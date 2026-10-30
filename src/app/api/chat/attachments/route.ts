import {NextRequest,NextResponse} from 'next/server';
import {apiError,checkOrigin,database,RequestError} from '../../../../lib/auth/server';
import {chatActor,chatId} from '../../../../lib/chat-server';
export const dynamic='force-dynamic';
const MAX=3*1024*1024;
export async function POST(req:NextRequest){try{
 checkOrigin(req);const actor=await chatActor();if(Number(req.headers.get('content-length'))>MAX+65536)throw new RequestError('Mỗi file tối đa 3 MB.',413);
 const form=await req.formData(),id=form.get('id'),room=form.get('room_id'),file=form.get('file');chatId(id);chatId(room);
 if(!(file instanceof File)||!file.size||file.size>MAX)throw new RequestError('Mỗi file từ 1 byte đến 3 MB.',413);
 const name=file.name.replace(/[\r\n\u0000-\u001f]/g,'').slice(0,150)||'tep-dinh-kem',bytes=Buffer.from(await file.arrayBuffer());
 // Only raster images and supported videos render inline. Everything else downloads as a file.
 const type=['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','video/quicktime'].includes(file.type)?file.type:'application/octet-stream';
 const sql=database(),result=await sql.transaction([
 sql`SELECT id FROM app_chat_rooms WHERE id=${room} FOR UPDATE`,
 sql`DELETE FROM app_chat_attachments WHERE message_id IS NULL AND created_at<now()-interval '1 day'`,
 sql`INSERT INTO app_chat_attachments(id,room_id,uploaded_by,name,content_type,size,bytes)
 SELECT ${id},r.id,${actor.id},${name},${type},${bytes.length},decode(${bytes.toString('base64')},'base64') FROM app_chat_rooms r JOIN app_chat_members mine ON mine.room_id=r.id AND mine.member_id=${actor.id} WHERE r.id=${room}
 AND (SELECT COALESCE(SUM(size),0) FROM app_chat_attachments WHERE room_id=r.id)+${bytes.length}<=104857600
 ON CONFLICT(id) DO NOTHING`,
 sql`SELECT id,name,content_type,size FROM app_chat_attachments a WHERE id=${id} AND room_id=${room} AND uploaded_by=${actor.id} AND bytes=decode(${bytes.toString('base64')},'base64') AND EXISTS(SELECT 1 FROM app_chat_members WHERE room_id=a.room_id AND member_id=${actor.id})`
 ]);if(!result[3].length)throw new RequestError('Không thể tải file: không còn trong nhóm, mã file khác nội dung hoặc nhóm đã đạt 100 MB.',409);
 return NextResponse.json({attachment:result[3][0]},{status:201,headers:{'Cache-Control':'private, no-store'}});
}catch(e){return apiError(e);}}
export async function GET(req:NextRequest){try{
 const actor=await chatActor(),id=req.nextUrl.searchParams.get('id');chatId(id);
 const rows=await database()`SELECT a.name,a.content_type,a.size,encode(a.bytes,'base64') AS data FROM app_chat_attachments a JOIN app_chat_members mine ON mine.room_id=a.room_id AND mine.member_id=${actor.id} LEFT JOIN app_chat_messages msg ON msg.id=a.message_id
 WHERE a.id=${id} AND ((msg.seq>mine.joined_after_seq) OR (a.message_id IS NULL AND a.uploaded_by=${actor.id}))`;
 if(!rows.length)throw new RequestError('Không tìm thấy file trong phạm vi cuộc trò chuyện.',404);
 const a=rows[0],inline=a.content_type.startsWith('image/')||a.content_type.startsWith('video/');
 return new NextResponse(new Uint8Array(Buffer.from(a.data,'base64')),{headers:{'Content-Type':a.content_type,'Content-Length':String(a.size),'Content-Disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(a.name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
}catch(e){return apiError(e);}}
