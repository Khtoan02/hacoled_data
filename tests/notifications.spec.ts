import {test,expect} from '@playwright/test';
import {needsKpiReminder} from '../src/lib/notifications';
import {currentMonth} from '../src/lib/kpis';
test('Task notifications respect roles, transitions, read ownership and deletion',async({playwright,browser})=>{
 const baseURL='http://127.0.0.1:3100',extraHTTPHeaders={Origin:baseURL,'x-real-ip':'198.51.100.191'};
 const root=await playwright.request.newContext({baseURL,extraHTTPHeaders});
 const auth=await(await root.get('/api/auth/status')).json();
 if(auth.needsSetup)expect((await root.post('/api/auth/setup',{data:{name:'Khánh Toàn',email:'owner@example.test',password:'Test-only-password-2026!',setupToken:'isolated-test-setup-token'}})).status()).toBe(200);
 else expect((await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}})).status()).toBe(200);
 const clients:Record<string,typeof root>={},ids:Record<string,string>={};
 for(const [key,role] of [['staff','marketing_staff'],['other','marketing_intern'],['manager','marketing_manager'],['sales','sales_hotline']]){
  expect((await root.post('/api/members',{data:{name:`Notify ${key}`,email:`notify-${key}@example.test`,password:`Notify-${key}-2026!`,role}})).status()).toBe(201);
  clients[key]=await playwright.request.newContext({baseURL,extraHTTPHeaders});expect((await clients[key].post('/api/auth/login',{data:{password:`Notify-${key}-2026!`}})).status()).toBe(200);
 }
 const members=(await(await root.get('/api/members')).json()).members;
 for(const key of Object.keys(clients))ids[key]=members.find((m:{email:string})=>m.email===`notify-${key}@example.test`).id;
 const result=await root.post('/api/tasks',{data:{title:'Thông báo công việc kiểm thử',assignee_id:ids.staff,status:'pending',output_type:'post',planned_quantity:1,due_at:`${currentMonth()}-20T10:00:00Z`}});
 expect(result.status()).toBe(201);const taskId=(await result.json()).id;
 const inbox=async(c:typeof root)=>(await(await c.get('/api/notifications')).json()).notifications;
 const own=()=>inbox(clients.staff);
 const entry=(await own()).find((n:{task_id:string})=>n.task_id===taskId);expect(entry.kind).toBe('task_assigned');
 expect((await inbox(clients.other)).some((n:{task_id:string})=>n.task_id===taskId)).toBe(false);
 expect((await inbox(clients.sales))).toHaveLength(0);
 expect((await clients.other.patch('/api/notifications',{data:{id:entry.id}})).status()).toBe(404);
 expect((await clients.staff.patch('/api/notifications',{data:{id:entry.id}})).status()).toBe(200);
 expect((await own()).find((n:{id:string})=>n.id===entry.id).read_at).toBeTruthy();
 const db=async(query:string,params:unknown[]=[])=>await(await fetch('http://127.0.0.1:54339',{method:'POST',body:JSON.stringify({query,params})})).json();
 // Database trigger covers imports and result updates atomically, including repeated completion saves.
 await db("UPDATE app_tasks SET status='completed',report_version=report_version+1 WHERE id=$1::uuid",[taskId]);
 await db("UPDATE app_tasks SET status='completed',report_version=report_version+1 WHERE id=$1::uuid",[taskId]);
 expect((await inbox(clients.manager)).filter((n:{task_id:string;kind:string})=>n.task_id===taskId&&n.kind==='task_completed')).toHaveLength(1);
 expect((await inbox(root)).filter((n:{task_id:string;kind:string})=>n.task_id===taskId&&n.kind==='task_completed')).toHaveLength(1);
 await db('UPDATE app_tasks SET assignee_id=$1::uuid,report_version=report_version+1 WHERE id=$2::uuid',[ids.other,taskId]);
 expect((await own()).some((n:{task_id:string})=>n.task_id===taskId)).toBe(false);
 expect((await inbox(clients.other)).some((n:{task_id:string})=>n.task_id===taskId)).toBe(true);
 const ctx=await browser.newContext({storageState:await clients.other.storageState()}),page=await ctx.newPage();await page.goto(`${baseURL}/admin/tasks`);
 await page.getByRole('button',{name:/^Thông báo/}).click();await expect(page.getByRole('heading',{name:'Thông báo',exact:true})).toBeVisible();
 await page.getByRole('link',{name:/Công việc mới.*Thông báo công việc kiểm thử/}).click();await expect(page).toHaveURL(/task=/);
 expect((await root.delete(`/api/tasks?id=${taskId}`)).status()).toBe(200);
 expect((await inbox(clients.other)).some((n:{task_id:string})=>n.task_id===taskId)).toBe(false);
 const ch=await root.post('/api/social-channels',{data:{name:'Notify KPI channel',platform:'facebook',url:'https://www.facebook.com/notify-kpi',handle:'@notify-kpi',notes:'',active:true,access:[]}});expect(ch.status()).toBe(201);const channelId=(await ch.json()).id;
 const goal=await root.post('/api/kpis',{data:{assignee_id:ids.other,channel_id:channelId,month:currentMonth(),output_type:'post',target:30,notes:'',active:true}});expect(goal.status()).toBe(201);const goalId=(await goal.json()).id;
 expect((await clients.other.post('/api/notifications')).status()).toBe(200);
 expect((await clients.other.post('/api/notifications')).status()).toBe(200);
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const reminders=(await inbox(clients.other)).filter((n:{kpi_id:string})=>n.kpi_id===goalId);
 expect(reminders).toHaveLength(Number(today.slice(8))>=7?1:0);
 expect((await inbox(clients.staff)).some((n:{kpi_id:string})=>n.kpi_id===goalId)).toBe(false);
 expect((await root.delete(`/api/kpis?id=${goalId}&version=0`)).status()).toBe(200);
 expect((await inbox(clients.other)).some((n:{kpi_id:string})=>n.kpi_id===goalId)).toBe(false);
 await ctx.close();for(const c of Object.values(clients))await c.dispose();await root.dispose();
});

test('KPI reminder cadence follows actual production and month pace',()=>{
 expect(needsKpiReminder(0,30,3,30)).toBe(false);
 expect(needsKpiReminder(2,30,15,30)).toBe(true);
 expect(needsKpiReminder(20,30,15,30)).toBe(false);
 expect(needsKpiReminder(29,30,28,30)).toBe(true);
 expect(needsKpiReminder(30,30,28,30)).toBe(false);
 expect(needsKpiReminder(35,30,28,30)).toBe(false);
});
