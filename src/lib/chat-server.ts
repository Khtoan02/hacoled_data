import {headers} from "next/headers";
import "server-only";
import { database, getMember, RequestError } from "./auth/server";
import { isUuid } from "./social";
export async function chatActor(requireTabIdentity=false){
 const member=await getMember();
 if(!member)throw new RequestError("Vui lòng đăng nhập lại.",401);
 const requestHeaders=await headers(),expected=requestHeaders.get("X-Haco-Member");
 if(requireTabIdentity&&!expected&&requestHeaders.get("Sec-Fetch-Site")==="same-origin"&&(!requestHeaders.get("Sec-Fetch-Dest")||requestHeaders.get("Sec-Fetch-Dest")==="empty"))throw new RequestError("Giao diện chat đã được cập nhật. Tải lại trang để tiếp tục.",426);
 if(expected&&expected!==member.id)throw new RequestError("Tài khoản đăng nhập đã thay đổi. Tải lại trang trước khi tiếp tục.",401);
 return member;
}
export function chatId(value:unknown):asserts value is string {
 if(!isUuid(value))throw new RequestError("Mã cuộc trò chuyện không hợp lệ.");
}
export function chatMemberIds(value:unknown):string[]{
 if(!Array.isArray(value)||value.length<1||value.length>50||value.some(id=>!isUuid(id))||new Set(value).size!==value.length)throw new RequestError("Chọn từ 1 đến 50 thành viên, không lặp người.");
 return value;
}
export async function visibleChatRoom(id:string,actorId:string){
 const rows=await database()`SELECT r.id,r.kind,r.title,r.owner_id,r.version,r.created_at,
 (SELECT jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'role',m.role,'active',m.active) ORDER BY p.joined_at,m.id) FROM app_chat_members p JOIN app_members m ON m.id=p.member_id WHERE p.room_id=r.id) AS members
 FROM app_chat_rooms r JOIN app_chat_members mine ON mine.room_id=r.id AND mine.member_id=${actorId} WHERE r.id=${id}`;
 if(!rows.length)throw new RequestError("Cuộc trò chuyện không còn trong phạm vi truy cập của bạn.",404);
 return rows[0];
}
