-- Enable Supabase Realtime on tables that require live updates.
-- REPLICA IDENTITY FULL ensures UPDATE payloads carry the complete row.

ALTER TABLE anomalies  REPLICA IDENTITY FULL;
ALTER TABLE workspaces REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;
