"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  GripVertical,
  LayoutGrid,
  ListChecks,
  ListFilter,
  ListTodo,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { TaskResult } from "./task-report";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import {
  isFullAccess,
  ROLE_POLICIES,
  TASK_SCOPE_LABELS,
} from "../../lib/security/rbac";
import type { Member } from "../../lib/auth/types";
import {
  dateInputValue,
  formatDate,
  isOverdue,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type ChecklistItem,
} from "../../lib/tasks";
import {
  Avatar,
  Drawer,
  EmptyState,
  LoadingState,
  Notice,
  Pagination,
  Panel,
  PriorityBadge,
  StatusBadge,
} from "./ui";
const pageSize = 10;
type Draft = {
  title: string;
  description: string;
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
  const view = ["list", "board", "todo"].includes(params.get("view") || "")
    ? params.get("view")!
    : "list";
  const [tasks, setTasks] = useState<Task[]>([]),
    [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"),
    [assigneeFilter, setAssigneeFilter] = useState("all"),
    [priorityFilter, setPriorityFilter] = useState("all"),
    [dueFilter, setDueFilter] = useState("all"),
    [page, setPage] = useState(1);
  const [opened, setOpened] = useState<Task | "new" | null>(null),
    [dragged, setDragged] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    title: "",
    description: "",
    assignee_id: member.id,
    due_at: "",
    status: "pending",
    priority: "normal",
    checklist: [],
  });
  const [reportDirty, setReportDirty] = useState(false);
  const [detailTab, setDetailTab] = useState<"details" | "result">("details");
  const [newItem, setNewItem] = useState("");
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const r = await fetch("/api/tasks", { cache: "no-store" }),
          d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setTasks(d.tasks);
        if (full) {
          const m = await fetch("/api/members", { cache: "no-store" }),
            md = await m.json();
          if (!m.ok) throw new Error(md.error);
          setMembers(md.members.filter((person: Member) => person.active));
        }
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
            title: "",
            description: "",
            assignee_id: member.id,
            due_at: "",
            status,
            priority: "normal",
            checklist: [],
          }
        : {
            title: task.title,
            description: task.description,
            assignee_id: task.assignee_id,
            due_at: dateInputValue(task.due_at),
            status: task.status,
            priority: task.priority,
            checklist: task.checklist.map((item) => ({ ...item })),
          },
    );
  }
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
  async function remove(task: Task) {
    if (
      !window.confirm(
        `Xóa công việc “${task.title}”? Thao tác này không thể khôi phục.`,
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
      `${t.title} ${t.description} ${t.assignee_name}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")) &&
      (statusFilter === "all" || t.status === statusFilter) &&
      (priorityFilter === "all" || t.priority === priorityFilter) &&
      (assigneeFilter === "all" || t.assignee_id === assigneeFilter) &&
      (dueFilter === "all" || isOverdue(t)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    currentPage = Math.min(page, totalPages),
    visible = filtered.slice(
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
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setDueFilter("all");
    setPage(1);
  }
  function card(task: Task) {
    const done = task.checklist.filter((item) => item.done).length;
    return (
      <article
        key={task.id}
        className={`kanban-card ${full ? "can-drag" : ""}`}
        draggable={full && !busy}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", task.id);
          setDragged(task.id);
        }}
        onDragEnd={() => setDragged(null)}
      >
        <div className="kanban-card-top">
          <PriorityBadge priority={task.priority} />
          {full && (
            <GripVertical size={16} className="drag-grip" aria-hidden="true" />
          )}
        </div>
        <button className="task-card-title" onClick={() => open(task)}>
          {task.title}
        </button>
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
      </article>
    );
  }
  return (
    <DashboardShell
      title="Công việc"
      description={`Phạm vi xem: ${TASK_SCOPE_LABELS[ROLE_POLICIES[member.role].taskScope]}.`}
      actions={
        full && (
          <button className="primary-button" onClick={() => open("new")}>
            <Plus size={17} />
            Tạo công việc
          </button>
        )
      }
    >
      <div className="summary-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`summary-tile ${stat.tone}`}>
            <span className="summary-icon">
              <stat.icon size={22} strokeWidth={1.6} />
            </span>
            <div>
              <span>{stat.label}</span>
              <strong>{loading ? "—" : stat.value}</strong>
            </div>
          </div>
        ))}
      </div>
      {error && <Notice>{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      <Panel
        title="Danh sách công việc"
        description={`${filtered.length} công việc trong phạm vi quyền của bạn.`}
        action={
          <button
            className="secondary-button"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        }
      >
        <div className="task-viewbar">
          <div
            className="segmented-control"
            role="group"
            aria-label="Chế độ xem công việc"
          >
            {[
              { id: "list", label: "Bảng", icon: ClipboardList },
              { id: "board", label: "Kanban", icon: LayoutGrid },
              { id: "todo", label: "To-do", icon: ListChecks },
            ].map((v) => (
              <button
                key={v.id}
                aria-pressed={view === v.id}
                className={view === v.id ? "active" : ""}
                onClick={() =>
                  router.replace(`/admin/tasks?view=${v.id}`, { scroll: false })
                }
              >
                <v.icon size={16} />
                {v.label}
              </button>
            ))}
          </div>
          <span className="view-hint">
            {full && view === "board"
              ? "Kéo thả thẻ hoặc mở chi tiết để chuyển trạng thái."
              : full
                ? "Quản lý tiến độ và người thực hiện."
                : "Mở công việc để xem hoặc báo cáo kết quả."}
          </span>
        </div>
        <div className="advanced-toolbar">
          <label className="table-search">
            <Search size={17} />
            <input
              aria-label="Tìm công việc"
              placeholder="Tìm công việc, mô tả, người thực hiện…"
              value={search}
              onChange={(e) => changeFilter(setSearch, e.target.value)}
            />
          </label>
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
          <select
            aria-label="Lọc độ ưu tiên"
            value={priorityFilter}
            onChange={(e) => changeFilter(setPriorityFilter, e.target.value)}
          >
            <option value="all">Mọi độ ưu tiên</option>
            {Object.entries(TASK_PRIORITIES).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            className={`secondary-button filter-overdue ${dueFilter === "overdue" ? "selected" : ""}`}
            aria-pressed={dueFilter === "overdue"}
            onClick={() =>
              changeFilter(
                setDueFilter,
                dueFilter === "all" ? "overdue" : "all",
              )
            }
          >
            <ListFilter size={15} />
            Quá hạn
          </button>
        </div>
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
              ) : full ? (
                <button className="primary-button" onClick={() => open("new")}>
                  <Plus size={16} />
                  Tạo công việc đầu tiên
                </button>
              ) : undefined
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
            {Object.entries(TASK_STATUSES).map(([status, label]) => {
              const items = filtered.filter((t) => t.status === status);
              if (!items.length) return null;
              return (
                <section key={status}>
                  <h3>
                    {label}
                    <span className="count-badge">{items.length}</span>
                  </h3>
                  {items.map((t) => (
                    <div
                      className={`todo-row ${t.status === "completed" ? "done" : ""}`}
                      key={t.id}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Hoàn thành ${t.title}`}
                        checked={t.status === "completed"}
                        disabled={!full || busy}
                        onChange={(e) =>
                          void save(
                            {
                              id: t.id,
                              status: e.target.checked
                                ? "completed"
                                : "pending",
                            },
                            "PATCH",
                          )
                        }
                      />
                      <button className="todo-title" onClick={() => open(t)}>
                        {t.title}
                        <small>{t.assignee_name}</small>
                      </button>
                      <PriorityBadge priority={t.priority} />
                      <span
                        className={`todo-date ${isOverdue(t) ? "overdue" : ""}`}
                      >
                        {formatDate(t.due_at, "Chưa đặt hạn")}
                      </span>
                      <Avatar name={t.assignee_name} size="small" />
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="members-table task-table">
                <thead>
                  <tr>
                    <th>Công việc</th>
                    <th>Người thực hiện</th>
                    <th>Độ ưu tiên</th>
                    <th>Hạn hoàn thành</th>
                    <th>Trạng thái</th>
                    <th aria-label="Chi tiết" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <button
                          className="table-task-title"
                          onClick={() => open(t)}
                        >
                          {t.title}
                        </button>
                        <button
                          type="button"
                          className="task-result-link"
                          onClick={() => {
                            open(t);
                            setDetailTab("result");
                          }}
                        >
                          <MessageSquareText size={13} />
                          {t.result_text || t.evidence_links.length
                            ? "Xem kết quả"
                            : "Kết quả & tiến độ"}
                        </button>
                        {t.checklist.length > 0 && (
                          <small className="table-task-checklist">
                            <ListChecks size={13} />
                            {t.checklist.filter((c) => c.done).length}/
                            {t.checklist.length} mục
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="member-identity">
                          <Avatar name={t.assignee_name} size="small" />
                          <span>
                            <strong>{t.assignee_name}</strong>
                            <small>
                              {ROLE_POLICIES[t.assignee_role].label}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className={isOverdue(t) ? "overdue" : ""}>
                        {formatDate(t.due_at)}
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Mở chi tiết ${t.title}`}
                          onClick={() => open(t)}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              total={filtered.length}
              pageSize={pageSize}
              onChange={setPage}
            />
          </>
        )}
      </Panel>
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
              onDirty={setReportDirty}
              onBusy={setBusy}
              onSaved={(updated) => {
                setOpened(updated);
                setTasks((current) =>
                  current.map((t) => (t.id === updated.id ? updated : t)),
                );
                setDraft((current) => ({
                  ...current,
                  status: updated.status,
                  checklist: updated.checklist,
                }));
              }}
            />
          ) : full ? (
            <form
              className="account-form task-editor"
              onSubmit={(e) => {
                e.preventDefault();
                void save(
                  {
                    ...draft,
                    id: opened === "new" ? undefined : opened.id,
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
                Mô tả
                <textarea
                  rows={4}
                  maxLength={10000}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  placeholder="Mục tiêu, yêu cầu và kết quả cần bàn giao…"
                />
              </label>
              <label>
                Người thực hiện
                <select
                  required
                  aria-label="Người thực hiện"
                  value={draft.assignee_id}
                  onChange={(e) =>
                    setDraft({ ...draft, assignee_id: e.target.value })
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
                <label>
                  Độ ưu tiên
                  <select
                    aria-label="Độ ưu tiên công việc"
                    value={draft.priority}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                  >
                    {Object.entries(TASK_PRIORITIES).map(([k, v]) => (
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
            opened !== "new" && (
              <div className="task-readonly">
                <div className="task-detail-badges">
                  <StatusBadge status={opened.status} />
                  <PriorityBadge priority={opened.priority} />
                </div>
                <h3>{opened.title}</h3>
                <p className="detail-description">
                  {opened.description || "Chưa có mô tả."}
                </p>
                <dl>
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
            )
          )}
        </Drawer>
      )}
    </DashboardShell>
  );
}
