-- Transactions: individual financial line items parsed from uploaded files.
-- File uploads: audit trail linking raw files to their parsed output.

CREATE TABLE transactions (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid          NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vendor_name      text          NOT NULL,
  amount           numeric(12,2) NOT NULL,
  transaction_date date          NOT NULL,
  category         text          DEFAULT 'uncategorised',
  source_file      text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE file_uploads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id),
  storage_path      text        NOT NULL,
  original_filename text,
  row_count         int         DEFAULT 0,
  rejected_count    int         DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- RLS: users can only access transactions/uploads belonging to their workspaces.

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_owner_only" ON transactions
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_uploads_owner_only" ON file_uploads
  FOR ALL USING (
    user_id = auth.uid()
  );

CREATE INDEX idx_transactions_workspace_id
  ON transactions(workspace_id);

CREATE INDEX idx_transactions_vendor_date
  ON transactions(workspace_id, vendor_name, transaction_date DESC);

CREATE INDEX idx_file_uploads_workspace
  ON file_uploads(workspace_id, created_at DESC);
