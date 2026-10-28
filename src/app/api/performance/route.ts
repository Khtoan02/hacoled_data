import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  database,
  getMember,
  RequestError,
} from "../../../lib/auth/server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
import { currentMonth, validMonth, type Kpi } from "../../../lib/kpis";
import { scopedKpiData } from "../../../lib/kpi-data";
import {
  summarizePerformance,
  type PerformanceTask,
} from "../../../lib/performance";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    const scope = ROLE_POLICIES[member.role].taskScope;
    if (scope === "none")
      throw new RequestError("Chưa được cấp quyền báo cáo.", 403);
    const month = req.nextUrl.searchParams.get("month") || currentMonth();
    if (!validMonth(month))
      throw new RequestError("Tháng đánh giá không hợp lệ.");
    const [data, tasks] = await Promise.all([
      scopedKpiData(member, "all"),
      database()`SELECT t.id,t.title,t.assignee_id,m.name AS assignee_name,t.channel_id,c.name AS channel_name,t.output_type,t.kpi_id,t.status,t.due_at,t.completed_at,t.created_at,to_char(t.delivered_on,'YYYY-MM-DD') AS delivered_on,t.delivered_quantity,t.brief,t.result_text,jsonb_array_length(t.evidence_links)>0 AS has_evidence,
  (SELECT COUNT(*)::int FROM jsonb_array_elements(t.checklist) item WHERE item->>'done'='true') AS checklist_done,jsonb_array_length(t.checklist) AS checklist_total
  FROM app_tasks t JOIN app_members m ON m.id=t.assignee_id LEFT JOIN app_social_channels c ON c.id=t.channel_id WHERE (${scope}='all' OR t.assignee_id=${member.id} OR (${scope}='marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))`,
    ]);
    return NextResponse.json(
      summarizePerformance(
        tasks as unknown as PerformanceTask[],
        data.kpis as unknown as Kpi[],
        month,
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
