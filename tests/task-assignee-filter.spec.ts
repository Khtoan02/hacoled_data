import {test,expect} from '@playwright/test';
test('Leader and Marketing Manager can immediately filter authorized coworkers across all four views',async({playwright,browser})=>{
 const baseURL='http://127.0.0.1:3100',headers={Origin:baseURL,'x-real-ip':'198.51.100.223'},root=await playwright.request.newContext({baseURL,extraHTTPHeaders:headers});
 const auth=await(await root.get('/api/auth/status')).json();if(auth.needsSetup)await root.post('/api/auth/setup',{data:{name:'Khánh Toàn',email:'owner@example.test',password:'Test-only-password-2026!',setupToken:'isolated-test-setup-token'}});else await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}});
 const clients:Record<string,typeof root>={},ids:Record<string,string>={};
 for(const [key,role] of [['manager','marketing_manager'],['peer','marketing_manager'],['staff','marketing_staff'],['intern','marketing_intern']]){
  expect((await root.post('/api/members',{data:{name:`Filter ${key}`,email:`filter-${key}@example.test`,password:`Filter-${key}-2026!`,role}})).status()).toBe(201);clients[key]=await playwright.request.newContext({baseURL,extraHTTPHeaders:headers});await clients[key].post('/api/auth/login',{data:{password:`Filter-${key}-2026!`}});
 }
 const members=(await(await root.get('/api/members')).json()).members;for(const key of Object.keys(clients))ids[key]=members.find((m:{email:string})=>m.email===`filter-${key}@example.test`).id;
 for(const key of ['manager','peer','staff','intern'])expect((await root.post('/api/tasks',{data:{title:`Person filter ${key}`,assignee_id:ids[key]}})).status()).toBe(201);
 const context=await browser.newContext({storageState:await clients.manager.storageState(),viewport:{width:1440,height:1000}}),page=await context.newPage();await page.goto(`${baseURL}/admin/tasks`);
 const select=page.getByLabel('Lọc người thực hiện',{exact:true});await expect(select).toBeVisible();await expect(page.getByLabel('Lọc trạng thái',{exact:true})).toHaveCount(0);
 await expect(select.locator(`option[value="${ids.staff}"]`)).toHaveCount(1);const options=await select.locator('option').allTextContents();expect(options.some(v=>v.includes('Filter staff'))).toBe(true);expect(options.some(v=>v.includes('Filter intern'))).toBe(true);expect(options.some(v=>v.includes('Filter manager (Tôi)'))).toBe(true);expect(options.some(v=>v.includes('Filter peer'))).toBe(false);
 await select.selectOption(ids.staff);
 for(const name of ['List','Table','To-do','Kanban']){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','true');await expect(select).toHaveValue(ids.staff);await expect(page.getByRole('button',{name:/^Person filter staff/})).toBeVisible();await expect(page.getByRole('button',{name:/^Person filter intern/})).toHaveCount(0);}
 await page.setViewportSize({width:390,height:844});await expect(select).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await select.selectOption(ids.intern);await expect(page.getByRole('button',{name:/^Person filter intern/})).toBeVisible();
 const leaderContext=await browser.newContext({storageState:await root.storageState()}),leaderPage=await leaderContext.newPage();await leaderPage.goto(`${baseURL}/admin/tasks`);const all=leaderPage.getByLabel('Lọc người thực hiện',{exact:true});await all.selectOption(ids.peer);await expect(leaderPage.getByRole('button',{name:'Person filter peer',exact:true})).toBeVisible();
 const staffContext=await browser.newContext({storageState:await clients.staff.storageState()}),staffPage=await staffContext.newPage();await staffPage.goto(`${baseURL}/admin/tasks`);await expect(staffPage.getByLabel('Lọc người thực hiện',{exact:true})).toHaveCount(0);await expect(staffPage.getByRole('button',{name:'Person filter peer',exact:true})).toHaveCount(0);
 await context.close();await leaderContext.close();await staffContext.close();for(const c of Object.values(clients))await c.dispose();await root.dispose();
});
