"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { ArrowLeft,Check,MessageCircle,Plus,Search,Send,Settings2,Users } from "lucide-react";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import { Avatar,Drawer,EmptyState,LoadingState,Notice } from "./ui";
import { ROLE_POLICIES } from "../../lib/security/rbac";
import { mergeMessages,roomTitle,type ChatMessage,type ChatPerson,type ChatRoom } from "../../lib/chat";
function clock(value:string){return new Date(value).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Ho_Chi_Minh"});}
function day(value:string){return new Date(value).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Asia/Ho_Chi_Minh"});}
async function data(response:Response){const d=await response.json().catch(()=>({error:"Máy chủ chưa phản hồi đúng. Hãy thử lại."}));if(!response.ok)throw Object.assign(new Error(d.error||"Chưa tải được cuộc trò chuyện."),{status:response.status});return d;}
function MessageText({body}:{body:string}){return <>{body.split(/(https?:\/\/[^\s<>]+)/g).map((part,i)=>/^https?:\/\//.test(part)?<a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>:part)}</>;}
export function ChatPage({compact=false,initialRoom="",active=true,onSelect}:{compact?:boolean;initialRoom?:string;active?:boolean;onSelect?:(id:string)=>void}={}){
 const member=useMember(),router=useRouter(),params=useSearchParams();
 const [localRoom,setLocalRoom]=useState(initialRoom),selected=compact?localRoom:params.get("room")??"";
 useEffect(()=>{if(compact)setLocalRoom(initialRoom);},[compact,initialRoom]);
 const [rooms,setRooms]=useState<ChatRoom[]>([]),[people,setPeople]=useState<ChatPerson[]>([]),[loading,setLoading]=useState(true),[inboxError,setInboxError]=useState("");
 const [room,setRoom]=useState<ChatRoom|null>(null),[messages,setMessages]=useState<ChatMessage[]>([]),[hasMore,setHasMore]=useState(false),[historyBusy,setHistoryBusy]=useState(false),[chatLoading,setChatLoading]=useState(false),[chatError,setChatError]=useState("");
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[sending,setSending]=useState(false),[sendError,setSendError]=useState("");
 const [revision,setRevision]=useState(0);
 const fetchedCursor=useRef<Record<string,string>>({});
 const [query,setQuery]=useState(""),[editor,setEditor]=useState<"new"|"manage"|null>(null);
 const activeRef=useRef(active);activeRef.current=active;
 const selectedRef=useRef(selected),sendLock=useRef(false),pending=useRef<Record<string,{text:string;id:string}>>({});selectedRef.current=selected;
 const scroller=useRef<HTMLDivElement>(null),nearBottom=useRef(true),readSeq=useRef<Record<string,string>>({});
 const inbox=useCallback(async(signal?:AbortSignal)=>{
  try{const d=await data(await fetch("/api/chat",{cache:"no-store",signal}));if(signal?.aborted)return;setRooms(d.rooms);setPeople(d.people);setInboxError("");}
  catch(e){if(!signal?.aborted){setInboxError(e instanceof Error?e.message:"Chưa tải được danh sách chat.");if((e as {status?:number}).status===401){setRooms([]);setPeople([]);setRoom(null);setMessages([]);setEditor(null);}}}
  finally{if(!signal?.aborted)setLoading(false);}
 },[]);
 useEffect(()=>{const controller=new AbortController();const refresh=()=>{if(document.visibilityState==="visible")void inbox(controller.signal);};void inbox(controller.signal);const timer=setInterval(refresh,5000);document.addEventListener("visibilitychange",refresh);return()=>{controller.abort();clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};},[inbox]);
 const markRead=useCallback(async(id:string,seq:string)=>{
  if(!activeRef.current||document.visibilityState!=="visible"||!document.hasFocus()||selectedRef.current!==id||readSeq.current[id]===seq)return;
  try{await data(await fetch("/api/chat/messages",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({room_id:id,last_seen_seq:seq})}));readSeq.current[id]=seq;setRooms(all=>all.map(r=>r.id===id?{...r,unread:0}:r));window.dispatchEvent(new Event("haco-chat-read"));}catch{/* The next visible refresh retries unread acknowledgement. */}
 },[]);
 useEffect(()=>{
  const controller=new AbortController();setRoom(null);setMessages([]);setChatError("");setSendError("");setHasMore(false);nearBottom.current=true;
  if(!selected){setChatLoading(false);return()=>controller.abort();}
  setChatLoading(true);let initial=true,latestSeq:string|null=null;let fetching=false;
  const refresh=async()=>{
   if(!active||document.visibilityState!=="visible"||fetching)return;
   fetching=true;
   try{
    const response=await fetch(`/api/chat/messages?room=${encodeURIComponent(selected)}${latestSeq!==null?`&after=${latestSeq}`:""}`,{cache:"no-store",signal:controller.signal});
    if(response.status===404){if(!controller.signal.aborted){setRoom(null);setMessages([]);}throw new Error("Bạn không còn trong cuộc trò chuyện này. Chọn cuộc trò chuyện khác.");}
    const d=await data(response);if(controller.signal.aborted)return;
    setRoom(d.room);setMessages(old=>mergeMessages(old,d.messages));if(initial)setHasMore(d.has_more);setChatError("");
    const latest=d.messages[d.messages.length-1];latestSeq=String(latest?.seq??latestSeq??"0");fetchedCursor.current[selected]=latestSeq!;if(latest&&nearBottom.current)void markRead(selected,latest.seq);initial=false;
   }catch(e){if(!controller.signal.aborted){setChatError(e instanceof Error?e.message:"Mất kết nối. Hệ thống đang thử tải lại.");if([401,403].includes((e as {status?:number}).status??0)){setRoom(null);setMessages([]);setEditor(null);}}}
   finally{fetching=false;if(!controller.signal.aborted)setChatLoading(false);}
  };
  void refresh();const timer=setInterval(()=>void refresh(),5000);const onFocus=()=>void refresh();window.addEventListener("focus",onFocus);document.addEventListener("visibilitychange",onFocus);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener("focus",onFocus);document.removeEventListener("visibilitychange",onFocus);};
 },[selected,markRead,revision,active]);
 useEffect(()=>{if(nearBottom.current&&scroller.current)scroller.current.scrollTop=scroller.current.scrollHeight;},[messages]);
 useEffect(()=>{const el=scroller.current;if(!el)return;const observer=new ResizeObserver(()=>{if(nearBottom.current)el.scrollTop=el.scrollHeight;});observer.observe(el);return()=>observer.disconnect();},[selected,chatLoading]);
 function choose(id:string){setEditor(null);if(compact){setLocalRoom(id);onSelect?.(id);return;}router.replace(id?`/admin/chat?room=${encodeURIComponent(id)}`:"/admin/chat",{scroll:false});}
 async function older(){
  if(!messages[0]||historyBusy)return;const id=selected,height=scroller.current?.scrollHeight??0,top=scroller.current?.scrollTop??0;setHistoryBusy(true);
  try{const d=await data(await fetch(`/api/chat/messages?room=${id}&before=${messages[0].seq}`,{cache:"no-store"}));if(selectedRef.current!==id)return;nearBottom.current=false;setMessages(old=>mergeMessages(d.messages,old));setHasMore(d.has_more);requestAnimationFrame(()=>{if(scroller.current&&selectedRef.current===id)scroller.current.scrollTop=scroller.current.scrollHeight-height+top;});}
  catch(e){setChatError(e instanceof Error?e.message:"Chưa tải được tin cũ.");}finally{setHistoryBusy(false);}
 }
 async function send(){
  const id=selected,text=(drafts[id]??"").trim();if(!room||room.id!==id||!text||sendLock.current)return;
  sendLock.current=true;setSending(true);setSendError("");
  const batch=pending.current[id]?.text===text?pending.current[id]:{text,id:crypto.randomUUID()};pending.current[id]=batch;
  try{
   const d=await data(await fetch("/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:batch.id,room_id:id,body:text})}));
   if(selectedRef.current===id){nearBottom.current=true;setMessages(old=>mergeMessages(old,[d.message]));}
   setDrafts(old=>(old[id]??"").trim()===text?{...old,[id]:""}:old);delete pending.current[id];void inbox();
  }catch(e){if(selectedRef.current===id)setSendError(e instanceof Error?e.message:"Chưa gửi được. Bấm gửi lại để thử với cùng tin nhắn.");}
  finally{sendLock.current=false;setSending(false);}
 }
 const visible=rooms.filter(r=>roomTitle(r,member.id).toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))),text=drafts[selected]??"";
 const content=<>
  {compact&&<button className="mini-chat-new secondary-button" onClick={()=>setEditor("new")}><Plus size={16}/>Cuộc trò chuyện mới</button>}
  {inboxError&&<Notice>{inboxError} <button className="table-action" onClick={()=>void inbox()}>Thử lại</button></Notice>}
  <div className={`team-chat ${selected?"has-selection":""}`}>
   <aside className="chat-inbox" aria-label="Danh sách cuộc trò chuyện">
    <div className="chat-inbox-head"><h2>Cuộc trò chuyện</h2><span>{rooms.reduce((n,r)=>n+r.unread,0)>0?`${rooms.reduce((n,r)=>n+r.unread,0)} tin chưa đọc`: "Tin nhắn của bạn"}</span></div>
    <label className="chat-search"><Search size={16}/><input aria-label="Tìm cuộc trò chuyện" placeholder="Tìm người hoặc nhóm…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="chat-room-list">
     {loading?<LoadingState label="Đang tải cuộc trò chuyện…"/>:!visible.length?<EmptyState title={query?"Không tìm thấy cuộc trò chuyện":"Bắt đầu trao đổi"} description={query?"Thử tên người hoặc tên nhóm khác.":"Nhắn riêng cho một người hoặc tạo nhóm cho công việc chung."} icon={MessageCircle}/>:visible.map(r=><button key={r.id} className={`chat-room ${r.id===selected?"selected":""}`} aria-pressed={r.id===selected} onClick={()=>choose(r.id)}>
      <span className="chat-room-avatar">{r.kind==="group"?<Users size={21}/>:<Avatar name={roomTitle(r,member.id)} size="small"/>}</span>
      <span className="chat-room-copy"><strong>{roomTitle(r,member.id)}</strong><small>{r.last_body??(r.kind==="group"?`${r.members.length} thành viên · Nhóm mới`:"Chưa có tin nhắn")}</small></span>
      <span className="chat-room-meta">{r.last_at&&<time>{day(r.last_at)===day(new Date().toISOString())?clock(r.last_at):day(r.last_at).slice(0,5)}</time>}{r.unread>0&&<b aria-label={`${r.unread} tin chưa đọc`}>{r.unread>99?"99+":r.unread}</b>}</span>
     </button>)}
    </div>
   </aside>
   <section className="chat-conversation" aria-label="Nội dung cuộc trò chuyện">
    {!selected?<EmptyState title="Chọn một cuộc trò chuyện" description="Tin nhắn chỉ hiển thị với những người đang tham gia." icon={MessageCircle} action={<button className="secondary-button" onClick={()=>setEditor("new")}>Nhắn tin mới</button>}/>:chatLoading?<LoadingState label="Đang tải tin nhắn…"/>:<>
     <header className="chat-conversation-head"><button className="icon-button chat-back" aria-label="Về danh sách cuộc trò chuyện" onClick={()=>choose("")}><ArrowLeft size={19}/></button><div><h2>{room?roomTitle(room,member.id):"Cuộc trò chuyện"}</h2><p>{room?.kind==="group"?`${room.members.length} thành viên`:room?.members.find(p=>p.id!==member.id)?.active===false?"Tài khoản người nhận đã ngừng hoạt động":"Trao đổi riêng"}</p></div>{room&&<button className="secondary-button" onClick={()=>setEditor("manage")}><Settings2 size={16}/>{room.owner_id===member.id?"Quản lý nhóm":"Thành viên"}</button>}</header>
     {chatError&&<div className="chat-inline-notice"><Notice>{chatError}</Notice></div>}
     <div ref={scroller} className="chat-message-list" role="log" aria-label="Tin nhắn" aria-live="polite" aria-relevant="additions" onScroll={e=>{const el=e.currentTarget;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;if(nearBottom.current&&fetchedCursor.current[selected])void markRead(selected,fetchedCursor.current[selected]);}}>
      {hasMore&&<button className="chat-load-older secondary-button" disabled={historyBusy} onClick={()=>void older()}>{historyBusy?"Đang tải…":"Xem tin nhắn cũ hơn"}</button>}
      {room&&!messages.length&&!chatError&&<EmptyState title="Chưa có tin nhắn" description={room.kind==="group"?"Thành viên mới xem được tin nhắn từ lúc được thêm vào nhóm.":"Gửi lời nhắn đầu tiên để bắt đầu trao đổi."} icon={MessageCircle}/>}
      {messages.map((m,i)=><div key={m.id}>
       {(i===0||day(messages[i-1].created_at)!==day(m.created_at))&&<div className="chat-day">{day(m.created_at)}</div>}
       <article className={`chat-message ${m.author_id===member.id?"mine":""}`} aria-label={`Tin nhắn của ${m.author_name}`}><div className="chat-bubble"><strong>{m.author_id===member.id?"Bạn":m.author_name}</strong><p><MessageText body={m.body}/></p><time dateTime={m.created_at}>{clock(m.created_at)}</time></div></article>
      </div>)}
     </div>
     {room&&<form className="chat-composer" onSubmit={e=>{e.preventDefault();void send();}}>
      {sendError&&<Notice>{sendError} Nội dung vẫn được giữ; bạn có thể gửi lại.</Notice>}
      <div className="chat-composer-row"><textarea aria-label="Nội dung tin nhắn" placeholder="Nhập tin nhắn…" rows={2} maxLength={4000} value={text} disabled={sending} onChange={e=>setDrafts(old=>({...old,[selected]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}/><button className="primary-button" disabled={!text.trim()||sending} aria-label="Gửi tin nhắn" type="submit"><Send size={18}/><span>{sending?"Đang gửi…":"Gửi"}</span></button></div>
      <div className="chat-composer-hint"><span>Enter để gửi · Shift + Enter để xuống dòng</span><span>{text.length}/4000</span></div>
     </form>}
    </>}
   </section>
  </div>
  {editor&&<ChatEditor key={`${editor}-${room?.id??"new"}`} mode={editor} room={editor==="manage"?room:null} people={people} onClose={()=>setEditor(null)} onSaved={id=>{setEditor(null);void inbox();if(id===selected)setRevision(n=>n+1);choose(id);}}/>}
 </>;
 return compact?content:<DashboardShell title="Chat nội bộ" description="Trao đổi riêng và phối hợp công việc trong nhóm." actions={<button className="primary-button" onClick={()=>setEditor("new")}><Plus size={17}/>Cuộc trò chuyện mới</button>}>{content}</DashboardShell>;
}
function ChatEditor({mode,room,people,onClose,onSaved}:{mode:"new"|"manage";room:ChatRoom|null;people:ChatPerson[];onClose:()=>void;onSaved:(id:string)=>void}){
 const member=useMember(),canEdit=mode==="new"||room?.kind==="group"&&room.owner_id===member.id;
 const [requestId]=useState(()=>crypto.randomUUID());
 const [kind,setKind]=useState<"direct"|"group">(room?.kind??"direct"),[title,setTitle]=useState(room?.title??""),[ids,setIds]=useState<string[]>(room?.members.map(p=>p.id)??[member.id]),[owner,setOwner]=useState(room?.owner_id??member.id),[query,setQuery]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const directory=[...new Map([...people,...(room?.members??[])].map(p=>[p.id,p])).values()],matches=directory.filter(p=>(mode!=="new"||kind!=="direct"||p.id!==member.id)&&p.name.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))&&(canEdit||ids.includes(p.id)));
 async function save(e:React.FormEvent){e.preventDefault();if(busy||!canEdit)return;setBusy(true);setError("");try{const d=await data(await fetch("/api/chat",{method:mode==="new"?"POST":"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="new"?{kind,title,member_ids:ids,request_id:requestId}:{id:room!.id,version:room!.version,title,member_ids:ids,owner_id:owner})}));onSaved(d.id??room!.id);}catch(e){setError(e instanceof Error?e.message:"Chưa lưu được nhóm.");}finally{setBusy(false);}}
 return <Drawer title={mode==="new"?"Cuộc trò chuyện mới":canEdit?"Quản lý nhóm":"Thành viên cuộc trò chuyện"} description="Chat nhóm chỉ hiển thị tin nhắn từ lúc mỗi người được thêm vào." onClose={()=>{if(!busy)onClose();}}><form className="account-form chat-editor" onSubmit={save}>
  {error&&<Notice>{error}</Notice>}
  {mode==="new"&&<div className="chat-kind-switch" aria-label="Loại cuộc trò chuyện"><button type="button" aria-pressed={kind==="direct"} onClick={()=>{setKind("direct");setIds([member.id]);}}>Nhắn riêng</button><button type="button" aria-pressed={kind==="group"} onClick={()=>{setKind("group");setIds([member.id]);}}>Tạo nhóm</button></div>}
  {kind==="group"&&<label>Tên nhóm<input aria-label="Tên nhóm chat" value={title} maxLength={100} required disabled={!canEdit||busy} onChange={e=>setTitle(e.target.value)}/></label>}
  <label>Tìm thành viên<input aria-label="Tìm thành viên chat" placeholder="Nhập tên đồng nghiệp…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <div className="chat-people" aria-label="Thành viên có thể chọn">{matches.map(p=><label key={p.id} className="chat-person"><input type={mode==="new"&&kind==="direct"?"radio":"checkbox"} name="chat-person" aria-label={`Chọn ${p.name}`} checked={ids.includes(p.id)} disabled={!canEdit||busy||p.id===member.id||p.id===owner&&mode==="manage"||!p.active} onChange={e=>setIds(old=>kind==="direct"?[member.id,p.id]:e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))}/><Avatar name={p.name} size="small"/><span><strong>{p.name}{p.id===member.id?" (Bạn)":""}</strong><small>{ROLE_POLICIES[p.role].label}{!p.active?" · Ngừng hoạt động":""}</small></span>{p.id===room?.owner_id&&<span className="chat-owner-label">Trưởng nhóm</span>}</label>)}</div>
  {!matches.length&&<p className="result-hint">Không có thành viên phù hợp.</p>}
  <p className="result-hint">Đã chọn {ids.length} người{kind==="group"?" · Tối đa 50 người":""}. Nhóm chỉ trưởng nhóm được đổi tên và thành viên.</p>
  {mode==="manage"&&canEdit&&kind==="group"&&<label>Trưởng nhóm<select aria-label="Trưởng nhóm chat" value={owner} onChange={e=>setOwner(e.target.value)} disabled={busy}>{directory.filter(p=>ids.includes(p.id)&&p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
  {canEdit&&<button className="primary-button" type="submit" disabled={busy||ids.length<2&&mode==="new"||ids.length>50}>{busy?"Đang lưu…":mode==="new"?kind==="direct"?"Mở trò chuyện":"Tạo nhóm chat":"Lưu nhóm"}</button>}
 </form></Drawer>;
}
