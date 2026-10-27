import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
  requireManager,
} from "../../../lib/auth/server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    const scope = ROLE_POLICIES[member.role].taskScope;
    if (scope === "none")
      throw new RequestError("Quyền công việc chưa được cấp.", 403);
    const id = req.nextUrl.searchParams.get("id");
    if (id && !/^[0-9a-f-]{36}$/i.test(id))
      throw new RequestError("Mã công việc không hợp lệ.");
    const tasks =
      await database()`SELECT t.id, t.title, t.description, t.status, t.assignee_id, t.due_at, t.created_at,
      m.name AS assignee_name, m.role AS assignee_role
      FROM app_tasks t JOIN app_members m ON m.id = t.assignee_id
      WHERE (${scope} = 'all' OR t.assignee_id = ${member.id} OR
        (${scope} = 'marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))
        AND (${id}::uuid IS NULL OR t.id = ${id}::uuid)
      ORDER BY t.created_at DESC, t.id`;
    if (id && !tasks.length)
      throw new RequestError(
        "Không tìm thấy công việc trong phạm vi quyền của bạn.",
        404,
      );
    return NextResponse.json(
      { tasks, scope },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireManager(),
      body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    if (
      !title ||
      title.length > 200 ||
      description.length > 10000 ||
      typeof body.assignee_id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.assignee_id)
    ) {
      throw new RequestError(
        "Điền tên công việc (tối đa 200 ký tự) và chọn người thực hiện.",
      );
    }
    const due = body.due_at ? new Date(body.due_at) : null;
    if (due && isNaN(due.getTime()))
      throw new RequestError("Hạn hoàn thành không hợp lệ.");
    const rows =
      await database()`INSERT INTO app_tasks (id, title, description, assignee_id, created_by, due_at)
      SELECT ${randomUUID()}, ${title}, ${description}, id, ${actor.id}, ${due?.toISOString() ?? null} FROM app_members
      WHERE id = ${body.assignee_id} AND active = true RETURNING id`;
    if (!rows.length)
      throw new RequestError("Người thực hiện không tồn tại hoặc đã bị khóa.");
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    checkOrigin(req);
    await requireManager();
    const body = await req.json();
    if (
      typeof body.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.id) ||
      !["pending", "in_progress", "completed"].includes(body.status)
    )
      throw new RequestError("Trạng thái công việc không hợp lệ.");
    const tasks =
      await database()`UPDATE app_tasks SET status = ${body.status} WHERE id = ${body.id} RETURNING id`;
    if (!tasks.length) throw new RequestError("Không tìm thấy công việc.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
