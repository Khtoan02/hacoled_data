import { NextRequest, NextResponse } from "next/server";
import { apiError, checkOrigin, database, RequestError } from "../../../lib/auth/server";
import { chatActor } from "../../../lib/chat-server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
import { scopedKpiData } from "../../../lib/kpi-data";
import { currentMonth, OUTPUT_TYPES, type OutputType } from "../../../lib/kpis";
import { needsKpiReminder } from "../../../lib/notifications";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store, private"};
// Resolve permissions on every read: reassignment or role changes revoke old event visibility.
async function visible(){
 const actor=await chatActor(),scope=ROLE_POLICIES[actor.role].taskScope;
 const rows=await database()`SELECT n.id::text,n.kind,n.title,n.body,n.created_at,n.read_at,n.task_id,n.kpi_id,to_char(k.month,'YYYY-MM') AS month
 FROM app_notifications n LEFT JOIN app_tasks t ON t.id=n.task_id LEFT JOIN app_kpis k ON k.id=n.kpi_id
 JOIN app_members owner ON owner.id=COALESCE(t.assignee_id,k.assignee_id)
 WHERE n.member_id=${actor.id} AND (${scope}='all' OR (${scope}<>'none' AND owner.id=${actor.id}) OR (${scope}='marketing_team' AND owner.role IN ('marketing_staff','marketing_intern')))
 ORDER BY n.id DESC LIMIT 100`;
 return {actor,rows};
}
export async function GET(){try{const {rows}=await visible();return NextResponse.json({notifications:rows,unread:rows.filter(r=>!r.read_at).length},{headers});}catch(e){return apiError(e);}}
export async function PATCH(req:NextRequest){try{
 checkOrigin(req);const {actor,rows}=await visible(),b=await req.json();
 if(b.id!=="all" && (typeof b.id!=="string"||!rows.some(r=>r.id===b.id)))throw new RequestError("Thông báo không tồn tại.",404);
 const ids=b.id==="all"?rows.map(r=>r.id):[b.id];
 await database()`UPDATE app_notifications SET read_at=COALESCE(read_at,now()) WHERE member_id=${actor.id} AND id IN(SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)::bigint)`;
 return NextResponse.json({ok:true},{headers});
}catch(e){return apiError(e);}}
export async function POST(req:NextRequest){try{
 checkOrigin(req);const actor=await chatActor();
 if(ROLE_POLICIES[actor.role].taskScope==='none')return NextResponse.json({ok:true},{headers});
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const month=currentMonth(),day=Number(today.slice(8)),days=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
 const {kpis}=await scopedKpiData(actor,month);
 const sql=database();
 for(const k of kpis){
  if(!k.active||!needsKpiReminder(Number(k.delivered),Number(k.target),day,days))continue;
  const label=OUTPUT_TYPES[k.output_type as OutputType]?.label??k.output_type;
  await sql`INSERT INTO app_notifications(member_id,kpi_id,event_key,kind,title,body)
   SELECT ${actor.id},id,${`kpi:${k.id}:${today}`},'kpi_reminder','Nhắc tiến độ KPI',${`${k.assignee_name} · ${k.channel_name} · ${label}: ${k.delivered}/${k.target}. Còn ${Math.max(0,Number(k.target)-Number(k.delivered))} để hoàn thành tháng ${month.slice(5)}/${month.slice(0,4)}.`}
   FROM app_kpis WHERE id=${k.id} AND active=true ON CONFLICT(member_id,event_key) DO NOTHING`;
 }
 return NextResponse.json({ok:true},{headers});
}catch(e){return apiError(e);}}
