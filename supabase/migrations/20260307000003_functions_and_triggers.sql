-- recalculate_workspace_total: sums open anomalies and writes
-- the result into workspaces.total_saved for a given workspace.

CREATE OR REPLACE FUNCTION recalculate_workspace_total(ws_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total
    FROM anomalies
   WHERE workspace_id = ws_id
     AND status = 'open';

  UPDATE workspaces
     SET total_saved = v_total
   WHERE id = ws_id;
END;
$$;

-- Trigger function: routes anomaly row changes to recalculate_workspace_total
-- for every affected workspace (handles INSERT, UPDATE, DELETE, and workspace reassignment).

CREATE OR REPLACE FUNCTION trg_after_anomaly_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_workspace_total(OLD.workspace_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
    PERFORM recalculate_workspace_total(OLD.workspace_id);
  END IF;

  PERFORM recalculate_workspace_total(NEW.workspace_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_anomaly_change
  AFTER INSERT OR UPDATE OR DELETE
  ON anomalies
  FOR EACH ROW
  EXECUTE FUNCTION trg_after_anomaly_change();

-- find_zombie_subscriptions: returns vendors charged more than once
-- in the same calendar month within a workspace.

CREATE OR REPLACE FUNCTION find_zombie_subscriptions(ws_id uuid)
RETURNS TABLE (
  vendor_name      text,
  charge_month     timestamptz,
  charge_count     bigint,
  total_charged    numeric,
  transaction_ids  uuid[],
  charge_amounts   numeric[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.vendor_name,
    DATE_TRUNC('month', t.transaction_date) AS charge_month,
    COUNT(*)                                AS charge_count,
    SUM(t.amount)                           AS total_charged,
    ARRAY_AGG(t.id)                         AS transaction_ids,
    ARRAY_AGG(t.amount ORDER BY t.transaction_date) AS charge_amounts
  FROM transactions t
  WHERE t.workspace_id = ws_id
  GROUP BY t.vendor_name, DATE_TRUNC('month', t.transaction_date)
  HAVING COUNT(*) > 1;
$$;
