import {syncKpiNotifications} from "../../../lib/kpi-notifications";
import {schedulePush} from "../../../lib/push-delivery";
import { NextRequest, NextResponse } from "next/server";
import { apiError, checkOrigin, database, RequestError } from "../../../lib/auth/server";
import { chatActor } from "../../../lib/chat-server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
export const dynamic="force-dynamic";
export const maxDuration=60;
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
export async function GET(){try{const {rows}=await visible();schedulePush();return NextResponse.json({notifications:rows,unread:rows.filter(r=>!r.read_at).length},{headers});}catch(e){return apiError(e);}}
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
 await syncKpiNotifications(actor);
 schedulePush();
 return NextResponse.json({ok:true},{headers});
}catch(e){return apiError(e);}}
