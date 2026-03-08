import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_BASE_URL = Deno.env.get("WEBHOOK_BASE_URL")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = await req.json();

    // Bland AI sends different event structures; normalise the key fields
    const callId = payload.call_id ?? payload.id;
    const status = payload.status ?? payload.event;
    const transcripts = payload.transcripts ?? payload.transcript ?? [];

    if (!callId) {
      return new Response(JSON.stringify({ error: "Missing call_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the negotiation by call_id
    const { data: negotiation, error: lookupErr } = await supabaseAdmin
      .from("negotiations")
      .select("id, status")
      .eq("call_id", callId)
      .single();

    if (lookupErr || !negotiation) {
      return new Response(JSON.stringify({ error: "Negotiation not found for call_id" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const negotiationId = negotiation.id;

    // Handle transcript events -- insert each utterance as a row
    if (Array.isArray(transcripts) && transcripts.length > 0) {
      const rows = transcripts.map((t: any, idx: number) => ({
        negotiation_id: negotiationId,
        speaker: (t.user ?? t.speaker ?? "agent").toLowerCase() === "user" ? "vendor" : "agent",
        content: t.text ?? t.content ?? "",
        timestamp_ms: t.timestamp ?? idx * 1000,
      }));

      // Filter out empty content lines
      const validRows = rows.filter((r: any) => r.content.trim().length > 0);

      if (validRows.length > 0) {
        await supabaseAdmin.from("call_transcript_lines").insert(validRows);
      }
    }

    // Handle single transcript line (real-time streaming from some providers)
    if (payload.text && !Array.isArray(transcripts)) {
      await supabaseAdmin.from("call_transcript_lines").insert({
        negotiation_id: negotiationId,
        speaker: (payload.from ?? payload.speaker ?? "agent").toLowerCase() === "user" ? "vendor" : "agent",
        content: payload.text,
        timestamp_ms: payload.timestamp ?? Date.now(),
      });
    }

    // Handle call completion
    if (
      status === "completed" ||
      status === "ended" ||
      payload.completed === true
    ) {
      await supabaseAdmin
        .from("negotiations")
        .update({ status: "completed" })
        .eq("id", negotiationId);

      // Trigger summarisation asynchronously
      try {
        await fetch(`${WEBHOOK_BASE_URL}/negotiations-summarise`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ negotiation_id: negotiationId }),
        });
      } catch {
        // Summarisation is best-effort; don't fail the webhook response
      }
    }

    // Handle call failure
    if (status === "failed" || status === "error" || status === "no-answer") {
      const outcome =
        status === "no-answer" || status === "no_answer" ? "no_answer" : "error";
      await supabaseAdmin
        .from("negotiations")
        .update({ status: "failed", outcome })
        .eq("id", negotiationId);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
