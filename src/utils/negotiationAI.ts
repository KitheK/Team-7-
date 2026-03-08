import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN ?? '';
const HF_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_URL = 'https://router.huggingface.co/nscale/v1/chat/completions';

async function callLLM(prompt: string, maxTokens = 1500, temperature = 0.3): Promise<string> {
  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI model error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function extractJSON(text: string): any {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { raw: text };
  } catch {
    return { raw: text };
  }
}

export type VoiceProvider = 'local' | 'bland';

export async function generateBrief(
  vendorName: string,
  workspaceId: string | null,
  threshold = 1000
): Promise<{ brief: any; negotiationId: string | null; error?: string }> {
  if (!supabase) return { brief: null, negotiationId: null, error: 'Supabase not configured' };
  if (!HF_TOKEN) return { brief: null, negotiationId: null, error: 'HuggingFace token not configured' };
  if (!workspaceId) {
    return { brief: null, negotiationId: null, error: 'Select a workspace before starting an AI call' };
  }

  // Step 1: Try RPC for spend data, fall back to client-side aggregation
  let vendorSummary = '';
  const { data: opportunities } = await supabase.rpc(
    'detect_negotiation_opportunities',
    { p_threshold: threshold }
  );

  if (opportunities && opportunities.length > 0) {
    const targets = vendorName
      ? opportunities.filter((o: any) => o.vendor_name === vendorName)
      : opportunities;

    if (targets.length > 0) {
      vendorSummary = targets
        .map((o: any) => `- ${o.vendor_name}: $${o.annual_spend} annual spend, $${o.avg_invoice} avg invoice, ${o.month_count} months of history`)
        .join('\n');
    }
  }

  if (!vendorSummary) {
    vendorSummary = `- ${vendorName}: Vendor flagged for negotiation review based on spend patterns`;
  }

  // Step 2: Call LLM for brief
  const prompt = `You are an SME financial analyst. Analyze this vendor spend data and generate a negotiation brief.

Vendor data:
${vendorSummary}

Generate a JSON object with this exact structure for each vendor:
{
  "vendors": [
    {
      "vendor_name": "...",
      "annual_spend": 0,
      "target_price": 0,
      "discount_target_pct": 15,
      "talking_points": ["point 1", "point 2", "point 3"],
      "risk_assessment": "low|medium|high",
      "recommended_approach": "..."
    }
  ]
}

Target a 15% discount. Include three specific, actionable talking points per vendor. Respond with ONLY the JSON object, no other text.`;

  const rawContent = await callLLM(prompt);
  const brief = extractJSON(rawContent);

  // Step 3: Create the tracked negotiation record before allowing call start.
  let negotiationId: string | null = null;
  const isValidUuid = workspaceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId);
  if (!isValidUuid) {
    return { brief: null, negotiationId: null, error: 'A valid workspace is required to track this AI call' };
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const vendor = brief.vendors?.[0] ?? brief;

    if (!userId) {
      return { brief: null, negotiationId: null, error: 'You must be signed in to start an AI call' };
    }

    const { data: neg, error: insertErr } = await supabase
      .from('negotiations')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        vendor_name: vendor.vendor_name ?? vendorName,
        target_discount: vendor.discount_target_pct ?? 15,
        annual_spend: vendor.annual_spend ?? 0,
        brief: vendor,
        status: 'pending',
      })
      .select()
      .single();

    if (insertErr) {
      console.warn('Could not create negotiation record:', insertErr.message);
      return { brief: null, negotiationId: null, error: `Could not create negotiation record: ${insertErr.message}` };
    }

    negotiationId = neg?.id ?? null;
  } catch (e: any) {
    console.warn('Negotiation insert failed:', e);
    return { brief: null, negotiationId: null, error: e?.message ?? 'Failed to create negotiation record' };
  }

  if (!negotiationId) {
    return { brief: null, negotiationId: null, error: 'Could not create a tracked negotiation for this call' };
  }

  return { brief, negotiationId };
}

export async function generateScriptAndStartCall(
  negotiationId: string | null,
  vendorPhone: string,
  tone: string,
  fallbackBrief?: { vendor_name?: string; annual_spend?: number; target_discount?: number; talking_points?: string[] },
  provider: VoiceProvider = 'local'
): Promise<{ script: any; callId?: string; error?: string }> {
  if (!supabase) return { script: null, error: 'Supabase not configured' };
  if (!negotiationId) return { script: null, error: 'Negotiation ID is required to start a call' };
  if (!vendorPhone.trim()) return { script: null, error: 'Vendor phone number is required to start a call' };

  const { data, error, response } = await supabase.functions.invoke('negotiations-start', {
    body: {
      negotiation_id: negotiationId,
      vendor_name: fallbackBrief?.vendor_name,
      vendor_phone: vendorPhone,
      target_discount: fallbackBrief?.target_discount,
      tone,
      provider,
    },
  });

  if (error) {
    let detailedError = error.message ?? 'Edge Function call failed';

    const res = (error instanceof FunctionsHttpError && error.context) || response;
    if (res) {
      try {
        const text = await res.text();
        try {
          const payload = JSON.parse(text);
          if (payload?.error && payload?.details) detailedError = `${payload.error}: ${payload.details}`;
          else if (payload?.error) detailedError = payload.error;
        } catch {
          if (text?.trim()) detailedError = text;
        }
      } catch {
        // ignore
      }
    }

    return { script: null, error: detailedError };
  }

  if (data?.error) {
    return { script: data.script ?? null, error: data.error };
  }

  if (!data?.call_id) {
    return { script: data?.script ?? null, error: 'Call started response did not include a call ID' };
  }

  return { script: data.script, callId: data.call_id };
}
