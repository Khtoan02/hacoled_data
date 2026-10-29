"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  OUTPUT_TYPES,
  SELECTABLE_OUTPUT_TYPES,
  monthLabel,
  type Kpi,
  type OutputType,
} from "../../lib/kpis";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  GripVertical,
  LayoutGrid,
  List,
  Table2,
  ListChecks,
  ListFilter,
  ListTodo,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Download,
  Upload,
  X,
} from "lucide-react";
import { deadlineMonth, matchDeadlineKpi, compareTaskDeadline } from "../../lib/task-planning";
import { TaskListView,TaskTableView } from "./task-collection-views";
import { compareTaskView,type TaskSort } from "../../lib/task-views";
import { TaskResult } from "./task-report";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import {
  isFullAccess,
  ROLE_POLICIES,
  TASK_SCOPE_LABELS,
} from "../../lib/security/rbac";
import type { SocialChannel } from "../../lib/social";
import type { Member } from "../../lib/auth/types";
import {
  taskDeadlineGroup,
  dateInputValue,
  formatDate,
  isOverdue,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type ChecklistItem,
  type TaskBrief,
} from "../../lib/tasks";
import {
  Avatar,
  Drawer,
  EmptyState,
  LoadingState,
  Notice,
  Pagination,
  Panel,
  StatusBadge,
} from "./ui";
import {
  ChannelIdentity,
  ChannelMultiSelect,
  ChannelSelect,
} from "./channel-picker";
import { TaskImport } from "./task-import";
import { TaskBriefFields, TaskBriefSummary } from "./task-brief";
const pageSize = 10;
type Draft = {
  kpi_id: string;
  output_type: OutputType;
  planned_quantity: number;
  channel_ids: string[];
  title: string;
  description: string;
  brief: TaskBrief;
  assignee_id: string;
  due_at: string;
  status: TaskStatus;
  priority: TaskPriority;
  checklist: ChecklistItem[];
};
export function TasksPage() {
  const member = useMember(),
    full = isFullAccess(member.role),
    router = useRouter(),
    params = useSearchParams();
  const view = ["list", "table", "board", "todo"].includes(params.get("view") || "")
    ? params.get("view")!
    : "list";
  const [expandedFilters,setExpandedFilters]=useState(false);
  const [sort,setSort]=useState<TaskSort>({field:'deadline',direction:'asc'});
  const paginatedView=view==='list'||view==='table';
  const [tasks, setTasks] = useState<Task[]>([]),
    [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"),
    [assigneeFilter, setAssigneeFilter] = useState(
      params.get("assignee") || "all",
    ),
    [dueFilter, setDueFilter] = useState("all"),
    [page, setPage] = useState(1);
  const [opened, setOpened] = useState<Task | "new" | null>(null),
    [dragged, setDragged] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    kpi_id: "",
    output_type: "other",
    planned_quantity: 1,
    channel_ids: [],
    title: "",
    description: "",
    brief: {},
    assignee_id: member.id,
    due_at: "",
    status: "pending",
    priority: "normal",
    checklist: [],
  });
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [kpiFilter, setKpiFilter] = useState(params.get("kpi") || "all");
  const consumed = useRef("");
  const [importOpen, setImportOpen] = useState(false);
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [channelFilter, setChannelFilter] = useState("all");
  const [reportDirty, setReportDirty] = useState(false);
  const [detailTab, setDetailTab] = useState<"details" | "result">("details");
  const [newItem, setNewItem] = useState("");
  const [selecting,setSelecting]=useState(false),[selected,setSelected]=useState<string[]>([]),[deleteOpen,setDeleteOpen]=useState(false);
  useEffect(()=>{setSelected([]);setDeleteOpen(false);},[search,statusFilter,assigneeFilter,dueFilter,kpiFilter,channelFilter]);
  function toggleSelected(id:string){setSelected(current=>current.includes(id)?current.filter(v=>v!==id):current.length<100?[...current,id]:current);}
  function selectBox(task:Task){return <input type="checkbox" className="task-select" aria-label={`Chọn công việc ${task.title}`} checked={selected.includes(task.id)} disabled={busy||(!selected.includes(task.id)&&selected.length>=100)} onChange={()=>toggleSelected(task.id)}/>;}
  async function bulkDelete(){
    setBusy(true);setError("");
    try{
      const items=tasks.filter(t=>selected.includes(t.id)).map(t=>({id:t.id,version:t.report_version}));
      const r=await fetch('/api/tasks/bulk-delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})}),d=await r.json();
      if(!r.ok)throw Error(d.error);
      setDeleteOpen(false);setSelected([]);setSelecting(false);await load();setNotice(`Đã xóa ${d.deleted} công việc. KPI và hiệu suất được tính lại theo dữ liệu còn lại.`);
    }catch(e){setError(e instanceof Error?e.message:'Chưa xóa được công việc. Hãy thử lại.');setDeleteOpen(false);}
    finally{setBusy(false);}
  }

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const r = await fetch("/api/tasks", { cache: "no-store" }),
          d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setTasks(d.tasks);
        const cr = await fetch("/api/social-channels", { cache: "no-store" }),
          cd = await cr.json();
        if (!cr.ok) throw new Error(cd.error);
        setChannels(cd.channels);
        const kr = await fetch("/api/kpis?month=all", { cache: "no-store" }),
          kd = await kr.json();
        if (!kr.ok) throw new Error(kd.error);
        setKpis(kd.kpis);
        if (full) {
          const m = await fetch("/api/members", { cache: "no-store" }),
            md = await m.json();
          if (!m.ok) throw new Error(md.error);
          setMembers(md.members.filter((person: Member) => person.active));
        } else setMembers([member]);
        return true;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Không tải được công việc. Hãy thử lại.",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [full],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function save(body: object, method: "POST" | "PATCH", close = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const previous = tasks;
    const update = body as Partial<Task>;
    const optimistic =
      method === "PATCH" && !close && update.id && update.status;
    if (optimistic) {
      setTasks((current) =>
        current.map((task) =>
          task.id === update.id ? { ...task, status: update.status! } : task,
        ),
      );
    }
    try {
      const r = await fetch("/api/tasks", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (close) setOpened(null);
      const refreshed = await load(true);
      setNotice(
        refreshed
          ? method === "POST"
            ? "Đã tạo và giao công việc."
            : "Đã lưu thay đổi công việc."
          : "Đã lưu. Hãy làm mới để tải dữ liệu mới nhất.",
      );
    } catch (e) {
      if (optimistic) setTasks(previous);
      setError(
        e instanceof Error ? e.message : "Chưa lưu được. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  function open(task: Task | "new", status: TaskStatus = "pending") {
    setError("");
    setNewItem("");
    setOpened(task);
    setDetailTab(task === "new" || full ? "details" : "result");
    setDraft(
      task === "new"
        ? {
            kpi_id: "",
            output_type: "other",
            planned_quantity: 1,
            channel_ids: [],
            title: "",
            description: "",
            brief: {},
            assignee_id: member.id,
            due_at: "",
            status,
            priority: "normal",
            checklist: [],
            ...(() => {
              const k = kpis.find(
                (k) => k.id === params.get("kpi") && k.active,
              );
              return k
                ? {
                    kpi_id: k.id,
                    due_at: new Date(Date.UTC(Number(k.month.slice(0,4)),Number(k.month.slice(5,7)),0)).toISOString().slice(0,10),
                    channel_ids: [k.channel_id],
                    assignee_id: k.assignee_id,
                    output_type: k.output_type,
                  }
                : {};
            })(),
          }
        : {
            kpi_id: task.kpi_id ?? "",
            output_type: task.output_type,
            planned_quantity: task.planned_quantity,
            channel_ids: task.channel_ids?.length
              ? task.channel_ids
              : task.channel_id
                ? [task.channel_id]
                : [],
            title: task.title,
            description: task.description,
            brief: task.brief || {},
            assignee_id: task.assignee_id,
            due_at: dateInputValue(task.due_at),
            status: task.status,
            priority: task.priority,
            checklist: task.checklist.map((item) => ({ ...item })),
          },
    );
  }
  useEffect(() => {
    setKpiFilter(params.get("kpi") || "all");
    setAssigneeFilter(params.get("assignee") || "all");
  }, [params]);
  useEffect(() => {
    if (loading) return;
    const token = `${params.get("create")}|${params.get("task")}|${params.get("kpi")}`;
    if (consumed.current === token) return;
    consumed.current = token;
    if (params.get("create") === "1") open("new");
    else if (params.get("task")) {
      const t = tasks.find((t) => t.id === params.get("task"));
      if (t) open(t);
      else setError("Không tìm thấy công việc trong phạm vi quyền của bạn.");
    }
  }, [loading, params, tasks, kpis]);
  const kpiMonth = deadlineMonth(draft.due_at);
  const matchedKpi = matchDeadlineKpi(kpis, draft, opened && opened !== "new" ? opened.kpi_id : null);
  const autoKpiId = matchedKpi?.id ?? "";
  useEffect(() => {
    if (!opened) return;
    setDraft((d) => d.kpi_id === autoKpiId ? d : {...d,kpi_id:autoKpiId});
  }, [opened, autoKpiId]);
  function closeDetails() {
    if (busy) return;
    if (
      reportDirty &&
      !window.confirm("Kết quả chưa lưu. Bạn muốn đóng và bỏ thay đổi?")
    )
      return;
    setReportDirty(false);
    setOpened(null);
  }
  function switchDetailTab(tab: "details" | "result") {
    if (tab === detailTab) return;
    if (
      reportDirty &&
      tab !== detailTab &&
      !window.confirm("Kết quả chưa lưu. Bạn muốn chuyển mục và bỏ thay đổi?")
    )
      return;
    setReportDirty(false);
    setDetailTab(tab);
  }
  async function quickStatus(task:Task,status:TaskStatus){
    if(full){await save({id:task.id,status},"PATCH");return;}
    if(task.assignee_id!==member.id)return;
    setTasks(current=>current.map(t=>t.id===task.id?{...t,status}:t));
    setBusy(true);setError("");
    try{
      const r=await fetch('/api/tasks/report',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:task.id,version:task.report_version,status,result_text:task.result_text,evidence_links:task.evidence_links,completed_items:task.checklist.filter(c=>c.done).map(c=>c.id)})}),d=await r.json();
      if(!r.ok)throw Error(d.error);await load(true);setNotice("Đã cập nhật tiến độ công việc.");
    }catch(e){setTasks(current=>current.map(t=>t.id===task.id?task:t));setError(e instanceof Error?e.message:"Chưa cập nhật được tiến độ. Hãy tải lại danh sách.");}
    finally{setBusy(false);}
  }
  async function remove(task: Task) {
    if (
      !window.confirm(
        `Xóa công việc “${task.title}”? Sản lượng của việc này sẽ bị loại khỏi KPI. Thao tác không thể khôi phục.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/tasks?id=${task.id}`, { method: "DELETE" }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setOpened(null);
      await load();
      setNotice("Đã xóa công việc.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa xóa được công việc.");
    } finally {
      setBusy(false);
    }
  }
  function addChecklist() {
    if (!newItem.trim() || draft.checklist.length >= 30) return;
    setDraft({
      ...draft,
      checklist: [
        ...draft.checklist,
        { id: crypto.randomUUID(), title: newItem.trim(), done: false },
      ],
    });
    setNewItem("");
  }
  const filtered = tasks.filter(
    (t) =>
      (kpiFilter === "all" ||
        (kpiFilter === "none" ? !t.kpi_id : t.kpi_id === kpiFilter)) &&
      (channelFilter === "all" ||
        (channelFilter === "none"
          ? !(t.channel_ids?.length || t.channel_id)
          : (t.channel_ids || [t.channel_id]).includes(channelFilter))) &&
      `${t.title} ${t.description} ${t.assignee_name}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")) &&
      (statusFilter === "all" || t.status === statusFilter) &&
      (assigneeFilter === "all" || t.assignee_id === assigneeFilter) &&
      (dueFilter === "all" || (dueFilter === "overdue" ? isOverdue(t) : taskDeadlineGroup(t) === dueFilter)),
  ).sort(compareTaskDeadline);
  const orderedTasks=view==='table'?[...filtered].sort((a,b)=>compareTaskView(a,b,sort)):filtered;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    currentPage = Math.min(page, totalPages),
    visible = orderedTasks.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );
  const assignees = [
    ...new Map(tasks.map((t) => [t.assignee_id, t.assignee_name])).entries(),
  ];
  const stats = [
    {
      label: "Tất cả công việc",
      value: tasks.length,
      icon: ClipboardList,
      tone: "neutral",
    },
    {
      label: "Đang thực hiện",
      value: tasks.filter((t) => t.status === "in_progress").length,
      icon: ListTodo,
      tone: "brand",
    },
    {
      label: "Đã hoàn thành",
      value: tasks.filter((t) => t.status === "completed").length,
      icon: CheckCheck,
      tone: "green",
    },
    {
      label: "Đã quá hạn",
      value: tasks.filter(isOverdue).length,
      icon: CalendarDays,
      tone: "amber",
    },
  ];
  function changeFilter(set: (v: string) => void, value: string) {
    set(value);
    setPage(1);
  }
  function resetFilters() {
    setSearch("");
    setKpiFilter("all");
    setChannelFilter("all");
    setStatusFilter("all");
    setAssigneeFilter("all");
    setDueFilter("all");
    setPage(1);
  }
  function card(task: Task) {
    const done = task.checklist.filter((item) => item.done).length;
    const taskChannels = task.channels?.length
      ? task.channels
      : channels.filter(
          (item) =>
            task.channel_ids?.includes(item.id) || item.id === task.channel_id,
        );
    return (
      <article
        key={task.id}
        className={`kanban-card ${full && !selecting ? "can-drag" : ""} ${selected.includes(task.id)?"is-selected":""}`}
        draggable={full && !busy && !selecting}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", task.id);
          setDragged(task.id);
        }}
        onDragEnd={() => setDragged(null)}
      >
        <div className="kanban-card-top">
          {full && selecting ? selectBox(task) : <span className="task-output-label">{OUTPUT_TYPES[task.output_type].label} · {task.planned_quantity} {OUTPUT_TYPES[task.output_type].unit}</span>}
          {full && !selecting && <button type="button" className="icon-button danger" disabled={busy} aria-label={`Xóa công việc ${task.title}`} title="Xóa công việc" onClick={()=>void remove(task)}><Trash2 size={16}/></button>}
          {full && !selecting && (
            <GripVertical size={16} className="drag-grip" aria-hidden="true" />
          )}
        </div>
        <button className="task-card-title" onClick={() => open(task)}>
          {task.title}
        </button>
        {taskChannels.length ? (
          <div className="task-channel-stack">
            {taskChannels.map((channel) => (
              <ChannelIdentity key={channel.id} channel={channel} compact />
            ))}
          </div>
        ) : task.channel_name ? (
          <p className="task-channel-label">{task.channel_name}</p>
        ) : null}
        {task.description && (
          <p className="task-card-description">{task.description}</p>
        )}
        {task.checklist.length > 0 && (
          <div className="checklist-progress">
            <span>
              <ListChecks size={14} />
              {done}/{task.checklist.length} mục
            </span>
            <progress
              max={task.checklist.length}
              value={done}
              aria-label={`Checklist ${task.title}`}
            />
          </div>
        )}
        <div className="kanban-card-bottom">
          <div className="task-due">
            <CalendarDays size={14} />
            <span className={isOverdue(task) ? "overdue" : ""}>
              {formatDate(task.due_at, "Chưa đặt hạn")}
            </span>
          </div>
          <span title={task.assignee_name}>
            <Avatar name={task.assignee_name} size="small" />
          </span>
        </div>
        <div className="task-card-actions"><span className="task-assignee-caption">{task.assignee_name}</span><button type="button" className="task-result-link" onClick={()=>{open(task);setDetailTab("result");}}><MessageSquareText size={14}/>{full||task.assignee_id===member.id?"Trả kết quả":"Xem kết quả"}</button></div>
      </article>
    );
  }
  const collectionProps={tasks:visible,full,memberId:member.id,busy,selecting,selected,onSelect:toggleSelected,onOpen:(task:Task)=>open(task),onResult:(task:Task)=>{open(task);setDetailTab("result");},onDelete:(task:Task)=>void remove(task)};
  return (
    <DashboardShell
      title="Công việc"
      description={`Phạm vi xem: ${TASK_SCOPE_LABELS[ROLE_POLICIES[member.role].taskScope]}.`}
      actions={
        <div className="task-page-actions">
          <Link className="secondary-button" href="/admin/kpis">
            Theo dõi KPI
          </Link>
          {full && (
            <a className="secondary-button" href="/api/tasks/import">
              <Download size={16} />
              Tải file mẫu
            </a>
          )}
          {full && (
            <>
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => setImportOpen(true)}
              >
                <Upload size={16} />
                Import kế hoạch
              </button>
            </>
          )}
          <button className="primary-button" onClick={() => open("new")}>
            <Plus size={17} />
            Tạo công việc
          </button>
        </div>
      }
    >
      <div className="task-workspace-summary" role="group" aria-label="Tổng hợp công việc">
        {stats.map((stat) => (
          <span key={stat.label} className={`task-workspace-stat ${stat.tone}`}><stat.icon size={16}/><span>{stat.label}</span><strong>{loading?'—':stat.value}</strong></span>
        ))}
      </div>
      {error && <Notice>{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      <Panel
        className="tasks-panel work-collection"
        title="Danh sách công việc"
        description={loading?"Đang tải công việc…":`${filtered.length} công việc${filtered.length!==tasks.length?` / ${tasks.length} trong phạm vi của bạn`:" trong phạm vi của bạn"}`}
        action={<div className="task-panel-actions">{full&&<button className="secondary-button" disabled={busy||loading} aria-pressed={selecting} onClick={()=>{setSelecting(!selecting);setSelected([]);}}> {selecting?"Hủy chọn":"Chọn nhiều"}</button>}
          <button
            className="secondary-button"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button></div>
        }
      >
        <div className="work-toolbar">        <div className="task-viewbar">
          <div
            className="segmented-control"
            role="group"
            aria-label="Chế độ xem công việc"
          >
            {[
              { id: "list", label: "List", icon: List },
              { id: "table", label: "Table", icon: Table2 },
              { id: "board", label: "Kanban", icon: LayoutGrid },
              { id: "todo", label: "To-do", icon: ListChecks },
            ].map((v) => (
              <button
                key={v.id}
                aria-pressed={view === v.id}
                className={view === v.id ? "active" : ""}
                onClick={() =>
                  (() => {
                    const next = new URLSearchParams(params.toString());
                    next.set("view", v.id);
                    router.replace(`/admin/tasks?${next.toString()}`, {
                      scroll: false,
                    });
                  })()
                }
              >
                <v.icon size={16} />
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="work-search-controls">          <label className="table-search">
            <Search size={17} />
            <input
              aria-label="Tìm công việc"
              placeholder="Tìm công việc, mô tả, người thực hiện…"
              value={search}
              onChange={(e) => changeFilter(setSearch, e.target.value)}
            />
          </label><button type="button" className="secondary-button" aria-expanded={expandedFilters} aria-controls="task-advanced-filters" onClick={()=>setExpandedFilters(!expandedFilters)}><ListFilter size={16}/>Bộ lọc{[kpiFilter,channelFilter,statusFilter,assigneeFilter].filter(v=>v!=="all").length>0&&` (${[kpiFilter,channelFilter,statusFilter,assigneeFilter].filter(v=>v!=="all").length})`}<ChevronDown size={15}/></button></div>
</div>
        <div className="task-quick-filters" role="group" aria-label="Lọc nhanh công việc">
          <button className={assigneeFilter===member.id?"active":""} aria-pressed={assigneeFilter===member.id} onClick={()=>changeFilter(setAssigneeFilter,assigneeFilter===member.id?"all":member.id)}>Việc của tôi</button>
          {[['all','Mọi thời hạn'],['overdue','Quá hạn'],['today','Hôm nay'],['week','7 ngày tới']].map(([id,label])=><button key={id} className={dueFilter===id?"active":""} aria-pressed={dueFilter===id} onClick={()=>changeFilter(setDueFilter,id)}>{label}{id==='overdue'&&` · ${tasks.filter(isOverdue).length}`}</button>)}
        </div>
        {(search||kpiFilter!=="all"||channelFilter!=="all"||statusFilter!=="all"||assigneeFilter!=="all"||dueFilter!=="all")&&<div className="work-filter-summary"><span>Đang lọc {filtered.length} công việc</span><button type="button" onClick={resetFilters}>Bỏ lọc</button></div>}
        {expandedFilters&&<div className="advanced-toolbar" id="task-advanced-filters">
          <select
            aria-label="Lọc KPI công việc"
            value={kpiFilter}
            onChange={(e) => changeFilter(setKpiFilter, e.target.value)}
          >
            <option value="all">Mọi chỉ tiêu</option>
            <option value="none">Ngoài KPI</option>
            {kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {OUTPUT_TYPES[k.output_type].label} · {k.channel_name} ·{" "}
                {monthLabel(k.month)} · {k.assignee_name}
              </option>
            ))}
          </select>
          <ChannelSelect
            ariaLabel="Lọc kênh công việc"
            value={channelFilter}
            channels={channels}
            onChange={(value) => changeFilter(setChannelFilter, value)}
            specialOptions={[
              { value: "all", label: "Mọi kênh" },
              { value: "none", label: "Chưa gắn kênh" },
            ]}
          />

          <select
            aria-label="Lọc trạng thái"
            value={statusFilter}
            onChange={(e) => changeFilter(setStatusFilter, e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(TASK_STATUSES).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc người thực hiện"
            value={assigneeFilter}
            onChange={(e) => changeFilter(setAssigneeFilter, e.target.value)}
          >
            <option value="all">Mọi người thực hiện</option>
            {assignees.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

        </div>}
        {selecting&&full&&<div className="task-selection-bar">
          <label><input type="checkbox" aria-label={paginatedView?"Chọn tất cả trên trang":"Chọn các công việc đang hiển thị"} checked={(paginatedView?visible:filtered).slice(0,100).length>0&&(paginatedView?visible:filtered).slice(0,100).every(t=>selected.includes(t.id))} disabled={busy||loading||!filtered.length} onChange={e=>{const ids=(paginatedView?visible:filtered).slice(0,100).map(t=>t.id);setSelected(current=>e.target.checked?[...new Set([...current,...ids])].slice(0,100):current.filter(id=>!ids.includes(id)));}}/>{paginatedView?"Chọn trang này":"Chọn tối đa 100 việc"}</label>
          <span aria-live="polite">Đã chọn <strong>{selected.length}</strong> công việc</span>
          <button className="secondary-button" disabled={!selected.length||busy} onClick={()=>setSelected([])}>Bỏ chọn</button>
          <button className="primary-button danger-action" disabled={!selected.length||busy} onClick={()=>setDeleteOpen(true)}><Trash2 size={16}/>Xóa đã chọn ({selected.length})</button>
        </div>}
        {loading ? (
          <LoadingState label="Đang tải công việc…" />
        ) : !filtered.length ? (
          <EmptyState
            title={
              tasks.length
                ? "Không có công việc phù hợp"
                : "Chưa có công việc nào"
            }
            description={
              tasks.length
                ? "Thử tìm kiếm khác hoặc xóa bộ lọc để xem lại danh sách."
                : full
                  ? "Bắt đầu bằng một công việc, người thực hiện và hạn hoàn thành."
                  : "Công việc được giao cho bạn sẽ xuất hiện tại đây."
            }
            action={
              tasks.length ? (
                <button className="secondary-button" onClick={resetFilters}>
                  Xóa bộ lọc
                </button>
              ) : (
                <button className="primary-button" onClick={() => open("new")}>
                  <Plus size={16} />
                  Tạo công việc đầu tiên
                </button>
              )
            }
          />
        ) : view === "board" ? (
          <div className="kanban-board">
            {Object.entries(TASK_STATUSES).map(([status, label]) => {
              const items = filtered.filter((t) => t.status === status);
              return (
                <section
                  key={status}
                  className={`kanban-column ${status} ${dragged ? "drop-enabled" : ""}`}
                  aria-label={label}
                  onDragOver={(e) => {
                    if (full && dragged) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    if (
                      full &&
                      id === dragged &&
                      tasks.some((t) => t.id === id && t.status !== status)
                    )
                      void save({ id, status }, "PATCH");
                    setDragged(null);
                  }}
                >
                  <header>
                    <h3>
                      <span />
                      {label}
                    </h3>
                    <span className="count-badge">{items.length}</span>
                    {full && (
                      <button
                        className="icon-button"
                        aria-label={`Thêm việc ${label}`}
                        onClick={() => open("new", status as TaskStatus)}
                      >
                        <Plus size={15} />
                      </button>
                    )}
                  </header>
                  <div className="kanban-cards">
                    {items.map((t) => card(t))}
                    {!items.length && (
                      <p className="kanban-empty">Chưa có công việc</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : view === "todo" ? (
          <div className="todo-groups">
            {[['overdue','Quá hạn'],['today','Đến hạn hôm nay'],['week','7 ngày tới'],['later','Sắp tới'],['undated','Chưa đặt hạn'],['completed','Đã hoàn thành']].map(([status, label]) => {
              const items = filtered.filter((t) => taskDeadlineGroup(t) === status);
              if (!items.length) return null;
              return (
                <details key={status} className="work-todo-group" open>
                  <summary><span>{label}</span><span className="count-badge">{items.length}</span><ChevronDown size={15}/></summary>
                  {items.map((t) => (
                    <div
                      className={`todo-row ${t.status === "completed" ? "done" : ""}`}
                      key={t.id}
                    >
                      {full&&selecting?selectBox(t):<input
                        type="checkbox"
                        aria-label={`Hoàn thành ${t.title}`}
                        checked={t.status === "completed"}
                        disabled={(!full && t.assignee_id!==member.id) || busy}
                        onChange={(e) =>
                          void quickStatus(t,e.target.checked?"completed":"pending")
                        }
                      />}
                      <button className="todo-title" onClick={() => open(t)}>
                        {t.title}
                        <small>{t.assignee_name} · {OUTPUT_TYPES[t.output_type].label} · {t.channel_name||"Chưa gắn kênh"}</small>
                      </button>
                      <span
                        className={`todo-date ${isOverdue(t) ? "overdue" : ""}`}
                      >
                        {formatDate(t.due_at, "Chưa đặt hạn")}
                      </span>
                      <StatusBadge status={t.status}/>
                      <button type="button" className="task-result-link" aria-label={`Kết quả ${t.title}`} onClick={()=>{open(t);setDetailTab("result");}}><MessageSquareText size={16}/><span>Kết quả</span></button>
                      {full && !selecting && <button type="button" className="icon-button danger" disabled={busy} aria-label={`Xóa công việc ${t.title}`} title="Xóa công việc" onClick={()=>void remove(t)}><Trash2 size={16}/></button>}
                    </div>
                  ))}
                </details>
              );
            })}
          </div>
        ) : (
          <>
            {view==='list'?<TaskListView {...collectionProps}/>:<TaskTableView {...collectionProps} sort={sort} onSort={field=>{setSort(current=>({field,direction:current.field===field&&current.direction==='asc'?'desc':'asc'}));setPage(1);}}/>}
            <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onChange={setPage}/>
          </>
        )}
      </Panel>
      {deleteOpen&&<Drawer title={`Xóa ${selected.length} công việc?`} description="Kiểm tra danh sách trước khi xác nhận." onClose={()=>{if(!busy)setDeleteOpen(false);}}>
        <div className="bulk-delete-confirm"><Notice>Các công việc sẽ bị xóa khỏi danh sách. Sản lượng liên quan sẽ bị loại khỏi KPI và hiệu suất. Thao tác không thể hoàn tác từ giao diện.</Notice>
        <ul>{tasks.filter(t=>selected.includes(t.id)).map(t=><li key={t.id}><strong>{t.title}</strong><span>{t.assignee_name} · {formatDate(t.due_at)} · {TASK_STATUSES[t.status]}</span></li>)}</ul>
        <div className="task-confirm-actions"><button className="secondary-button" disabled={busy} onClick={()=>setDeleteOpen(false)}>Giữ lại công việc</button><button className="primary-button danger-action" disabled={busy} onClick={()=>void bulkDelete()}><Trash2 size={16}/>{busy?"Đang xóa…":`Xác nhận xóa ${selected.length} công việc`}</button></div></div>
      </Drawer>}
      {importOpen && (
        <TaskImport
          onClose={() => setImportOpen(false)}
          onDone={(count) => {
            setImportOpen(false);
            void load();
            setNotice(
              `Đã nhập ${count} công việc. KPI liên quan được giữ liên kết.`,
            );
          }}
        />
      )}
      {opened && (
        <Drawer
          title={
            opened === "new"
              ? "Tạo công việc"
              : full
                ? "Chi tiết & chỉnh sửa"
                : "Chi tiết công việc"
          }
          description={
            opened === "new"
              ? "Giao việc rõ ràng, theo dõi tiến độ cùng đội ngũ."
              : `Người thực hiện: ${opened.assignee_name}`
          }
          onClose={closeDetails}
        >
          {error && (
            <div className="drawer-notice">
              <Notice>{error}</Notice>
            </div>
          )}
          {opened!=="new"&&<div className="task-detail-summary"><h3>{opened.title}</h3><div><StatusBadge status={opened.status}/><span className={isOverdue(opened)?"overdue":""}><CalendarDays size={14}/>{formatDate(opened.due_at)}</span><span>{opened.assignee_name}</span></div><p>{OUTPUT_TYPES[opened.output_type].label} · Dự kiến {opened.planned_quantity} {OUTPUT_TYPES[opened.output_type].unit} · {opened.kpi_id?"Đã liên kết KPI":"Ngoài KPI"}</p></div>}
          {opened !== "new" && (
            <div
              className="task-detail-tabs"
              role="group"
              aria-label="Nội dung công việc"
            >
              <button
                type="button"
                disabled={busy}
                aria-pressed={detailTab === "details"}
                onClick={() => switchDetailTab("details")}
              >
                Thông tin giao việc
              </button>
              <button
                type="button"
                disabled={busy}
                aria-pressed={detailTab === "result"}
                onClick={() => switchDetailTab("result")}
              >
                Kết quả & tiến độ
              </button>
            </div>
          )}
          {opened !== "new" && detailTab === "result" ? (
            <TaskResult
              key={opened.id}
              task={opened}
              canReport={
                full ||
                (opened.assignee_id === member.id &&
                  ROLE_POLICIES[member.role].taskScope !== "none")
              }
              channels={channels}
              kpis={kpis}
              onDirty={setReportDirty}
              onBusy={setBusy}
              onSaved={(updated) => {
                void fetch("/api/kpis?month=all", { cache: "no-store" })
                  .then((r) => (r.ok ? r.json() : null))
                  .then((d) => {
                    if (d) setKpis(d.kpis);
                  })
                  .catch(() => {});
                setOpened(updated);
                setTasks((current) =>
                  current.map((t) => (t.id === updated.id ? updated : t)),
                );
                setDraft((current) => ({
                  ...current,
                  kpi_id: updated.kpi_id ?? "",
                  output_type: updated.output_type,
                  planned_quantity: updated.planned_quantity,
                  channel_ids: updated.channel_ids?.length
                    ? updated.channel_ids
                    : updated.channel_id
                      ? [updated.channel_id]
                      : [],
                  status: updated.status,
                  checklist: updated.checklist,
                }));
              }}
            />
          ) : full || opened === "new" ? (
            <form
              className="account-form task-editor"
              onSubmit={(e) => {
                e.preventDefault();
                void save(
                  {
                    ...draft,
                    id: opened === "new" ? undefined : opened.id,
                    kpi_id: draft.kpi_id || null,
                    channel_ids: draft.channel_ids,
                    due_at: draft.due_at
                      ? new Date(`${draft.due_at}T17:00:00+07:00`).toISOString()
                      : null,
                  },
                  opened === "new" ? "POST" : "PATCH",
                  true,
                );
              }}
            >
              <label>
                Tên công việc
                <input
                  required
                  maxLength={200}
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="Nhập tên công việc"
                />
              </label>
              <label>
                Mô tả chung (nếu cần)
                <textarea
                  rows={4}
                  maxLength={10000}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  placeholder="Bối cảnh hoặc mục tiêu chung của công việc…"
                />
              </label>
              <section className="task-kpi-fields">
                <h3>Liên kết KPI & khối lượng</h3>
                <p className="result-hint" role="status">
                  {!draft.due_at ? "Chọn hạn hoàn thành để hệ thống xác định tháng KPI."
                    : matchedKpi ? `Đã tự gắn KPI ${monthLabel(matchedKpi.month)} · ${matchedKpi.channel_name}.`
                    : `Chưa có KPI đang hoạt động khớp nhân sự, kênh chính và loại sản phẩm trong ${monthLabel(kpiMonth!)}. Công việc hiện nằm ngoài KPI.`}
                </p>
                <label>Chỉ tiêu liên quan
                  <input aria-label="KPI liên quan" readOnly value={matchedKpi ? `${OUTPUT_TYPES[matchedKpi.output_type].label} · ${matchedKpi.channel_name} · ${monthLabel(matchedKpi.month)}` : "Không gắn KPI · công việc ngoài chỉ tiêu"} />
                </label>
                <div className="field-pair">
                  <label>
                    Loại sản phẩm
                    <select
                      aria-label="Loại sản phẩm công việc"
                      value={draft.output_type}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          output_type: e.target.value as OutputType,
                        })
                      }
                    >
                      {SELECTABLE_OUTPUT_TYPES.map(([id, v]) => (
                        <option key={id} value={id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Khối lượng dự kiến
                    <input
                      aria-label="Khối lượng dự kiến"
                      required
                      type="number"
                      min={1}
                      max={100000}
                      step={1}
                      value={draft.planned_quantity}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          planned_quantity: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <p className="result-hint">
                  Khối lượng dự kiến chưa được tính vào KPI. Sản lượng thực tế
                  được nhập khi báo cáo kết quả.
                </p>
              </section>
              <label>
                Kênh thực hiện
                <ChannelMultiSelect
                  ariaLabel="Kênh thực hiện"
                  values={draft.channel_ids}
                  channels={channels.filter(
                    (c) => c.active || draft.channel_ids.includes(c.id),
                  )}
                  onChange={(values) =>
                    setDraft({
                      ...draft,
                      kpi_id:
                        draft.kpi_id &&
                        !values.includes(
                          kpis.find((k) => k.id === draft.kpi_id)?.channel_id ||
                            "",
                        )
                          ? ""
                          : draft.kpi_id,
                      channel_ids: values,
                    })
                  }
                />
              </label>
              <TaskBriefFields
                brief={draft.brief}
                outputType={draft.output_type}
                selectedChannels={channels.filter((channel) =>
                  draft.channel_ids.includes(channel.id),
                )}
                onChange={(brief) => setDraft({ ...draft, brief })}
              />
              <label>
                Người thực hiện
                <select
                  required
                  aria-label="Người thực hiện"
                  value={draft.assignee_id}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      kpi_id: "",
                      assignee_id: e.target.value,
                    })
                  }
                >
                  {opened !== "new" &&
                    !members.some((m) => m.id === opened.assignee_id) && (
                      <option value={opened.assignee_id}>
                        {opened.assignee_name} (đã khóa)
                      </option>
                    )}
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {ROLE_POLICIES[m.role].label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-pair">
                <label>
                  Trạng thái
                  <select
                    aria-label="Trạng thái công việc"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        status: e.target.value as TaskStatus,
                      })
                    }
                  >
                    {Object.entries(TASK_STATUSES).map(([k, v]) => (
                      <option value={k} key={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Hạn hoàn thành
                <input
                  type="date"
                  value={draft.due_at}
                  onChange={(e) =>
                    setDraft({ ...draft, due_at: e.target.value })
                  }
                />
              </label>
              <section className="task-checklist">
                <h3>
                  <ListChecks size={17} />
                  Checklist
                  <span>
                    {draft.checklist.filter((c) => c.done).length}/
                    {draft.checklist.length}
                  </span>
                </h3>
                {draft.checklist.map((item) => (
                  <div className="checklist-item" key={item.id}>
                    <input
                      type="checkbox"
                      aria-label={`Hoàn tất ${item.title}`}
                      checked={item.done}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          checklist: draft.checklist.map((c) =>
                            c.id === item.id
                              ? { ...c, done: e.target.checked }
                              : c,
                          ),
                        })
                      }
                    />
                    <span className={item.done ? "checked" : ""}>
                      {item.title}
                    </span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Xóa mục ${item.title}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          checklist: draft.checklist.filter(
                            (c) => c.id !== item.id,
                          ),
                        })
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="checklist-add">
                  <input
                    aria-label="Thêm mục checklist"
                    maxLength={200}
                    placeholder="Thêm một bước thực hiện…"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChecklist();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!newItem.trim() || draft.checklist.length >= 30}
                    onClick={addChecklist}
                  >
                    <Plus size={16} />
                    Thêm
                  </button>
                </div>
              </section>
              <footer className="task-editor-footer">
                {opened !== "new" && (
                  <button
                    className="icon-button danger"
                    type="button"
                    aria-label="Xóa công việc"
                    disabled={busy}
                    onClick={() => void remove(opened)}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => setOpened(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={busy || loading}
                >
                  <Check size={16} />
                  {busy
                    ? "Đang lưu…"
                    : opened === "new"
                      ? "Giao công việc"
                      : "Lưu thay đổi"}
                </button>
              </footer>
            </form>
          ) : (
            <div className="task-readonly">
              <div className="task-detail-badges">
                <StatusBadge status={opened.status} />
              </div>
              <h3>{opened.title}</h3>
              <p className="detail-description">
                {opened.description || "Chưa có mô tả."}
              </p>
              <h4>Yêu cầu công việc</h4>
              <TaskBriefSummary brief={opened.brief || {}} />
              <dl>
                <dt>Khối lượng</dt>
                <dd>
                  {opened.delivered_quantity}/{opened.planned_quantity}{" "}
                  {OUTPUT_TYPES[opened.output_type].unit} ·{" "}
                  {opened.kpi_id ? "Có gắn KPI" : "Ngoài KPI"}
                </dd>
                <dt>Kênh thực hiện</dt>
                <dd>
                  {opened.channels?.length ? (
                    <div className="task-channel-stack">
                      {opened.channels.map((channel) => (
                        <a
                          key={channel.id}
                          href={channel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ChannelIdentity channel={channel} compact />
                        </a>
                      ))}
                    </div>
                  ) : (
                    "Chưa gắn kênh"
                  )}
                </dd>
                <dt>Người thực hiện</dt>
                <dd>{opened.assignee_name}</dd>
                <dt>Hạn hoàn thành</dt>
                <dd>{formatDate(opened.due_at)}</dd>
                <dt>Ngày tạo</dt>
                <dd>{formatDate(opened.created_at)}</dd>
              </dl>
              <h4>Checklist</h4>
              {opened.checklist.length ? (
                opened.checklist.map((item) => (
                  <div className="checklist-item" key={item.id}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      disabled
                      aria-label={item.title}
                    />
                    <span>{item.title}</span>
                  </div>
                ))
              ) : (
                <p>Chưa có checklist.</p>
              )}
              <p className="readonly-note">
                <MessageSquareText size={16} />
                Bạn có thể báo cáo kết quả trong mục Kết quả & tiến độ nếu đây
                là công việc được giao cho mình.
              </p>
            </div>
          )}
        </Drawer>
      )}
    </DashboardShell>
  );
}
