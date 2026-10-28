CREATE TABLE IF NOT EXISTS app_kpi_imports (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES app_members(id),
  request_hash text NOT NULL,
  row_count integer NOT NULL,
  created_count integer NOT NULL,
  updated_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_task_plan_imports (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES app_members(id),
  request_hash text NOT NULL,
  row_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_task_plan_imports_actor_hash
  ON app_task_plan_imports(actor_id,request_hash);
