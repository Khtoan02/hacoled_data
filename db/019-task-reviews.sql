ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS review_status text CHECK (review_status IN ('passed', 'failed'));
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS review_comment text NOT NULL DEFAULT '';
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES app_members(id);
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS reviewer_name text;
ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
