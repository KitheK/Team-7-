import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const HF_TOKEN = Deno.env.get("HF_TOKEN")!;
const BLAND_AI_API_KEY = Deno.env.get("BLAND_AI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_BASE_URL = Deno.env.get("WEBHOOK_BASE_URL")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER") ?? "";
const PIPECAT_WS_URL = Deno.env.get("PIPECAT_WS_URL") ?? "";

const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/v1/chat/completions`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  collaborative:
    "Use a warm, partnership-oriented tone. Emphasize mutual benefit and long-term relationship. Use phrases like 'we value our partnership', 'let's find a solution that works for both of us'.",
  assertive:
    "Be direct and data-driven. Lead with facts and market comparisons. Use phrases like 'based on our analysis', 'industry benchmarks suggest', 'we need to see improvement on pricing'.",
  firm:
    "Be professional but uncompromising. Make it clear alternatives are being evaluated. Use phrases like 'we have competitive offers', 'we require a pricing adjustment to continue', 'our budget constraints are firm'.",
};

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

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { negotiation_id, vendor_name, vendor_phone, target_discount, tone, provider } =
      await req.json();

    if (!negotiation_id || !vendor_phone) {
      return new Response(
        JSON.stringify({ error: "negotiation_id and vendor_phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine voice provider: "local" (Pipecat + Twilio) or "bland" (default)
    const voiceProvider = provider ?? (PIPECAT_WS_URL ? "local" : "bland");

    // Fetch the negotiation record and its brief
    const { data: negotiation, error: fetchErr } = await supabaseAdmin
      .from("negotiations")
      .select("*")
      .eq("id", negotiation_id)
      .single();

    if (fetchErr || !negotiation) {
      return new Response(JSON.stringify({ error: "Negotiation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const activeTone = tone ?? negotiation.tone ?? "collaborative";
    const discount = target_discount ?? negotiation.target_discount ?? 15;
    const vName = vendor_name ?? negotiation.vendor_name;
    const brief = negotiation.brief ?? {};

    const talkingPoints = brief.talking_points
      ? brief.talking_points.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")
      : "- Reference volume commitment\n- Reference competitive alternatives\n- Reference long-term partnership value";

    const prompt = `You are a professional phone negotiation script writer for small and medium enterprises (SMEs).

Write a complete phone-call script for negotiating with ${vName}.

Context:
- Annual spend: $${negotiation.annual_spend ?? "N/A"}
- Target discount: ${discount}%
- Talking points from our analysis:
${talkingPoints}

Tone: ${activeTone}
${TONE_INSTRUCTIONS[activeTone] ?? TONE_INSTRUCTIONS.collaborative}

The script MUST include these sections in order:
1. OPENING: Professional greeting, state who you are (the client's procurement team), purpose of the call
2. PRICE REQUEST: Volume-based pricing request citing specific spend data and the ${discount}% target
3. OBJECTION HANDLER - "Fixed Pricing": Response when vendor claims prices are fixed/non-negotiable
4. OBJECTION HANDLER - "Manager Approval": Response when vendor says they need manager/corporate approval
5. CLOSING: Summary of ask, timeline for response, professional sign-off

Format the script as a JSON object:
{
  "opening": "...",
  "price_request": "...",
  "objection_fixed_pricing": "...",
  "objection_manager_approval": "...",
  "closing": "...",
  "full_script": "... (the complete script as natural speech for the AI voice agent)"
}

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
        max_tokens: 2000,
        temperature: 0.4,
      }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      await supabaseAdmin
        .from("negotiations")
        .update({ status: "failed" })
        .eq("id", negotiation_id);
      return new Response(
        JSON.stringify({ error: "HuggingFace API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hfData = await hfResponse.json();
    const rawContent = hfData.choices?.[0]?.message?.content ?? "";

    let script: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      script = jsonMatch ? JSON.parse(jsonMatch[0]) : { full_script: rawContent };
    } catch {
      script = { full_script: rawContent };
    }

    // Submit call via the selected voice provider
    const webhookUrl = `${WEBHOOK_BASE_URL}/negotiations-webhook`;

    let callId: string | null = null;
    let providerError: string | null = null;

    if (voiceProvider === "local") {
      // ── Local Pipecat stack via Twilio Media Streams ──
      const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
      const wsUrl = `${PIPECAT_WS_URL}?negotiation_id=${negotiation_id}&call_id=${negotiation_id}`;

      const twiml = `<Response><Connect><Stream url="${wsUrl}"><Parameter name="negotiation_id" value="${negotiation_id}"/></Stream></Connect></Response>`;

      const twilioBody = new URLSearchParams({
        To: vendor_phone,
        From: TWILIO_PHONE_NUMBER,
        Twiml: twiml,
        StatusCallback: webhookUrl,
        StatusCallbackEvent: "completed",
      });

      const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const twilioResponse = await fetch(twilioApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: twilioBody.toString(),
      });

      if (twilioResponse.ok) {
        const twilioData = await twilioResponse.json();
        callId = twilioData.sid ?? null;
      } else {
        providerError = await twilioResponse.text();
      }
    } else {
      // ── Bland AI (cloud provider) ──
      const blandResponse = await fetch("https://api.bland.ai/v1/calls", {
        method: "POST",
        headers: {
          Authorization: BLAND_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: vendor_phone,
          task: script.full_script ?? rawContent,
          webhook: webhookUrl,
          interruption_threshold: 100,
          metadata: { negotiation_id },
          voice: "mason",
          reduce_latency: true,
          wait_for_greeting: true,
        }),
      });

      if (blandResponse.ok) {
        const blandData = await blandResponse.json();
        callId = blandData.call_id ?? null;
      } else {
        providerError = await blandResponse.text();
      }
    }

    // Update the negotiation record
    const updatePayload: Record<string, any> = {
      vendor_phone,
      tone: activeTone,
      target_discount: discount,
      script,
      status: callId ? "calling" : "failed",
    };
    if (callId) updatePayload.call_id = callId;

    await supabaseAdmin
      .from("negotiations")
      .update(updatePayload)
      .eq("id", negotiation_id);

    if (!callId) {
      return new Response(
        JSON.stringify({
          error: `${voiceProvider} call failed`,
          details: providerError,
          script,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        negotiation_id,
        call_id: callId,
        status: "calling",
        script,
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
