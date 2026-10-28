-- Keep a reviewable snapshot when administrators remove erroneous plans/work.
CREATE TABLE IF NOT EXISTS app_deletion_audit (
  id uuid PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('kpi','task')),
  entity_id uuid NOT NULL,
  actor_id uuid NOT NULL REFERENCES app_members(id),
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_deletion_audit_entity_idx ON app_deletion_audit(entity_type,entity_id);
