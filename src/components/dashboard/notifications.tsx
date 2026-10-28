"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Drawer,Notice } from "./ui";
type Item={id:string;title:string;body:string;created_at:string;read_at:string|null;task_id:string|null;month:string|null};
export function NotificationBell(){
 const [items,setItems]=useState<Item[]>([]),[unread,setUnread]=useState(0),[open,setOpen]=useState(false),[error,setError]=useState('');
 async function refresh(){
  try{const r=await fetch('/api/notifications',{cache:'no-store'});if(r.status===401){setItems([]);setUnread(0);return;}if(!r.ok)throw Error();const d=await r.json();setItems(d.notifications);setUnread(d.unread);setError('');}catch{setError('Chưa tải được thông báo. Vui lòng thử lại.');}
 }
 useEffect(()=>{
  let alive=true,lastSync=0;
  async function tick(){if(document.hidden||!alive)return;const now=Date.now();
   if(now-lastSync>=15*60*1000){try{const r=await fetch('/api/notifications',{method:'POST'});if(r.ok)lastSync=now;}catch{}}
   if(alive)await refresh();
  }
  void tick();const timer=setInterval(tick,30000);document.addEventListener('visibilitychange',tick);
  return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
 },[]);
 async function read(id:string){try{const r=await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(!r.ok)throw Error();await refresh();}catch{setError('Chưa đánh dấu đã đọc được. Vui lòng thử lại.');}}
 return <><button className="icon-button notification-bell" aria-label={`Thông báo${unread?` · ${unread} chưa đọc`:''}`} onClick={()=>{setOpen(true);void refresh();}}><Bell size={20}/>{unread>0&&<span className="notification-count">{unread>99?'99+':unread}</span>}</button>
 {open&&<Drawer title="Thông báo" description="Công việc mới, kết quả hoàn thành và nhắc tiến độ KPI trong phạm vi của bạn." onClose={()=>setOpen(false)}>
 {error&&<Notice>{error}</Notice>}
 <div className="notification-actions"><button className="btn-secondary" onClick={()=>void refresh()}>Tải lại</button><button className="btn-secondary" disabled={!unread} onClick={()=>void read('all')}>Đánh dấu tất cả đã đọc</button></div>
 {!items.length&&!error&&<p>Chưa có thông báo mới.</p>}
 <div className="notification-list">{items.map(n=><Link key={n.id} className={`notification-item ${n.read_at?'':'unread'}`} href={n.task_id?`/admin/tasks?task=${n.task_id}`:`/admin/kpis?month=${n.month}`} onClick={()=>{void read(n.id);setOpen(false);}}><strong>{!n.read_at&&<span aria-label="Chưa đọc">● </span>}{n.title}</strong><p>{n.body}</p><time dateTime={n.created_at}>{new Date(n.created_at).toLocaleString('vi-VN')}</time></Link>)}</div>
 <p className="notification-help">Hiển thị 100 thông báo gần nhất. Cập nhật mỗi 30 giây khi mở ứng dụng; nhắc KPI tối đa một lần mỗi ngày cho mỗi chỉ tiêu.</p>
 </Drawer>}</>;
}
