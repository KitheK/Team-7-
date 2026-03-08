import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_BASE_URL = Deno.env.get("WEBHOOK_BASE_URL")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    component: "negotiations-webhook",
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

async function findNegotiation(
  supabaseAdmin: ReturnType<typeof createClient>,
  callId: string | null,
  negotiationId: string | null,
) {
  if (callId) {
    const { data } = await supabaseAdmin
      .from("negotiations")
      .select("id, status, call_id")
      .eq("call_id", callId)
      .maybeSingle();

    if (data) return data;
  }

  if (negotiationId) {
    const { data } = await supabaseAdmin
      .from("negotiations")
      .select("id, status, call_id")
      .eq("id", negotiationId)
      .maybeSingle();

    if (data) return data;
  }

  return null;
}

async function dedupeTranscriptRows(
  supabaseAdmin: ReturnType<typeof createClient>,
  negotiationId: string,
  rows: Array<{ negotiation_id: string; speaker: string; content: string; timestamp_ms: number | null }>,
) {
  if (rows.length === 0) return rows;

  const timestamps = [...new Set(rows.map(r => r.timestamp_ms).filter((ts): ts is number => typeof ts === "number"))];
  if (timestamps.length === 0) return rows;

  const { data: existing } = await supabaseAdmin
    .from("call_transcript_lines")
    .select("speaker, content, timestamp_ms")
    .eq("negotiation_id", negotiationId)
    .in("timestamp_ms", timestamps);

  const existingKeys = new Set(
    (existing ?? []).map((row: any) => `${row.speaker}|${row.timestamp_ms}|${row.content}`)
  );

  return rows.filter((row) => !existingKeys.has(`${row.speaker}|${row.timestamp_ms}|${row.content}`));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = await req.json();

    // Bland AI sends different event structures; normalise the key fields
    const callId = payload.call_id ?? payload.id ?? null;
    const payloadNegotiationId =
      payload.negotiation_id ??
      payload.metadata?.negotiation_id ??
      payload.customParameters?.negotiation_id ??
      null;
    const status = payload.status ?? payload.event;
    const transcripts = payload.transcripts ?? payload.transcript ?? [];
    logEvent("event_received", {
      call_id: callId,
      negotiation_id: payloadNegotiationId,
      status,
      transcript_count: Array.isArray(transcripts) ? transcripts.length : 0,
    });

    if (!callId && !payloadNegotiationId) {
      logEvent("event_rejected", { reason: "missing_call_and_negotiation_ids" });
      return new Response(JSON.stringify({ error: "Missing call_id or negotiation_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prefer the canonical call_id, but fall back to negotiation_id for local transcript events.
    const negotiation = await findNegotiation(supabaseAdmin, callId, payloadNegotiationId);

    if (!negotiation) {
      logEvent("correlation_failed", {
        call_id: callId,
        negotiation_id: payloadNegotiationId,
        failure_category: "transcript_correlation_failed",
      });
      return new Response(JSON.stringify({ error: "Negotiation not found for call correlation" }), {
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
        const dedupedRows = await dedupeTranscriptRows(supabaseAdmin, negotiationId, validRows);
        if (dedupedRows.length > 0) {
          await supabaseAdmin.from("call_transcript_lines").insert(dedupedRows);
        }
        logEvent("transcripts_processed", {
          negotiation_id: negotiationId,
          received: validRows.length,
          inserted: dedupedRows.length,
          duplicates_skipped: validRows.length - dedupedRows.length,
        });
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
      logEvent("single_transcript_inserted", { negotiation_id: negotiationId });
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
      logEvent("call_completed", { negotiation_id: negotiationId, call_id: callId });

      // Trigger summarisation asynchronously
      try {
        const summaryResponse = await fetch(`${WEBHOOK_BASE_URL}/negotiations-summarise`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ negotiation_id: negotiationId }),
        });
        if (!summaryResponse.ok) {
          const body = await summaryResponse.text();
          logEvent("summarisation_trigger_failed", {
            negotiation_id: negotiationId,
            status: summaryResponse.status,
            failure_category: "summarisation_trigger_failed",
            details: body,
          });
        } else {
          logEvent("summarisation_triggered", { negotiation_id: negotiationId });
        }
      } catch {
        // Summarisation is best-effort; don't fail the webhook response
        logEvent("summarisation_trigger_failed", {
          negotiation_id: negotiationId,
          failure_category: "summarisation_trigger_failed",
        });
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
      logEvent("call_failed", {
        negotiation_id: negotiationId,
        call_id: callId,
        failure_category: outcome === "no_answer" ? "no_answer" : "call_runtime_failed",
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    logEvent("unexpected_error", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
