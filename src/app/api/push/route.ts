import {cookies} from 'next/headers';
import {randomUUID} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {apiError,checkOrigin,database,getMember,RequestError,SESSION_COOKIE} from '../../../lib/auth/server';
import {digest} from '../../../lib/auth/password';
import {pushConfig} from '../../../lib/push-config';
import {parsePushSubscription,validPushEndpoint} from '../../../lib/push-subscription';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
function expectedActor(req:NextRequest,id:string){const expected=req.headers.get('X-Haco-Member');if(expected&&expected!==id)throw new RequestError('Tài khoản đã thay đổi. Tải lại trang.',401);}

export async function GET(req:NextRequest){try{const actor=await getMember();if(!actor)throw new RequestError('Vui lòng đăng nhập.',401);expectedActor(req,actor.id);const config=pushConfig();return NextResponse.json({viewer_id:actor.id,configured:Boolean(config),publicKey:config?.publicKey??null,backgroundRemindersConfigured:Boolean(process.env.CRON_SECRET)},{headers});}catch(e){return apiError(e);}}
export async function POST(req:NextRequest){try{
 checkOrigin(req);const actor=await getMember(),token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!actor||!token)throw new RequestError('Vui lòng đăng nhập lại.',401);expectedActor(req,actor.id);
 const b=await req.json(),session=digest(token),sql=database();
 if(b.action==='status'){
  if(!validPushEndpoint(b.endpoint))throw new RequestError('Thiết bị không hợp lệ.');
  const rows=await sql`SELECT id FROM app_push_subscriptions WHERE endpoint=${b.endpoint} AND member_id=${actor.id} AND session_hash=${session}`;
  return NextResponse.json({viewer_id:actor.id,enabled:rows.length>0},{headers});
 }
 if(!pushConfig())throw new RequestError('Máy chủ chưa cấu hình khóa Web Push. Liên hệ quản trị viên.',503);
 const subscription=parsePushSubscription(b.subscription);if(!subscription)throw new RequestError('Đăng ký thông báo không hợp lệ hoặc dịch vụ đẩy chưa được hỗ trợ.');
 const result=await sql.transaction([
  sql`SELECT m.id FROM app_members m JOIN app_sessions s ON s.member_id=m.id WHERE s.token_hash=${session} AND m.id=${actor.id} AND s.expires_at>now() FOR UPDATE OF m`,
  sql`INSERT INTO app_push_subscriptions(id,member_id,session_hash,endpoint,p256dh,auth)
   SELECT ${randomUUID()},${actor.id},${session},${subscription.endpoint},${subscription.keys.p256dh},${subscription.keys.auth}
   WHERE EXISTS(SELECT 1 FROM app_sessions WHERE token_hash=${session} AND member_id=${actor.id} AND expires_at>now())
   AND (EXISTS(SELECT 1 FROM app_push_subscriptions WHERE endpoint=${subscription.endpoint}) OR (SELECT COUNT(*) FROM app_push_subscriptions p JOIN app_sessions s ON s.token_hash=p.session_hash WHERE p.member_id=${actor.id} AND s.expires_at>now())<10)
   ON CONFLICT(endpoint) DO UPDATE SET member_id=excluded.member_id,session_hash=excluded.session_hash,p256dh=excluded.p256dh,auth=excluded.auth,updated_at=now(),created_at=CASE WHEN app_push_subscriptions.member_id=excluded.member_id AND app_push_subscriptions.session_hash=excluded.session_hash THEN app_push_subscriptions.created_at ELSE now() END WHERE app_push_subscriptions.member_id=excluded.member_id RETURNING id`,
 ]);
 if(!result[1].length)throw new RequestError('Phiên đã hết hạn hoặc tài khoản đã đăng ký đủ 10 thiết bị.',409);
 return NextResponse.json({ok:true},{headers});
}catch(e){return apiError(e);}}
export async function DELETE(req:NextRequest){try{
 checkOrigin(req);const actor=await getMember(),token=(await cookies()).get(SESSION_COOKIE)?.value;if(!actor||!token)throw new RequestError('Vui lòng đăng nhập.',401);expectedActor(req,actor.id);
 const b=await req.json();if(!validPushEndpoint(b.endpoint))throw new RequestError('Thiết bị không hợp lệ.');
 await database()`DELETE FROM app_push_subscriptions WHERE endpoint=${b.endpoint} AND member_id=${actor.id} AND session_hash=${digest(token)}`;
 return NextResponse.json({ok:true},{headers});
}catch(e){return apiError(e);}}
