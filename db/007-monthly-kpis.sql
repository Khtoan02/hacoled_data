CREATE TABLE IF NOT EXISTS app_kpis (
  id uuid PRIMARY KEY,
  assignee_id uuid NOT NULL REFERENCES app_members(id),
  channel_id uuid NOT NULL REFERENCES app_social_channels(id),
  month date NOT NULL CHECK (EXTRACT(DAY FROM month)=1),
  output_type text NOT NULL CHECK (output_type IN ('post','video','short_video','story','image','livestream','other')),
  target integer NOT NULL CHECK (target BETWEEN 1 AND 100000),
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES app_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignee_id,channel_id,month,output_type)
);
CREATE TABLE IF NOT EXISTS app_kpi_audit (
  id uuid PRIMARY KEY,
  kpi_id uuid NOT NULL REFERENCES app_kpis(id),
  actor_id uuid NOT NULL REFERENCES app_members(id),
  target integer NOT NULL,
  active boolean NOT NULL,
  notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS kpi_id uuid REFERENCES app_kpis(id);
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS output_type text NOT NULL DEFAULT 'other' CHECK (output_type IN ('post','video','short_video','story','image','livestream','other'));
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS planned_quantity integer NOT NULL DEFAULT 1 CHECK (planned_quantity BETWEEN 1 AND 100000);
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS delivered_quantity integer NOT NULL DEFAULT 0 CHECK (delivered_quantity BETWEEN 0 AND 100000);
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS delivered_on date;
CREATE INDEX IF NOT EXISTS app_tasks_kpi_idx ON app_tasks(kpi_id);
ALTER TABLE app_task_reports ADD COLUMN IF NOT EXISTS kpi_id uuid;
ALTER TABLE app_task_reports ADD COLUMN IF NOT EXISTS output_type text NOT NULL DEFAULT 'other';
ALTER TABLE app_task_reports ADD COLUMN IF NOT EXISTS planned_quantity integer NOT NULL DEFAULT 1;
ALTER TABLE app_task_reports ADD COLUMN IF NOT EXISTS delivered_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE app_task_reports ADD COLUMN IF NOT EXISTS delivered_on date;
