CREATE TABLE IF NOT EXISTS app_social_channels (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  handle text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  credentials_cipher text,
  version integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES app_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_social_channel_access (
  channel_id uuid NOT NULL REFERENCES app_social_channels(id),
  member_id uuid NOT NULL REFERENCES app_members(id),
  PRIMARY KEY (channel_id, member_id)
);
CREATE TABLE IF NOT EXISTS app_social_channel_audit (
  id uuid PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES app_social_channels(id),
  actor_id uuid NOT NULL REFERENCES app_members(id),
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES app_social_channels(id);
CREATE INDEX IF NOT EXISTS app_tasks_channel_idx ON app_tasks(channel_id);
ALTER TABLE app_task_reports ADD COLUMN IF NOT EXISTS channel_id uuid;
ALTER TABLE app_task_reports ADD COLUMN IF NOT EXISTS channel_name text;
