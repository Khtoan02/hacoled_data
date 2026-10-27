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
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type ChecklistItem,
} from "../../../lib/tasks";
export const dynamic = "force-dynamic";
const isId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
interface Fields {
  title?: string;
  description?: string;
  assignee_id?: string;
  due_at?: string | null;
  status?: string;
  priority?: string;
  checklist?: ChecklistItem[];
}
function fields(body: unknown, partial = false): Fields {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new RequestError("Thông tin công việc không hợp lệ.");
  const input = body as Record<string, unknown>,
    output: Fields = {};
  if (
    Object.keys(input).some(
      (key) =>
        ![
          "id",
          "title",
          "description",
          "assignee_id",
          "due_at",
          "status",
          "priority",
          "checklist",
        ].includes(key),
    )
  )
    throw new RequestError("Có trường dữ liệu không được hỗ trợ.");
  if (!partial || "title" in input) {
    if (
      typeof input.title !== "string" ||
      !input.title.trim() ||
      input.title.trim().length > 200
    )
      throw new RequestError("Tên công việc cần từ 1 đến 200 ký tự.");
    output.title = input.title.trim();
  }
  if (!partial || "assignee_id" in input) {
    if (!isId(input.assignee_id))
      throw new RequestError("Chọn người thực hiện hợp lệ.");
    output.assignee_id = input.assignee_id;
  }
  if ("description" in input) {
    if (
      typeof input.description !== "string" ||
      input.description.length > 10000
    )
      throw new RequestError("Mô tả tối đa 10.000 ký tự.");
    output.description = input.description.trim();
  }
  if ("status" in input) {
    if (
      typeof input.status !== "string" ||
      !Object.hasOwn(TASK_STATUSES, input.status)
    )
      throw new RequestError("Trạng thái không hợp lệ.");
    output.status = input.status;
  }
  if ("priority" in input) {
    if (
      typeof input.priority !== "string" ||
      !Object.hasOwn(TASK_PRIORITIES, input.priority)
    )
      throw new RequestError("Độ ưu tiên không hợp lệ.");
    output.priority = input.priority;
  }
  if ("due_at" in input) {
    if (input.due_at === null || input.due_at === "") output.due_at = null;
    else {
      if (
        typeof input.due_at !== "string" ||
        !Number.isFinite(Date.parse(input.due_at))
      )
        throw new RequestError("Hạn hoàn thành không hợp lệ.");
      output.due_at = new Date(input.due_at).toISOString();
    }
  }
  if ("checklist" in input) {
    if (!Array.isArray(input.checklist) || input.checklist.length > 30)
      throw new RequestError("Tối đa 30 mục checklist.");
    output.checklist = input.checklist.map((item) => {
      if (
        !item ||
        !isId(item.id) ||
        typeof item.title !== "string" ||
        !item.title.trim() ||
        item.title.length > 200 ||
        typeof item.done !== "boolean"
      )
        throw new RequestError("Mục checklist không hợp lệ.");
      return { id: item.id, title: item.title.trim(), done: item.done };
    });
    if (
      new Set(output.checklist.map((item) => item.id)).size !==
      output.checklist.length
    )
      throw new RequestError("Checklist chứa mã mục bị trùng.");
  }
  if (partial && !Object.keys(output).length)
    throw new RequestError("Chưa có thay đổi cần lưu.");
  return output;
}
export async function GET(req: NextRequest) {
  try {
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    const scope = ROLE_POLICIES[member.role].taskScope;
    if (scope === "none")
      throw new RequestError("Quyền công việc chưa được cấp.", 403);
    const id = req.nextUrl.searchParams.get("id") || null;
    if (id && !isId(id)) throw new RequestError("Mã công việc không hợp lệ.");
    const tasks =
      await database()`SELECT t.id, t.title, t.description, t.status, t.priority, t.checklist, t.assignee_id, t.due_at, t.created_at, t.updated_at,
      m.name AS assignee_name, m.role AS assignee_role FROM app_tasks t JOIN app_members m ON m.id = t.assignee_id
      WHERE (${scope} = 'all' OR t.assignee_id = ${member.id} OR (${scope} = 'marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))
        AND (${id}::uuid IS NULL OR t.id = ${id}::uuid) ORDER BY t.created_at DESC, t.id`;
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
      data = fields(await req.json());
    const rows =
      await database()`INSERT INTO app_tasks (id, title, description, assignee_id, created_by, due_at, status, priority, checklist)
      SELECT ${randomUUID()}, ${data.title!}, ${data.description ?? ""}, id, ${actor.id}, ${data.due_at ?? null}, ${data.status ?? "pending"}, ${data.priority ?? "normal"}, ${JSON.stringify(data.checklist ?? [])}::jsonb
      FROM app_members WHERE id = ${data.assignee_id!} AND active = true RETURNING id`;
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
    if (!body || !isId(body.id))
      throw new RequestError("Mã công việc không hợp lệ.");
    const data = fields(body, true);
    const tasks = await database()`UPDATE app_tasks SET
      title = COALESCE(${data.title ?? null}, title), description = COALESCE(${data.description ?? null}, description), status = COALESCE(${data.status ?? null}, status),
      priority = COALESCE(${data.priority ?? null}, priority), assignee_id = COALESCE(${data.assignee_id ?? null}::uuid, assignee_id),
      due_at = CASE WHEN ${"due_at" in data} THEN ${data.due_at ?? null}::timestamptz ELSE due_at END,
      checklist = COALESCE(${data.checklist === undefined ? null : JSON.stringify(data.checklist)}::jsonb, checklist), updated_at = now()
      WHERE id = ${body.id} AND (${data.assignee_id ?? null}::uuid IS NULL OR EXISTS(SELECT 1 FROM app_members WHERE id = ${data.assignee_id ?? null}::uuid AND active = true)) RETURNING id`;
    if (!tasks.length)
      throw new RequestError(
        "Không tìm thấy công việc hoặc người thực hiện không còn hoạt động.",
        404,
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    checkOrigin(req);
    await requireManager();
    const id = req.nextUrl.searchParams.get("id");
    if (!isId(id)) throw new RequestError("Mã công việc không hợp lệ.");
    const rows =
      await database()`DELETE FROM app_tasks WHERE id = ${id} RETURNING id`;
    if (!rows.length) throw new RequestError("Không tìm thấy công việc.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
