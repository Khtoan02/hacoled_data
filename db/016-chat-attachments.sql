CREATE TABLE IF NOT EXISTS app_chat_attachments (
 id uuid PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES app_chat_rooms(id) ON DELETE CASCADE,
 message_id uuid REFERENCES app_chat_messages(id) ON DELETE CASCADE,
 uploaded_by uuid NOT NULL REFERENCES app_members(id),
 name text NOT NULL,
 content_type text NOT NULL,
 size integer NOT NULL CHECK(size BETWEEN 1 AND 3145728),
 bytes bytea NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS app_chat_attachments_message ON app_chat_attachments(message_id);
ALTER TABLE app_chat_messages ADD COLUMN IF NOT EXISTS attachment_ids uuid[] NOT NULL DEFAULT '{}';
