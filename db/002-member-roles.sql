ALTER TABLE app_members DROP CONSTRAINT IF EXISTS app_members_role_check;
DELETE FROM app_sessions WHERE member_id IN (
  SELECT id FROM app_members WHERE role IN ('fulltime_coord','intern_seo','intern_video_long','intern_video_short','ai_assistant')
);
UPDATE app_members SET
  active = CASE WHEN role = 'ai_assistant' THEN false ELSE active END,
  role = CASE
    WHEN role IN ('fulltime_coord','ai_assistant') THEN 'marketing_staff'
    WHEN role IN ('intern_seo','intern_video_long','intern_video_short') THEN 'marketing_intern'
    ELSE role END
WHERE role IN ('fulltime_coord','intern_seo','intern_video_long','intern_video_short','ai_assistant');
ALTER TABLE app_members ADD CONSTRAINT app_members_role_check CHECK (
  role IN ('sales_hotline','executive','lead_marketing','marketing_manager','marketing_staff','marketing_intern')
);
