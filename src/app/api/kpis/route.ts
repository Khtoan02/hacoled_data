import { scopedKpiData } from "../../../lib/kpi-data";
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
import {
  currentMonth,
  OUTPUT_TYPES,
  SELECTABLE_OUTPUT_TYPES,
  validMonth,
} from "../../../lib/kpis";
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
    const { kpis, extras } = await scopedKpiData(actor, month);
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
    const version = req.nextUrl.searchParams.get("version");
    if (version !== null && !/^\d+$/.test(version)) throw new RequestError("Phiên bản KPI không hợp lệ.");
    const expected = version === null ? null : Number(version);
    if (expected !== null && (!Number.isSafeInteger(expected) || expected > 2147483647)) throw new RequestError("Phiên bản KPI không hợp lệ.");
    const sql = database();
    const result = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(724111)`,
      sql`SELECT id FROM app_kpis WHERE id=${id} AND (${expected}::int IS NULL OR version=${expected}::int) FOR UPDATE`,
      sql`INSERT INTO app_deletion_audit(id,entity_type,entity_id,actor_id,snapshot)
      SELECT ${randomUUID()},'kpi',k.id,${actor.id},jsonb_build_object('kpi',to_jsonb(k),'target_history',COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM app_kpi_audit a WHERE a.kpi_id=k.id),'[]'::jsonb),'linked_task_ids',COALESCE((SELECT jsonb_agg(t.id) FROM app_tasks t WHERE t.kpi_id=k.id),'[]'::jsonb))
      FROM app_kpis k WHERE k.id=${id} AND (${expected}::int IS NULL OR k.version=${expected}::int)`,
      sql`UPDATE app_tasks t SET kpi_id=NULL,report_version=report_version+1,updated_at=now() WHERE t.kpi_id=${id} AND EXISTS(SELECT 1 FROM app_kpis k WHERE k.id=${id} AND (${expected}::int IS NULL OR k.version=${expected}::int)) RETURNING t.id`,
      sql`DELETE FROM app_kpi_audit a WHERE a.kpi_id=${id} AND EXISTS(SELECT 1 FROM app_kpis k WHERE k.id=${id} AND (${expected}::int IS NULL OR k.version=${expected}::int))`,
      sql`DELETE FROM app_kpis WHERE id=${id} AND (${expected}::int IS NULL OR version=${expected}::int) RETURNING id`,
    ]);
    if (!result[5].length) throw new RequestError("KPI không còn tồn tại hoặc vừa thay đổi. Làm mới trước khi xóa.", 409);
    return NextResponse.json({ ok: true, unlinked_tasks: result[3].length });
  } catch (e) {
    return apiError(e);
  }
}
