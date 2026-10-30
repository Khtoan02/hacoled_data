import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError,checkOrigin,database,requireLeader,RequestError } from "../../../../lib/auth/server";
import { isUuid } from "../../../../lib/social";
export async function POST(req:NextRequest){
 try{
  checkOrigin(req);const actor=await requireLeader(),body=await req.json();
  if(!body||!Array.isArray(body.items)||body.items.length<1||body.items.length>100||body.items.some((v:unknown)=>!v||typeof v!=='object'||!isUuid((v as {id:unknown}).id)||!Number.isSafeInteger((v as {version:unknown}).version)||Number((v as {version:unknown}).version)<0)||new Set(body.items.map((v:{id:string})=>v.id)).size!==body.items.length)throw new RequestError('Chọn từ 1 đến 100 công việc khác nhau và tải lại danh sách trước khi xóa.');
  const rows=await database()`WITH input AS(SELECT * FROM jsonb_to_recordset(${JSON.stringify(body.items)}::jsonb) AS x(id uuid,version int)),
   locked AS MATERIALIZED(SELECT t.* FROM app_tasks t JOIN input i ON i.id=t.id ORDER BY t.id FOR UPDATE OF t),
   ready AS(SELECT l.* FROM locked l JOIN input i ON i.id=l.id AND i.version=l.report_version WHERE (SELECT count(*) FROM locked l2 JOIN input i2 ON i2.id=l2.id AND i2.version=l2.report_version)=${body.items.length}),
   audit AS(INSERT INTO app_deletion_audit(id,entity_type,entity_id,actor_id,snapshot)
    SELECT (md5(${randomUUID()}||t.id::text))::uuid,'task',t.id,${actor.id},jsonb_build_object('task',to_jsonb(t),'channels',COALESCE((SELECT jsonb_agg(channel_id) FROM app_task_channels WHERE task_id=t.id),'[]'::jsonb),'bulk',true) FROM ready t RETURNING entity_id)
   DELETE FROM app_tasks t USING audit a WHERE t.id=a.entity_id RETURNING t.id`;
  if(rows.length!==body.items.length)throw new RequestError('Có công việc vừa thay đổi hoặc đã bị xóa. Chưa xóa công việc nào; hãy tải lại danh sách và chọn lại.',409);
  return NextResponse.json({ok:true,deleted:rows.length});
 }catch(e){return apiError(e);}
}
