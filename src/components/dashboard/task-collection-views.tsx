"use client";
// Uses TailAdmin's compact table hierarchy with HacoLED data and permissions.
import {ArrowDown,ArrowUp,ArrowUpDown,ArrowLeftRight,CalendarDays,CheckCircle2,ChevronRight,Circle,Image,MessageSquareText,Trash2} from 'lucide-react';
import {type Task,formatDate,isOverdue} from '../../lib/tasks';
import {OUTPUT_TYPES} from '../../lib/kpis';
import {Avatar,StatusBadge} from './ui';
import {ChannelIdentity} from './channel-picker';
import type {TaskSort} from "../../lib/task-views";
export type CollectionProps={
 tasks:Task[];full:boolean;canDelete:boolean;memberId:string;busy:boolean;selecting:boolean;selected:string[];
 onSelect:(id:string)=>void;onOpen:(task:Task)=>void;onResult:(task:Task)=>void;onDelete:(task:Task)=>void;
};
function TaskSelection({task,props}:{task:Task;props:CollectionProps}){
 return <input className="task-select" type="checkbox" aria-label={`Chọn công việc ${task.title}`} checked={props.selected.includes(task.id)} disabled={props.busy||(!props.selected.includes(task.id)&&props.selected.length>=100)} onChange={()=>props.onSelect(task.id)}/>;
}
function RowActions({task,props}:{task:Task;props:CollectionProps}){
 return <div className="collection-actions"><button type="button" className="icon-button" aria-label={`Kết quả ${task.title}`} title={props.full||props.memberId===task.assignee_id?'Trả kết quả':'Xem kết quả'} onClick={()=>props.onResult(task)}><MessageSquareText size={17}/></button><button type="button" className="icon-button" aria-label={`Mở chi tiết ${task.title}`} title="Mở chi tiết" onClick={()=>props.onOpen(task)}><ChevronRight size={17}/></button>{props.canDelete&&!props.selecting&&<button type="button" className="icon-button danger" aria-label={`Xóa công việc ${task.title}`} title="Xóa công việc" disabled={props.busy} onClick={()=>props.onDelete(task)}><Trash2 size={16}/></button>}</div>;
}
export function TaskListView(props:CollectionProps){
 return <div className="work-list" role="list" aria-label="Danh sách công việc dạng List">{props.tasks.map(t=><article role="listitem" className={`work-list-row ${props.selected.includes(t.id)?'is-selected':''}`} key={t.id}>
 <div className="work-list-marker">{props.selecting&&props.full?<TaskSelection task={t} props={props}/>:t.status==='completed'?<CheckCircle2 size={20} className="work-is-done"/>:<Circle size={20}/>}</div>
 <div className="work-list-content"><button className="work-list-title" onClick={()=>props.onOpen(t)}>{t.title}</button><div className="work-list-meta"><span>{t.channel_name||'Chưa gắn kênh'}</span><span>{OUTPUT_TYPES[t.output_type].label}</span>{t.checklist.length>0&&<span>{t.checklist.filter(c=>c.done).length}/{t.checklist.length} bước</span>}{t.evidence_links.length>0&&<span><Image size={13} aria-hidden="true"/>{t.evidence_links.length} minh chứng</span>}</div></div>
 <span className={`work-list-deadline ${isOverdue(t)?'overdue':''}`}><CalendarDays size={14}/>{formatDate(t.due_at)}</span>
 <span className="work-list-person" title={t.assignee_name}><Avatar name={t.assignee_name} size="small"/><span>{t.assignee_name}</span></span>
 <StatusBadge status={t.status}/><RowActions task={t} props={props}/>
 </article>)}</div>;
}
export function TaskTableView(props:CollectionProps&{sort:TaskSort;onSort:(field:TaskSort['field'])=>void}){
 function heading(field:TaskSort['field'],text:string){const active=props.sort.field===field,Icon=active?(props.sort.direction==='asc'?ArrowUp:ArrowDown):ArrowUpDown;return <th className={`grid-${field}-cell`} scope="col" aria-sort={active?(props.sort.direction==='asc'?'ascending':'descending'):'none'}><button onClick={()=>props.onSort(field)}>{text}<Icon size={13}/></button></th>;}
 return <><p className="work-table-hint"><ArrowLeftRight size={14}/>Cuộn ngang để xem đầy đủ các cột</p><div className="work-table-scroll" role="region" aria-label="Bảng công việc, cuộn ngang để xem thêm" tabIndex={0}><table aria-label="Lưới dữ liệu công việc" className={`work-table work-data-grid ${props.full&&props.selecting?"has-selection":""}`}><thead><tr>
 {props.full&&props.selecting&&<th className="grid-selection-cell" aria-label="Chọn công việc"/>}{heading('title','Công việc')}<th className="grid-channel-cell">Kênh thực hiện</th>{heading('assignee','Người thực hiện')}{heading('deadline','Hạn hoàn thành')}<th className="grid-production-cell">Sản lượng / KPI</th>{heading('status','Trạng thái')}<th className="grid-actions-cell" aria-label="Thao tác">Thao tác</th>
 </tr></thead><tbody>{props.tasks.map(t=><tr key={t.id} className={props.selected.includes(t.id)?'is-selected':''}>
 {props.full&&props.selecting&&<td className="grid-selection-cell"><TaskSelection task={t} props={props}/></td>}
 <td className="work-table-title"><button onClick={()=>props.onOpen(t)}>{t.title}</button><small>{OUTPUT_TYPES[t.output_type].label}{t.checklist.length>0&&` · ${t.checklist.filter(c=>c.done).length}/${t.checklist.length} bước`}</small></td>
 <td className="grid-channel-cell">{t.channels?.length?<div className="work-table-channels">{t.channels.slice(0,2).map(c=><ChannelIdentity key={c.id} channel={c} compact/>)}{t.channels.length>2&&<small>+{t.channels.length-2} kênh</small>}</div>:<span className="work-muted">{t.channel_name||'Chưa gắn kênh'}</span>}</td>
 <td className="grid-person-cell"><div className="work-table-person"><Avatar name={t.assignee_name} size="small"/><span>{t.assignee_name}</span></div></td>
 <td className={`grid-deadline-cell ${isOverdue(t)?'overdue':''}`}>{formatDate(t.due_at)}</td>
 <td className="grid-production-cell"><span className="work-production">{t.status==='completed'?t.delivered_quantity:0} / {t.planned_quantity} {OUTPUT_TYPES[t.output_type].unit}</span><small className="work-muted">{t.kpi_id?'Trong KPI':'Ngoài KPI'}</small></td>
 <td className="grid-status-cell"><StatusBadge status={t.status}/></td><td className="grid-actions-cell"><RowActions task={t} props={props}/></td>
 </tr>)}</tbody></table></div></>;
}
