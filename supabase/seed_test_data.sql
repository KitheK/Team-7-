-- ============================================================
-- Alfred Analytics: Test seed data
-- Creates a test user's workspaces and transactions to verify
-- vendor normalization, recurrence detection, price creep,
-- and opportunity classification.
--
-- Run AFTER the analytics migration (20260308000002).
-- This uses a placeholder user_id — replace with a real UUID
-- from auth.users when testing against a live Supabase instance.
-- ============================================================

-- For local testing, we reference existing workspaces.
-- In a real seed, you'd insert into auth.users first.
-- Below assumes workspaces already exist for the user.

-- Quick verification queries (run after refresh-analytics):

-- 1. Check vendor normalization
-- select vendor_canonical, vendor_category, normalization_method, count(*)
-- from v_transactions_normalized
-- group by 1, 2, 3
-- order by count(*) desc;

-- 2. Check monthly rollups
-- select vendor_canonical, year, month, monthly_total, transaction_count
-- from v_monthly_vendor_rollups
-- order by vendor_canonical, year, month;

-- 3. Check cross-month summary
-- select
--   vendor_canonical, vendor_category,
--   active_month_count, consecutive_month_count,
--   average_monthly_spend, latest_monthly_spend,
--   annualized_spend, price_creep_pct,
--   normalization_method
-- from v_vendor_cross_month_summary
-- order by annualized_spend desc;

-- 4. Check opportunities (after running refresh-analytics edge function)
-- select
--   vendor_name, type, status, confidence,
--   annualized_spend, estimated_annual_savings,
--   reason_codes, explanation
-- from opportunities
-- order by estimated_annual_savings desc;

-- 5. Check opportunity summary
-- select * from get_opportunity_summary('<user_id>');

-- ============================================================
-- EXPECTED CLASSIFICATION OUTCOMES
-- (Verify these after running refresh-analytics)
-- ============================================================
--
-- | Vendor               | Expected Type          | Reason                                            |
-- |----------------------|------------------------|---------------------------------------------------|
-- | Amazon Web Services  | ai_negotiation         | 6+ months, $50K+ annualized, Cloud category       |
-- | Salesforce           | ai_negotiation         | 6+ months, $18K annualized, CRM category          |
-- | Slack                | email_cancellation     | Recurring, <$5K annual, not negotiation-eligible   |
-- | Figma                | email_cancellation     | Recurring, <$5K annual, Design category            |
-- | GitHub               | email_cancellation     | Recurring, <$5K annual, Dev category               |
-- | Notion               | email_cancellation     | Recurring, <$5K annual, Productivity               |
-- | Acme Corp            | manual_review          | Raw vendor (no alias match), low confidence        |
-- ============================================================
