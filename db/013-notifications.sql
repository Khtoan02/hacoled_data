CREATE TABLE IF NOT EXISTS app_notifications (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 member_id uuid NOT NULL REFERENCES app_members(id) ON DELETE CASCADE,
 task_id uuid REFERENCES app_tasks(id) ON DELETE CASCADE,
 kpi_id uuid REFERENCES app_kpis(id) ON DELETE CASCADE,
 event_key text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('task_assigned','task_completed','kpi_reminder')),
 title text NOT NULL,
 body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 read_at timestamptz,
 UNIQUE(member_id,event_key)
);
CREATE INDEX IF NOT EXISTS app_notifications_inbox ON app_notifications(member_id,id DESC);
CREATE OR REPLACE FUNCTION app_notify_task() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE assigned boolean; finished boolean; person_role text; person_name text;
BEGIN
 IF TG_OP='INSERT' THEN assigned:=true; finished:=NEW.status='completed';
 ELSE assigned:=NEW.assignee_id IS DISTINCT FROM OLD.assignee_id; finished:=NEW.status='completed' AND OLD.status<>'completed'; END IF;
 SELECT role,name INTO person_role,person_name FROM app_members WHERE id=NEW.assignee_id;
 IF assigned THEN
  INSERT INTO app_notifications(member_id,task_id,event_key,kind,title,body)
  SELECT m.id,NEW.id,'assigned:'||NEW.id||':'||NEW.report_version,'task_assigned','Công việc mới',NEW.title||' · '||person_name
  FROM app_members m WHERE m.active AND (m.role IN ('executive','lead_marketing') OR (m.id=NEW.assignee_id AND m.role<>'sales_hotline') OR (m.role='marketing_manager' AND person_role IN ('marketing_staff','marketing_intern')))
  ON CONFLICT(member_id,event_key) DO NOTHING;
 END IF;
 IF finished THEN
  INSERT INTO app_notifications(member_id,task_id,event_key,kind,title,body)
  SELECT m.id,NEW.id,'completed:'||NEW.id||':'||NEW.report_version,'task_completed','Công việc đã hoàn thành',person_name||' · '||NEW.title
  FROM app_members m WHERE m.active AND (m.role IN ('executive','lead_marketing') OR (m.role='marketing_manager' AND (m.id=NEW.assignee_id OR person_role IN ('marketing_staff','marketing_intern'))))
  ON CONFLICT(member_id,event_key) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS app_task_notification ON app_tasks;
CREATE TRIGGER app_task_notification AFTER INSERT OR UPDATE OF assignee_id,status ON app_tasks FOR EACH ROW EXECUTE FUNCTION app_notify_task();
