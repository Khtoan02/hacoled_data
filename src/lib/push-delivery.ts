import 'server-only';
import webpush from 'web-push';
import {after} from 'next/server';
import {randomUUID} from 'node:crypto';
import {database} from './auth/server';
import {pushConfig} from './push-config';
import {chatNotification} from './chat';
export type PushEvent={id:string;member_id:string;kind:string|null;task_id:string|null;kpi_id:string|null;month:string|null;room_id:string|null;created_at:string;author_name?:string|null;message_body?:string|null};
export async function visiblePushEvents(ids:string[],includeRead=false){
 return await database()`SELECT e.id::text,e.member_id,e.created_at,n.kind,n.task_id,n.kpi_id,to_char(k.month,'YYYY-MM') AS month,msg.room_id,author.name AS author_name,msg.body AS message_body
 FROM app_push_events e JOIN app_members m ON m.id=e.member_id
 LEFT JOIN app_notifications n ON n.id=e.notification_id LEFT JOIN app_tasks t ON t.id=n.task_id LEFT JOIN app_kpis k ON k.id=n.kpi_id LEFT JOIN app_members owner ON owner.id=COALESCE(t.assignee_id,k.assignee_id)
 LEFT JOIN app_chat_messages msg ON msg.id=e.message_id LEFT JOIN app_members author ON author.id=msg.author_id LEFT JOIN app_chat_members mine ON mine.room_id=msg.room_id AND mine.member_id=e.member_id
 WHERE e.id IN(SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)::bigint) AND e.created_at>now()-interval '24 hours' AND (msg.id IS NULL OR e.created_at>now()-interval '10 minutes') AND m.active=true
 AND ((n.id IS NOT NULL AND (${includeRead} OR n.read_at IS NULL) AND owner.id IS NOT NULL AND (m.role IN ('lead_marketing','executive') OR (m.role<>'sales_hotline' AND owner.id=m.id) OR (m.role='marketing_manager' AND owner.role IN ('marketing_staff','marketing_intern'))))
 OR (msg.id IS NOT NULL AND mine.member_id IS NOT NULL AND msg.author_id<>m.id AND msg.seq>mine.joined_after_seq AND (${includeRead} OR msg.seq>mine.last_read_seq))) ORDER BY e.id` as PushEvent[];
}
export function pushPayload(events:PushEvent[]){
 const event=events[events.length-1],chat=Boolean(event.room_id),count=events.length;
 const title=chat?'HacoLED · Tin nhắn mới':event.kind==='kpi_reminder'?'HacoLED · Nhắc tiến độ KPI':event.kind==='task_completed'?'HacoLED · Công việc hoàn thành':'HacoLED · Công việc mới';
 const body=chat?`Bạn có ${count>1?count+' tin nhắn':'tin nhắn'} mới trong chat nội bộ.`:event.kind==='kpi_reminder'?'Bạn có chỉ tiêu cần theo dõi tiến độ. Mở ứng dụng để xem.':`${count>1?count+' cập nhật':'Có cập nhật'} công việc dành cho bạn. Mở ứng dụng để xem chi tiết.`;
 const url=chat?`/admin/chat?room=${event.room_id}`:count===1&&event.task_id?`/admin/tasks?task=${event.task_id}`:count===1&&event.month?`/admin/kpis?month=${event.month}`:'/admin/tasks';
 return {...(chat?chatNotification(event.author_name??"",event.message_body??""):{title,body}),url,tag:chat?`chat:${event.member_id}:${event.room_id}`:`work:${event.kind}`};
}
type Send=(subscription:webpush.PushSubscription,payload:string,options:webpush.RequestOptions)=>Promise<unknown>;
export async function flushPush(send:Send=webpush.sendNotification){
 const config=pushConfig();if(!config)return {sent:0};
 const deadline=Date.now()+18000;let sent=0,networkBudget=32;
 for(let batch=0;batch<4&&Date.now()<deadline&&networkBudget>0;batch++){
  const claim=randomUUID(),sql=database();
  const claimed=await sql`WITH ready AS(SELECT id FROM app_push_events WHERE completed_at IS NULL AND available_at<=now() AND (lease_until IS NULL OR lease_until<now()) ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 80)
  UPDATE app_push_events e SET claim_token=${claim},lease_until=now()+interval '2 minutes',attempts=attempts+1 FROM ready r WHERE e.id=r.id RETURNING e.id::text`;
  if(!claimed.length)break;
  const ids=claimed.map(r=>r.id),events=(await visiblePushEvents(ids)).filter(e=>!e.room_id||new Date(e.created_at).getTime()>Date.now()-5*60*1000),groups=new Map<string,PushEvent[]>();
  for(const event of events){const key=`${event.member_id}:${event.room_id??event.kind}`;groups.set(key,[...(groups.get(key)??[]),event]);}
  const jobs:Array<()=>Promise<void>>=[];
  const [subscriptions,deliveries]=await Promise.all([
   sql`SELECT p.id,p.member_id,p.endpoint,p.p256dh,p.auth,p.created_at FROM app_push_subscriptions p JOIN app_sessions s ON s.token_hash=p.session_hash JOIN app_members m ON m.id=p.member_id WHERE p.member_id IN(SELECT jsonb_array_elements_text(${JSON.stringify([...new Set(events.map(e=>e.member_id))])}::jsonb)::uuid) AND s.expires_at>now() AND m.active=true`,
   sql`SELECT event_id::text,subscription_id FROM app_push_deliveries WHERE event_id IN(SELECT jsonb_array_elements_text(${JSON.stringify(events.map(e=>e.id))}::jsonb)::bigint)`,
  ]);
  const already=new Set(deliveries.map(r=>`${r.event_id}:${r.subscription_id}`));
  for(const list of groups.values()){
   for(const subscription of subscriptions.filter(p=>p.member_id===list[0].member_id)){
    const pending=list.filter(e=>!already.has(`${e.id}:${subscription.id}`)&&new Date(e.created_at).getTime()>=new Date(subscription.created_at).getTime());
    if(!pending.length)continue;
    jobs.push(async()=>{
     if(Date.now()>=deadline||networkBudget<=0)return;networkBudget--;
     try{
      await send({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify({events:pending.map(e=>e.id),device:subscription.id}),{TTL:pending[0].room_id?300:86400,urgency:'normal',timeout:3000,vapidDetails:{subject:config.subject,publicKey:config.publicKey,privateKey:config.privateKey}});
      await sql`INSERT INTO app_push_deliveries(event_id,subscription_id) SELECT e.id,p.id FROM app_push_events e CROSS JOIN app_push_subscriptions p WHERE p.id=${subscription.id} AND e.id IN(SELECT jsonb_array_elements_text(${JSON.stringify(pending.map(e=>e.id))}::jsonb)::bigint) ON CONFLICT DO NOTHING`;sent++;
     }catch(error){const status=(error as {statusCode?:number}).statusCode;if(status===404||status===410)await sql`DELETE FROM app_push_subscriptions WHERE id=${subscription.id}`;}
    });
   }
  }
  let cursor=0;await Promise.all(Array.from({length:Math.min(8,jobs.length)},async()=>{while(cursor<jobs.length){const job=jobs[cursor++];await job();}}));
  await sql`UPDATE app_push_events e SET completed_at=CASE WHEN e.created_at<now()-interval '24 hours' OR e.attempts>=12 OR e.id NOT IN(SELECT jsonb_array_elements_text(${JSON.stringify(events.map(e=>e.id))}::jsonb)::bigint) OR NOT EXISTS(
   SELECT 1 FROM app_push_subscriptions p JOIN app_sessions s ON s.token_hash=p.session_hash JOIN app_members m ON m.id=p.member_id WHERE p.member_id=e.member_id AND p.created_at<=e.created_at AND s.expires_at>now() AND m.active=true AND NOT EXISTS(SELECT 1 FROM app_push_deliveries d WHERE d.event_id=e.id AND d.subscription_id=p.id)) THEN now() ELSE NULL END,
   available_at=now()+LEAST(3600,30*power(2,LEAST(e.attempts,7))) * interval '1 second',lease_until=NULL,claim_token=NULL WHERE e.claim_token=${claim}`;
 }
 return {sent};
}
export function schedulePush(){after(async()=>{try{await flushPush();}catch{/* Durable events remain queued. Never log endpoint tokens or message content. */}});}
