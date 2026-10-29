import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {resolveImportChannels} from '../src/lib/task-import-channels';
const channel=(id:string,platform:string,handle:string)=>({id,name:'HacoLED Việt Nam',platform,handle,url:`https://${platform}.example.test/${id}`});
test('Channel diagnostics distinguish missing, ambiguous, repeated and over-limit channels',()=>{
 const fb=channel('fb','facebook','@hacoled'),tk=channel('tk','tiktok','@hacoled'),channels=[fb,tk];
 const ambiguous=resolveImportChannels('@hacoled',channels);expect(ambiguous.errors).toHaveLength(1);expect(ambiguous.errors[0]).toContain('khớp 2 kênh');expect(ambiguous.errors[0]).not.toContain('bị lặp');
 const missing=resolveImportChannels('Facebook Reels',channels);expect(missing.errors).toHaveLength(1);expect(missing.errors[0]).toContain('Không tìm thấy');expect(missing.errors[0]).not.toContain('bị lặp');
 expect(resolveImportChannels(fb.url,channels).selected[0].id).toBe('fb');
 expect(resolveImportChannels(`${fb.url}|${fb.id}`,channels).errors[0]).toContain('bị lặp');
 expect(resolveImportChannels(Array(21).fill(fb.id).join('|'),channels).errors[0]).toContain('Tối đa 20');
});
test('Import preview reports total rows, separate invalid rows and total errors, without committing',async({playwright,browser})=>{
 const baseURL='http://127.0.0.1:3100',headers={Origin:baseURL,'x-real-ip':'198.51.100.214'};
 const root=await playwright.request.newContext({baseURL,extraHTTPHeaders:headers});const auth=await(await root.get('/api/auth/status')).json();
 if(auth.needsSetup)await root.post('/api/auth/setup',{data:{name:'Khánh Toàn',email:'owner@example.test',password:'Test-only-password-2026!',setupToken:'isolated-test-setup-token'}});else await root.post('/api/auth/login',{data:{password:'Test-only-password-2026!'}});
 const rows=Array.from({length:101},(_,i)=>({ten_cong_viec:`Import diagnostic ${i+1}`,email_nguoi_thuc_hien:i<45?'owner@example.test':'',kenh:i<45?'':'missing channel',dinh_dang:'audit'}));
 // Make 45 valid items and 56 invalid, with more than the 100 displayed-error cap.
 for(let i=0;i<45;i++){rows[i].dinh_dang='khac';Object.assign(rows[i],{ghi_chu_cong_viec:'Kiểm tra kế hoạch công việc.'});}
 const r=await root.post('/api/tasks/import',{data:{rows,stage:'preview'}});expect(r.status()).toBe(200);const p=await r.json();expect(p.total).toBe(101);expect(p.valid).toBe(45);expect(p.invalid).toBe(56);expect(p.errors).toHaveLength(100);expect(p.errors_total).toBe(168);expect(p.errors.some((s:string)=>s.includes('bị lặp'))).toBe(false);
 const bad=await root.post('/api/tasks/import',{data:{rows,stage:'commit',fingerprint:p.fingerprint,import_id:randomUUID()}});expect(bad.status()).toBe(400);
 const tasks=(await(await root.get('/api/tasks')).json()).tasks;expect(tasks.some((t:{title:string})=>t.title.startsWith('Import diagnostic'))).toBe(false);
 const ctx=await browser.newContext({storageState:await root.storageState()}),page=await ctx.newPage();await page.goto(`${baseURL}/admin/tasks`);await page.getByRole('button',{name:'Import kế hoạch',exact:true}).click();
 const csv='ten_cong_viec,email_nguoi_thuc_hien,kenh,dinh_dang,ghi_chu_cong_viec\n'+rows.map(row=>`"${row.ten_cong_viec}",${row.email_nguoi_thuc_hien},${row.kenh},${row.dinh_dang},Kiểm tra kế hoạch công việc.`).join('\n');
 await page.getByLabel('File kế hoạch công việc',{exact:true}).setInputFiles({name:'diagnostics.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await expect(page.getByText('101 dòng trong file · 45 hợp lệ · 56 cần sửa',{exact:true})).toBeVisible();await expect(page.getByText('Đang hiển thị 100/168 lỗi. Hãy sửa các dòng được liệt kê rồi kiểm tra lại file.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Xác nhận nhập 45 công việc',exact:true})).toBeDisabled();
 await ctx.close();await root.dispose();
});
