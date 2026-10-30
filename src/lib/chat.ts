import type { MemberRoleId } from "./security/rbac";
export interface ChatPerson { id:string; name:string; role:MemberRoleId; active:boolean }
export interface ChatRoom {
 id:string; kind:"direct"|"group"; title:string; owner_id:string|null; version:number;
 last_incoming_seq?:string|null;last_author_id?:string; created_at:string; members:ChatPerson[]; unread:number; last_body:string|null; last_at:string|null;
}
export interface ChatAttachment {id:string;name:string;content_type:string;size:number}
export interface ChatMessage {attachments?:ChatAttachment[];id:string;seq:string;room_id:string;author_id:string;author_name:string;body:string;created_at:string}
export function roomTitle(room:ChatRoom, viewerId:string) {
 return room.kind==="group" ? room.title : room.members.find(m=>m.id!==viewerId)?.name ?? "Cuộc trò chuyện";
}
export function mergeMessages(old:ChatMessage[], next:ChatMessage[]) {
 return [...new Map([...old,...next].map(m=>[m.id,m])).values()].sort((a,b)=>BigInt(a.seq)<BigInt(b.seq)?-1:BigInt(a.seq)>BigInt(b.seq)?1:0);
}
