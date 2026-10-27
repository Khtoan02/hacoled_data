CREATE TABLE IF NOT EXISTS app_tasks (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  assignee_id uuid NOT NULL REFERENCES app_members(id),
  created_by uuid NOT NULL REFERENCES app_members(id),
  due_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_tasks_assignee_idx ON app_tasks(assignee_id);
