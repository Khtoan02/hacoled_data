-- Images are private task data, served only through an authenticated route.
CREATE TABLE IF NOT EXISTS app_task_attachments (
 id uuid PRIMARY KEY,
 task_id uuid NOT NULL REFERENCES app_tasks(id) ON DELETE CASCADE,
 uploaded_by uuid NOT NULL REFERENCES app_members(id),
 name text NOT NULL,
 content_type text NOT NULL CHECK(content_type IN ('image/png','image/jpeg','image/webp')),
 bytes bytea NOT NULL,
 size integer NOT NULL CHECK(size>0 AND size<=2097152),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_task_attachments_task ON app_task_attachments(task_id);
