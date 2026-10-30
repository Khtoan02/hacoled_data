/* One OS-notification owner per browser origin. No page/API content is cached. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{try{const old=await self.registration.getNotifications?.();old?.forEach(n=>n.close());}catch{}await self.clients.claim();})()));
let pushQueue=Promise.resolve();
const seenMemory=new Set();
let seenDatabase;
function openSeen(){
 if(typeof indexedDB==='undefined')return Promise.resolve(null);
 if(!seenDatabase)seenDatabase=new Promise(resolve=>{const req=indexedDB.open('haco-notification-receipts',1);req.onupgradeneeded=()=>{const store=req.result.createObjectStore('seen',{keyPath:'id'});store.createIndex('at','at');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);});
 return seenDatabase;
}
async function wasSeen(keys){
 if(keys.every(key=>seenMemory.has(key)))return true;
 const db=await openSeen();if(!db)return false;
 return new Promise(resolve=>{const tx=db.transaction('seen','readonly'),store=tx.objectStore('seen');let count=0;for(const key of keys){const request=store.get(key);request.onsuccess=()=>{if(request.result)count++;};}tx.oncomplete=()=>resolve(count===keys.length);tx.onerror=()=>resolve(false);});
}
async function remember(keys){
 keys.forEach(key=>seenMemory.add(key));if(seenMemory.size>5000)seenMemory.clear();
 const db=await openSeen();if(!db)return;
 await new Promise(resolve=>{const tx=db.transaction('seen','readwrite'),store=tx.objectStore('seen');keys.forEach(id=>store.put({id,at:Date.now()}));const old=store.index('at').openCursor(IDBKeyRange.upperBound(Date.now()-86400000));old.onsuccess=()=>{const cursor=old.result;if(cursor){cursor.delete();cursor.continue();}};tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();});
}
async function neutral(expired){
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 if(windows.some(client=>client.focused))return;
 // userVisibleOnly requires a visible result for background pushes. Never expose another session's chat.
 await self.registration.showNotification(expired?'Haco | Thông báo đã hết hiệu lực':'Haco | Chưa tải được thông báo',{body:'Mở Haco để kiểm tra kết nối và phiên đăng nhập.',tag:'haco-push-status',silent:true,data:{url:'/admin/profile'}});
}
async function receivePush(event){
 try{
  const input=event.data?.json();
  if(!input||!Array.isArray(input.events)||input.events.length>80||!input.events.length||!input.events.every(id=>/^\d{1,18}$/.test(id))||!/^[a-f0-9-]{36}$/i.test(input.device)){await neutral(true);return;}
  const response=await fetch(`/api/push/validate?events=${input.events.join(',')}&device=${encodeURIComponent(input.device)}`,{credentials:'include',cache:'no-store'});
  if(response.status!==200){await neutral([204,401,403,404].includes(response.status));return;}
  const data=await response.json(),keys=input.events.map(id=>`${input.device}:${id}`),duplicate=await wasSeen(keys);
  await self.registration.showNotification(data.title,{body:data.body,icon:'/icon.png',badge:'/icon.png',tag:data.tag,renotify:!duplicate,...(duplicate?{silent:true}:{}),data:{url:data.url}});
  await remember(keys);
 }catch{await neutral(false);}
}
self.addEventListener('push',event=>{
 pushQueue=pushQueue.catch(()=>{}).then(()=>receivePush(event));event.waitUntil(pushQueue);
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{
  const url=new URL(event.notification.data?.url||'/admin',self.location.origin);
  if(url.origin!==self.location.origin||!url.pathname.startsWith('/admin'))return;
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=clients.find(client=>new URL(client.url).origin===url.origin);
  if(existing){await existing.navigate(url.href);await existing.focus();}else await self.clients.openWindow(url.href);
 })());
});
