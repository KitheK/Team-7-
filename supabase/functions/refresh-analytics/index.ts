import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --------------- Thresholds (easy to tune) ---------------

const CONSECUTIVE_MONTHS_STRONG = 6;
const CONSECUTIVE_MONTHS_MODERATE = 3;
const ACTIVE_MONTHS_MIN = 3;

const PRICE_CREEP_STRONG = 10;
const PRICE_CREEP_MODERATE = 5;

const AI_NEGOTIATION_MIN_SPEND = 2000;
const AI_NEGOTIATION_HIGH_SPEND = 10000;
const EMAIL_CANCELLATION_MAX_SPEND = 5000;

const SAVINGS_PCT_NEGOTIATION = 0.15;
const SAVINGS_PCT_MANUAL = 0.10;

const NEGOTIABLE_CATEGORIES = new Set([
  "Cloud & Infrastructure",
  "CRM & Sales",
  "Communications",
  "Customer Support",
  "Marketing & Analytics",
]);

// --------------- Classification logic ---------------

interface VendorSummary {
  user_id: string;
  vendor_canonical: string;
  vendor_category: string;
  active_month_count: number;
  consecutive_month_count: number;
  average_monthly_spend: number;
  latest_monthly_spend: number;
  annualized_spend: number;
  total_spend: number;
  total_transaction_count: number;
  price_creep_pct: number;
  normalization_method: string;
}

interface ClassifiedOpportunity {
  user_id: string;
  vendor_name: string;
  canonical_vendor_name: string;
  category: string;
  type: "email_cancellation" | "ai_negotiation" | "manual_review";
  reason_codes: string[];
  explanation: string;
  confidence: number;
  annualized_spend: number;
  estimated_annual_savings: number;
  recurring_months: number;
  latest_monthly_spend: number;
  price_creep_pct: number;
}

function computeRecurrenceScore(v: VendorSummary): number {
  if (v.consecutive_month_count >= CONSECUTIVE_MONTHS_STRONG) return 90;
  if (v.consecutive_month_count >= CONSECUTIVE_MONTHS_MODERATE) return 70;
  if (v.active_month_count >= ACTIVE_MONTHS_MIN) return 50;
  return 20;
}

function classify(v: VendorSummary): ClassifiedOpportunity {
  const recurrenceScore = computeRecurrenceScore(v);
  const reasons: string[] = [];
  const spend = Number(v.annualized_spend) || 0;
  const creep = Number(v.price_creep_pct) || 0;
  const latest = Number(v.latest_monthly_spend) || 0;
  const avg = Number(v.average_monthly_spend) || 0;

  if (v.active_month_count >= 3)
    reasons.push(`recurring_${v.active_month_count}_months`);
  if (creep > PRICE_CREEP_MODERATE)
    reasons.push(`price_creep_${Math.round(creep)}pct`);
  if (spend >= AI_NEGOTIATION_HIGH_SPEND) reasons.push("high_annual_spend");
  if (v.total_transaction_count > v.active_month_count * 1.5)
    reasons.push("duplicate_charge_pattern");
  if (v.normalization_method === "raw") reasons.push("low_confidence_vendor");
  if (NEGOTIABLE_CATEGORIES.has(v.vendor_category))
    reasons.push("b2b_negotiable_category");

  let type: ClassifiedOpportunity["type"];
  let estimated: number;
  let confidence: number;

  const isNegotiable =
    recurrenceScore >= 50 &&
    spend >= AI_NEGOTIATION_MIN_SPEND &&
    (creep > PRICE_CREEP_MODERATE || spend >= AI_NEGOTIATION_HIGH_SPEND) &&
    NEGOTIABLE_CATEGORIES.has(v.vendor_category);

  const isCancellable =
    recurrenceScore >= 50 &&
    spend < EMAIL_CANCELLATION_MAX_SPEND &&
    !isNegotiable;

  if (isNegotiable) {
    type = "ai_negotiation";
    estimated = Math.round(spend * SAVINGS_PCT_NEGOTIATION * 100) / 100;
    confidence = Math.min(
      95,
      recurrenceScore * 0.4 +
        (creep > PRICE_CREEP_STRONG ? 30 : creep > PRICE_CREEP_MODERATE ? 20 : 10) +
        (spend >= AI_NEGOTIATION_HIGH_SPEND ? 20 : 10)
    );
  } else if (isCancellable) {
    type = "email_cancellation";
    estimated = Math.round(spend * 100) / 100;
    confidence = Math.min(90, recurrenceScore * 0.6 + (spend < 1000 ? 20 : 10));
  } else {
    type = "manual_review";
    estimated = Math.round(spend * SAVINGS_PCT_MANUAL * 100) / 100;
    confidence = Math.min(50, recurrenceScore * 0.3 + 10);
  }

  const explanation = buildExplanation(v, type, creep, avg, latest);

  return {
    user_id: v.user_id,
    vendor_name: v.vendor_canonical,
    canonical_vendor_name: v.vendor_canonical,
    category: v.vendor_category,
    type,
    reason_codes: reasons,
    explanation,
    confidence: Math.round(confidence * 100) / 100,
    annualized_spend: spend,
    estimated_annual_savings: estimated,
    recurring_months: v.active_month_count,
    latest_monthly_spend: latest,
    price_creep_pct: creep,
  };
}

