"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Crosshair,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { ROLE_POLICIES, isFullAccess } from "../../lib/security/rbac";
import { useMember } from "./session";

export const workspaceItems = [
  {
    id: "tasks",
    label: "Công việc",
    icon: ClipboardList,
    href: "/admin/tasks",
    group: "CÔNG VIỆC",
  },
  {
    id: "executive",
    label: "Tổng quan",
    icon: LayoutDashboard,
    group: "KHÔNG GIAN LÀM VIỆC",
  },
  {
    id: "crm_pipeline",
    label: "Khách hàng & Cơ hội",
    icon: BarChart3,
    group: "",
  },
  {
    id: "strategy_lab",
    label: "Chiến lược & Insight",
    icon: Crosshair,
    group: "",
  },
  {
    id: "content_channels",
    label: "Nội dung & Kênh",
    icon: FileText,
    group: "",
  },
  {
    id: "team_cost",
    label: "Nhân sự & Chi phí",
    icon: Users,
    group: "ĐỘI NGŨ",
  },
  {
    id: "team_survey",
    label: "Khảo sát đội ngũ",
    icon: ClipboardList,
    href: "/admin/survey",
    group: "",
  },
  {
    id: "members",
    label: "Thành viên & Phân quyền",
    icon: ShieldCheck,
    href: "/admin/members",
    group: "QUẢN TRỊ",
  },
  {
    id: "security_qa",
    label: "Bảo mật & Kiểm thử",
    icon: ShieldCheck,
    group: "",
  },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/admin"
      className="brand-lockup"
      aria-label="HacoLED Data — Tổng quan"
    >
      <span className="brand-symbol">
        H<span>•</span>
      </span>
      {!compact && (
        <span>
          <strong>
            Haco<span className="text-brand-600">LED</span>
          </strong>
          <small>DATA WORKSPACE</small>
        </span>
      )}
    </Link>
  );
}

export function DashboardShell({
  children,
  title,
  description,
  activeTab,
  onTabChange,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  actions?: React.ReactNode;
}) {
  const member = useMember(),
    policy = ROLE_POLICIES[member.role];
  const pathname = usePathname(),
    router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false),
    [search, setSearch] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    sidebar.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
      }
      if (event.key === "Tab") {
        const controls = sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled)",
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (window.matchMedia("(max-width: 1023px)").matches)
        menuTrigger.current?.focus();
    };
  }, [mobileOpen]);
  const allowed = (id: string) => {
    if (id === "tasks") return policy.taskScope !== "none";
    return isFullAccess(member.role);
  };
  function go(id: string, href?: string) {
    setMobileOpen(false);
    setSearch("");
    if (href) router.push(href);
    else if (onTabChange) onTabChange(id);
    else router.push(`/admin?tab=${id}`);
  }
  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.push("/");
      router.refresh();
    } catch {
      setLogoutError("Chưa đăng xuất được. Vui lòng thử lại.");
    }
  }
  const searchResults = workspaceItems.filter(
    (item) =>
      allowed(item.id) &&
      item.label
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <div className="dashboard-app">
      <a href="#workspace-content" className="skip-link">
        Đến nội dung
      </a>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng điều hướng"
        />
      )}
      <aside
        ref={sidebar}
        id="workspace-navigation"
        className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Điều hướng chính" className="sidebar-nav">
          {workspaceItems.map((item) => {
            if (!allowed(item.id)) return null;
            const active = item.href
              ? pathname === item.href
              : pathname === "/admin" && activeTab === item.id;
            return (
              <div key={item.id}>
                {item.group && <p className="nav-group">{item.group}</p>}
                <button
                  onClick={() => go(item.id, item.href)}
                  className={`nav-item ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon size={19} strokeWidth={1.7} />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={15} />}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <div className="dongson-pattern" aria-hidden="true" />
          <span className="sidebar-note-dot" />
          <strong>
            Dữ liệu kết nối.
            <br />
            Quyết định vững vàng.
          </strong>
          <p>Không gian marketing HacoLED</p>
          <Link href="/survey" target="_blank">
            Mở biểu mẫu khảo sát <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className="status-light" />
          HacoLED Marketing Base<span>v1.0</span>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-topbar">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="icon-button mobile-only"
            ref={menuTrigger}
            aria-controls="workspace-navigation"
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
          </button>
          <PanelLeftClose
            className="desktop-only text-zinc-400"
            size={21}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="workspace-search">
            <Search size={18} />
            <input
              aria-label="Tìm phân hệ"
              placeholder="Tìm trong không gian làm việc…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <div className="search-results">
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => go(item.id, item.href)}
                    >
                      <item.icon size={16} />
                      {item.label}
                      <ChevronRight size={14} />
                    </button>
                  ))
                ) : (
                  <p>Không tìm thấy phân hệ.</p>
                )}
              </div>
            )}
          </div>
          <div className="topbar-account">
            <span className="account-avatar">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="account-description">
              <strong>{member.name}</strong>
              <small>{policy.label}</small>
            </span>
            <button
              className="icon-button"
              onClick={logout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="workspace-content" className="workspace-main">
          <div className="workspace-heading">
            <div>
              <h1>{title}</h1>
              {description && <p>{description}</p>}
            </div>
            <div className="workspace-actions">
              {actions}
              <span className="workspace-breadcrumb">
                HacoLED <ChevronRight size={13} />{" "}
                {pathname.includes("members")
                  ? "Phân quyền"
                  : pathname.includes("survey")
                    ? "Khảo sát"
                    : "Dashboard"}
              </span>
            </div>
          </div>
          {logoutError && (
            <p className="form-message error" role="alert">
              {logoutError}
            </p>
          )}
          {children}
          <footer className="workspace-footer">
            <span>
              © {new Date().getFullYear()} HacoLED · Marketing Data Workspace
            </span>
            <span>Rõ dữ liệu. Đúng quyết định.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
