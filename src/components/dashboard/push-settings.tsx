"use client";
import {useEffect,useState} from 'react';
import {BellRing,BellOff,ChevronDown} from 'lucide-react';
import {Notice} from './ui';
function applicationKey(value:string){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function matchesKey(subscription:PushSubscription,key:string){const existing=subscription.options.applicationServerKey;if(!existing)return false;const expected=applicationKey(key),actual=new Uint8Array(existing);return actual.length===expected.length&&actual.every((v,i)=>v===expected[i]);}
export function PushSettings({compact=false}:{compact?:boolean}){
 const [supported,setSupported]=useState<boolean|null>(null),[permission,setPermission]=useState<NotificationPermission>('default'),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [config,setConfig]=useState<{configured:boolean;publicKey:string|null;backgroundRemindersConfigured:boolean}|null>(null);
 useEffect(()=>{
  let alive=true;const available=window.isSecureContext&&'Notification'in window&&'serviceWorker'in navigator&&'PushManager'in window;setSupported(available);
  if(!available){setLoading(false);return;}
  setPermission(Notification.permission);
  (async()=>{try{const r=await fetch('/api/push',{cache:'no-store'}),data=await r.json();if(!r.ok)throw Error(data.error);if(!alive)return;setConfig(data);
   const registration=data.configured?await navigator.serviceWorker.register('/sw.js',{scope:'/'}):await navigator.serviceWorker.getRegistration('/'),subscription=await registration?.pushManager.getSubscription();
   if(subscription&&data.publicKey&&matchesKey(subscription,data.publicKey)){const status=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',endpoint:subscription.endpoint})});const s=await status.json();if(!status.ok)throw Error(s.error);if(alive)setEnabled(s.enabled);}
  }catch(e){if(alive)setError(e instanceof Error?e.message:'Chưa kiểm tra được thiết bị.');}finally{if(alive)setLoading(false);}})();return()=>{alive=false;};
 },[]);
 async function enable(){
  if(!config?.publicKey||busy)return;setBusy(true);setError('');
  try{
   // The browser prompt must follow the person's own click.
   const permission=await Notification.requestPermission();setPermission(permission);if(permission!=='granted')return;
   await navigator.serviceWorker.register('/sw.js',{scope:'/'});const registration=await navigator.serviceWorker.ready;
   let subscription=await registration.pushManager.getSubscription();
   if(subscription){
    const status=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',endpoint:subscription.endpoint})}),data=await status.json();
    if(!status.ok)throw Error(data.error);
    if(!data.enabled||!matchesKey(subscription,config.publicKey)){await subscription.unsubscribe();subscription=null;}
   }
   if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationKey(config.publicKey)});
   const r=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:subscription.toJSON()})}),d=await r.json();if(!r.ok)throw Error(d.error);setEnabled(true);
  }catch(e){setError(e instanceof Error?e.message:'Chưa bật được thông báo. Kiểm tra kết nối rồi thử lại.');}finally{setBusy(false);}
 }
 async function disable(){setBusy(true);setError('');try{
  const registration=await navigator.serviceWorker.getRegistration('/'),subscription=await registration?.pushManager.getSubscription();
  if(subscription){const r=await fetch('/api/push',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:subscription.endpoint})});if(!r.ok)throw Error('Chưa tắt được thông báo. Vui lòng thử lại.');await subscription.unsubscribe();}
  setEnabled(false);
 }catch(e){setError(e instanceof Error?e.message:'Chưa tắt được thông báo.');}finally{setBusy(false);}}
 const Container=compact?'details':'section',Heading=compact?'summary':'div';
 return <Container className={`push-settings ${compact?'compact':''}`}><Heading><BellRing size={18}/><h3>Thông báo trên thiết bị</h3><span className={enabled?'push-active':''}>{enabled?'Đang bật':'Chưa bật'}</span>{compact&&<ChevronDown size={15}/>}</Heading>
 {supported===false?<p>Trình duyệt này chưa hỗ trợ Web Push. Với iPhone/iPad, hãy thêm HacoLED vào màn hình chính và mở từ biểu tượng đó.</p>:<>
 <p>Nhận thông báo chat, công việc và KPI kể cả khi không mở tab. Chỉ áp dụng trên thiết bị này và trong thời hạn đăng nhập; hệ điều hành có thể giới hạn thông báo khi trình duyệt bị tắt hoàn toàn.</p>
 {config&&!config.configured&&<Notice tone="info">Máy chủ chưa cấu hình khóa Web Push. Quản trị viên cần cấu hình trước khi bật trên thiết bị.</Notice>}
 {permission==='denied'&&<Notice tone="info">Thông báo đang bị chặn. Mở cài đặt quyền của trang trong trình duyệt để cho phép, rồi tải lại trang.</Notice>}
 {error&&<Notice>{error}</Notice>}
 <button type="button" className="secondary-button" disabled={loading||busy||!config?.configured||(!enabled&&permission==='denied')} onClick={()=>void(enabled?disable():enable())}>{enabled?<BellOff size={16}/>:<BellRing size={16}/>}{loading?'Đang kiểm tra…':busy?'Đang cập nhật…':enabled?'Tắt trên thiết bị này':'Bật thông báo trên thiết bị này'}</button>
 {config?.configured&&!config.backgroundRemindersConfigured&&<p className="push-config-note">Chat và công việc có thể đẩy ngay. Nhắc KPI tự động khi mọi người đóng ứng dụng cần quản trị viên bật lịch nền.</p>}
 </>}
 </Container>;
}
