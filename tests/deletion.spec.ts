import { test, expect } from "@playwright/test";
import { currentMonth } from "../src/lib/kpis";
const baseURL="http://127.0.0.1:3100";
test("Leader deletes erroneous KPIs and tasks, keeps snapshots, and restricted roles cannot delete",async({playwright,browser})=>{
 const headers={Origin:baseURL,"x-real-ip":"198.51.100.184"};
 const root=await playwright.request.newContext({baseURL,extraHTTPHeaders:headers});
 const auth=await(await root.get("/api/auth/status")).json();
 if(auth.needsSetup) expect((await root.post("/api/auth/setup",{data:{name:"Khánh Toàn",email:"owner@example.test",password:"Test-only-password-2026!",setupToken:"isolated-test-setup-token"}})).status()).toBe(200);
 else expect((await root.post("/api/auth/login",{data:{password:"Test-only-password-2026!"}})).status()).toBe(200);
 const actors:Record<string,Awaited<ReturnType<typeof playwright.request.newContext>>>={};
 for(const [key,role] of [["leader","lead_marketing"],["staff","marketing_staff"],["manager","marketing_manager"]]){
  expect((await root.post("/api/members",{data:{name:`Deletion ${key}`,email:`deletion-${key}@example.test`,password:`Deletion-${key}-2026!`,role}})).status()).toBe(201);
  const client=await playwright.request.newContext({baseURL,extraHTTPHeaders:headers});
  expect((await client.post("/api/auth/login",{data:{password:`Deletion-${key}-2026!`}})).status()).toBe(200);actors[key]=client;
 }
 const members=(await(await root.get("/api/members")).json()).members;
 const staff=members.find((m:{email:string})=>m.email==="deletion-staff@example.test");
 const leader=actors.leader;
 const cr=await leader.post("/api/social-channels",{data:{name:"Kênh kiểm thử xóa",platform:"facebook",url:"https://www.facebook.com/deletion-test",handle:"@deletion-test",notes:"",active:true,access:[]}});
 expect(cr.status()).toBe(201);const channelId=(await cr.json()).id;
 const plan={assignee_id:staff.id,channel_id:channelId,month:currentMonth(),output_type:"image",target:10,notes:"KPI tạo nhầm",active:true};
 const gr=await leader.post("/api/kpis",{data:plan});expect(gr.status()).toBe(201);const goalId=(await gr.json()).id;
 const tr=await leader.post("/api/tasks",{data:{title:"Công việc kiểm thử xóa",assignee_id:staff.id,channel_ids:[channelId],output_type:"image",planned_quantity:2,due_at:`${currentMonth()}-15T10:00:00Z`,status:"completed"}});
 expect(tr.status()).toBe(201);const taskId=(await tr.json()).id;
 const task=() => leader.get(`/api/tasks?id=${taskId}`);
 expect((await(await task()).json()).tasks[0].kpi_id).toBe(goalId);
 for(const key of ["staff","manager"]){
  expect((await actors[key].delete(`/api/kpis?id=${goalId}`)).status()).toBe(403);
  expect((await actors[key].delete(`/api/tasks?id=${taskId}`)).status()).toBe(403);
 }
 expect((await leader.delete(`/api/kpis?id=${goalId}&version=99`)).status()).toBe(409);
 expect((await(await task()).json()).tasks[0].kpi_id).toBe(goalId);
 const ui=await browser.newContext({storageState:await leader.storageState()}),page=await ui.newPage();
 await page.goto(`${baseURL}/admin/kpis?channel=${channelId}`);
 const deleteGoal=page.getByRole("button",{name:`Xóa KPI Kênh kiểm thử xóa Deletion staff`,exact:true});
 page.once("dialog",d=>d.dismiss());await deleteGoal.click();
 expect((await(await leader.get(`/api/kpis?month=${currentMonth()}`)).json()).kpis.some((k:{id:string})=>k.id===goalId)).toBe(true);
 page.once("dialog",d=>d.accept());await deleteGoal.click();
 await expect(page.getByText("Đã xóa KPI. Giữ lại 1 công việc và chuyển thành ngoài KPI.",{exact:true})).toBeVisible();
 const remaining=(await(await task()).json()).tasks[0];expect(remaining.kpi_id).toBeNull();expect(remaining.status).toBe("completed");expect(remaining.delivered_quantity).toBe(2);
 const data=await(await leader.get(`/api/kpis?month=${currentMonth()}`)).json();expect(data.kpis.some((k:{id:string})=>k.id===goalId)).toBe(false);expect(data.extras.some((t:{id:string})=>t.id===taskId)).toBe(true);
 // The uniqueness slot is free for a corrected target.
 expect((await leader.post("/api/kpis",{data:plan})).status()).toBe(201);
 await page.goto(`${baseURL}/admin/tasks`);
 await page.getByLabel("Tìm công việc",{exact:true}).fill("Công việc kiểm thử xóa");
 const deleteTask=page.getByRole("button",{name:"Xóa công việc Công việc kiểm thử xóa",exact:true});
 page.once("dialog",d=>d.dismiss());await deleteTask.click();expect((await task()).status()).toBe(200);
 page.once("dialog",d=>d.accept());await deleteTask.click();
 await expect(page.getByText("Đã xóa công việc.",{exact:true})).toBeVisible();expect((await task()).status()).toBe(404);
 const audit=await(await fetch("http://127.0.0.1:54339",{method:"POST",body:JSON.stringify({query:"SELECT entity_type,snapshot FROM app_deletion_audit WHERE entity_id IN ($1::uuid,$2::uuid) ORDER BY entity_type",params:[goalId,taskId]})})).json();
 expect(audit.rows).toHaveLength(2);expect(audit.rows[0][0]).toBe("kpi");expect(audit.rows[1][0]).toBe("task");
 expect(JSON.stringify(audit.rows[0][1])).toContain("KPI tạo nhầm");expect(JSON.stringify(audit.rows[1][1])).toContain("Công việc kiểm thử xóa");
 const leaderMember=members.find((m:{email:string})=>m.email==="deletion-leader@example.test");
 expect((await root.patch("/api/members",{data:{id:leaderMember.id,role:"marketing_staff"}})).status()).toBe(200);
 await ui.close();for(const c of Object.values(actors))await c.dispose();await root.dispose();
});
