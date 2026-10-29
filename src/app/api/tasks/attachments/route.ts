import {randomUUID} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {apiError,checkOrigin,database,getMember,RequestError} from '../../../../lib/auth/server';
import {ROLE_POLICIES,isFullAccess} from '../../../../lib/security/rbac';
import {isUuid} from '../../../../lib/social';
import {MAX_IMAGE_BYTES,rasterType} from '../../../../lib/task-attachments';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{
 const actor=await getMember();if(!actor)throw new RequestError('Vui lòng đăng nhập.',401);
 const id=req.nextUrl.searchParams.get('id');if(!isUuid(id))throw new RequestError('Mã ảnh không hợp lệ.');
 const scope=ROLE_POLICIES[actor.role].taskScope;
 const rows=await database()`SELECT encode(a.bytes,'base64') AS data,a.content_type,a.size FROM app_task_attachments a JOIN app_tasks t ON t.id=a.task_id JOIN app_members m ON m.id=t.assignee_id
 WHERE a.id=${id} AND (${scope}='all' OR (${scope}<>'none' AND t.assignee_id=${actor.id}) OR (${scope}='marketing_team' AND m.role IN ('marketing_staff','marketing_intern')))`;
 if(!rows.length)throw new RequestError('Không tìm thấy ảnh trong phạm vi quyền của bạn.',404);
 return new NextResponse(new Uint8Array(Buffer.from(rows[0].data,'base64')),{headers:{'Content-Type':rows[0].content_type,'Content-Length':String(rows[0].size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
}catch(e){return apiError(e);}}
export async function POST(req:NextRequest){try{
 checkOrigin(req);const actor=await getMember();if(!actor)throw new RequestError('Vui lòng đăng nhập.',401);
 if(ROLE_POLICIES[actor.role].taskScope==='none')throw new RequestError('Chưa được cấp quyền công việc.',403);
 if(Number(req.headers.get('content-length'))>MAX_IMAGE_BYTES+65536)throw new RequestError('Mỗi ảnh tối đa 2 MB.',413);
 const form=await req.formData(),taskId=form.get('task_id'),file=form.get('file'),id=form.get('id');
 if(!isUuid(taskId)||!isUuid(id)||!(file instanceof File))throw new RequestError('Ảnh hoặc công việc không hợp lệ.');
 if(!file.size||file.size>MAX_IMAGE_BYTES)throw new RequestError('Mỗi ảnh cần từ 1 byte đến 2 MB.',413);
 const bytes=Buffer.from(await file.arrayBuffer()),type=rasterType(bytes);
 if(!type||type!==file.type)throw new RequestError('Chỉ nhận ảnh PNG, JPEG hoặc WebP đúng định dạng.');
 const sql=database(),name=file.name.replace(/[\r\n\u0000-\u001f]/g,'').slice(0,150)||'anh-minh-chung';
 const result=await sql.transaction([
  sql`SELECT id FROM app_tasks WHERE id=${taskId} AND (${isFullAccess(actor.role)} OR assignee_id=${actor.id}) FOR UPDATE`,
  sql`INSERT INTO app_task_attachments(id,task_id,uploaded_by,name,content_type,bytes,size)
   SELECT ${id},t.id,${actor.id},${name},${type},decode(${bytes.toString('base64')},'base64'),${bytes.length} FROM app_tasks t
   WHERE t.id=${taskId} AND (${isFullAccess(actor.role)} OR t.assignee_id=${actor.id})
   AND (SELECT COALESCE(SUM(size),0) FROM app_task_attachments WHERE task_id=t.id)+${bytes.length}<=20971520
   ON CONFLICT(id) DO NOTHING RETURNING id`,
  sql`SELECT id FROM app_task_attachments WHERE id=${id} AND task_id=${taskId} AND uploaded_by=${actor.id} AND bytes=decode(${bytes.toString('base64')},'base64') AND EXISTS(SELECT 1 FROM app_tasks t WHERE t.id=${taskId} AND (${isFullAccess(actor.role)} OR t.assignee_id=${actor.id}))`,
 ]);
 if(!result[2].length)throw new RequestError('Không thể lưu ảnh: quyền công việc đã đổi, ảnh gửi lại khác bản cũ hoặc tổng ảnh của công việc đã đạt 20 MB.',409);
 return NextResponse.json({url:`/api/tasks/attachments?id=${id}`},{status:201,headers:{'Cache-Control':'no-store'}});
}catch(e){return apiError(e);}}
