import {schedulePush} from "../../../../lib/push-delivery";
import { NextRequest,NextResponse } from "next/server";
import { apiError,checkOrigin,database,RequestError } from "../../../../lib/auth/server";
import { chatActor,chatId,visibleChatRoom } from "../../../../lib/chat-server";
export const dynamic="force-dynamic";
export const maxDuration=60;
const headers={"Cache-Control":"no-store, private"};
export async function GET(req:NextRequest){
 try{
  const actor=await chatActor(),id=req.nextUrl.searchParams.get("room"),before=req.nextUrl.searchParams.get("before"),after=req.nextUrl.searchParams.get("after");chatId(id);
  if(before!==null&&(!/^\d{1,18}$/.test(before)||BigInt(before)<BigInt(1)))throw new RequestError("Mốc tin nhắn không hợp lệ.");
  if(after!==null&&(!/^\d{1,18}$/.test(after)||before!==null))throw new RequestError("Mốc tin nhắn mới không hợp lệ.");
  const room=await visibleChatRoom(id,actor.id);
  const messages=await database()`SELECT msg.id,msg.seq::text,msg.room_id,msg.author_id,m.name AS author_name,msg.body,msg.created_at
   FROM app_chat_messages msg JOIN app_members m ON m.id=msg.author_id JOIN app_chat_members mine ON mine.room_id=msg.room_id AND mine.member_id=${actor.id}
   WHERE msg.room_id=${id} AND msg.seq>mine.joined_after_seq AND (${before}::bigint IS NULL OR msg.seq<${before}::bigint) AND (${after}::bigint IS NULL OR msg.seq>${after}::bigint) ORDER BY CASE WHEN ${after}::bigint IS NOT NULL THEN msg.seq END ASC,msg.seq DESC LIMIT 51`;
  const has_more=messages.length>50;
  return NextResponse.json({room,messages:after===null?messages.slice(0,50).reverse():messages.slice(0,50),has_more},{headers});
 }catch(e){return apiError(e);}
}
export async function POST(req:NextRequest){
 try{
  checkOrigin(req);const actor=await chatActor(),b=await req.json();
  if(!b||Object.keys(b).some(k=>!["id","room_id","body"].includes(k)))throw new RequestError("Tin nhắn không hợp lệ.");
  chatId(b.id);chatId(b.room_id);
  if(typeof b.body!=="string"||!b.body.trim()||b.body.trim().length>4000)throw new RequestError("Tin nhắn từ 1 đến 4.000 ký tự.");
  const sql=database(),result=await sql.transaction([
   sql`SELECT pg_advisory_xact_lock(724113)`,
   sql`INSERT INTO app_chat_messages(id,room_id,author_id,body)
    SELECT ${b.id},r.id,${actor.id},${b.body.trim()} FROM app_chat_rooms r JOIN app_chat_members mine ON mine.room_id=r.id AND mine.member_id=${actor.id}
    WHERE r.id=${b.room_id} AND (r.kind='group' OR EXISTS(SELECT 1 FROM app_chat_members p JOIN app_members m ON m.id=p.member_id WHERE p.room_id=r.id AND p.member_id<>${actor.id} AND m.active=true))
    ON CONFLICT(id) DO UPDATE SET id=app_chat_messages.id WHERE app_chat_messages.room_id=excluded.room_id AND app_chat_messages.author_id=excluded.author_id AND app_chat_messages.body=excluded.body
    RETURNING id,seq::text,room_id,author_id,body,created_at`,
  ]);
  if(!result[1].length)throw new RequestError("Chưa gửi được: quyền truy cập, người nhận hoặc mã tin nhắn đã thay đổi. Tải lại cuộc trò chuyện.",409);
  schedulePush();
  return NextResponse.json({message:{...result[1][0],author_name:actor.name}},{status:201,headers});
 }catch(e){return apiError(e);}
}
export async function PATCH(req:NextRequest){
 try{
  checkOrigin(req);const actor=await chatActor(),b=await req.json();
  if(!b||Object.keys(b).some(k=>!["room_id","last_seen_seq"].includes(k)))throw new RequestError("Mốc đã đọc không hợp lệ.");
  chatId(b.room_id);
  if(typeof b.last_seen_seq!=="string"||!/^\d{1,18}$/.test(b.last_seen_seq))throw new RequestError("Mốc đã đọc không hợp lệ.");
  const rows=await database()`UPDATE app_chat_members mine SET last_read_seq=GREATEST(mine.last_read_seq,${b.last_seen_seq}::bigint)
   WHERE mine.room_id=${b.room_id} AND mine.member_id=${actor.id} AND (${b.last_seen_seq}::bigint=0 OR EXISTS(SELECT 1 FROM app_chat_messages WHERE room_id=mine.room_id AND seq=${b.last_seen_seq}::bigint AND seq>mine.joined_after_seq)) RETURNING room_id`;
  if(!rows.length)throw new RequestError("Không còn quyền truy cập hoặc mốc tin nhắn không hợp lệ.",404);
  return NextResponse.json({ok:true},{headers});
 }catch(e){return apiError(e);}
}
