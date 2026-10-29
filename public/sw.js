/* Push-only worker. No page, API, credential or image response is cached. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  try{
   const input=event.data?.json();
   if(!input||!Array.isArray(input.events)||input.events.length>80||!input.events.length||!input.events.every(id=>/^\d{1,18}$/.test(id))||!/^[a-f0-9-]{36}$/i.test(input.device))return;
   const response=await fetch(`/api/push/validate?events=${input.events.join(',')}&device=${encodeURIComponent(input.device)}`,{credentials:'include',cache:'no-store'});
   if(response.status!==200)return;
   const data=await response.json();
   await self.registration.showNotification(data.title,{body:data.body,icon:'/icon.png',badge:'/icon.png',tag:data.tag,renotify:false,data:{url:data.url}});
  }catch{/* Never display cached private content or trust a sender-supplied URL. */}
 })());
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
