import {test,expect} from '@playwright/test';
import {canViewWorkspaceItem,PREVIEW_WORKSPACE_IDS} from '../src/lib/workspace-access';
import {MEMBER_ROLE_IDS} from '../src/lib/security/rbac';

test('Only Marketing Leader sees unfinished and demonstration sections',()=>{
 for(const role of MEMBER_ROLE_IDS){
  for(const id of PREVIEW_WORKSPACE_IDS)expect(canViewWorkspaceItem(role,id),`${role}: ${id}`).toBe(role==='lead_marketing');
  expect(canViewWorkspaceItem(role,'chat')).toBe(true);
  expect(canViewWorkspaceItem(role,'profile')).toBe(true);
  expect(canViewWorkspaceItem(role,'tasks')).toBe(role!=='sales_hotline');
  expect(canViewWorkspaceItem(role,'members')).toBe(['executive','lead_marketing'].includes(role));
 }
});
test('Director retains real overview and administration but cannot open preview routes',async({playwright,browser})=>{
 const baseURL='http://127.0.0.1:3100',extraHTTPHeaders={Origin:baseURL,'x-real-ip':'198.51.100.199'};
 const root=await playwright.request.newContext({baseURL,extraHTTPHeaders});
 const auth=await(await root.get('/api/auth/status')).json();
 if(auth.needsSetup)await root.post('/api/auth/setup',{data:{name:'Khánh Toàn',email:'owner@example.test',password:'Test-only-password-2026!',setupToken:'isolated-test-setup-token'}});
 else await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}});
 expect((await root.post('/api/members',{data:{name:'Workspace Director',email:'workspace-director@example.test',password:'Workspace-director-2026!',role:'executive'}})).status()).toBe(201);
 const client=await playwright.request.newContext({baseURL,extraHTTPHeaders});expect((await client.post('/api/auth/login',{data:{password:'Workspace-director-2026!'}})).status()).toBe(200);
 const ctx=await browser.newContext({storageState:await client.storageState()}),page=await ctx.newPage();await page.goto(`${baseURL}/admin?tab=crm_pipeline`);
 await expect(page.getByRole('heading',{name:'Tổng quan vận hành',exact:true})).toBeVisible();
 await expect(page.getByText('Báo cáo marketing minh họa',{exact:false})).toHaveCount(0);
 await expect(page.getByRole('button',{name:/Sắp có|Không có quyền/})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Thư viện giao diện',exact:true})).toHaveCount(0);
 await page.getByLabel('Tìm chức năng',{exact:true}).fill('Thư viện');await expect(page.locator('.search-results button')).toHaveCount(0);
 await page.goto(`${baseURL}/admin/components`);await expect(page).toHaveURL(`${baseURL}/admin`);
 const members=(await(await root.get('/api/members')).json()).members;
 const id=members.find((m:{email:string})=>m.email==='workspace-director@example.test').id;
 expect((await root.patch('/api/members',{data:{id,role:'marketing_staff'}})).status()).toBe(200);
 await ctx.close();await client.dispose();await root.dispose();
});
