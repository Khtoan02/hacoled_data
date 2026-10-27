import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
} from "../../../../lib/auth/server";
import { ROLE_POLICIES, isFullAccess } from "../../../../lib/security/rbac";
import { TASK_STATUSES, validEvidenceUrl } from "../../../../lib/tasks";
export const dynamic = "force-dynamic";
const isId = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export async function GET(req: NextRequest) {
  try {
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    const scope = ROLE_POLICIES[member.role].taskScope,
      id = req.nextUrl.searchParams.get("id");
    if (!isId(id)) throw new RequestError("Mã công việc không hợp lệ.");
    const visible =
      await database()`SELECT t.id FROM app_tasks t JOIN app_members m ON m.id=t.assignee_id WHERE t.id=${id} AND
      (${scope}='all' OR (${scope}<>'none' AND t.assignee_id=${member.id}) OR (${scope}='marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))`;
    if (!visible.length)
      throw new RequestError(
        "Không tìm thấy công việc trong phạm vi quyền của bạn.",
        404,
      );
    const reports =
      await database()`SELECT id, actor_name, status, result_text, evidence_links, checklist, due_at, completed_at, created_at FROM app_task_reports WHERE task_id=${id} ORDER BY created_at DESC, id DESC LIMIT 50`;
    return NextResponse.json(
      { reports },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    checkOrigin(req);
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    const scope = ROLE_POLICIES[member.role].taskScope;
    if (scope === "none")
      throw new RequestError("Quyền công việc chưa được cấp.", 403);
    const b = await req.json();
    if (
      !b ||
      typeof b !== "object" ||
      Array.isArray(b) ||
      Object.keys(b).some(
        (k) =>
          ![
            "id",
            "version",
            "status",
            "result_text",
            "evidence_links",
            "completed_items",
          ].includes(k),
      )
    )
      throw new RequestError("Chỉ được cập nhật tiến độ và kết quả công việc.");
    if (
      !isId(b.id) ||
      !Number.isSafeInteger(b.version) ||
      b.version < 0 ||
      typeof b.status !== "string" ||
      !Object.hasOwn(TASK_STATUSES, b.status)
    )
      throw new RequestError("Thông tin tiến độ không hợp lệ.");
    if (typeof b.result_text !== "string" || b.result_text.length > 10000)
      throw new RequestError("Kết quả tối đa 10.000 ký tự.");
    if (
      !Array.isArray(b.evidence_links) ||
      b.evidence_links.length > 10 ||
      b.evidence_links.some(
        (v: unknown) => typeof v !== "string" || !validEvidenceUrl(v),
      )
    )
      throw new RequestError(
        "Tối đa 10 link HTTP/HTTPS hợp lệ, mỗi link tối đa 2.048 ký tự.",
      );
    if (
      !Array.isArray(b.completed_items) ||
      b.completed_items.length > 30 ||
      b.completed_items.some((v: unknown) => !isId(v)) ||
      new Set(b.completed_items).size !== b.completed_items.length
    )
      throw new RequestError("Checklist không hợp lệ.");
    const links = [...new Set<string>(b.evidence_links)],
      done = JSON.stringify(b.completed_items);
    const rows =
      await database()`WITH updated AS (UPDATE app_tasks t SET status=${b.status}, result_text=${b.result_text.trim()}, evidence_links=${JSON.stringify(links)}::jsonb,
      checklist=COALESCE((SELECT jsonb_agg(jsonb_set(item,'{done}',to_jsonb((item->>'id') IN (SELECT jsonb_array_elements_text(${done}::jsonb)))) ORDER BY ord) FROM jsonb_array_elements(t.checklist) WITH ORDINALITY AS e(item,ord)), '[]'::jsonb),
      completed_at=CASE WHEN ${b.status}='completed' THEN CASE WHEN t.status='completed' THEN t.completed_at ELSE now() END ELSE NULL END,
      updated_at=now(), report_version=t.report_version+1
      WHERE t.id=${b.id} AND (${isFullAccess(member.role)} OR t.assignee_id=${member.id}) AND t.report_version=${b.version}
      AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(${done}::jsonb) d(id) WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(t.checklist) c WHERE c->>'id'=d.id)) RETURNING t.*),
      logged AS (INSERT INTO app_task_reports (id,task_id,task_title,assignee_id,actor_id,actor_name,status,result_text,evidence_links,checklist,due_at,completed_at)
      SELECT ${randomUUID()},id,title,assignee_id,${member.id},${member.name},status,result_text,evidence_links,checklist,due_at,completed_at FROM updated RETURNING task_id)
      SELECT u.id,u.status,u.result_text,u.evidence_links,u.checklist,u.completed_at,u.updated_at,u.report_version FROM updated u JOIN logged l ON l.task_id=u.id`;
    if (!rows.length)
      throw new RequestError(
        "Công việc vừa thay đổi hoặc bạn không có quyền cập nhật. Tải lại chi tiết trước khi gửi lại.",
        409,
      );
    return NextResponse.json({ ok: true, task: rows[0] });
  } catch (e) {
    return apiError(e);
  }
}