function buildExplanation(
  v: VendorSummary,
  type: string,
  creep: number,
  avg: number,
  latest: number
): string {
  const parts: string[] = [];

  if (v.active_month_count >= 2) {
    parts.push(
      `Recurring for ${v.active_month_count} months at ~$${Math.round(avg)}/mo`
    );
  } else {
    parts.push(`Seen in ${v.active_month_count} month(s)`);
  }

  if (creep > PRICE_CREEP_MODERATE) {
    parts.push(`Price increased ${Math.round(creep)}% vs average`);
  }

  if (type === "ai_negotiation") {
    parts.push("B2B vendor likely open to negotiation");
  } else if (type === "email_cancellation") {
    parts.push("Subscription that could be cancelled via email");
  } else {
    parts.push("Needs manual review — limited data or unclear vendor");
  }

  return parts.join(". ") + ".";
}

// --------------- Handler ---------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: vendorRows, error: viewError } = await admin
      .from("v_vendor_cross_month_summary")
      .select("*")
      .eq("user_id", userId);

    if (viewError) {
      return new Response(
        JSON.stringify({ error: "Failed to read analytics view", details: viewError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vendorRows || vendorRows.length === 0) {
      return new Response(
        JSON.stringify({ refreshed: 0, created: 0, updated: 0, message: "No vendor data found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const classified = (vendorRows as VendorSummary[]).map(classify);

    const { data: existing } = await admin
      .from("opportunities")
      .select("id, canonical_vendor_name, status, secured_annual_savings, action_taken_at, resolved_at")
      .eq("user_id", userId);

    const existingMap = new Map(
      (existing ?? []).map((e: any) => [e.canonical_vendor_name, e])
    );
    const seenVendors = new Set<string>();

    let created = 0;
    let updated = 0;

    for (const opp of classified) {
      seenVendors.add(opp.canonical_vendor_name);
      const ex = existingMap.get(opp.canonical_vendor_name);

      if (ex) {
        const preserveStatus = [
          "email_drafted", "email_sent",
          "ai_call_started", "ai_call_completed",
          "resolved", "dismissed",
        ];
        const keepStatus = preserveStatus.includes(ex.status);

        await admin
          .from("opportunities")
          .update({
            vendor_name: opp.vendor_name,
            category: opp.category,
            type: opp.type,
            reason_codes: opp.reason_codes,
            explanation: opp.explanation,
            confidence: opp.confidence,
            annualized_spend: opp.annualized_spend,
            estimated_annual_savings: opp.estimated_annual_savings,
            recurring_months: opp.recurring_months,
            latest_monthly_spend: opp.latest_monthly_spend,
            price_creep_pct: opp.price_creep_pct,
            ...(keepStatus
              ? {}
              : { status: "recommended" }),
          })
          .eq("id", ex.id);
        updated++;
      } else {
        await admin.from("opportunities").insert({
          user_id: opp.user_id,
          vendor_name: opp.vendor_name,
          canonical_vendor_name: opp.canonical_vendor_name,
          category: opp.category,
          type: opp.type,
          reason_codes: opp.reason_codes,
          explanation: opp.explanation,
          confidence: opp.confidence,
          annualized_spend: opp.annualized_spend,
          estimated_annual_savings: opp.estimated_annual_savings,
          recurring_months: opp.recurring_months,
          latest_monthly_spend: opp.latest_monthly_spend,
          price_creep_pct: opp.price_creep_pct,
          status: "recommended",
        });
        created++;
      }
    }

    // Dismiss opportunities for vendors no longer in the data
    const staleVendors = (existing ?? [])
      .filter(
        (e: any) =>
          !seenVendors.has(e.canonical_vendor_name) &&
          e.status !== "resolved" &&
          e.status !== "dismissed"
      )
      .map((e: any) => e.id);

    if (staleVendors.length > 0) {
      await admin
        .from("opportunities")
        .update({ status: "dismissed" })
        .in("id", staleVendors);
    }

    return new Response(
      JSON.stringify({
        refreshed: classified.length,
        created,
        updated,
        dismissed: staleVendors.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
