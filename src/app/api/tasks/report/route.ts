import { ATTACHMENT_PATH } from "../../../../lib/task-attachments";
import { resolveDeadlineKpi } from "../../../../lib/task-kpi";
import { outputFields } from "../../../../lib/kpi-fields";
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
      await database()`SELECT id, actor_name, status, result_text, evidence_links, checklist, due_at, completed_at, created_at, channel_id, channel_name, kpi_id, output_type, planned_quantity, delivered_quantity, to_char(delivered_on,'YYYY-MM-DD') AS delivered_on FROM app_task_reports WHERE task_id=${id} ORDER BY created_at DESC, id DESC LIMIT 50`;
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
            "kpi_id",
            "output_type",
            "delivered_quantity",
            "delivered_on",
            "channel_id",
            "channel_ids",
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
        "Tối đa 10 ảnh đính kèm hoặc link HTTP/HTTPS hợp lệ, mỗi link tối đa 2.048 ký tự.",
      );
    if (
      !Array.isArray(b.completed_items) ||
      b.completed_items.length > 30 ||
      b.completed_items.some((v: unknown) => !isId(v)) ||
      new Set(b.completed_items).size !== b.completed_items.length
    )
      throw new RequestError("Checklist không hợp lệ.");
    if ("channel_id" in b && b.channel_id !== null && !isId(b.channel_id))
      throw new RequestError("Kênh không hợp lệ.");
    if ("channel_ids" in b) {
      if (!Array.isArray(b.channel_ids) || b.channel_ids.length > 20 || b.channel_ids.some((id: unknown) => !isId(id)) || new Set(b.channel_ids).size !== b.channel_ids.length)
        throw new RequestError("Danh sách kênh không hợp lệ (tối đa 20 kênh).");
      b.channel_id = b.channel_ids[0] ?? null;
    }
    const attachmentIds=b.evidence_links.flatMap((url:string)=>{const m=url.match(ATTACHMENT_PATH);return m?[m[1]]:[];});
    if(attachmentIds.length){
      const owned=await database()`SELECT id FROM app_task_attachments WHERE task_id=${b.id} AND id IN(SELECT jsonb_array_elements_text(${JSON.stringify(attachmentIds)}::jsonb)::uuid)`;
      if(owned.length!==new Set(attachmentIds).size)throw new RequestError("Có ảnh không thuộc công việc này. Hãy chọn lại ảnh.");
    }
    const production = outputFields(b);
    const current = await database()`SELECT assignee_id,channel_id,output_type,due_at,kpi_id FROM app_tasks WHERE id=${b.id} AND (${isFullAccess(member.role)} OR assignee_id=${member.id})`;
    if(current[0]?.due_at) {
      production.kpi_id = await resolveDeadlineKpi({assignee_id:current[0].assignee_id,channel_id:"channel_id" in b ? b.channel_id : current[0].channel_id,output_type:production.output_type ?? current[0].output_type,due_at:current[0].due_at,existing_kpi_id:current[0].kpi_id});
    }
    const links = [...new Set<string>(b.evidence_links)],
      done = JSON.stringify(b.completed_items);
    const channelJson = "channel_ids" in b ? JSON.stringify(b.channel_ids) : null;
    const rows =
      await database()`WITH input AS (SELECT ${channelJson}::jsonb AS channel_ids), updated AS (UPDATE app_tasks t SET kpi_id=CASE WHEN ${"kpi_id" in production} THEN ${production.kpi_id ?? null}::uuid ELSE t.kpi_id END,output_type=COALESCE(${production.output_type ?? null},t.output_type),delivered_quantity=COALESCE(${production.delivered_quantity ?? null}::int,CASE WHEN ${b.status}='completed' AND t.status<>'completed' AND t.delivered_quantity=0 THEN t.planned_quantity ELSE t.delivered_quantity END),
      delivered_on=CASE WHEN ${"delivered_on" in production} THEN COALESCE(${production.delivered_on ?? null}::date,CASE WHEN ${b.status}='completed' THEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ELSE NULL END) ELSE COALESCE(t.delivered_on,CASE WHEN ${b.status}='completed' THEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ELSE NULL END) END,
      channel_id=CASE WHEN ${"channel_id" in b} THEN ${b.channel_id ?? null}::uuid ELSE t.channel_id END, status=${b.status}, result_text=${b.result_text.trim()}, evidence_links=${JSON.stringify(links)}::jsonb,
      checklist=COALESCE((SELECT jsonb_agg(jsonb_set(item,'{done}',to_jsonb((item->>'id') IN (SELECT jsonb_array_elements_text(${done}::jsonb)))) ORDER BY ord) FROM jsonb_array_elements(t.checklist) WITH ORDINALITY AS e(item,ord)), '[]'::jsonb),
      completed_at=CASE WHEN ${b.status}='completed' THEN CASE WHEN t.status='completed' THEN t.completed_at ELSE now() END ELSE NULL END,
      updated_at=now(), report_version=t.report_version+1
      WHERE t.id=${b.id} AND (${isFullAccess(member.role)} OR t.assignee_id=${member.id}) AND t.report_version=${b.version}
      AND (${channelJson}::jsonb IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(${channelJson}::jsonb) x WHERE NOT EXISTS(SELECT 1 FROM app_social_channels c WHERE c.id=x::uuid AND c.active=true)))
      AND (CASE WHEN ${"kpi_id" in production} THEN ${production.kpi_id ?? null}::uuid ELSE t.kpi_id END IS NULL OR EXISTS(SELECT 1 FROM app_kpis k WHERE k.id=CASE WHEN ${"kpi_id" in production} THEN ${production.kpi_id ?? null}::uuid ELSE t.kpi_id END AND (k.active OR k.id=t.kpi_id) AND k.assignee_id=t.assignee_id AND k.channel_id=CASE WHEN ${"channel_id" in b} THEN ${b.channel_id ?? null}::uuid ELSE t.channel_id END AND k.output_type=COALESCE(${production.output_type ?? null},t.output_type)))
      AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(${done}::jsonb) d(id) WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(t.checklist) c WHERE c->>'id'=d.id)) RETURNING t.*),
      removed AS (DELETE FROM app_task_channels tc USING updated u,input i WHERE i.channel_ids IS NOT NULL AND tc.task_id=u.id AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(i.channel_ids) selected(id) WHERE selected.id::uuid=tc.channel_id) RETURNING tc.task_id),
      linked AS (INSERT INTO app_task_channels(task_id,channel_id) SELECT u.id,x::uuid FROM updated u CROSS JOIN input i CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(i.channel_ids,'[]'::jsonb)) x ON CONFLICT DO NOTHING RETURNING task_id),
      logged AS (INSERT INTO app_task_reports (id,task_id,task_title,assignee_id,actor_id,actor_name,status,result_text,evidence_links,checklist,due_at,completed_at,channel_id,channel_name,kpi_id,output_type,planned_quantity,delivered_quantity,delivered_on)
      SELECT ${randomUUID()},id,title,assignee_id,${member.id},${member.name},status,result_text,evidence_links,checklist,due_at,completed_at,channel_id,(SELECT name FROM app_social_channels WHERE id=updated.channel_id)  ,kpi_id,output_type,planned_quantity,delivered_quantity,delivered_on FROM updated RETURNING task_id)
      SELECT u.id,u.status,u.result_text,u.evidence_links,u.checklist,u.completed_at,u.updated_at,u.report_version,u.kpi_id,u.output_type,u.planned_quantity,u.delivered_quantity,to_char(u.delivered_on,'YYYY-MM-DD') AS delivered_on,u.channel_id,c.name AS channel_name,c.url AS channel_url,c.platform AS channel_platform,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',sc.id,'name',sc.name,'url',sc.url,'platform',sc.platform,'handle',sc.handle,'active',sc.active) ORDER BY CASE WHEN sc.id=u.channel_id THEN 0 ELSE 1 END,sc.name) FROM app_social_channels sc WHERE sc.id IN (SELECT x::uuid FROM jsonb_array_elements_text(COALESCE(${channelJson}::jsonb,(SELECT jsonb_agg(tc.channel_id) FROM app_task_channels tc WHERE tc.task_id=u.id),'[]'::jsonb)) x)),'[]'::jsonb) AS channels,
      COALESCE(${channelJson}::jsonb,(SELECT jsonb_agg(tc.channel_id ORDER BY CASE WHEN tc.channel_id=u.channel_id THEN 0 ELSE 1 END) FROM app_task_channels tc WHERE tc.task_id=u.id),'[]'::jsonb) AS channel_ids
      FROM updated u JOIN logged l ON l.task_id=u.id LEFT JOIN app_social_channels c ON c.id=u.channel_id`;
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
