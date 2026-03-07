-- Create the workspaces table: top-level container for all financial data in LeanLedger.

CREATE TABLE workspaces (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year  text          NOT NULL,
  total_saved numeric(12,2) NOT NULL DEFAULT 0,
  created_at  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT uq_user_month UNIQUE (user_id, month_year)
);

-- Row Level Security: isolate each user's workspaces.
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_owner_only" ON workspaces
  FOR ALL USING (user_id = auth.uid());

-- Speed up lookups by user.
CREATE INDEX idx_workspaces_user_id ON workspaces (user_id);
