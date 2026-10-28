CREATE TABLE IF NOT EXISTS app_chat_rooms (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('direct','group')),
  title text NOT NULL DEFAULT '' CHECK (char_length(title)<=100),
  creation_key text NOT NULL UNIQUE,
  creation_hash text NOT NULL,
  owner_id uuid REFERENCES app_members(id),
  created_by uuid NOT NULL REFERENCES app_members(id),
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK ((kind='direct' AND owner_id IS NULL) OR (kind='group' AND owner_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS app_chat_members (
  room_id uuid NOT NULL REFERENCES app_chat_rooms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES app_members(id),
  joined_after_seq bigint NOT NULL DEFAULT 0,
  last_read_seq bigint NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(room_id,member_id)
);
CREATE INDEX IF NOT EXISTS app_chat_members_member_idx ON app_chat_members(member_id,room_id);
CREATE TABLE IF NOT EXISTS app_chat_messages (
  seq bigserial PRIMARY KEY,
  id uuid NOT NULL UNIQUE,
  room_id uuid NOT NULL REFERENCES app_chat_rooms(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES app_members(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS app_chat_messages_room_seq_idx ON app_chat_messages(room_id,seq DESC);
