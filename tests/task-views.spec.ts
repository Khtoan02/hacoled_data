import {test,expect} from '@playwright/test';
import {compareTaskView,type TaskSort} from '../src/lib/task-views';
import type {Task} from '../src/lib/tasks';
const baseURL='http://127.0.0.1:3100';
test('Four distinct task views preserve filters, selection, row actions and compact responsive layouts',async({playwright,browser})=>{
 const client=await playwright.request.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL,'x-real-ip':'198.51.100.208'}});
 const status=await(await client.get('/api/auth/status')).json();if(status.needsSetup)await client.post('/api/auth/setup',{data:{name:'Khánh Toàn',email:'owner@example.test',password:'Test-only-password-2026!',setupToken:'isolated-test-setup-token'}});else await client.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}});
 const members=(await(await client.get('/api/members')).json()).members,owner=members.find((m:{email:string})=>m.email==='owner@example.test');
 const ids:string[]=[];
 const plans=[['Thiết kế bộ ảnh màn hình LED','pending','2030-01-10T10:00:00Z'],['Bàn giao video giới thiệu sản phẩm','in_progress','2030-01-11T10:00:00Z'],['Chuẩn bị nội dung cho tuần mới','pending',null],['Hoàn thiện ảnh dự án hội trường','completed','2030-01-12T10:00:00Z']];
 for(const [title,state,due] of plans){const r=await client.post('/api/tasks',{data:{title:`HacoLED · ${title}`,description:'Nội dung cần được kiểm tra và bàn giao cùng hình ảnh minh chứng.',output_type:'image',planned_quantity:3,assignee_id:owner.id,status:state,due_at:due}});expect(r.status()).toBe(201);ids.push((await r.json()).id);}
 const context=await browser.newContext({storageState:await client.storageState(),viewport:{width:1440,height:1000}}),page=await context.newPage();await page.goto(`${baseURL}/admin/tasks`);await page.getByLabel('Tìm công việc',{exact:true}).fill('HacoLED ·');
 for(const name of ['List','Table','To-do','Kanban'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
 await expect(page.getByRole('list',{name:'Danh sách công việc dạng List'}).getByRole('listitem')).toHaveCount(4);
 await expect(page.getByLabel('Lọc trạng thái',{exact:true})).toHaveCount(0);
 // The first live work item is available before 650px on desktop, without opening filters.
 expect((await page.locator('.work-list-row').first().boundingBox())!.y).toBeLessThan(650);
 await page.getByRole('button',{name:'Chọn nhiều',exact:true}).click();await page.getByLabel(`Chọn công việc HacoLED · ${plans[0][0]}`,{exact:true}).check();
 await page.screenshot({path:'.impeccable/review/task-four-list-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Table',exact:true}).click();await expect(page).toHaveURL(/view=table/);await expect(page.getByRole('table')).toBeVisible();await expect(page.getByRole('button',{name:'Xóa đã chọn (1)',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Hạn hoàn thành',exact:true}).click();await expect(page.getByRole('columnheader',{name:'Hạn hoàn thành',exact:true})).toHaveAttribute('aria-sort','descending');
 const titles=await page.locator('.work-table-title>button').allTextContents();expect(titles[0]).toContain(plans[3][0]);expect(titles[3]).toContain(plans[2][0]);
 await page.screenshot({path:'.impeccable/review/task-four-table-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Bộ lọc',exact:true}).click();await page.getByLabel('Lọc trạng thái',{exact:true}).selectOption('in_progress');await expect(page.locator('.work-table tbody tr')).toHaveCount(1);await expect(page.getByRole('button',{name:'Xóa đã chọn (0)',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'To-do',exact:true}).click();await expect(page.locator('.todo-row')).toHaveCount(1);await expect(page.getByLabel('Tìm công việc',{exact:true})).toHaveValue('HacoLED ·');
 await page.getByLabel('Lọc trạng thái',{exact:true}).selectOption('all');await page.getByRole('button',{name:/^Bộ lọc/}).click();await page.getByRole('button',{name:'Hủy chọn',exact:true}).click();
 await page.screenshot({path:'.impeccable/review/task-four-todo-desktop.png',fullPage:true});
 const group=page.locator('.work-todo-group').first();await group.locator('summary').click();await expect(group).not.toHaveAttribute('open','');await group.locator('summary').click();
 await page.getByRole('button',{name:'Kanban',exact:true}).click();await expect(page.locator('.kanban-column')).toHaveCount(3);await page.screenshot({path:'.impeccable/review/task-four-kanban-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 for(const [name,file] of [['List','list'],['Table','table'],['To-do','todo'],['Kanban','kanban']]){
  await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator(name==='List'?'.work-list':name==='Table'?'.work-table':name==='To-do'?'.todo-groups':'.kanban-board')).toBeVisible();await expect(page.getByLabel('Tìm công việc',{exact:true})).toHaveValue('HacoLED ·');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`.impeccable/review/task-four-${file}-mobile.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'List',exact:true}).click();await page.getByRole('button',{name:`Kết quả HacoLED · ${plans[0][0]}`,exact:true}).click();await expect(page.getByLabel('Kết quả thực hiện',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();
 expect((await client.post('/api/tasks/bulk-delete',{data:{items:ids.map(id=>({id,version:0}))}})).status()).toBe(200);
 await context.close();await client.dispose();
});
test('View sorting preserves undated-last, stable deadlines and Vietnamese names',()=>{
 const a={id:'a',title:'Ảnh LED 2',assignee_name:'An',status:'pending',due_at:'2030-01-01T10:00:00Z'} as Task,b={...a,id:'b',title:'Ảnh LED 10',assignee_name:'Bình',status:'completed',due_at:'2030-01-02T10:00:00Z'} as Task,c={...a,id:'c',due_at:null} as Task;
 for(const direction of ['asc','desc'] as const)expect([a,b,c].sort((x,y)=>compareTaskView(x,y,{field:'deadline',direction})).at(-1)?.id).toBe('c');
 expect(compareTaskView(a,b,{field:'title',direction:'asc'})).toBeLessThan(0);
 expect(compareTaskView(a,b,{field:'status',direction:'asc'})).toBeLessThan(0);
 expect(compareTaskView(a,b,{field:'assignee',direction:'desc'})).toBeGreaterThan(0);
});
