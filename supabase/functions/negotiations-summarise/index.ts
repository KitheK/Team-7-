import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const HF_TOKEN = Deno.env.get("HF_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const HF_API_URL = `https://router.huggingface.co/nscale/v1/chat/completions`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    component: "negotiations-summarise",
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { negotiation_id } = await req.json();
    logEvent("request_received", { negotiation_id });

    if (!negotiation_id) {
      logEvent("request_invalid", { reason: "missing_negotiation_id" });
      return new Response(JSON.stringify({ error: "negotiation_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the negotiation record
    const { data: negotiation, error: negErr } = await supabaseAdmin
      .from("negotiations")
      .select("*")
      .eq("id", negotiation_id)
      .single();

    if (negErr || !negotiation) {
      logEvent("negotiation_not_found", {
        negotiation_id,
        error: negErr?.message ?? null,
      });
      return new Response(JSON.stringify({ error: "Negotiation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all transcript lines ordered by timestamp
    const { data: lines, error: linesErr } = await supabaseAdmin
      .from("call_transcript_lines")
      .select("speaker, content, timestamp_ms")
      .eq("negotiation_id", negotiation_id)
      .order("timestamp_ms", { ascending: true });

    if (linesErr || !lines || lines.length === 0) {
      logEvent("transcript_missing", {
        negotiation_id,
        failure_category: "summarisation_missing_transcript",
      });
      return new Response(
        JSON.stringify({ error: "No transcript lines found for this negotiation" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    logEvent("transcript_loaded", { negotiation_id, line_count: lines.length });

    const transcriptText = lines
      .map((l: any) => `[${l.speaker.toUpperCase()}]: ${l.content}`)
      .join("\n");

    const prompt = `You are an expert negotiation analyst for SME procurement.

Analyze this vendor negotiation phone call transcript between our AI agent and the vendor (${negotiation.vendor_name}).

Transcript:
${transcriptText}

Context:
- Target discount was: ${negotiation.target_discount ?? 15}%
- Annual spend: $${negotiation.annual_spend ?? "unknown"}

Provide your analysis as a JSON object with this exact structure:
{
  "outcome": "success|partial|rejected",
  "agreed_discount": <number or null if no agreement>,
  "agreed_terms": "brief summary of what was agreed",
  "key_moments": ["moment 1", "moment 2"],
  "vendor_sentiment": "positive|neutral|negative",
  "follow_up_email": "Complete professional follow-up email confirming the discussion and any agreed terms. Address it to the vendor. Include specific numbers discussed."
}

Rules for outcome:
- "success": vendor agreed to the target discount or better
- "partial": vendor offered some discount but below target
- "rejected": vendor refused any discount

Respond with ONLY the JSON object.`;

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
        temperature: 0.2,
      }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      logEvent("summary_generation_failed", {
        negotiation_id,
        status: hfResponse.status,
        failure_category: "summary_model_failed",
      });
      return new Response(
        JSON.stringify({ error: "HuggingFace API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hfData = await hfResponse.json();
    const rawContent = hfData.choices?.[0]?.message?.content ?? "";

    let summary: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      summary = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: rawContent };
    } catch {
      summary = { raw: rawContent, outcome: "error" };
    }

    // Update the negotiation record with results
    await supabaseAdmin
      .from("negotiations")
      .update({
        outcome: summary.outcome ?? "error",
        agreed_discount: summary.agreed_discount ?? null,
        follow_up_email: summary.follow_up_email ?? null,
        status: "completed",
      })
      .eq("id", negotiation_id);
    logEvent("summary_saved", {
      negotiation_id,
      outcome: summary.outcome ?? "error",
      agreed_discount: summary.agreed_discount ?? null,
    });

    // If successful, log the saving to the anomalies table for ROI tracking
    if (
      summary.outcome === "success" &&
      summary.agreed_discount != null &&
      negotiation.annual_spend
    ) {
      const savingsAmount =
        negotiation.annual_spend * (summary.agreed_discount / 100);

      await supabaseAdmin.from("anomalies").insert({
        workspace_id: negotiation.workspace_id,
        type: "negotiation_saving",
        amount: Math.round(savingsAmount * 100) / 100,
        status: "open",
        metadata: {
          negotiation_id,
          vendor_name: negotiation.vendor_name,
          agreed_discount: summary.agreed_discount,
          annual_spend: negotiation.annual_spend,
        },
        source: "csv",
      });
      logEvent("savings_logged", {
        negotiation_id,
        savings_amount: Math.round(savingsAmount * 100) / 100,
      });
    }

    return new Response(
      JSON.stringify({ negotiation_id, summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    logEvent("unexpected_error", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
