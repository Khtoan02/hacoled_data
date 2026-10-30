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
    const response=await fetch("/api/chat",{cache:"no-store",signal:controller.signal});
    if(!response.ok){if([401,403].includes(response.status)){setUnread(0);setToast(null);setOpen(false);previous.current=null;}return;}
    const data=await response.json();if(controller.signal.aborted)return;const rooms:ChatRoom[]=data.rooms;
    const stamp=(r:ChatRoom)=>r.last_incoming_seq??r.last_at??"";
    const next=new Map(rooms.map(r=>[r.id,stamp(r)]));
    const fresh=rooms.find(r=>{
     if(!stamp(r)||(r.last_incoming_seq===undefined&&r.last_author_id===member.id))return false;
     const known=previous.current?.has(r.id)??false;
     let seen=previous.current?.get(r.id);if(previous.current===null){try{seen=sessionStorage.getItem(`haco-chat-seen:${member.id}:${r.id}`)??undefined;}catch{}}
     // An open conversation can acknowledge the message before this poll runs.
     // Its incoming sequence still proves a new message arrived; unread alone cannot.
     return seen!==stamp(r)&&(r.unread>0||(known&&r.last_incoming_seq!==undefined));
    });
    for(const r of rooms){try{sessionStorage.setItem(`haco-chat-seen:${member.id}:${r.id}`,stamp(r));}catch{}}
    setUnread(rooms.reduce((sum,r)=>sum+r.unread,0));
    setToast(old=>old&&rooms.some(r=>r.id===old.id&&r.unread>0)?old:null);
    previous.current=next;
    if(fresh){
     setToast(fresh);
     if("Notification" in window&&Notification.permission==="granted"){
      const registration=await navigator.serviceWorker?.getRegistration();
      // Web Push owns OS alerts when subscribed. Fall back while a tab is open otherwise.
      const subscription=await registration?.pushManager?.getSubscription();
      let pushActive=false;
      if(subscription){const status=await fetch("/api/push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"status",endpoint:subscription.endpoint})});if(status.ok)pushActive=Boolean((await status.json()).enabled);}
      if(!pushActive||(document.visibilityState==="visible"&&document.hasFocus())){const title="HacoLED · Tin nhắn mới",options={body:"Bạn có tin nhắn mới trong chat nội bộ.",tag:`chat:${fresh.id}`,renotify:true,icon:"/icon.png",data:{url:`/admin/chat?room=${fresh.id}`}};
       if(registration)await registration.showNotification(title,options);
       else {const alert=new Notification(title,options);alert.onclick=()=>{window.focus();window.location.assign(`/admin/chat?room=${fresh.id}`);alert.close();};}
      }
     }
    }
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

 if(fullPage&&!toast)return null;
 return <div className="floating-chat">
  {settings&&<div className="chat-device-settings"><button className="icon-button" aria-label="Đóng cài đặt thông báo chat" onClick={()=>setSettings(false)}><X size={17}/></button><PushSettings/></div>}
  {toast&&<div className="chat-toast" role="status"><button className="chat-toast-open" onClick={()=>{if(fullPage)window.location.assign(`/admin/chat?room=${toast.id}`);else show(toast.id);}}><MessageCircle size={20}/><span><strong>{roomTitle(toast,member.id)}</strong><small>Có tin nhắn mới · Bấm để trả lời</small></span></button><button className="icon-button" aria-label="Ẩn thông báo tin nhắn" onClick={()=>setToast(null)}><X size={16}/></button></div>}
  {!fullPage&&mounted&&<section hidden={!open} ref={panel} tabIndex={-1} className="mini-chat-panel" role="region" aria-label="Chat nhanh" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}}>
   <header className="mini-chat-header"><div><MessageCircle size={19}/><strong>Chat nội bộ</strong></div><div><Link className="icon-button" aria-label="Mở chat toàn màn hình" href={room?`/admin/chat?room=${encodeURIComponent(room)}`:"/admin/chat"}><Maximize2 size={17}/></Link><button className="icon-button" aria-label="Thu gọn chat" onClick={close}><Minus size={19}/></button></div></header>
   <div className="mini-chat-body"><ChatPage compact initialRoom={room} active={open} onSelect={setRoom}/></div>
  </section>}
  {!fullPage&&<div className="chat-floating-controls"><button className="icon-button" aria-label="Cài đặt và thử thông báo chat" onClick={()=>setSettings(!settings)}><BellRing size={20}/></button><button ref={launcher} className={`chat-launcher ${unread>0?"has-unread":""}`} aria-label={`${open?"Thu gọn chat":"Mở chat nhanh"}${unread?` · ${unread} tin chưa đọc`:""}`} aria-expanded={open} onClick={()=>open?close():show()}><MessageCircle size={23}/><span>Chat</span>{unread>0&&<b>{unread>99?"99+":unread}</b>}</button></div>}
 </div>;
}
