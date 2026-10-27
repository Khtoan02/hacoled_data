ALTER TABLE app_tasks
  ADD COLUMN IF NOT EXISTS brief jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(brief) = 'object');
