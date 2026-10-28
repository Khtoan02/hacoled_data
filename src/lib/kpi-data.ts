import "server-only";
import { database } from "./auth/server";
import { ROLE_POLICIES } from "./security/rbac";
import type { Member } from "./auth/types";
export async function scopedKpiData(actor: Member, month: string) {
  const all = month === "all",
    scope = ROLE_POLICIES[actor.role].taskScope;
  const date = all ? "2000-01-01" : `${month}-01`;
  const kpis =
    await database()`SELECT k.id,k.assignee_id,m.name AS assignee_name,k.channel_id,c.name AS channel_name,to_char(k.month,'YYYY-MM') AS month,k.output_type,k.target,k.notes,k.active,k.version,
    COUNT(t.id)::int AS task_count,COALESCE(SUM(t.planned_quantity),0)::int AS planned,
    COUNT(t.id) FILTER(WHERE t.status='completed')::int AS completed_tasks,
    COUNT(t.id) FILTER(WHERE t.status='completed' AND t.delivered_quantity=0)::int AS zero_quantity_tasks,
    COALESCE(SUM(t.delivered_quantity) FILTER(WHERE t.status='completed'),0)::int AS delivered,
    COALESCE(SUM(t.delivered_quantity) FILTER(WHERE t.status='completed' AND (t.delivered_on<k.month OR t.delivered_on>=k.month+interval '1 month')),0)::int AS outside_month
    FROM app_kpis k JOIN app_members m ON m.id=k.assignee_id JOIN app_social_channels c ON c.id=k.channel_id
    LEFT JOIN app_tasks t ON t.kpi_id=k.id AND t.assignee_id=k.assignee_id AND t.channel_id=k.channel_id AND t.output_type=k.output_type
    WHERE (${all} OR k.month=${date}::date) AND (${scope}='all' OR k.assignee_id=${actor.id} OR (${scope}='marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))
    GROUP BY k.id,m.name,c.name ORDER BY k.month DESC,m.name,c.name,k.output_type`;
  const extras = all
    ? []
    : await database()`SELECT t.id,t.title,t.assignee_id,m.name AS assignee_name,t.channel_id,c.name AS channel_name,t.status,t.output_type,t.delivered_quantity,to_char(COALESCE(t.delivered_on,(t.completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date),'YYYY-MM-DD') AS delivered_on
    FROM app_tasks t JOIN app_members m ON m.id=t.assignee_id LEFT JOIN app_social_channels c ON c.id=t.channel_id
    WHERE t.kpi_id IS NULL AND t.status='completed' AND COALESCE(t.delivered_on,(t.completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)>=${date}::date
    AND COALESCE(t.delivered_on,(t.completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)<${date}::date+interval '1 month'
    AND (${scope}='all' OR t.assignee_id=${actor.id} OR (${scope}='marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))
    ORDER BY t.completed_at DESC,t.id`;
  return { kpis, extras };
}
