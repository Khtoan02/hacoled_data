ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS result_text text NOT NULL DEFAULT '';
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS evidence_links jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence_links) = 'array');
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS report_version integer NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS app_task_reports (
  id uuid PRIMARY KEY,
  task_id uuid NOT NULL,
  task_title text NOT NULL,
  assignee_id uuid NOT NULL REFERENCES app_members(id),
  actor_id uuid NOT NULL REFERENCES app_members(id),
  actor_name text NOT NULL,
  status text NOT NULL,
  result_text text NOT NULL,
  evidence_links jsonb NOT NULL,
  checklist jsonb NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_task_reports_task_idx ON app_task_reports(task_id, created_at DESC);
