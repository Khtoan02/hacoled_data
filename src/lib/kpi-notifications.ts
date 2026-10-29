import "server-only";
import {database} from './auth/server';
import type {Member} from './auth/types';
import {scopedKpiData} from './kpi-data';
import {currentMonth,OUTPUT_TYPES,type OutputType} from './kpis';
import {needsKpiReminder} from './notifications';
export async function syncKpiNotifications(actor:Member){
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const month=currentMonth(),day=Number(today.slice(8)),days=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
 const {kpis}=await scopedKpiData(actor,month);
 const sql=database();
 for(const k of kpis){
  if(!k.active||!needsKpiReminder(Number(k.delivered),Number(k.target),day,days))continue;
  const label=OUTPUT_TYPES[k.output_type as OutputType]?.label??k.output_type;
  await sql`INSERT INTO app_notifications(member_id,kpi_id,event_key,kind,title,body)
   SELECT ${actor.id},id,${`kpi:${k.id}:${today}`},'kpi_reminder','Nhắc tiến độ KPI',${`${k.assignee_name} · ${k.channel_name} · ${label}: ${k.delivered}/${k.target}. Còn ${Math.max(0,Number(k.target)-Number(k.delivered))} để hoàn thành tháng ${month.slice(5)}/${month.slice(0,4)}.`}
   FROM app_kpis WHERE id=${k.id} AND active=true ON CONFLICT(member_id,event_key) DO NOTHING`;
 }
}
