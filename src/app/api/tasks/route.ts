import {schedulePush} from "../../../lib/push-delivery";
import { resolveDeadlineKpi } from "../../../lib/task-kpi";
import { outputFields, type OutputFields } from "../../../lib/kpi-fields";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
  requireManager,
  requireLeader,
} from "../../../lib/auth/server";
import { ROLE_POLICIES, isFullAccess } from "../../../lib/security/rbac";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type ChecklistItem,
  type TaskBrief,
} from "../../../lib/tasks";
export const dynamic = "force-dynamic";
export const maxDuration=60;
const isId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
interface Fields extends OutputFields {
  channel_id?: string | null;
  channel_ids?: string[];
  title?: string;
  description?: string;
  assignee_id?: string;
  due_at?: string | null;
  status?: string;
  priority?: string;
  checklist?: ChecklistItem[];
  brief?: TaskBrief;
}
const BRIEF_FIELDS = ["content_pillar","content_format","cta","website_url","primary_keyword","slug","outbound_links","content_direction","notes"] as const;
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
          "kpi_id",
          "output_type",
          "planned_quantity",
          "delivered_quantity",
          "delivered_on",
          "channel_id",
          "channel_ids",
          "title",
          "description",
          "assignee_id",
          "due_at",
          "status",
          "priority",
          "checklist",
          "brief",
        ].includes(key),
    )
  )
    throw new RequestError("Có trường dữ liệu không được hỗ trợ.");
  if ("channel_id" in input) {
    if (input.channel_id !== null && !isId(input.channel_id))
      throw new RequestError("Kênh không hợp lệ.");
    output.channel_id = input.channel_id as string | null;
  }
  if ("channel_ids" in input) {
    if (
      !Array.isArray(input.channel_ids) ||
      input.channel_ids.length > 20 ||
      input.channel_ids.some((id) => !isId(id)) ||
      new Set(input.channel_ids).size !== input.channel_ids.length
    )
      throw new RequestError("Danh sách kênh không hợp lệ (tối đa 20 kênh).");
    output.channel_ids = input.channel_ids as string[];
    output.channel_id = output.channel_ids[0] ?? null;
  }
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
  if ("brief" in input) {
    if (!input.brief || typeof input.brief !== "object" || Array.isArray(input.brief))
      throw new RequestError("Yêu cầu công việc không hợp lệ.");
    const briefInput = input.brief as Record<string, unknown>;
    if (Object.keys(briefInput).some((key) => !BRIEF_FIELDS.includes(key as (typeof BRIEF_FIELDS)[number])))
      throw new RequestError("Yêu cầu công việc có trường không được hỗ trợ.");
    const brief: TaskBrief = {};
    for (const key of BRIEF_FIELDS) {
      const value = briefInput[key];
      if (value === undefined) continue;
      if (typeof value !== "string" || value.length > (key === "slug" ? 200 : 3000))
        throw new RequestError("Mỗi yêu cầu công việc tối đa 3.000 ký tự; slug tối đa 200 ký tự.");
      const clean = value.trim();
      if (clean) brief[key] = clean;
    }
    output.brief = brief;
  }
  Object.assign(output, outputFields(input));
  if (partial && !Object.keys(output).length)
    throw new RequestError("Chưa có thay đổi cần lưu.");
  return output;
}
async function validateBrief(data: Fields) {
  if (!data.output_type || !data.brief) return;
  const brief = data.brief;
  if (["video","short_video","story"].includes(data.output_type) && !brief.content_direction)
    throw new RequestError("Video cần có định hướng nội dung.");
  if (data.output_type === "other" && !brief.notes)
    throw new RequestError("Công việc khác cần ghi chú rõ việc phải làm.");
  if (data.output_type !== "post" || !data.channel_ids?.length) return;
  const rows = await database()`SELECT c.platform FROM app_social_channels c JOIN jsonb_array_elements_text(${JSON.stringify(data.channel_ids)}::jsonb) x(id) ON c.id=x.id::uuid`;
  const platforms = new Set(rows.map((row) => row.platform));
  if (platforms.has("facebook") && (!brief.content_pillar || !brief.content_format))
    throw new RequestError("Bài Facebook cần tuyến nội dung và định dạng nội dung.");
  if (platforms.has("website") && (!brief.primary_keyword || !brief.slug))
    throw new RequestError("Bài Website cần từ khóa chính và slug.");
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
      await database()`SELECT t.id, t.title, t.description, t.brief, t.status, t.priority, t.checklist, t.assignee_id, t.due_at, t.created_at, t.updated_at, t.result_text, t.evidence_links, t.completed_at, t.report_version, t.kpi_id, t.output_type, t.planned_quantity, t.delivered_quantity, to_char(t.delivered_on,'YYYY-MM-DD') AS delivered_on, t.channel_id, c.name AS channel_name, c.url AS channel_url, c.platform AS channel_platform,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',sc.id,'name',sc.name,'url',sc.url,'platform',sc.platform,'handle',sc.handle,'active',sc.active) ORDER BY CASE WHEN sc.id=t.channel_id THEN 0 ELSE 1 END,sc.name) FROM app_task_channels tc JOIN app_social_channels sc ON sc.id=tc.channel_id WHERE tc.task_id=t.id),'[]'::jsonb) AS channels,
      COALESCE((SELECT jsonb_agg(tc.channel_id ORDER BY CASE WHEN tc.channel_id=t.channel_id THEN 0 ELSE 1 END) FROM app_task_channels tc WHERE tc.task_id=t.id),'[]'::jsonb) AS channel_ids,
      m.name AS assignee_name, m.role AS assignee_role FROM app_tasks t JOIN app_members m ON m.id = t.assignee_id LEFT JOIN app_social_channels c ON c.id=t.channel_id
      WHERE (${scope} = 'all' OR t.assignee_id = ${member.id} OR (${scope} = 'marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))
        AND (${id}::uuid IS NULL OR t.id = ${id}::uuid) ORDER BY t.due_at ASC NULLS LAST, t.id`;
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
    const actor = await getMember();
    if (!actor) throw new RequestError("Vui lòng đăng nhập.", 401);
    if (ROLE_POLICIES[actor.role].taskScope === "none")
      throw new RequestError("Chưa được cấp quyền công việc.", 403);
    const body = await req.json();
    if (!isFullAccess(actor.role) && body?.assignee_id !== actor.id)
      throw new RequestError("Bạn chỉ được tạo công việc cho chính mình.", 403);
    const data = fields(body);
    await validateBrief(data);
    if (data.due_at) data.kpi_id = await resolveDeadlineKpi({assignee_id:data.assignee_id!,channel_id:data.channel_id,output_type:data.output_type,due_at:data.due_at});
    const taskId = randomUUID(), channelIds = data.channel_ids ?? (data.channel_id ? [data.channel_id] : []);
    const rows = await database()`WITH input AS (SELECT ${JSON.stringify(channelIds)}::jsonb AS channel_ids),
      saved AS (INSERT INTO app_tasks (id, title, description, brief, assignee_id, created_by, due_at, status, priority, checklist, completed_at, channel_id, kpi_id, output_type, planned_quantity, delivered_quantity, delivered_on)
      SELECT ${taskId}, ${data.title!}, ${data.description ?? ""}, ${JSON.stringify(data.brief ?? {})}::jsonb, m.id, ${actor.id}, ${data.due_at ?? null}, ${data.status ?? "pending"}, ${data.priority ?? "normal"}, ${JSON.stringify(data.checklist ?? [])}::jsonb, CASE WHEN ${data.status ?? "pending"} = 'completed' THEN now() ELSE NULL END, ${data.channel_id ?? null}::uuid, ${data.kpi_id ?? null}::uuid, ${data.output_type ?? "other"}, ${data.planned_quantity ?? 1}, ${data.delivered_quantity ?? (data.status === "completed" ? data.planned_quantity ?? 1 : 0)}, COALESCE(${data.delivered_on ?? null}::date,CASE WHEN ${data.status ?? "pending"}='completed' THEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ELSE NULL END)
      FROM app_members m CROSS JOIN input i WHERE m.id=${data.assignee_id!} AND m.active=true
      AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(i.channel_ids) x WHERE NOT EXISTS(SELECT 1 FROM app_social_channels c WHERE c.id=x::uuid AND c.active=true))
      AND (${data.kpi_id ?? null}::uuid IS NULL OR EXISTS(SELECT 1 FROM app_kpis k WHERE k.id=${data.kpi_id ?? null}::uuid AND k.active=true AND k.assignee_id=${data.assignee_id!} AND k.channel_id=${data.channel_id ?? null}::uuid AND k.output_type=${data.output_type ?? "other"})) RETURNING id),
      linked AS (INSERT INTO app_task_channels(task_id,channel_id) SELECT s.id,x::uuid FROM saved s CROSS JOIN input i CROSS JOIN jsonb_array_elements_text(i.channel_ids) x RETURNING task_id)
      SELECT id FROM saved`;
    if (!rows.length)
      throw new RequestError(
        "Nhân sự/kênh không hoạt động hoặc KPI không khớp người, kênh và loại sản phẩm.",
      );
    schedulePush();
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireManager();
    const body = await req.json();
    if (!body || !isId(body.id))
      throw new RequestError("Mã công việc không hợp lệ.");
    const data = fields(body, true);
    await validateBrief(data);
    if (["due_at","assignee_id","channel_id","channel_ids","output_type"].some(k=>k in data)) {
      const existing=await database()`SELECT assignee_id,channel_id,output_type,due_at,kpi_id FROM app_tasks WHERE id=${body.id}`;
      if(!existing.length) throw new RequestError("Không tìm thấy công việc.",404);
      const current={...existing[0],...data};
      data.kpi_id=await resolveDeadlineKpi({...current,existing_kpi_id:existing[0].kpi_id} as {assignee_id:string;channel_id:string|null;output_type:string;due_at:string|null;existing_kpi_id:string|null});
    }
    const channelJson = data.channel_ids === undefined ? null : JSON.stringify(data.channel_ids);
    const tasks = await database()`WITH input AS (SELECT ${channelJson}::jsonb AS channel_ids), updated AS (UPDATE app_tasks SET
      kpi_id=CASE WHEN ${"kpi_id" in data} THEN ${data.kpi_id ?? null}::uuid ELSE kpi_id END,
      output_type=COALESCE(${data.output_type ?? null},output_type),planned_quantity=COALESCE(${data.planned_quantity ?? null}::int,planned_quantity),delivered_quantity=COALESCE(${data.delivered_quantity ?? null}::int,CASE WHEN ${data.status ?? null}='completed' AND status<>'completed' AND delivered_quantity=0 THEN COALESCE(${data.planned_quantity ?? null}::int,planned_quantity) ELSE delivered_quantity END),
      delivered_on=CASE WHEN ${"delivered_on" in data} THEN COALESCE(${data.delivered_on ?? null}::date,CASE WHEN COALESCE(${data.status ?? null},status)='completed' THEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ELSE NULL END) ELSE COALESCE(delivered_on,CASE WHEN COALESCE(${data.status ?? null},status)='completed' THEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ELSE NULL END) END,
      title = COALESCE(${data.title ?? null}, title), description = COALESCE(${data.description ?? null}, description), brief = COALESCE(${data.brief === undefined ? null : JSON.stringify(data.brief)}::jsonb, brief), status = COALESCE(${data.status ?? null}, status),
      channel_id = CASE WHEN ${"channel_id" in data} THEN ${data.channel_id ?? null}::uuid ELSE channel_id END,
      priority = COALESCE(${data.priority ?? null}, priority), assignee_id = COALESCE(${data.assignee_id ?? null}::uuid, assignee_id),
      due_at = CASE WHEN ${"due_at" in data} THEN ${data.due_at ?? null}::timestamptz ELSE due_at END,
      checklist = COALESCE(${data.checklist === undefined ? null : JSON.stringify(data.checklist)}::jsonb, checklist), updated_at = now(), report_version = report_version + 1,
      completed_at = CASE WHEN COALESCE(${data.status ?? null}, status) = 'completed' THEN CASE WHEN status = 'completed' THEN completed_at ELSE now() END ELSE NULL END
      WHERE id = ${body.id} AND (${channelJson}::jsonb IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(${channelJson}::jsonb) x WHERE NOT EXISTS(SELECT 1 FROM app_social_channels c WHERE c.id=x::uuid AND c.active=true))) AND (${data.assignee_id ?? null}::uuid IS NULL OR EXISTS(SELECT 1 FROM app_members WHERE id = ${data.assignee_id ?? null}::uuid AND active = true))
      AND (CASE WHEN ${"kpi_id" in data} THEN ${data.kpi_id ?? null}::uuid ELSE kpi_id END IS NULL OR EXISTS(SELECT 1 FROM app_kpis k WHERE k.id=CASE WHEN ${"kpi_id" in data} THEN ${data.kpi_id ?? null}::uuid ELSE app_tasks.kpi_id END AND (k.active OR k.id=app_tasks.kpi_id) AND k.assignee_id=COALESCE(${data.assignee_id ?? null}::uuid,app_tasks.assignee_id) AND k.channel_id=CASE WHEN ${"channel_id" in data} THEN ${data.channel_id ?? null}::uuid ELSE app_tasks.channel_id END AND k.output_type=COALESCE(${data.output_type ?? null},app_tasks.output_type))) RETURNING *)
      ,removed AS (DELETE FROM app_task_channels tc USING updated u,input i WHERE i.channel_ids IS NOT NULL AND tc.task_id=u.id AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(i.channel_ids) selected(id) WHERE selected.id::uuid=tc.channel_id) RETURNING tc.task_id),
      linked AS (INSERT INTO app_task_channels(task_id,channel_id) SELECT u.id,x::uuid FROM updated u CROSS JOIN input i CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(i.channel_ids,'[]'::jsonb)) x ON CONFLICT DO NOTHING RETURNING task_id)
      INSERT INTO app_task_reports (id, task_id, task_title, assignee_id, actor_id, actor_name, status, result_text, evidence_links, checklist, due_at, completed_at, channel_id, channel_name, kpi_id, output_type, planned_quantity, delivered_quantity, delivered_on)
      SELECT ${randomUUID()}, id, title, assignee_id, ${actor.id}, ${actor.name}, status, result_text, evidence_links, checklist, due_at, completed_at, channel_id, (SELECT name FROM app_social_channels WHERE id=updated.channel_id)  , kpi_id, output_type, planned_quantity, delivered_quantity, delivered_on FROM updated RETURNING task_id`;
    if (!tasks.length)
      throw new RequestError(
        "Công việc không tồn tại hoặc KPI/nhân sự/kênh không khớp. Kiểm tra lại liên kết KPI.",
        404,
      );
    schedulePush();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireLeader();
    const id = req.nextUrl.searchParams.get("id");
    if (!isId(id)) throw new RequestError("Mã công việc không hợp lệ.");
    const sql = database();
    const result = await sql.transaction([
      sql`SELECT id FROM app_tasks WHERE id=${id} FOR UPDATE`,
      sql`INSERT INTO app_deletion_audit(id,entity_type,entity_id,actor_id,snapshot) SELECT ${randomUUID()},'task',t.id,${actor.id},jsonb_build_object('task',to_jsonb(t),'channels',COALESCE((SELECT jsonb_agg(channel_id) FROM app_task_channels WHERE task_id=t.id),'[]'::jsonb)) FROM app_tasks t WHERE t.id=${id}`,
      sql`DELETE FROM app_tasks WHERE id=${id} RETURNING id`,
    ]);
    const rows = result[2];
    if (!rows.length) throw new RequestError("Không tìm thấy công việc.", 404);
    schedulePush();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
