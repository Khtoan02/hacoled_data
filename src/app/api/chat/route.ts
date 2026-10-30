import { randomUUID,createHash } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { apiError,checkOrigin,database,RequestError } from "../../../lib/auth/server";
import { chatActor,chatId,chatMemberIds } from "../../../lib/chat-server";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store, private"};
export async function GET(){
 try{
  const actor=await chatActor(true),sql=database();
  const [rooms,people]=await Promise.all([
   sql`SELECT r.id,r.kind,r.title,r.owner_id,r.version,r.created_at,
    (SELECT jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'role',m.role,'active',m.active) ORDER BY p.joined_at,m.id) FROM app_chat_members p JOIN app_members m ON m.id=p.member_id WHERE p.room_id=r.id) AS members,
    (SELECT COUNT(*)::int FROM app_chat_messages msg WHERE msg.room_id=r.id AND msg.seq>GREATEST(mine.last_read_seq,mine.joined_after_seq) AND msg.author_id<>${actor.id}) AS unread,
    incoming.seq::text AS last_incoming_seq,incoming.author_id AS last_incoming_author_id,incoming.author_name AS last_incoming_author_name,incoming.body AS last_incoming_body,latest.author_id AS last_author_id,latest.body AS last_body,latest.created_at AS last_at
    FROM app_chat_rooms r JOIN app_chat_members mine ON mine.room_id=r.id AND mine.member_id=${actor.id}
    LEFT JOIN LATERAL(SELECT body,created_at,author_id FROM app_chat_messages WHERE room_id=r.id AND seq>mine.joined_after_seq ORDER BY seq DESC LIMIT 1) latest ON true
    LEFT JOIN LATERAL(SELECT msg.seq,msg.body,msg.author_id,author.name AS author_name FROM app_chat_messages msg JOIN app_members author ON author.id=msg.author_id WHERE msg.room_id=r.id AND msg.seq>mine.joined_after_seq AND msg.author_id<>${actor.id} ORDER BY msg.seq DESC LIMIT 1) incoming ON true
    ORDER BY COALESCE(latest.created_at,r.created_at) DESC,r.id`,
   sql`SELECT id,name,role,active FROM app_members WHERE active=true ORDER BY name,id`,
  ]);
  return NextResponse.json({viewer_id:actor.id,rooms,people},{headers:noStore});
 }catch(e){return apiError(e);}
}
export async function POST(req:NextRequest){
 try{
  checkOrigin(req);const actor=await chatActor(true),b=await req.json();
  if(!b||!["direct","group"].includes(b.kind)||Object.keys(b).some(k=>!["kind","title","member_ids","request_id"].includes(k)))throw new RequestError("Thông tin cuộc trò chuyện không hợp lệ.");
  chatId(b.request_id);
  const ids=chatMemberIds(b.member_ids);
  if(!ids.includes(actor.id))ids.push(actor.id);
  if(ids.length>50||ids.length<2||(b.kind==="direct"&&ids.length!==2))throw new RequestError("Chọn người nhận; nhóm tối đa 50 thành viên.");
  const title=typeof b.title==="string"?b.title.trim():"";
  if(b.kind==="group"&&(!title||title.length>100))throw new RequestError("Tên nhóm từ 1 đến 100 ký tự.");
  const key=b.kind==="direct"?`direct:${[...ids].sort().join(":")}`:`group:${actor.id}:${b.request_id}`,id=randomUUID(),sql=database();
  const hash=createHash("sha256").update(JSON.stringify({kind:b.kind,title:b.kind==="group"?title:"",ids:[...ids].sort()})).digest("hex");
  const result=await sql.transaction([
   sql`SELECT pg_advisory_xact_lock(724113)`,
   sql`WITH created AS(INSERT INTO app_chat_rooms(id,kind,title,creation_key,creation_hash,owner_id,created_by)
    SELECT ${id},${b.kind},${b.kind==="group"?title:""},${key},${hash},${b.kind==="group"?actor.id:null}::uuid,${actor.id}
    WHERE (SELECT COUNT(*) FROM app_members WHERE active=true AND id IN(SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)::uuid))=${ids.length}
    ON CONFLICT(creation_key) DO NOTHING RETURNING id),
    added AS(INSERT INTO app_chat_members(room_id,member_id) SELECT r.id,x::uuid FROM created r CROSS JOIN jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb) x)
    SELECT id FROM created UNION ALL SELECT r.id FROM app_chat_rooms r JOIN app_chat_members mine ON mine.room_id=r.id AND mine.member_id=${actor.id} WHERE r.creation_key=${key} AND r.creation_hash=${hash}`,
  ]);
  if(!result[1].length)throw new RequestError("Thành viên không còn hoạt động, yêu cầu đã thay đổi hoặc bạn không còn trong nhóm. Tải lại danh sách.",409);
  return NextResponse.json({id:result[1][0].id},{status:201,headers:noStore});
 }catch(e){return apiError(e);}
}
export async function PATCH(req:NextRequest){
 try{
  checkOrigin(req);const actor=await chatActor(true),b=await req.json();
  if(!b||Object.keys(b).some(k=>!["id","version","title","member_ids","owner_id"].includes(k)))throw new RequestError("Thông tin nhóm không hợp lệ.");
  chatId(b.id);chatId(b.owner_id);const ids=chatMemberIds(b.member_ids);
  if(!ids.includes(b.owner_id)||!Number.isSafeInteger(b.version)||b.version<0||typeof b.title!=="string"||!b.title.trim()||b.title.trim().length>100)throw new RequestError("Điền tên nhóm và giữ trưởng nhóm trong danh sách thành viên.");
  const sql=database(),result=await sql.transaction([
   sql`SELECT pg_advisory_xact_lock(724113)`,
   sql`WITH input AS(SELECT ${JSON.stringify(ids)}::jsonb AS ids), saved AS(
    UPDATE app_chat_rooms r SET title=${b.title.trim()},owner_id=${b.owner_id},version=version+1 FROM input i
    WHERE r.id=${b.id} AND r.kind='group' AND r.owner_id=${actor.id} AND r.version=${b.version}
    AND EXISTS(SELECT 1 FROM app_chat_members WHERE room_id=r.id AND member_id=${actor.id})
    AND EXISTS(SELECT 1 FROM app_members WHERE id=${b.owner_id} AND active=true)
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(i.ids) x WHERE NOT EXISTS(SELECT 1 FROM app_members m WHERE m.id=x::uuid AND (m.active OR EXISTS(SELECT 1 FROM app_chat_members p WHERE p.room_id=r.id AND p.member_id=m.id)))) RETURNING r.id),
    removed AS(DELETE FROM app_chat_members p WHERE p.room_id IN(SELECT id FROM saved) AND p.member_id NOT IN(SELECT jsonb_array_elements_text(ids)::uuid FROM input)),
    added AS(INSERT INTO app_chat_members(room_id,member_id,joined_after_seq,last_read_seq)
    SELECT s.id,x::uuid,COALESCE((SELECT MAX(seq) FROM app_chat_messages WHERE room_id=s.id),0),COALESCE((SELECT MAX(seq) FROM app_chat_messages WHERE room_id=s.id),0) FROM saved s CROSS JOIN input i CROSS JOIN jsonb_array_elements_text(i.ids) x ON CONFLICT DO NOTHING)
    SELECT id FROM saved`,
  ]);
  if(!result[1].length)throw new RequestError("Chỉ trưởng nhóm được sửa nhóm. Nhóm có thể vừa thay đổi; hãy tải lại.",409);
  return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){return apiError(e);}
}
