/**
 * Standalone test for the opportunity classification logic.
 * Mirrors the rules in supabase/functions/refresh-analytics/index.ts.
 *
 * Run with: npx tsx scripts/test-classification.ts
 */

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

interface VendorSummary {
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

type OpType = "email_cancellation" | "ai_negotiation" | "manual_review";

function computeRecurrenceScore(v: VendorSummary): number {
  if (v.consecutive_month_count >= CONSECUTIVE_MONTHS_STRONG) return 90;
  if (v.consecutive_month_count >= CONSECUTIVE_MONTHS_MODERATE) return 70;
  if (v.active_month_count >= ACTIVE_MONTHS_MIN) return 50;
  return 20;
}

function classify(v: VendorSummary): { type: OpType; estimated: number; confidence: number } {
  const recurrenceScore = computeRecurrenceScore(v);
  const spend = v.annualized_spend;
  const creep = v.price_creep_pct;

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
    return {
      type: "ai_negotiation",
      estimated: Math.round(spend * SAVINGS_PCT_NEGOTIATION * 100) / 100,
      confidence: Math.min(95,
        recurrenceScore * 0.4 +
        (creep > PRICE_CREEP_STRONG ? 30 : creep > PRICE_CREEP_MODERATE ? 20 : 10) +
        (spend >= AI_NEGOTIATION_HIGH_SPEND ? 20 : 10)
      ),
    };
  }
  if (isCancellable) {
    return {
      type: "email_cancellation",
      estimated: spend,
      confidence: Math.min(90, recurrenceScore * 0.6 + (spend < 1000 ? 20 : 10)),
    };
  }
  return {
    type: "manual_review",
    estimated: Math.round(spend * SAVINGS_PCT_MANUAL * 100) / 100,
    confidence: Math.min(50, recurrenceScore * 0.3 + 10),
  };
}

// ──── Test scenarios ────

const scenarios: { name: string; vendor: VendorSummary; expectedType: OpType }[] = [
  {
    name: "AWS — high-spend recurring Cloud vendor → ai_negotiation",
    vendor: {
      vendor_canonical: "Amazon Web Services",
      vendor_category: "Cloud & Infrastructure",
      active_month_count: 8,
      consecutive_month_count: 8,
      average_monthly_spend: 4200,
      latest_monthly_spend: 4500,
      annualized_spend: 50400,
      total_spend: 33600,
      total_transaction_count: 8,
      price_creep_pct: 7.14,
      normalization_method: "alias",
    },
    expectedType: "ai_negotiation",
  },
  {
    name: "Salesforce — recurring CRM vendor above $2K → ai_negotiation",
    vendor: {
      vendor_canonical: "Salesforce",
      vendor_category: "CRM & Sales",
      active_month_count: 6,
      consecutive_month_count: 6,
      average_monthly_spend: 1500,
      latest_monthly_spend: 1650,
      annualized_spend: 18000,
      total_spend: 9000,
      total_transaction_count: 6,
      price_creep_pct: 10,
      normalization_method: "alias",
    },
    expectedType: "ai_negotiation",
  },
  {
    name: "Slack — recurring Comms vendor <$5K, not negotiation → email_cancellation",
    vendor: {
      vendor_canonical: "Slack",
      vendor_category: "Communications",
      active_month_count: 6,
      consecutive_month_count: 6,
      average_monthly_spend: 200,
      latest_monthly_spend: 200,
      annualized_spend: 2400,
      total_spend: 1200,
      total_transaction_count: 6,
      price_creep_pct: 0,
      normalization_method: "alias",
    },
    expectedType: "email_cancellation",
  },
  {
    name: "Figma — recurring Design vendor <$5K → email_cancellation",
    vendor: {
      vendor_canonical: "Figma",
      vendor_category: "Design & Creative",
      active_month_count: 4,
      consecutive_month_count: 4,
      average_monthly_spend: 90,
      latest_monthly_spend: 90,
      annualized_spend: 1080,
      total_spend: 360,
      total_transaction_count: 4,
      price_creep_pct: 0,
      normalization_method: "alias",
    },
    expectedType: "email_cancellation",
  },
  {
    name: "GitHub — recurring Dev vendor <$5K → email_cancellation",
    vendor: {
      vendor_canonical: "GitHub",
      vendor_category: "Dev & Engineering",
      active_month_count: 5,
      consecutive_month_count: 5,
      average_monthly_spend: 150,
      latest_monthly_spend: 150,
      annualized_spend: 1800,
      total_spend: 750,
      total_transaction_count: 5,
      price_creep_pct: 0,
      normalization_method: "alias",
    },
    expectedType: "email_cancellation",
  },
  {
    name: "Acme Corp — raw vendor, 2 months only → manual_review",
    vendor: {
      vendor_canonical: "Acme Corp",
      vendor_category: "Other",
      active_month_count: 2,
      consecutive_month_count: 2,
      average_monthly_spend: 500,
      latest_monthly_spend: 500,
      annualized_spend: 6000,
      total_spend: 1000,
      total_transaction_count: 2,
      price_creep_pct: 0,
      normalization_method: "raw",
    },
    expectedType: "manual_review",
  },
  {
    name: "Notion — recurring Productivity <$5K, no negotiation → email_cancellation",
    vendor: {
      vendor_canonical: "Notion",
      vendor_category: "Productivity",
      active_month_count: 4,
      consecutive_month_count: 4,
      average_monthly_spend: 80,
      latest_monthly_spend: 80,
      annualized_spend: 960,
      total_spend: 320,
      total_transaction_count: 4,
      price_creep_pct: 0,
      normalization_method: "alias",
    },
    expectedType: "email_cancellation",
  },
  {
    name: "Twilio — high-spend Comms vendor with price creep → ai_negotiation",
    vendor: {
      vendor_canonical: "Twilio",
      vendor_category: "Communications",
      active_month_count: 7,
      consecutive_month_count: 7,
      average_monthly_spend: 1200,
      latest_monthly_spend: 1350,
      annualized_spend: 14400,
      total_spend: 8400,
      total_transaction_count: 14,
      price_creep_pct: 12.5,
      normalization_method: "alias",
    },
    expectedType: "ai_negotiation",
  },
];

let passed = 0;
let failed = 0;

for (const scenario of scenarios) {
  const result = classify(scenario.vendor);
  const ok = result.type === scenario.expectedType;
  if (ok) {
    passed++;
    console.log(`  PASS  ${scenario.name}`);
    console.log(`        → ${result.type} (est $${result.estimated.toLocaleString()}, conf ${result.confidence.toFixed(1)})`);
  } else {
    failed++;
    console.log(`  FAIL  ${scenario.name}`);
    console.log(`        Expected: ${scenario.expectedType}  Got: ${result.type}`);
    console.log(`        (est $${result.estimated.toLocaleString()}, conf ${result.confidence.toFixed(1)})`);
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${scenarios.length} scenarios`);
process.exit(failed > 0 ? 1 : 0);
