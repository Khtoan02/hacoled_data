"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Command,
  Plus,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Task } from "../../lib/tasks";

interface CommandEntry {
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  badge?: string;
  badgeTone?: "passed" | "failed" | "neutral";
  onSelect: () => void;
}

export function CommandPalette({
  open,
  onClose,
  navItems,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  navItems: Array<{
    id: string;
    label: string;
    href?: string;
    available?: boolean;
    icon: LucideIcon;
  }>;
  onNavigate: (id: string, href?: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 20);
    let cancelled = false;
    void fetch("/api/tasks", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.tasks) setTasks(d.tasks.slice(0, 30));
      })
      .catch(() => {});
    void fetch("/api/knowledge", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.posts) setDocs(d.posts.slice(0, 20));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const entries: CommandEntry[] = [
    {
      id: "action-new-task",
      group: "Thao tác nhanh",
      label: "Tạo công việc mới",
      sublabel: "Mở biểu mẫu giao việc mới",
      icon: Plus,
      badge: "Action",
      onSelect: () => {
        onClose();
        router.push("/admin/tasks?create=1");
      },
    },
    {
      id: "action-view-table",
      group: "Thao tác nhanh",
      label: "Mở Bảng dữ liệu công việc (Table View)",
      sublabel: "Chế độ lưới dữ liệu kiểu Twenty",
      icon: ClipboardList,
      onSelect: () => {
        onClose();
        router.push("/admin/tasks?view=table");
      },
    },
    {
      id: "action-view-kanban",
      group: "Thao tác nhanh",
      label: "Mở Bảng Kanban công việc",
      sublabel: "Kéo thả trạng thái công việc",
      icon: Sparkles,
      onSelect: () => {
        onClose();
        router.push("/admin/tasks?view=board");
      },
    },
    ...navItems
      .filter((item) => item.available !== false)
      .map((item) => ({
        id: `nav-${item.id}`,
        group: "Điều hướng phân hệ",
        label: item.label,
        sublabel: item.href || `/admin?tab=${item.id}`,
        icon: item.icon,
        onSelect: () => {
          onClose();
          onNavigate(item.id, item.href);
        },
      })),
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      group: "Công việc",
      label: t.title,
      sublabel: `${t.assignee_name} · ${t.channel_name || "Chưa gắn kênh"}`,
      icon:
        t.review_status === "failed"
          ? AlertCircle
          : t.review_status === "passed"
          ? CheckCircle2
          : ClipboardList,
      badge:
        t.review_status === "failed"
          ? "Chưa đạt"
          : t.review_status === "passed"
          ? "Đạt"
          : undefined,
      badgeTone: t.review_status ?? "neutral",
      onSelect: () => {
        onClose();
        router.push(`/admin/tasks?task=${t.id}`);
      },
    })),
    ...docs.map((doc) => ({
      id: `doc-${doc.id}`,
      group: "Quy trình & thông báo",
      label: doc.title,
      sublabel: "Tài liệu nội bộ HacoLED",
      icon: BookOpen,
      onSelect: () => {
        onClose();
        router.push(`/admin/knowledge?post=${doc.id}`);
      },
    })),
  ];

  const q = query.trim().toLocaleLowerCase("vi");
  const filtered = q
    ? entries.filter((e) =>
        `${e.label} ${e.sublabel || ""} ${e.group}`
          .toLocaleLowerCase("vi")
          .includes(q),
      )
    : entries.slice(0, 14);

  const safeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Enter" && filtered[safeIndex]) {
      e.preventDefault();
      filtered[safeIndex].onSelect();
    }
  }

  let currentGroup = "";

  return (
    <div
      className="cmd-palette-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Hộp lệnh tìm kiếm & thao tác nhanh"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="cmd-palette-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-palette-search">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Tìm nhanh công việc, quy trình, phân hệ hoặc gõ lệnh…"
            aria-label="Tìm nhanh trong hộp lệnh"
          />
          {query && (
            <button
              type="button"
              className="icon-button"
              aria-label="Xóa từ khóa"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X size={15} />
            </button>
          )}
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        <div className="cmd-palette-list" role="listbox">
          {filtered.length === 0 ? (
            <p className="cmd-palette-empty">
              Không tìm thấy kết quả phù hợp với “{query}”.
            </p>
          ) : (
            filtered.map((item, idx) => {
              const showGroup = item.group !== currentGroup;
              currentGroup = item.group;
              const Icon = item.icon;
              const isSelected = idx === safeIndex;
              return (
                <div key={item.id}>
                  {showGroup && (
                    <div className="cmd-palette-group">{item.group}</div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`cmd-palette-item ${isSelected ? "is-active" : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={item.onSelect}
                  >
                    <span className="cmd-palette-item-icon">
                      <Icon size={16} />
                    </span>
                    <span className="cmd-palette-item-body">
                      <strong>{item.label}</strong>
                      {item.sublabel && <small>{item.sublabel}</small>}
                    </span>
                    {item.badge && (
                      <span
                        className={`cmd-palette-badge ${item.badgeTone || "neutral"}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight size={14} className="cmd-palette-arrow" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <footer className="cmd-palette-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> Di chuyển
          </span>
          <span>
            <kbd>↵</kbd> Mở nhanh
          </span>
          <span>
            <Command size={12} /> + <kbd>K</kbd> Bật/tắt hộp lệnh
          </span>
        </footer>
      </div>
    </div>
  );
}
