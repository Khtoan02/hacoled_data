import {test,expect} from '@playwright/test';
test('Only marketing leaders mutate KPIs or delete tasks; managers and staff can create their own work',async({playwright})=>{
 const baseURL='http://127.0.0.1:3100',extraHTTPHeaders={Origin:baseURL,'x-real-ip':'198.51.100.235'},root=await playwright.request.newContext({baseURL,extraHTTPHeaders});
 const auth=await(await root.get('/api/auth/status')).json();if(auth.needsSetup)await root.post('/api/auth/setup',{data:{name:'Khánh Toàn',email:'owner@example.test',password:'Test-only-password-2026!',setupToken:'isolated-test-setup-token'}});else await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}});
 for(const role of ['marketing_manager','marketing_staff','marketing_intern','executive']){
  const password=`Restriction-${role}-2026!`,email=`restriction-${role}@example.test`;
  expect((await root.post('/api/members',{data:{name:`Restriction ${role}`,email,password,role}})).status()).toBe(201);
  const id=(await(await root.get('/api/members')).json()).members.find((m:any)=>m.email===email).id;
  const client=await playwright.request.newContext({baseURL,extraHTTPHeaders});await client.post('/api/auth/login',{data:{password}});
  for(const response of [await client.post('/api/kpis',{data:{}}),await client.patch('/api/kpis',{data:{}}),await client.delete('/api/kpis?id=00000000-0000-4000-8000-000000000000'),await client.post('/api/kpis/import',{data:{}}),await client.delete('/api/tasks?id=00000000-0000-4000-8000-000000000000'),await client.post('/api/tasks/bulk-delete',{data:{ids:[]}})])expect(response.status()).toBe(403);
  const work=await client.post('/api/tasks',{data:{title:`Own work ${role}`,assignee_id:id}});expect(work.status()).toBe(201);const task=(await work.json()).id;expect((await root.delete(`/api/tasks?id=${task}`)).status()).toBe(200);expect((await root.patch('/api/members',{data:{id,active:false}})).status()).toBe(200);await client.dispose();
 }
 await root.dispose();
});
