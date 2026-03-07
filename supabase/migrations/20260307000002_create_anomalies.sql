-- Anomalies: flagged financial issues (zombie subscriptions, price creep, policy violations).

CREATE TABLE anomalies (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid          NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type          text          NOT NULL
                CHECK (type IN (
                  'zombie_subscription',
                  'price_creep',
                  'policy_violation',
                  'uncategorised'
                )),
  amount        numeric(12,2) NOT NULL,
  status        text          NOT NULL DEFAULT 'open'
                CHECK (status IN (
                  'open',
                  'resolved',
                  'pending_approval',
                  'dismissed'
                )),
  metadata      jsonb         DEFAULT '{}',
  source        text          DEFAULT 'csv'
                CHECK (source IN ('csv', 'receipt_scan')),
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- RLS: users can only access anomalies belonging to their workspaces.

ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anomalies_owner_only" ON anomalies
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE INDEX idx_anomalies_workspace_status
  ON anomalies(workspace_id, status);

CREATE INDEX idx_anomalies_workspace_type
  ON anomalies(workspace_id, type, status);
