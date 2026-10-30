"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {Maximize2,MessageCircle,Minus,X,BellRing} from "lucide-react";
import {PushSettings} from "./push-settings";
import {ChatPage} from "./chat";
import {useMember} from "./session";
import {roomTitle,type ChatRoom} from "../../lib/chat";

/** Persistent across workspace navigation; only announces newly observed unread messages. */
export function FloatingChat(){
 const member=useMember(),pathname=usePathname(),fullPage=pathname==="/admin/chat";
 const [settings,setSettings]=useState(false),[open,setOpen]=useState(false),[mounted,setMounted]=useState(false),[room,setRoom]=useState(""),[unread,setUnread]=useState(0),[toast,setToast]=useState<ChatRoom|null>(null);
 const previous=useRef<Map<string,string>|null>(null),launcher=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null);

 useEffect(()=>{
  const controller=new AbortController();let busy=false;
  const refresh=async()=>{
   if(busy)return;busy=true;
   try{
    const response=await fetch("/api/chat",{cache:"no-store",signal:controller.signal,headers:{"X-Haco-Member":member.id}});
    if(!response.ok){if([401,403].includes(response.status)){setUnread(0);setToast(null);setOpen(false);previous.current=null;setMounted(false);controller.abort();}return;}
    const data=await response.json();if(controller.signal.aborted)return;
    if(data.viewer_id!==member.id){setUnread(0);setToast(null);setOpen(false);setMounted(false);controller.abort();return;}
    const rooms:ChatRoom[]=data.rooms;
    const stamp=(r:ChatRoom)=>typeof r.last_incoming_seq==="string"&&/^[1-9]\d*$/.test(r.last_incoming_seq)?r.last_incoming_seq:"";
    const next=new Map(rooms.map(r=>[r.id,stamp(r)]));
    const fresh=previous.current===null?undefined:rooms.find(r=>{
     const incoming=stamp(r),seen=previous.current?.get(r.id);
     return Boolean(incoming&&r.last_incoming_author_id&&r.last_incoming_author_id!==member.id&&r.members.some(m=>m.id===member.id)&&((seen!==undefined&&BigInt(incoming)>BigInt(seen||"0"))||(seen===undefined&&r.unread>0)));
    });
    setUnread(rooms.reduce((sum,r)=>sum+r.unread,0));
    setToast(old=>old&&rooms.some(r=>r.id===old.id&&r.unread>0)?old:null);
    previous.current=next;
    // Only the focused visible tab shows an in-app hint. OS notifications come solely from Web Push.
    if(fresh&&document.visibilityState==="visible"&&document.hasFocus())setToast(fresh);

   }catch{/* Keep the existing state during a temporary connection failure. */}
   finally{busy=false;}
  };
  void refresh();const timer=setInterval(()=>void refresh(),5000);
  const wake=()=>{if(document.visibilityState!=="visible"||!document.hasFocus())setToast(null);void refresh();};window.addEventListener("blur",wake);window.addEventListener("focus",wake);window.addEventListener("haco-chat-read",wake);document.addEventListener("visibilitychange",wake);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener("blur",wake);window.removeEventListener("focus",wake);window.removeEventListener("haco-chat-read",wake);document.removeEventListener("visibilitychange",wake);};
 },[member.id]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),8000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{if(fullPage){setOpen(false);setToast(null);}},[fullPage]);
 useEffect(()=>{if(open)panel.current?.focus();},[open]);
 function close(){setOpen(false);requestAnimationFrame(()=>launcher.current?.focus());}
 function show(id?:string){if(id)setRoom(id);setToast(null);setMounted(true);setOpen(true);}

 if(fullPage&&!toast)return null;
 return <div className="floating-chat">
  {settings&&<div className="chat-device-settings"><button className="icon-button" aria-label="Đóng cài đặt thông báo chat" onClick={()=>setSettings(false)}><X size={17}/></button><PushSettings/></div>}
  {toast&&<div className="chat-toast" role="status"><button className="chat-toast-open" onClick={()=>{if(fullPage)window.location.assign(`/admin/chat?room=${toast.id}`);else show(toast.id);}}><MessageCircle size={20}/><span><strong>Haco | {toast.last_incoming_author_name??roomTitle(toast,member.id)}:</strong><small>{toast.last_incoming_body??toast.last_body??"📎 Tệp đính kèm"}</small></span></button><button className="icon-button" aria-label="Ẩn thông báo tin nhắn" onClick={()=>setToast(null)}><X size={16}/></button></div>}
  {!fullPage&&mounted&&<section hidden={!open} ref={panel} tabIndex={-1} className="mini-chat-panel" role="region" aria-label="Chat nhanh" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}}>
   <header className="mini-chat-header"><div><MessageCircle size={19}/><strong>Chat nội bộ</strong></div><div><Link className="icon-button" aria-label="Mở chat toàn màn hình" href={room?`/admin/chat?room=${encodeURIComponent(room)}`:"/admin/chat"}><Maximize2 size={17}/></Link><button className="icon-button" aria-label="Thu gọn chat" onClick={close}><Minus size={19}/></button></div></header>
   <div className="mini-chat-body"><ChatPage compact initialRoom={room} active={open} onSelect={setRoom}/></div>
  </section>}
  {!fullPage&&<div className="chat-floating-controls"><button className="icon-button" aria-label="Cài đặt và thử thông báo chat" onClick={()=>setSettings(!settings)}><BellRing size={20}/></button><button ref={launcher} className={`chat-launcher ${unread>0?"has-unread":""}`} aria-label={`${open?"Thu gọn chat":"Mở chat nhanh"}${unread?` · ${unread} tin chưa đọc`:""}`} aria-expanded={open} onClick={()=>open?close():show()}><MessageCircle size={23}/><span>Chat</span>{unread>0&&<b>{unread>99?"99+":unread}</b>}</button></div>}
 </div>;
}
