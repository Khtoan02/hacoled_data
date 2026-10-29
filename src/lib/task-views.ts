import {compareTaskDeadline} from './task-planning';
import type {Task} from './tasks';
export type TaskSort={field:'deadline'|'title'|'assignee'|'status';direction:'asc'|'desc'};
export function compareTaskView(a:Task,b:Task,sort:TaskSort){
 if(sort.field==='deadline'){
  // Undated work stays last in either direction.
  if(!a.due_at||!b.due_at)return compareTaskDeadline(a,b);
  return sort.direction==='asc'?compareTaskDeadline(a,b):compareTaskDeadline(b,a);
 }
 if(sort.field==='status'){const rank={pending:0,in_progress:1,completed:2};return (rank[a.status]-rank[b.status])*(sort.direction==='asc'?1:-1)||compareTaskDeadline(a,b);}
 const fields={title:'title',assignee:'assignee_name',status:'status'} as const;
 const key=fields[sort.field],comparison=a[key].localeCompare(b[key],'vi',{numeric:true,sensitivity:'base'});
 return (sort.direction==='asc'?comparison:-comparison)||compareTaskDeadline(a,b);
}
