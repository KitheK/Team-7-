-- Vendor price history: rolling 6-month aggregate view used for
-- price-creep statistical analysis.

CREATE OR REPLACE VIEW vendor_price_history AS
SELECT
  workspace_id,
  vendor_name,
  DATE_TRUNC('month', transaction_date) AS charge_month,
  COUNT(*)                              AS charge_count,
  AVG(amount)                           AS avg_charge,
  MIN(amount)                           AS min_charge,
  MAX(amount)                           AS max_charge,
  STDDEV(amount)                        AS stddev_charge
FROM transactions
WHERE transaction_date >= NOW() - INTERVAL '6 months'
GROUP BY workspace_id, vendor_name, DATE_TRUNC('month', transaction_date)
ORDER BY vendor_name, charge_month;

-- RPC wrapper so the client can query by workspace_id through PostgREST.

CREATE OR REPLACE FUNCTION get_vendor_history(ws_id uuid)
RETURNS TABLE (
  workspace_id   uuid,
  vendor_name    text,
  charge_month   timestamptz,
  charge_count   bigint,
  avg_charge     numeric,
  min_charge     numeric,
  max_charge     numeric,
  stddev_charge  numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM vendor_price_history
  WHERE workspace_id = ws_id;
$$;
