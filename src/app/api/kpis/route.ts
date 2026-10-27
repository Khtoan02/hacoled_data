import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
  requireManager,
} from "../../../lib/auth/server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
import { isUuid } from "../../../lib/social";
import { currentMonth, OUTPUT_TYPES, SELECTABLE_OUTPUT_TYPES, validMonth } from "../../../lib/kpis";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const actor = await getMember();
    if (!actor) throw new RequestError("Vui lòng đăng nhập.", 401);
    const scope = ROLE_POLICIES[actor.role].taskScope;
    if (scope === "none")
      throw new RequestError("Chưa được cấp quyền KPI.", 403);
    const month = req.nextUrl.searchParams.get("month") || currentMonth(),
      all = month === "all";
    if (!all && !validMonth(month))
      throw new RequestError("Tháng KPI không hợp lệ.");
    const date = all ? "2000-01-01" : `${month}-01`;
    const kpis =
      await database()`SELECT k.id,k.assignee_id,m.name AS assignee_name,k.channel_id,c.name AS channel_name,to_char(k.month,'YYYY-MM') AS month,k.output_type,k.target,k.notes,k.active,k.version,
    COUNT(t.id)::int AS task_count,COALESCE(SUM(t.planned_quantity),0)::int AS planned,
    COUNT(t.id) FILTER(WHERE t.status='completed' AND t.delivered_on>=k.month AND t.delivered_on<k.month+interval '1 month')::int AS completed_tasks,
    COALESCE(SUM(t.delivered_quantity) FILTER(WHERE t.status='completed' AND t.delivered_on>=k.month AND t.delivered_on<k.month+interval '1 month'),0)::int AS delivered,
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
    return NextResponse.json(
      { kpis, extras, month, scope },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
async function save(req: NextRequest, create: boolean) {
  try {
    checkOrigin(req);
    const actor = await requireManager(),
      b = await req.json();
    if (
      !b ||
      typeof b !== "object" ||
      Array.isArray(b) ||
      Object.keys(b).some(
        (k) =>
          ![
            "id",
            "version",
            "assignee_id",
            "channel_id",
            "month",
            "output_type",
            "target",
            "notes",
            "active",
          ].includes(k),
      )
    )
      throw new RequestError("Thông tin KPI không hợp lệ.");
    if (
      !Number.isInteger(b.target) ||
      b.target < 1 ||
      b.target > 100000 ||
      typeof b.notes !== "string" ||
      b.notes.length > 3000 ||
      typeof b.active !== "boolean"
    )
      throw new RequestError(
        "Chỉ tiêu phải là số nguyên từ 1 đến 100.000; ghi chú tối đa 3.000 ký tự.",
      );
    if (create) {
      if (
        !isUuid(b.assignee_id) ||
        !isUuid(b.channel_id) ||
        !validMonth(b.month) ||
        typeof b.output_type !== "string" ||
        !SELECTABLE_OUTPUT_TYPES.some(([id]) => id === b.output_type)
      )
        throw new RequestError(
          "Chọn nhân sự, kênh, loại sản phẩm và tháng hợp lệ.",
        );
    } else if (
      !isUuid(b.id) ||
      !Number.isSafeInteger(b.version) ||
      b.version < 0 ||
      ["assignee_id", "channel_id", "month", "output_type"].some((k) => k in b)
    )
      throw new RequestError(
        "Chỉ được sửa chỉ tiêu, ghi chú và trạng thái. Giữ nguyên người, kênh, loại sản phẩm và kỳ đã giao.",
      );
    const id = create ? randomUUID() : b.id;
    const rows = create
      ? await database()`WITH saved AS(INSERT INTO app_kpis(id,assignee_id,channel_id,month,output_type,target,notes,active,created_by)
    SELECT ${id},m.id,c.id,${`${b.month}-01`}::date,${b.output_type},${b.target},${b.notes.trim()},${b.active},${actor.id}
    FROM app_members m CROSS JOIN app_social_channels c WHERE m.id=${b.assignee_id} AND m.active=true AND m.role IN ('lead_marketing','executive','marketing_manager','marketing_staff','marketing_intern') AND c.id=${b.channel_id} AND c.active=true
    ON CONFLICT(assignee_id,channel_id,month,output_type) DO NOTHING RETURNING *)
    INSERT INTO app_kpi_audit(id,kpi_id,actor_id,target,active,notes) SELECT ${randomUUID()},id,${actor.id},target,active,notes FROM saved RETURNING kpi_id`
      : await database()`WITH saved AS(UPDATE app_kpis SET target=${b.target},notes=${b.notes.trim()},active=${b.active},version=version+1,updated_at=now() WHERE id=${id} AND version=${b.version} RETURNING *)
    INSERT INTO app_kpi_audit(id,kpi_id,actor_id,target,active,notes) SELECT ${randomUUID()},id,${actor.id},target,active,notes FROM saved RETURNING kpi_id`;
    if (!rows.length)
      throw new RequestError(
        create
          ? "KPI đã tồn tại hoặc nhân sự/kênh không còn hoạt động. Kiểm tra danh sách trước khi giao."
          : "KPI vừa thay đổi. Tải lại danh sách trước khi lưu.",
        409,
      );
    return NextResponse.json({ ok: true, id }, { status: create ? 201 : 200 });
  } catch (e) {
    return apiError(e);
  }
}
export const POST = (req: NextRequest) => save(req, true);
export const PATCH = (req: NextRequest) => save(req, false);
export async function DELETE(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireManager();
    const id = req.nextUrl.searchParams.get("id");
    if (!isUuid(id)) throw new RequestError("Mã KPI không hợp lệ.");
    const sql = database();
    const results = await sql.transaction([
      sql`UPDATE app_tasks SET kpi_id=NULL,updated_at=now(),report_version=report_version+1 WHERE kpi_id=${id}`,
      sql`DELETE FROM app_kpi_audit WHERE kpi_id=${id}`,
      sql`DELETE FROM app_kpis WHERE id=${id} RETURNING id`,
    ]);
    if (!results[2].length) throw new RequestError("Không tìm thấy KPI.", 404);
    return NextResponse.json({ ok: true, actor: actor.id });
  } catch (e) {
    return apiError(e);
  }
}
