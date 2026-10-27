"use client";
// Adapted to HacoLED from the TailAdmin MIT component patterns supplied by the user.
// Attribution: /licenses/tailadmin.txt. No template demo data is used here.
import { useEffect, useId, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "../../../lib/tasks";
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`ui-panel ${className}`}>
      {title && (
        <div className="ui-panel-header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Notice({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "success" | "error" | "info";
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={`ui-notice ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={18} />
      <span>{children}</span>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="ui-empty">
      <span className="ui-empty-icon">
        <Icon size={26} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function LoadingState({
  label = "Đang tải dữ liệu…",
}: {
  label?: string;
}) {
  return (
    <div className="ui-loading" role="status">
      <Loader2 className="animate-spin" size={22} />
      <span>{label}</span>
    </div>
  );
}
export function Avatar({
  name,
  size = "normal",
  tone = "neutral",
}: {
  name: string;
  size?: "small" | "normal" | "large";
  tone?: "neutral" | "brand";
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <span className={`ui-avatar ${size} ${tone}`} aria-hidden="true">
      {initials || "H"}
    </span>
  );
}
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`ui-status ${status}`}>
      <span />
      {TASK_STATUSES[status]}
    </span>
  );
}
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`ui-priority ${priority}`}>
      <span />
      {TASK_PRIORITIES[priority]}
    </span>
  );
}
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="ui-pagination">
      <span>
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} trong ${total} kết quả`
          : "0 kết quả"}
      </span>
      <nav aria-label="Phân trang">
        <button
          className="icon-button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .map((p, i, arr) => (
            <span key={p}>
              {i > 0 && p > arr[i - 1] + 1 && (
                <span className="page-gap">…</span>
              )}
              <button
                className={`page-number ${p === page ? "active" : ""}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </span>
          ))}
        <button
          className="icon-button"
          aria-label="Trang sau"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ArrowRight size={16} />
        </button>
      </nav>
    </div>
  );
}
export function Drawer({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const id = useId(),
    ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current
      ?.querySelector<HTMLElement>(
        "button, input, select, textarea, [tabindex='0']",
      )
      ?.focus();
    function keydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key !== "Tab") return;
      const nodes = ref.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex='0']",
      );
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      className="ui-drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
    >
      <div
        className="ui-drawer"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <header>
          <div>
            <h2 id={id}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Đóng chi tiết"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
