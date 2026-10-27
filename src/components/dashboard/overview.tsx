"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock3,
  RefreshCw,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useMember } from "./session";
import {
  Avatar,
  EmptyState,
  LoadingState,
  Notice,
  Panel,
  PriorityBadge,
  StatusBadge,
} from "./ui";
import { formatDate, isOverdue, type Task } from "../../lib/tasks";
import type { Member } from "../../lib/auth/types";
const TaskCharts = dynamic(() => import("./charts").then((m) => m.TaskCharts), {
  ssr: false,
  loading: () => (
    <div className="chart-loading">
      <LoadingState label="Đang tải biểu đồ…" />
    </div>
  ),
});
export function OperationalOverview() {
  const member = useMember();
  const [tasks, setTasks] = useState<Task[]>([]),
    [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [months, setMonths] = useState(6);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/members", { cache: "no-store" }),
      ]);
      const data = await Promise.all(results.map((r) => r.json()));
      if (results.some((r) => !r.ok))
        throw new Error(
          data.find((_, i) => !results[i].ok)?.error ||
            "Không tải được dữ liệu tổng quan.",
        );
      setTasks(data[0].tasks);
      setMembers(data[1].members);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const completed = tasks.filter((t) => t.status === "completed").length,
    overdue = tasks.filter(isOverdue).length;
  const summary = [
    {
      label: "Tổng công việc",
      value: tasks.length,
      icon: ClipboardList,
      tone: "neutral",
      detail: `${tasks.filter((t) => t.status === "in_progress").length} việc đang thực hiện`,
    },
    {
      label: "Đã hoàn thành",
      value: completed,
      icon: CheckCheck,
      tone: "green",
      detail: tasks.length
        ? `${Math.round((completed / tasks.length) * 100)}% tổng công việc`
        : "Chưa có công việc",
    },
    {
      label: "Cần chú ý",
      value: overdue,
      icon: Clock3,
      tone: "amber",
      detail: "Công việc đã quá hạn",
    },
    {
      label: "Đội ngũ hoạt động",
      value: members.filter((m) => m.active).length,
      icon: Users,
      tone: "brand",
      detail: `${members.length} tài khoản trong hệ thống`,
    },
  ];
  const workload = members
    .filter((m) => m.active)
    .map((m) => ({
      ...m,
      total: tasks.filter((t) => t.assignee_id === m.id).length,
      done: tasks.filter(
        (t) => t.assignee_id === m.id && t.status === "completed",
      ).length,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  return (
    <div className="operational-overview">
      <section className="overview-greeting">
        <div>
          <h2>
            Chào {member.name.split(" ").slice(-1)[0]}, một ngày làm việc hiệu
            quả.
          </h2>
          <p>Theo dõi công việc và kết nối đội ngũ HacoLED.</p>
        </div>
        <div className="overview-date">
          <CalendarDays size={16} />
          {new Date().toLocaleDateString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
        <div className="dongson-pattern" aria-hidden="true" />
      </section>
      {error && (
        <Notice>
          {error}{" "}
          <button className="text-link" onClick={load}>
            Thử lại
          </button>
        </Notice>
      )}
      <div className="summary-grid overview-summary">
        {summary.map((s) => (
          <div key={s.label} className={`summary-tile ${s.tone}`}>
            <div className="summary-top">
              <span className="summary-icon">
                <s.icon size={21} strokeWidth={1.6} />
              </span>
            </div>
            <span>{s.label}</span>
            <strong>{loading || error ? "—" : s.value}</strong>
            <small>{s.detail}</small>
          </div>
        ))}
      </div>
      <div className="overview-section-title">
        <h2>Hiệu quả vận hành</h2>
        <div>
          <select
            aria-label="Khoảng thời gian biểu đồ"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            <option value={3}>3 tháng gần nhất</option>
            <option value={6}>6 tháng gần nhất</option>
            <option value={12}>12 tháng gần nhất</option>
          </select>
          <button
            className="icon-button"
            aria-label="Làm mới tổng quan"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      {loading ? (
        <LoadingState label="Đang tải tổng quan…" />
      ) : (
        !error && (
          <>
            <TaskCharts tasks={tasks} months={months} />
            <div className="overview-bottom">
              <Panel
                title="Công việc gần đây"
                description="Những công việc mới nhất của đội ngũ."
                action={
                  <Link className="text-link" href="/admin/tasks">
                    Xem tất cả <ArrowRight size={14} />
                  </Link>
                }
              >
                {tasks.length ? (
                  <div className="table-scroll">
                    <table className="members-table recent-task-table">
                      <thead>
                        <tr>
                          <th>Công việc</th>
                          <th>Người thực hiện</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.slice(0, 5).map((t) => (
                          <tr key={t.id}>
                            <td>
                              <Link href="/admin/tasks">{t.title}</Link>
                              <small>{formatDate(t.due_at)}</small>
                            </td>
                            <td>
                              <span className="recent-assignee">
                                <Avatar name={t.assignee_name} size="small" />
                                {t.assignee_name}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={t.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="Bắt đầu công việc đầu tiên"
                    description="Tạo công việc, giao người thực hiện và theo dõi tiến độ tại đây."
                    action={
                      <Link className="primary-button" href="/admin/tasks">
                        Đến quản lý công việc <ArrowRight size={15} />
                      </Link>
                    }
                  />
                )}
              </Panel>
              <Panel
                title="Phân bổ đội ngũ"
                description="Công việc được giao và tiến độ hoàn thành."
                action={
                  <Link href="/admin/members" className="text-link">
                    Đội ngũ <ArrowRight size={14} />
                  </Link>
                }
              >
                <div className="workload-list">
                  {workload.map((m) => (
                    <div className="workload-person" key={m.id}>
                      <Avatar name={m.name} size="small" />
                      <div>
                        <div>
                          <strong>{m.name}</strong>
                          <span>
                            {m.done}/{m.total} việc
                          </span>
                        </div>
                        <progress
                          max={Math.max(1, m.total)}
                          value={m.done}
                          aria-label={`Tiến độ ${m.name}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )
      )}
    </div>
  );
}
