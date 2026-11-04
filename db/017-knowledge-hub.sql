CREATE TABLE IF NOT EXISTS app_knowledge_posts (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('announcement', 'sop', 'knowledge')),
  summary text NOT NULL DEFAULT '',
  content text NOT NULL,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  pinned boolean NOT NULL DEFAULT false,
  require_ack boolean NOT NULL DEFAULT true,
  author_id uuid NOT NULL REFERENCES app_members(id),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS app_knowledge_posts_order_idx ON app_knowledge_posts(pinned DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS app_knowledge_posts_category_idx ON app_knowledge_posts(category);

CREATE TABLE IF NOT EXISTS app_knowledge_reads (
  post_id uuid NOT NULL REFERENCES app_knowledge_posts(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES app_members(id) ON DELETE CASCADE,
  first_viewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_viewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  view_count integer NOT NULL DEFAULT 1,
  acknowledged_at timestamptz,
  acknowledged_version integer,
  PRIMARY KEY (post_id, member_id)
);

CREATE INDEX IF NOT EXISTS app_knowledge_reads_member_idx ON app_knowledge_reads(member_id);

ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES app_knowledge_posts(id) ON DELETE CASCADE;
ALTER TABLE app_notifications DROP CONSTRAINT IF EXISTS app_notifications_kind_check;
ALTER TABLE app_notifications ADD CONSTRAINT app_notifications_kind_check CHECK (kind IN ('task_assigned', 'task_completed', 'kpi_reminder', 'knowledge_post'));

ALTER TABLE app_deletion_audit DROP CONSTRAINT IF EXISTS app_deletion_audit_entity_type_check;
ALTER TABLE app_deletion_audit ADD CONSTRAINT app_deletion_audit_entity_type_check CHECK (entity_type IN ('kpi', 'task', 'knowledge_post'));
