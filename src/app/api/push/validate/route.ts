import {cookies} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import {apiError,database,getMember,RequestError,SESSION_COOKIE} from '../../../../lib/auth/server';
import {digest} from '../../../../lib/auth/password';
import {isUuid} from '../../../../lib/social';
import {pushPayload,visiblePushEvents} from '../../../../lib/push-delivery';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{
 const member=await getMember(),token=(await cookies()).get(SESSION_COOKIE)?.value;if(!member||!token)throw new RequestError('Vui lòng đăng nhập.',401);
 const device=req.nextUrl.searchParams.get('device'),raw=req.nextUrl.searchParams.get('events')??'',ids=raw.split(',');
 if(!isUuid(device)||ids.length>80||!ids.length||ids.some(id=>!/^\d{1,18}$/.test(id)))throw new RequestError('Thông báo không hợp lệ.');
 const subscriptions=await database()`SELECT id,created_at FROM app_push_subscriptions WHERE id=${device} AND member_id=${member.id} AND session_hash=${digest(token)}`;
 if(!subscriptions.length)return new NextResponse(null,{status:204});
 const events=(await visiblePushEvents(ids,true)).filter(e=>e.member_id===member.id&&new Date(e.created_at).getTime()>=new Date(subscriptions[0].created_at).getTime());
 if(!events.length)return new NextResponse(null,{status:204});
 // Group only same conversation or event type. Never accept a URL or body from a push sender.
 const first=events[0],same=events.filter(e=>e.room_id===first.room_id&&e.kind===first.kind);
 return NextResponse.json(pushPayload(same),{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return apiError(e);}}
