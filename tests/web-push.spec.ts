import {test,expect} from '@playwright/test';
import {createECDH,randomBytes,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parsePushSubscription,validPushEndpoint} from '../src/lib/push-subscription';
const baseURL='http://127.0.0.1:3100';
const subscription=(mode='ok')=>{const curve=createECDH('prime256v1');curve.generateKeys();return {endpoint:`https://fcm.googleapis.com/hacoled-test/${mode}/${randomUUID()}`,keys:{p256dh:curve.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}};};
const db=async(query:string,params:unknown[]=[])=>await(await fetch('http://127.0.0.1:54339',{method:'POST',body:JSON.stringify({query,params})})).json();
test('Web Push encrypts, queues chat/work, rejects unauthorized devices, retries and removes expired subscriptions',async({playwright,browser})=>{
 const headers={Origin:baseURL,'x-real-ip':'198.51.100.227'},root=await playwright.request.newContext({baseURL,extraHTTPHeaders:headers}),auth=await(await root.get('/api/auth/status')).json();
 if(auth.needsSetup)await root.post('/api/auth/setup',{data:{name:'Khánh Toàn',email:'owner@example.test',password:'Test-only-password-2026!',setupToken:'isolated-test-setup-token'}});else await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}});
 const config=await(await root.get('/api/push')).json();expect(config.configured).toBe(true);expect(config.publicKey).toHaveLength(87);expect(JSON.stringify(config)).not.toContain('privateKey');expect(config.backgroundRemindersConfigured).toBe(true);
 const actors:Record<string,typeof root>={},ids:Record<string,string>={};
 for(const [key,role] of [['staff','marketing_staff'],['other','marketing_intern'],['manager','marketing_manager']]){expect((await root.post('/api/members',{data:{name:`Push ${key}`,email:`push-${key}@example.test`,password:`Push-${key}-2026!`,role}})).status()).toBe(201);actors[key]=await playwright.request.newContext({baseURL,extraHTTPHeaders:headers});expect((await actors[key].post('/api/auth/login',{data:{password:`Push-${key}-2026!`}})).status()).toBe(200);}
 const members=(await(await root.get('/api/members')).json()).members;for(const key of Object.keys(actors))ids[key]=members.find((m:{email:string})=>m.email===`push-${key}@example.test`).id;
 const rootSub=subscription(),deadSub=subscription('gone'),staffSub=subscription();
 for(const s of [rootSub,deadSub])expect((await root.post('/api/push',{data:{subscription:s}})).status()).toBe(200);
 expect((await actors.staff.post('/api/push',{data:{subscription:staffSub}})).status()).toBe(200);
 expect((await actors.other.post('/api/push',{data:{subscription:staffSub}})).status()).toBe(409);
 expect((await root.post('/api/push',{data:{subscription:{...rootSub,endpoint:'https://127.0.0.1/internal'}}})).status()).toBe(400);
 expect((await root.post('/api/push',{headers:{Origin:'https://untrusted.example'},data:{subscription:rootSub}})).status()).toBe(403);
 const task=await root.post('/api/tasks',{data:{title:'Push private task title',assignee_id:ids.staff}});expect(task.status()).toBe(201);const taskId=(await task.json()).id;
 await expect.poll(async()=>Number((await db('SELECT count(*) AS n FROM app_push_deliveries')).rows[0][0])).toBeGreaterThan(0);
 await expect.poll(async()=>Number((await db('SELECT count(*) FROM app_push_subscriptions WHERE endpoint=$1',[deadSub.endpoint])).rows[0][0])).toBe(0);
 const roomResponse=await root.post('/api/chat',{data:{kind:'group',title:'Private project room',member_ids:[ids.staff,ids.other],request_id:randomUUID()}});expect(roomResponse.status()).toBe(201);const room=(await roomResponse.json()).id;
 const messageId=randomUUID();expect((await root.post('/api/chat/messages',{data:{id:messageId,room_id:room,body:'PRIVATE MESSAGE NEVER ON LOCK SCREEN'}})).status()).toBe(201);
 const event=await db('SELECT e.id::text AS event_id,p.id AS device_id FROM app_push_events e JOIN app_push_subscriptions p ON p.member_id=e.member_id WHERE e.message_id=$1::uuid AND p.endpoint=$2',[messageId,staffSub.endpoint]);expect(event.rows).toHaveLength(1);const [eventId,deviceId]=event.rows[0];
 const url=`/api/push/validate?events=${eventId}&device=${deviceId}`,payloadResponse=await actors.staff.get(url);expect(payloadResponse.status()).toBe(200);const payload=await payloadResponse.json();expect(payload.url).toBe(`/admin/chat?room=${room}`);expect(payload.title).toBe('Haco | Khánh Toàn: PRIVATE MESSAGE NEVER ON LOCK SCREEN');expect(payload.body).toBe('');expect(JSON.stringify(payload)).not.toContain('Private project room');expect((await actors.other.get(url)).status()).toBe(204);
 const received=(await(await actors.staff.get(`/api/chat/messages?room=${room}`)).json()).messages.find((m:any)=>m.id===messageId);expect((await actors.staff.patch('/api/chat/messages',{data:{room_id:room,last_seen_seq:received.seq}})).status()).toBe(200);expect((await actors.staff.get(url)).status()).toBe(200);
 expect((await root.post('/api/chat/messages',{data:{id:messageId,room_id:room,body:'PRIVATE MESSAGE NEVER ON LOCK SCREEN'}})).status()).toBe(201);expect(Number((await db('SELECT count(*) FROM app_push_events WHERE message_id=$1::uuid',[messageId])).rows[0][0])).toBe(1);
 const roomDetails=(await(await root.get('/api/chat')).json()).rooms.find((r:{id:string})=>r.id===room),owner=members.find((m:{email:string})=>m.email==='owner@example.test');
 expect((await root.patch('/api/chat',{data:{id:room,version:roomDetails.version,title:'Private project room',member_ids:[owner.id,ids.other],owner_id:owner.id}})).status()).toBe(200);expect((await actors.staff.get(url)).status()).toBe(204);
 const retrySub=subscription('retry');expect((await actors.other.post('/api/push',{data:{subscription:retrySub}})).status()).toBe(200);
 const nextId=randomUUID();await root.post('/api/chat/messages',{data:{id:nextId,room_id:room,body:'Another message'}});
 await expect.poll(async()=>Number((await db('SELECT attempts FROM app_push_events WHERE message_id=$1::uuid',[nextId])).rows[0]?.[0]??0)).toBeGreaterThan(0);
 await expect.poll(async()=>Number((await db('SELECT count(*) FROM app_push_events WHERE message_id=$1::uuid AND lease_until IS NULL AND completed_at IS NULL',[nextId])).rows[0][0])).toBe(1);
 await db('UPDATE app_push_events SET available_at=now(),lease_until=NULL WHERE message_id=$1::uuid AND completed_at IS NULL',[nextId]);
 const channel=await root.post('/api/social-channels',{data:{name:'Push Cron KPI',platform:'facebook',url:'https://www.facebook.com/push-cron-kpi',handle:'@push-cron-kpi',notes:'',active:true,access:[]}});expect(channel.status()).toBe(201);const channelId=(await channel.json()).id;
 const month=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).format(new Date());
 const goal=await root.post('/api/kpis',{data:{assignee_id:ids.other,channel_id:channelId,month,output_type:'image',target:100,notes:'Cron without app open',active:true}});expect(goal.status()).toBe(201);const goalId=(await goal.json()).id;
 expect((await root.get('/api/push/cron')).status()).toBe(401);expect((await root.get('/api/push/cron',{headers:{Authorization:'Bearer isolated-push-cron-secret'}})).status()).toBe(200);
 expect(Number((await db('SELECT count(*) FROM app_push_deliveries d JOIN app_push_events e ON e.id=d.event_id WHERE e.message_id=$1::uuid',[nextId])).rows[0][0])).toBe(1);
 const day=Number(new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit'}).format(new Date()));
 const reminderCount=Number((await db('SELECT count(*) FROM app_notifications WHERE kpi_id=$1::uuid AND member_id=$2::uuid AND kind=$3',[goalId,ids.other,'kpi_reminder'])).rows[0][0]);expect(reminderCount).toBe(day>=7?1:0);
 expect((await root.get('/api/push/cron',{headers:{Authorization:'Bearer isolated-push-cron-secret'}})).status()).toBe(200);expect(Number((await db('SELECT count(*) FROM app_notifications WHERE kpi_id=$1::uuid AND member_id=$2::uuid AND kind=$3',[goalId,ids.other,'kpi_reminder'])).rows[0][0])).toBe(reminderCount);
 expect((await actors.staff.post('/api/auth/logout')).status()).toBe(200);expect(Number((await db('SELECT count(*) FROM app_push_subscriptions WHERE endpoint=$1',[staffSub.endpoint])).rows[0][0])).toBe(0);
 // Verify the worker validates server-side before showing and only opens same-origin /admin URLs.
 const handlers:Record<string,(event:any)=>void>={},shown:any[]=[];let validationStatus=200,pending:Promise<unknown>|null=null;
 const self={location:{origin:baseURL},addEventListener:(name:string,handler:(event:any)=>void)=>handlers[name]=handler,skipWaiting:()=>{},clients:{claim:()=>{},matchAll:async()=>[],openWindow:async()=>{}},registration:{showNotification:async(...args:unknown[])=>shown.push(args)}};
 vm.runInNewContext(readFileSync('public/sw.js','utf8'),{self,URL,fetch:async()=>({status:validationStatus,json:async()=>payload})});handlers.push({data:{json:()=>({events:[eventId],device:deviceId})},waitUntil:(p:Promise<unknown>)=>pending=p});await pending;expect(shown).toHaveLength(1);expect(shown[0][1].renotify).toBe(true);expect(shown[0][0]).toBe('Haco | Khánh Toàn: PRIVATE MESSAGE NEVER ON LOCK SCREEN');
 handlers.push({data:{json:()=>({events:[eventId],device:deviceId})},waitUntil:(p:Promise<unknown>)=>pending=p});await pending;expect(shown).toHaveLength(2);expect(shown[1][1].renotify).toBe(false);expect(shown[1][1].silent).toBe(true);
 validationStatus=204;handlers.push({data:{json:()=>({events:[eventId],device:deviceId})},waitUntil:(p:Promise<unknown>)=>pending=p});await pending;expect(shown[2][0]).toBe('Haco | Thông báo đã hết hiệu lực');expect(shown[2][1].silent).toBe(true);expect(JSON.stringify(shown[2])).not.toContain('PRIVATE');
 await root.delete(`/api/tasks?id=${taskId}`);for(const client of Object.values(actors))await client.dispose();await root.dispose();
});
test('Subscription parser prevents arbitrary server requests and invalid key material',()=>{
 for(const value of ['http://fcm.googleapis.com/test','https://localhost/test','https://fcm.googleapis.com.attacker.test/test','https://user:pass@fcm.googleapis.com/test','https://fcm.googleapis.com:8443/test'])expect(validPushEndpoint(value)).toBe(false);
 expect(parsePushSubscription(subscription())).not.toBeNull();expect(parsePushSubscription({endpoint:'https://fcm.googleapis.com/test',keys:{p256dh:'abc',auth:'abc'}})).toBeNull();
});
test('Notifications request permission on load, auto-subscribe and preserve explicit opt-out after reload',async({playwright,browser})=>{
 const root=await playwright.request.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL,'x-real-ip':'198.51.100.228'}});expect((await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}})).status()).toBe(200);
 const config=await(await root.get('/api/push')).json(),sub=subscription(),context=await browser.newContext({storageState:await root.storageState()});
 await context.addInitScript(({sub,key})=>{
  let registered=false,active:any=null,permission=localStorage.getItem('test-push-permission')??'default';(window as any).__pushRequests=0;(window as any).__testNotifications=0;(window as any).__testTags=[];
  Object.defineProperty(window,'Notification',{configurable:true,value:class{static get permission(){return permission;}static async requestPermission(){(window as any).__pushRequests++;permission='granted';localStorage.setItem('test-push-permission',permission);return permission;}}});
  Object.defineProperty(window,'PushManager',{configurable:true,value:class{}});
  const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')+'='),c=>c.charCodeAt(0));
  const registration={showNotification:async(_title:string,options:any)=>{(window as any).__testNotifications++;(window as any).__testTags.push(options.tag);if(!options.renotify||!options.requireInteraction)throw Error('Test must request visible re-alert');},getNotifications:async()=>[{tag:'haco-notification-test:stub',close:()=>{}}],pushManager:{getSubscription:async()=>active,subscribe:async()=>{active={endpoint:sub.endpoint,options:{applicationServerKey:bytes.buffer},toJSON:()=>sub,unsubscribe:async()=>{active=null;return true;}};return active;}}};
  Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{getRegistration:async()=>registered?registration:undefined,register:async()=>{registered=true;return registration;},ready:Promise.resolve(registration)}});
 },{sub,key:config.publicKey});
 const page=await context.newPage();await page.goto(`${baseURL}/admin/profile`);const enable=page.getByRole('button',{name:'Bật thông báo trên thiết bị này',exact:true});
 await expect(page.getByRole('button',{name:'Tắt trên thiết bị này',exact:true})).toBeEnabled();expect(await page.evaluate(()=>(window as any).__pushRequests)).toBe(1);expect((await(await root.post('/api/push',{data:{action:'status',endpoint:sub.endpoint}})).json()).enabled).toBe(true);
 await page.getByRole('button',{name:'Thử thông báo trên máy',exact:true}).click();await expect(page.getByRole('status')).toContainText('Trình duyệt đã tạo và lưu');expect(await page.evaluate(()=>(window as any).__testNotifications)).toBe(1);await page.getByRole('button',{name:'Thử thông báo trên máy',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__testNotifications)).toBe(2);expect(new Set(await page.evaluate(()=>(window as any).__testTags)).size).toBe(2);
 await page.getByRole('button',{name:'Tắt trên thiết bị này',exact:true}).click();await expect(enable).toBeEnabled();expect(Number((await db('SELECT count(*) FROM app_push_subscriptions WHERE endpoint=$1',[sub.endpoint])).rows[0][0])).toBe(0);
 await page.reload();await expect(enable).toBeEnabled();expect(await page.evaluate(()=>(window as any).__pushRequests)).toBe(0);expect((await(await root.post('/api/push',{data:{action:'status',endpoint:sub.endpoint}})).json()).enabled).toBe(false);
 await enable.click();await expect(page.getByRole('button',{name:'Tắt trên thiết bị này',exact:true})).toBeEnabled();await page.reload();await expect(page.getByRole('button',{name:'Tắt trên thiết bị này',exact:true})).toBeEnabled();expect(await page.evaluate(()=>(window as any).__pushRequests)).toBe(0);
 await context.close();await root.dispose();
});
test('Browsers blocking on-load prompts get a click fallback; denied permission is never requested again',async({playwright,browser})=>{
 const root=await playwright.request.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL,'x-real-ip':'198.51.100.246'}});await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}});const config=await(await root.get('/api/push')).json();
 for(const denied of [false,true]){
  const sub=subscription(),context=await browser.newContext({storageState:await root.storageState()});
  await context.addInitScript(({denied,sub,key})=>{
   let permission=denied?'denied':'default',active:any=null;(window as any).__autoRequests=0;
   Object.defineProperty(window,'Notification',{configurable:true,value:class{static get permission(){return permission;}static async requestPermission(){(window as any).__autoRequests++;if((window as any).__autoRequests>1&&navigator.userActivation.isActive)permission='granted';return permission;}}});Object.defineProperty(window,'PushManager',{configurable:true,value:class{}});
   const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')+'='),c=>c.charCodeAt(0));const registration={pushManager:{getSubscription:async()=>active,subscribe:async()=>active={endpoint:sub.endpoint,options:{applicationServerKey:bytes.buffer},toJSON:()=>sub,unsubscribe:async()=>{active=null;return true;}}}};
   Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register:async()=>registration,getRegistration:async()=>registration,ready:Promise.resolve(registration)}});
  },{denied,sub,key:config.publicKey});
  const page=await context.newPage();await page.goto(`${baseURL}/admin/profile`);
  if(denied){await expect(page.getByText('Thông báo đang bị chặn.',{exact:false})).toBeVisible();expect(await page.evaluate(()=>(window as any).__autoRequests)).toBe(0);await expect(page.getByRole('complementary',{name:'Cho phép thông báo'})).toHaveCount(0);}
  else{const reminder=page.getByRole('complementary',{name:'Cho phép thông báo'});await expect(reminder).toBeVisible();expect(await page.evaluate(()=>(window as any).__autoRequests)).toBe(1);await page.screenshot({path:'.impeccable/review/auto-push-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.impeccable/review/auto-push-mobile.png'});await reminder.getByRole('button',{name:'Cho phép thông báo',exact:true}).click();await expect(page.getByRole('button',{name:'Tắt trên thiết bị này',exact:true})).toBeEnabled();await expect(reminder).toHaveCount(0);}
  await context.close();
 }
 await root.dispose();
});
