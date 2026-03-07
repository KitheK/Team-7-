-- Catch-all performance indexes for queries that span multiple tables.
-- Uses IF NOT EXISTS to avoid conflicts with indexes created in earlier migrations.

-- Composite index for anomaly dashboard filtering by type within a status.
CREATE INDEX IF NOT EXISTS idx_anomalies_type_status_amount
  ON anomalies(workspace_id, type, status, amount);

-- Partial index: only open anomalies (used by recalculate_workspace_total).
CREATE INDEX IF NOT EXISTS idx_anomalies_open
  ON anomalies(workspace_id, amount)
  WHERE status = 'open';

-- Transaction date range scans within a workspace.
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_date
  ON transactions(workspace_id, transaction_date DESC);

-- Category breakdown queries.
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_category
  ON transactions(workspace_id, category);
