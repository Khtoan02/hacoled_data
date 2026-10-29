"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {Maximize2,MessageCircle,Minus,X} from "lucide-react";
import {ChatPage} from "./chat";
import {useMember} from "./session";
import {roomTitle,type ChatRoom} from "../../lib/chat";

/** Persistent across workspace navigation; only announces newly observed unread messages. */
export function FloatingChat(){
 const member=useMember(),pathname=usePathname(),fullPage=pathname==="/admin/chat";
 const [open,setOpen]=useState(false),[mounted,setMounted]=useState(false),[room,setRoom]=useState(""),[unread,setUnread]=useState(0),[toast,setToast]=useState<ChatRoom|null>(null);
 const previous=useRef<Map<string,string>|null>(null),launcher=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null);
 const fullPageRef=useRef(fullPage);fullPageRef.current=fullPage;
 useEffect(()=>{
  const controller=new AbortController();let busy=false;
  const refresh=async()=>{
   if(busy||document.visibilityState!=="visible")return;busy=true;
   try{
    const response=await fetch("/api/chat",{cache:"no-store",signal:controller.signal});
    if(!response.ok){if([401,403].includes(response.status)){setUnread(0);setToast(null);setOpen(false);previous.current=null;}return;}
    const data=await response.json();if(controller.signal.aborted)return;const rooms:ChatRoom[]=data.rooms;
    const next=new Map(rooms.map(r=>[r.id,r.last_at??""]));
    const fresh=rooms.find(r=>r.unread>0&&r.last_at&&previous.current!==null&&previous.current.get(r.id)!==r.last_at);
    setUnread(rooms.reduce((sum,r)=>sum+r.unread,0));
    setToast(old=>old&&rooms.some(r=>r.id===old.id&&r.unread>0)?old:null);
    if(fresh&&!fullPageRef.current)setToast(fresh);
    previous.current=next;
   }catch{/* Keep the existing state during a temporary connection failure. */}
   finally{busy=false;}
  };
  void refresh();const timer=setInterval(()=>void refresh(),5000);
  const wake=()=>void refresh();window.addEventListener("focus",wake);window.addEventListener("haco-chat-read",wake);document.addEventListener("visibilitychange",wake);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener("focus",wake);window.removeEventListener("haco-chat-read",wake);document.removeEventListener("visibilitychange",wake);};
 },[member.id]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),8000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{if(fullPage){setOpen(false);setToast(null);}},[fullPage]);
 useEffect(()=>{if(open)panel.current?.focus();},[open]);
 function close(){setOpen(false);requestAnimationFrame(()=>launcher.current?.focus());}
 function show(id?:string){if(id)setRoom(id);setToast(null);setMounted(true);setOpen(true);}
 if(fullPage)return null;
 return <div className="floating-chat">
  {toast&&<div className="chat-toast" role="status"><button className="chat-toast-open" onClick={()=>show(toast.id)}><MessageCircle size={20}/><span><strong>{roomTitle(toast,member.id)}</strong><small>Có tin nhắn mới · Bấm để trả lời</small></span></button><button className="icon-button" aria-label="Ẩn thông báo tin nhắn" onClick={()=>setToast(null)}><X size={16}/></button></div>}
  {mounted&&<section hidden={!open} ref={panel} tabIndex={-1} className="mini-chat-panel" role="region" aria-label="Chat nhanh" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}}>
   <header className="mini-chat-header"><div><MessageCircle size={19}/><strong>Chat nội bộ</strong></div><div><Link className="icon-button" aria-label="Mở chat toàn màn hình" href={room?`/admin/chat?room=${encodeURIComponent(room)}`:"/admin/chat"}><Maximize2 size={17}/></Link><button className="icon-button" aria-label="Thu gọn chat" onClick={close}><Minus size={19}/></button></div></header>
   <div className="mini-chat-body"><ChatPage compact initialRoom={room} active={open} onSelect={setRoom}/></div>
  </section>}
  <button ref={launcher} className={`chat-launcher ${unread>0?"has-unread":""}`} aria-label={`${open?"Thu gọn chat":"Mở chat nhanh"}${unread?` · ${unread} tin chưa đọc`:""}`} aria-expanded={open} onClick={()=>open?close():show()}><MessageCircle size={23}/><span>Chat</span>{unread>0&&<b>{unread>99?"99+":unread}</b>}</button>
 </div>;
}
