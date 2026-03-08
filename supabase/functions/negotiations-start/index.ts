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
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";

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

function missingEnvVars(vars: Record<string, string>) {
  return Object.entries(vars)
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    component: "negotiations-start",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logEvent("auth_missing");
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { negotiation_id, vendor_name, vendor_phone, target_discount, tone, provider } =
      await req.json();

    if (!negotiation_id || !vendor_phone) {
      logEvent("request_invalid", { negotiation_id, has_vendor_phone: Boolean(vendor_phone) });
      return new Response(
        JSON.stringify({ error: "negotiation_id and vendor_phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Phase 2: make the self-hosted voice stack the primary path.
    const voiceProvider = provider === "bland" ? "bland" : "local";
    logEvent("request_received", {
      negotiation_id,
      provider_requested: provider ?? null,
      provider_selected: voiceProvider,
    });

    if (voiceProvider === "local") {
      const missing = missingEnvVars({
        PIPECAT_WS_URL,
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER,
        WEBHOOK_BASE_URL,
      });

      if (missing.length > 0) {
        logEvent("config_missing", { negotiation_id, provider: voiceProvider, missing });
        return new Response(
          JSON.stringify({
            error: "Local voice pipeline is not fully configured",
            details: `Missing required env vars: ${missing.join(", ")}`,
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const missing = missingEnvVars({
        BLAND_AI_API_KEY,
        WEBHOOK_BASE_URL,
      });

      if (missing.length > 0) {
        logEvent("config_missing", { negotiation_id, provider: voiceProvider, missing });
        return new Response(
          JSON.stringify({
            error: "Bland fallback is not fully configured",
            details: `Missing required env vars: ${missing.join(", ")}`,
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch the negotiation record and its brief
    const { data: negotiation, error: fetchErr } = await supabaseAdmin
      .from("negotiations")
      .select("*")
      .eq("id", negotiation_id)
      .single();

    if (fetchErr || !negotiation) {
      logEvent("negotiation_not_found", {
        negotiation_id,
        error: fetchErr?.message ?? null,
      });
      return new Response(JSON.stringify({ error: "Negotiation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logEvent("negotiation_loaded", {
      negotiation_id,
      provider: voiceProvider,
      vendor_name: negotiation.vendor_name,
    });

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
      logEvent("script_generation_failed", {
        negotiation_id,
        provider: voiceProvider,
        status: hfResponse.status,
      });
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

    // Build the behavioral prompt for the voice agent.
    const objectionFixed = script.objection_fixed_pricing ??
      "Acknowledge their position, then reference competitive market rates and your willingness to explore alternatives.";
    const objectionManager = script.objection_manager_approval ??
      "Offer to schedule a follow-up call with their manager, and emphasize the urgency of your renewal timeline.";
    const recommendedApproach = brief.recommended_approach ??
      "Anchor on the account value, reference competitive alternatives, and push for a concrete next step.";
    const riskAssessment = brief.risk_assessment ?? "medium";
    const annualSpendStr = negotiation.annual_spend
      ? `$${Number(negotiation.annual_spend).toLocaleString()}`
      : "a significant amount";

    const taskString = `You are Sami from Team 7, calling ${vName} on a business matter.

YOUR IDENTITY:
- Your name is Sami. You work at Team 7.
- You handle vendor relationships and cost optimization for the company.

YOUR OPENING:
When the call connects, introduce yourself naturally. Here is how your opening should sound — adapt it, don't read it robotically:
"Hi, this is Sami from Team 7. How are you doing today? ... Great. So the reason I'm calling — we've been reviewing our vendor accounts and spending, and I wanted to have a quick conversation about our account with you folks. We've been spending around ${annualSpendStr} annually with ${vName}, and as we're planning our budget going forward, we're looking at whether there's room to work out better pricing. We really value the relationship and want to keep working together, so I figured a conversation was the right first step."

Do NOT recite that word for word. Use it as a guide for the flow: greet them, small talk briefly, explain the reason for the call by referencing the spend relationship, then naturally transition into the ask.

YOUR OBJECTIVE:
- You want to negotiate a ${discount}% reduction on your current pricing with ${vName}.
- Your annual spend is ${annualSpendStr}. Use that as leverage — it shows you're a committed, high-value customer.
- If they can agree to something today, great. If not, push for a specific follow-up: a call with their manager, a revised quote by a certain date, or a meeting to discuss options.

TONE:
${TONE_INSTRUCTIONS[activeTone] ?? TONE_INSTRUCTIONS.collaborative}

STRATEGY:
- Recommended approach: ${recommendedApproach}
- Risk level: ${riskAssessment}

KEY TALKING POINTS (weave these in naturally, don't list them):
${talkingPoints}

HANDLING PUSHBACK:
- If they say pricing is fixed or non-negotiable: ${objectionFixed}
- If they say they need manager or corporate approval: ${objectionManager}
- If they offer a smaller discount than your target, acknowledge it positively but counter: "I appreciate that. Is there any way to get closer to the ${discount}% range? That's really where we need to be to make the numbers work on our end."
- If they ask why now, explain you're doing a company-wide vendor review and this is part of that process.

HOW TO SPEAK:
- Sound like a real person having a business conversation, not a script reader.
- Keep responses to 1–3 sentences max, then let them talk.
- Use natural phrases: "yeah that makes sense", "I hear you", "totally understand", "let me ask you this".
- Use contractions. Say "we've" not "we have", "I'm" not "I am", "that'd" not "that would".
- Don't front-load all your points. Spread them across the conversation as they become relevant.
- Match the other person's energy — if they're casual, be casual. If they're formal, dial it up slightly.
- After making your pricing ask, stop talking and wait for their response.

CONVERSATION FLOW:
1. Greet, introduce yourself as Sami from Team 7, brief small talk.
2. Transition: explain you're reviewing vendor spend and want to discuss pricing.
3. Reference the relationship and annual spend to establish your value as a customer.
4. Make the ask — frame the ${discount}% target as what you need to make the budget work.
5. Listen and respond to whatever they say. Don't steamroll.
6. If they're open, nail down specifics. If they push back, use the objection guidance above.
7. Close with clear next steps: a follow-up date, a person to talk to, or a written confirmation.

HARD RULES:
- Never say you are an AI, a bot, or an automated system. You are Sami from Team 7.
- Never invent facts about pricing history, competitors, or contracts you weren't given.
- Never speak more than 3 sentences in a row without pausing for a response.
- Never say "procurement team". You're just Sami, calling about the account.
- If asked who you are, say "I'm Sami, I handle our vendor relationships at Team 7."
- If the conversation goes off-topic, gently steer back: "For sure — hey, before I forget, I did want to circle back on the pricing piece."
- Be polite and professional throughout, even if they say no.`;

    // Submit call via the selected voice provider
    const webhookUrl = `${WEBHOOK_BASE_URL}/negotiations-webhook`;

    let callId: string | null = null;
    let providerError: string | null = null;

    if (voiceProvider === "local") {
      // ── Local Pipecat stack via Twilio Media Streams ──
      const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
      const wsUrl = `${PIPECAT_WS_URL}?negotiation_id=${negotiation_id}`;
      logEvent("provider_launch_attempt", {
        negotiation_id,
        provider: voiceProvider,
        vendor_phone,
      });

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
        logEvent("provider_launch_success", {
          negotiation_id,
          provider: voiceProvider,
          call_id: callId,
        });
      } else {
        providerError = await twilioResponse.text();
        logEvent("provider_launch_failed", {
          negotiation_id,
          provider: voiceProvider,
          status: twilioResponse.status,
        });
      }
    } else {
      // ── Bland AI (cloud provider) ──
      logEvent("provider_launch_attempt", {
        negotiation_id,
        provider: voiceProvider,
        vendor_phone,
      });
      const blandResponse = await fetch("https://api.bland.ai/v1/calls", {
        method: "POST",
        headers: {
          Authorization: BLAND_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: vendor_phone,
          task: taskString,
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
        logEvent("provider_launch_success", {
          negotiation_id,
          provider: voiceProvider,
          call_id: callId,
        });
      } else {
        providerError = await blandResponse.text();
        logEvent("provider_launch_failed", {
          negotiation_id,
          provider: voiceProvider,
          status: blandResponse.status,
        });
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
      logEvent("call_start_failed", {
        negotiation_id,
        provider: voiceProvider,
        failure_category: "provider_launch_failed",
      });
      return new Response(
        JSON.stringify({
          error: `${voiceProvider} call failed`,
          details: providerError,
          provider: voiceProvider,
          script,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        negotiation_id,
        call_id: callId,
        provider: voiceProvider,
        status: "calling",
        script,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    logEvent("unexpected_error", {
      error: (err as Error).message,
    });
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
