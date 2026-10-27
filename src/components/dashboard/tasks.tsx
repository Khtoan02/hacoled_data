"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import {
  isFullAccess,
  ROLE_POLICIES,
  TASK_SCOPE_LABELS,
  type MemberRoleId,
} from "../../lib/security/rbac";
import type { Member } from "../../lib/auth/types";
interface Task {
  id: string;
  title: string;
  description: string;
  assignee_id: string;
  assignee_name: string;
  assignee_role: MemberRoleId;
  status: string;
  due_at: string | null;
}
const statuses = {
  pending: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
};
export function TasksPage() {
  const member = useMember(),
    full = isFullAccess(member.role);
  const [tasks, setTasks] = useState<Task[]>([]),
    [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [adding, setAdding] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee_id: member.id,
    due_at: "",
  });
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTasks(data.tasks);
      if (full) {
        const r = await fetch("/api/members", { cache: "no-store" }),
          d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setMembers(d.members.filter((m: Member) => m.active));
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không tải được công việc. Hãy thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, [full]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(body: object, method: "POST" | "PATCH") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/tasks", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (method === "POST") {
        setAdding(false);
        setForm({
          title: "",
          description: "",
          assignee_id: member.id,
          due_at: "",
        });
      }
      await load();
      setNotice(
        method === "POST"
          ? "Đã tạo và giao công việc."
          : "Đã cập nhật trạng thái.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Chưa lưu được. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  const filtered = tasks.filter((t) =>
    `${t.title} ${t.assignee_name}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <DashboardShell
      title="Công việc"
      description={`Phạm vi xem: ${TASK_SCOPE_LABELS[ROLE_POLICIES[member.role].taskScope]}.`}
      actions={
        full && (
          <button className="primary-button" onClick={() => setAdding(true)}>
            <Plus size={17} />
            Tạo công việc
          </button>
        )
      }
    >
      {error && (
        <p role="alert" className="form-message error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="form-message success">
          {notice}
        </p>
      )}
      {adding && full && (
        <section className="member-editor">
          <div className="section-heading">
            <h2>Tạo công việc</h2>
            <button
              className="icon-button"
              aria-label="Đóng biểu mẫu công việc"
              disabled={busy}
              onClick={() => setAdding(false)}
            >
              <X size={18} />
            </button>
          </div>
          <form
            className="account-form member-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save(
                {
                  ...form,
                  due_at: form.due_at
                    ? new Date(`${form.due_at}T17:00:00+07:00`).toISOString()
                    : null,
                },
                "POST",
              );
            }}
          >
            <label>
              Tên công việc
              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nhập tên công việc"
              />
            </label>
            <label>
              Người thực hiện
              <select
                aria-label="Người thực hiện"
                required
                value={form.assignee_id}
                onChange={(e) =>
                  setForm({ ...form, assignee_id: e.target.value })
                }
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {ROLE_POLICIES[m.role].label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mô tả
              <input
                maxLength={10000}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Nội dung cần thực hiện"
              />
            </label>
            <label>
              Hạn hoàn thành
              <input
                type="date"
                value={form.due_at}
                onChange={(e) => setForm({ ...form, due_at: e.target.value })}
              />
            </label>
            <div className="member-form-actions">
              <p>
                Công việc lưu trên database và chỉ hiển thị trong phạm vi quyền
                được cấp.
              </p>
              <button
                type="submit"
                className="primary-button"
                disabled={busy || loading}
              >
                {busy ? "Đang lưu…" : "Giao công việc"}
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="members-table-panel">
        <div className="section-heading">
          <div>
            <h2>
              Danh sách công việc{" "}
              <span className="count-badge">{tasks.length}</span>
            </h2>
            <p>Công việc hiển thị theo phạm vi quyền của bạn.</p>
          </div>
          <button
            className="secondary-button"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={17} />
            <input
              aria-label="Tìm công việc"
              placeholder="Tìm tên việc hoặc người thực hiện…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="members-table">
            <thead>
              <tr>
                <th>Công việc</th>
                <th>Người thực hiện</th>
                <th>Hạn hoàn thành</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    Đang tải công việc…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td
                      style={{
                        minWidth: 200,
                        maxWidth: 440,
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <strong>{t.title}</strong>
                      {t.description && (
                        <p className="text-xs text-zinc-500 mt-2">
                          {t.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <strong>{t.assignee_name}</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        {ROLE_POLICIES[t.assignee_role].label}
                      </p>
                    </td>
                    <td>
                      {t.due_at
                        ? new Date(t.due_at).toLocaleDateString("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                          })
                        : "Chưa đặt hạn"}
                    </td>
                    <td>
                      {full ? (
                        <select
                          aria-label={`Trạng thái ${t.title}`}
                          value={t.status}
                          disabled={busy}
                          onChange={(e) =>
                            void save(
                              { id: t.id, status: e.target.value },
                              "PATCH",
                            )
                          }
                        >
                          {Object.entries(statuses).map(([id, label]) => (
                            <option value={id} key={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        statuses[t.status as keyof typeof statuses]
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="table-empty">
                    {error
                      ? "Chưa tải được dữ liệu. Hãy làm mới để thử lại."
                      : "Chưa có công việc trong phạm vi của bạn."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
