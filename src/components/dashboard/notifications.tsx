"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {Bell,CheckCheck,ChevronRight,ClipboardList,RefreshCw,Target} from "lucide-react";
import {Drawer,EmptyState,LoadingState,Notice} from "./ui";
type Item={id:string;kind:'task_assigned'|'task_completed'|'kpi_reminder';title:string;body:string;created_at:string;read_at:string|null;task_id:string|null;month:string|null};
const dateKey=(value:string)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
function dayLabel(key:string){
 const today=dateKey(new Date().toISOString()),yesterday=new Date(`${today}T12:00:00Z`);yesterday.setUTCDate(yesterday.getUTCDate()-1);
 if(key===today)return 'Hôm nay';if(key===yesterday.toISOString().slice(0,10))return 'Hôm qua';return key.split('-').reverse().join('/');
}
export function NotificationBell(){
 const [items,setItems]=useState<Item[]>([]),[unread,setUnread]=useState(0),[open,setOpen]=useState(false),[error,setError]=useState('');
 const [loading,setLoading]=useState(true),[reading,setReading]=useState(false),[unreadOnly,setUnreadOnly]=useState(false),[kind,setKind]=useState('all');
 const latest=useRef(0);
 async function refresh(){
  const sequence=++latest.current;setLoading(true);
  try{
   const r=await fetch('/api/notifications',{cache:'no-store'});if(sequence!==latest.current)return;
   if(r.status===401){setItems([]);setUnread(0);setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');return;}
   if(!r.ok)throw Error();const d=await r.json();if(sequence!==latest.current)return;
   setItems(d.notifications);setUnread(d.unread);setError('');
  }catch{if(sequence===latest.current)setError('Chưa tải được thông báo. Bấm Tải lại để thử lại.');}
  finally{if(sequence===latest.current)setLoading(false);}
 }
 useEffect(()=>{
  let alive=true,lastSync=0;
  async function tick(){if(document.hidden||!alive)return;const now=Date.now();
   if(now-lastSync>=15*60*1000){try{const r=await fetch('/api/notifications',{method:'POST'});if(r.ok)lastSync=now;}catch{}}
   if(alive)await refresh();
  }
  void tick();const timer=setInterval(tick,30000);document.addEventListener('visibilitychange',tick);
  return()=>{alive=false;latest.current++;clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
 },[]);
 async function read(id:string){
  setReading(true);
  try{const r=await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(!r.ok)throw Error();await refresh();}
  catch{setError('Chưa đánh dấu đã đọc được. Vui lòng thử lại.');}finally{setReading(false);}
 }
 const visible=items.filter(n=>(!unreadOnly||!n.read_at)&&(kind==='all'||n.kind===kind));
 const groups=new Map<string,Item[]>();for(const item of visible){const key=dateKey(item.created_at);groups.set(key,[...(groups.get(key)??[]),item]);}
 return <>
  <button className="icon-button notification-bell" aria-label={`Thông báo${unread?` · ${unread} chưa đọc`:''}`} onClick={()=>{setOpen(true);void refresh();}}><Bell size={20}/>{unread>0&&<span className="notification-count">{unread>99?'99+':unread}</span>}</button>
  {open&&<Drawer title="Thông báo" description="Công việc và tiến độ KPI trong phạm vi của bạn." onClose={()=>setOpen(false)}>
   <div className="notification-body">
    <div className="notification-toolbar"><span className="notification-inbox-count" aria-live="polite"><strong>{unread}</strong> chưa đọc</span><button className="secondary-button" disabled={loading||reading} onClick={()=>void refresh()}><RefreshCw size={15} className={loading?'animate-spin':''}/>Tải lại</button><button className="secondary-button" disabled={!unread||reading||loading} onClick={()=>void read('all')}><CheckCheck size={16}/>{reading?'Đang cập nhật…':'Đánh dấu tất cả đã đọc'}</button></div>
    <div className="notification-filters"><button className={`notification-filter-button ${unreadOnly?'active':''}`} aria-pressed={unreadOnly} onClick={()=>setUnreadOnly(!unreadOnly)}>Chỉ hiện chưa đọc</button><select aria-label="Lọc loại thông báo" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Tất cả thông báo</option><option value="task_assigned">Công việc mới</option><option value="task_completed">Đã hoàn thành</option><option value="kpi_reminder">Nhắc tiến độ KPI</option></select></div>
    {error&&<Notice>{error}</Notice>}
    {loading&&!items.length&&!error?<LoadingState label="Đang tải thông báo…"/>:!visible.length&&!error?<EmptyState title={unreadOnly?'Không còn thông báo chưa đọc':'Chưa có thông báo phù hợp'} description={items.length?'Thử đổi loại thông báo hoặc bỏ lọc chưa đọc.':'Thông báo công việc mới và nhắc KPI sẽ xuất hiện tại đây.'}/>:null}
    <div className="notification-groups">{Array.from(groups,([key,notifications])=><section key={key} aria-label={`Thông báo ${dayLabel(key)}`}><h3>{dayLabel(key)}<span>{notifications.length}</span></h3><div className="notification-list">{notifications.map(n=>{
     const Icon=n.kind==='task_completed'?CheckCheck:n.kind==='kpi_reminder'?Target:ClipboardList;
     return <Link key={n.id} className={`notification-item ${n.read_at?'':'unread'}`} href={n.task_id?`/admin/tasks?task=${n.task_id}`:`/admin/kpis?month=${n.month}`} onClick={()=>{void read(n.id);setOpen(false);}}>
      <span className={`notification-kind-icon ${n.kind}`} aria-hidden="true"><Icon size={18}/></span><div className="notification-item-content"><strong>{n.title}{!n.read_at&&<span className="notification-unread-dot" role="img" aria-label="Chưa đọc"/>}</strong><p>{n.body}</p><time dateTime={n.created_at} title={new Date(n.created_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}>{new Date(n.created_at).toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'})}</time></div><ChevronRight size={16} className="notification-open-icon" aria-hidden="true"/>
     </Link>;
    })}</div></section>)}</div>
    <p className="notification-help">100 thông báo gần nhất · Cập nhật mỗi 30 giây khi mở ứng dụng. Nhắc KPI tối đa một lần/ngày/chỉ tiêu.</p>
   </div>
  </Drawer>}
 </>;
}
