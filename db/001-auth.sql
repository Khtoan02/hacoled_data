CREATE TABLE IF NOT EXISTS app_members (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('lead_marketing','fulltime_coord','intern_seo','intern_video_long','intern_video_short','sales_hotline','executive','ai_assistant')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash text PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES app_members(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_sessions_member_idx ON app_sessions(member_id);
CREATE TABLE IF NOT EXISTS app_auth_attempts (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_member_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES app_members(id),
  target_id uuid NOT NULL REFERENCES app_members(id),
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
