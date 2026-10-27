CREATE TABLE IF NOT EXISTS app_task_channels (
  task_id uuid NOT NULL REFERENCES app_tasks(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES app_social_channels(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, channel_id)
);

CREATE INDEX IF NOT EXISTS app_task_channels_channel_idx
  ON app_task_channels(channel_id);

INSERT INTO app_task_channels(task_id, channel_id)
SELECT id, channel_id FROM app_tasks WHERE channel_id IS NOT NULL
ON CONFLICT DO NOTHING;
