import type { MemberRoleId } from "./security/rbac";
export interface ChatPerson { id:string; name:string; role:MemberRoleId; active:boolean }
export interface ChatRoom {
 id:string; kind:"direct"|"group"; title:string; owner_id:string|null; version:number;
 last_incoming_seq?:string|null;last_incoming_author_id?:string|null;last_incoming_author_name?:string|null;last_incoming_body?:string|null;last_author_id?:string; created_at:string; members:ChatPerson[]; unread:number; last_body:string|null; last_at:string|null;
}
export interface ChatAttachment {id:string;name:string;content_type:string;size:number}
export interface ChatMessage {attachments?:ChatAttachment[];id:string;seq:string;room_id:string;author_id:string;author_name:string;body:string;created_at:string}
export function roomTitle(room:ChatRoom, viewerId:string) {
 return room.kind==="group" ? room.title : room.members.find(m=>m.id!==viewerId)?.name ?? "Cuộc trò chuyện";
}
export function mergeMessages(old:ChatMessage[], next:ChatMessage[]) {
 return [...new Map([...old,...next].map(m=>[m.id,m])).values()].sort((a,b)=>BigInt(a.seq)<BigInt(b.seq)?-1:BigInt(a.seq)>BigInt(b.seq)?1:0);
}

export function chatNotification(author:string,body:string){
 const clean=(value:string,max:number)=>value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max);
 return {title:`Haco | ${clean(author,60)||"Thành viên"}: ${clean(body,180)||"📎 Tệp đính kèm"}`,body:""};
}
