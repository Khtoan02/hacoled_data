import {timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {database} from '../../../../lib/auth/server';
import type {Member} from '../../../../lib/auth/types';
import {syncKpiNotifications} from '../../../../lib/kpi-notifications';
import {flushPush} from '../../../../lib/push-delivery';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(req:NextRequest){
 const configured=process.env.CRON_SECRET,actual=req.headers.get('authorization')??'',expected=`Bearer ${configured}`;
 if(!configured||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const sql=database(),members=await sql`SELECT DISTINCT m.id,m.name,m.email,m.role,m.active,m.created_at FROM app_members m JOIN app_push_subscriptions p ON p.member_id=m.id JOIN app_sessions s ON s.token_hash=p.session_hash WHERE m.active=true AND s.expires_at>now() AND m.role<>'sales_hotline'`;
  for(const member of members)await syncKpiNotifications(member as Member);
  const result=await flushPush();
  await sql`DELETE FROM app_push_subscriptions p WHERE NOT EXISTS(SELECT 1 FROM app_sessions s JOIN app_members m ON m.id=s.member_id WHERE s.token_hash=p.session_hash AND s.expires_at>now() AND m.active=true)`;
  await sql`DELETE FROM app_push_events WHERE created_at<now()-interval '30 days'`;
  return NextResponse.json({ok:true,...result},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Không hoàn tất xử lý thông báo nền; sẽ thử lại ở lần tiếp theo.'},{status:503});}
}
