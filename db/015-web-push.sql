CREATE TABLE IF NOT EXISTS app_push_subscriptions (
 id uuid PRIMARY KEY,
 member_id uuid NOT NULL REFERENCES app_members(id) ON DELETE CASCADE,
 session_hash text NOT NULL REFERENCES app_sessions(token_hash) ON DELETE CASCADE,
 endpoint text NOT NULL UNIQUE,
 p256dh text NOT NULL,
 auth text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_push_subscriptions_member ON app_push_subscriptions(member_id);
CREATE TABLE IF NOT EXISTS app_push_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 member_id uuid NOT NULL REFERENCES app_members(id) ON DELETE CASCADE,
 notification_id bigint REFERENCES app_notifications(id) ON DELETE CASCADE,
 message_id uuid REFERENCES app_chat_messages(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 available_at timestamptz NOT NULL DEFAULT now(),
 lease_until timestamptz,
 claim_token uuid,
 attempts integer NOT NULL DEFAULT 0,
 completed_at timestamptz,
 CHECK ((notification_id IS NULL) <> (message_id IS NULL)),
 UNIQUE(member_id,notification_id),
 UNIQUE(member_id,message_id)
);
CREATE INDEX IF NOT EXISTS app_push_events_pending ON app_push_events(available_at) WHERE completed_at IS NULL;
CREATE TABLE IF NOT EXISTS app_push_deliveries (
 event_id bigint NOT NULL REFERENCES app_push_events(id) ON DELETE CASCADE,
 subscription_id uuid NOT NULL REFERENCES app_push_subscriptions(id) ON DELETE CASCADE,
 sent_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(event_id,subscription_id)
);
CREATE OR REPLACE FUNCTION app_queue_notification_push() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO app_push_events(member_id,notification_id)
 SELECT NEW.member_id,NEW.id WHERE EXISTS(SELECT 1 FROM app_push_subscriptions p JOIN app_sessions s ON s.token_hash=p.session_hash WHERE p.member_id=NEW.member_id AND s.expires_at>now())
 ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS app_notification_push ON app_notifications;
CREATE TRIGGER app_notification_push AFTER INSERT ON app_notifications FOR EACH ROW EXECUTE FUNCTION app_queue_notification_push();
CREATE OR REPLACE FUNCTION app_queue_chat_push() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO app_push_events(member_id,message_id)
 SELECT c.member_id,NEW.id FROM app_chat_members c JOIN app_members m ON m.id=c.member_id
 WHERE c.room_id=NEW.room_id AND c.member_id<>NEW.author_id AND m.active AND NEW.seq>c.joined_after_seq
 AND EXISTS(SELECT 1 FROM app_push_subscriptions p JOIN app_sessions s ON s.token_hash=p.session_hash WHERE p.member_id=c.member_id AND s.expires_at>now())
 ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS app_chat_push ON app_chat_messages;
CREATE TRIGGER app_chat_push AFTER INSERT ON app_chat_messages FOR EACH ROW EXECUTE FUNCTION app_queue_chat_push();
