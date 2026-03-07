-- Policy rules: per-user expense policy configuration for AI enforcement.

CREATE TABLE policy_rules (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    text          NOT NULL,
  allowed     boolean       DEFAULT true,
  max_amount  numeric(10,2),
  description text,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE policy_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_rules_owner_only" ON policy_rules
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_policy_rules_user_id
  ON policy_rules(user_id);
