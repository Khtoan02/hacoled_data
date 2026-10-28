import type { Kpi } from "./kpis";
export function deadlineMonth(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit"}).format(new Date(value));
}
export function matchDeadlineKpi(kpis: Kpi[], task: {assignee_id:string;channel_ids:string[];output_type:string;due_at?:string|null}, existingKpiId?:string|null) {
  const month = deadlineMonth(task.due_at);
  return kpis.find(k=>(k.active || k.id===existingKpiId) && k.assignee_id===task.assignee_id && k.channel_id===task.channel_ids[0] && k.output_type===task.output_type && k.month===month) ?? null;
}
export function compareTaskDeadline(a:{id:string;due_at:string|null}, b:{id:string;due_at:string|null}) {
  const first=a.due_at?Date.parse(a.due_at):Infinity, second=b.due_at?Date.parse(b.due_at):Infinity;
  return (first===second?0:first<second?-1:1) || a.id.localeCompare(b.id);
}
