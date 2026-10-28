import "server-only";
import { database } from "./auth/server";
import { deadlineMonth } from "./task-planning";
export async function resolveDeadlineKpi(task:{assignee_id:string;channel_id?:string|null;output_type?:string;due_at?:string|null;existing_kpi_id?:string|null}) {
  const month=deadlineMonth(task.due_at);
  if(!month || !task.channel_id) return null;
  const rows=await database()`SELECT id FROM app_kpis WHERE (active=true OR id=${task.existing_kpi_id??null}::uuid) AND assignee_id=${task.assignee_id} AND channel_id=${task.channel_id} AND output_type=${task.output_type??"other"} AND month=${month+'-01'}::date`;
  return rows[0]?.id as string | undefined ?? null;
}
