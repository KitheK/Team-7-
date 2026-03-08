import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const HF_TOKEN = Deno.env.get("HF_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeVendorName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function vendorMatches(candidate: string | null | undefined, requested: string) {
  const normalizedCandidate = normalizeVendorName(candidate);
  const normalizedRequested = normalizeVendorName(requested);

  if (!normalizedCandidate || !normalizedRequested) return false;
  return (
    normalizedCandidate === normalizedRequested ||
    normalizedCandidate.includes(normalizedRequested) ||
    normalizedRequested.includes(normalizedCandidate)
  );
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticated client scoped to the calling user
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for service-level operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { vendor_name, threshold, workspace_id } = await req.json();

    // Detect negotiation opportunities via the Supabase RPC
    const { data: opportunities, error: rpcError } = await supabaseUser.rpc(
      "detect_negotiation_opportunities",
      { p_threshold: threshold ?? 5000 }
    );

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a specific vendor was requested, filter to that vendor using a
    // normalized comparison so small naming differences do not block the flow.
    let targets = vendor_name
      ? opportunities?.filter((o: any) => vendorMatches(o.vendor_name, vendor_name))
      : opportunities;

    // Fallback: if the opportunity detector has no exact hit, summarise the
    // selected workspace's transactions for that vendor so the user can still
    // generate a negotiation brief from the data they are looking at.
    if ((!targets || targets.length === 0) && vendor_name && workspace_id) {
      const { data: workspaceTx, error: txError } = await supabaseUser
        .from("transactions")
        .select("vendor_name, description, amount, transaction_date")
        .eq("workspace_id", workspace_id);

      if (txError) {
        return new Response(JSON.stringify({ error: txError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const matchingRows =
        workspaceTx?.filter((tx: any) =>
          vendorMatches(tx.vendor_name ?? tx.description, vendor_name)
        ) ?? [];

      if (matchingRows.length > 0) {
        const annualSpend = matchingRows.reduce(
          (sum: number, row: any) => sum + Number(row.amount ?? 0),
          0
        );
        const avgInvoice = annualSpend / matchingRows.length;
        const monthCount = new Set(
          matchingRows
            .map((row: any) => row.transaction_date?.slice?.(0, 7))
            .filter(Boolean)
        ).size;

        targets = [
          {
            vendor_name,
            annual_spend: annualSpend,
            avg_invoice: avgInvoice,
            month_count: monthCount || 1,
            estimated_saving: Number((annualSpend * 0.15).toFixed(2)),
          },
        ];
      }
    }

    if (!targets || targets.length === 0) {
      return new Response(
        JSON.stringify({ error: "No negotiation opportunities found matching criteria" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vendorSummary = targets
      .map(
        (o: any) =>
          `- ${o.vendor_name}: $${o.annual_spend} annual spend, $${o.avg_invoice} avg invoice, ${o.month_count} months of history`
      )
      .join("\n");

    const prompt = `You are an SME financial analyst. Analyze this vendor spend data and generate a negotiation brief.

Vendor data:
${vendorSummary}

Generate a JSON object with this exact structure for each vendor:
{
  "vendors": [
    {
      "vendor_name": "...",
      "annual_spend": ...,
      "target_price": ...,
      "discount_target_pct": 15,
      "talking_points": ["point 1", "point 2", "point 3"],
      "risk_assessment": "low|medium|high",
      "recommended_approach": "..."
    }
  ]
}

Target a 15% discount. Include three specific, actionable talking points per vendor that reference their actual spend data. Respond with ONLY the JSON object, no other text.`;

    const hfResponse = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      return new Response(
        JSON.stringify({ error: "HuggingFace API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hfData = await hfResponse.json();
    const rawContent = hfData.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the model response (handles markdown code fences)
    let brief: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      brief = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: rawContent };
    } catch {
      brief = { raw: rawContent };
    }

    // If a workspace_id was provided, create a negotiation record per vendor
    const createdNegotiations: any[] = [];
    if (workspace_id) {
      const { data: userData } = await supabaseUser.auth.getUser();
      const userId = userData?.user?.id;

      for (const vendor of brief.vendors ?? []) {
        const { data: neg, error: insertErr } = await supabaseAdmin
          .from("negotiations")
          .insert({
            workspace_id,
            user_id: userId,
            vendor_name: vendor.vendor_name,
            target_discount: vendor.discount_target_pct,
            annual_spend: vendor.annual_spend,
            brief: vendor,
            status: "pending",
          })
          .select()
          .single();

        if (!insertErr && neg) createdNegotiations.push(neg);
      }
    }

    return new Response(
      JSON.stringify({
        brief,
        opportunities: targets,
        negotiations: createdNegotiations,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
