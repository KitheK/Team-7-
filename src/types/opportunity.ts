export type OpportunityType =
  | "email_cancellation"
  | "ai_negotiation"
  | "manual_review";

export type OpportunityStatus =
  | "detected"
  | "recommended"
  | "email_drafted"
  | "email_sent"
  | "ai_call_started"
  | "ai_call_completed"
  | "resolved"
  | "dismissed";

export interface Opportunity {
  id: string;
  user_id: string;
  vendor_name: string;
  canonical_vendor_name: string | null;
  category: string | null;
  type: OpportunityType;
  reason_codes: string[];
  explanation: string;
  confidence: number;
  annualized_spend: number;
  estimated_annual_savings: number;
  secured_annual_savings: number;
  recurring_months: number;
  latest_monthly_spend: number | null;
  price_creep_pct: number | null;
  status: OpportunityStatus;
  action_taken_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunitySummary {
  securedSavings: number;
  potentialSavings: number;
  totalOpportunities: number;
  emailCancellationCount: number;
  aiNegotiationCount: number;
  manualReviewCount: number;
}

export const EMPTY_SUMMARY: OpportunitySummary = {
  securedSavings: 0,
  potentialSavings: 0,
  totalOpportunities: 0,
  emailCancellationCount: 0,
  aiNegotiationCount: 0,
  manualReviewCount: 0,
};
