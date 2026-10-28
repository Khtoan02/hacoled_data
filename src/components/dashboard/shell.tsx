"use client";

import Link from "next/link";
import { NotificationBell } from "./notifications";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Database,
  FlaskConical,
  Globe2,
  History,
  Crosshair,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  Menu,
  PanelLeftClose,
  RotateCcw,
  Sparkles,
  Target,
  UserRound,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
  Waypoints,
  X,
} from "lucide-react";
import { ROLE_POLICIES, isFullAccess } from "../../lib/security/rbac";
import { useMember } from "./session";

export const workspaceItems = [
  {
    id: "executive",
    label: "Tổng quan vận hành",
    icon: LayoutDashboard,
    group: "TỔNG QUAN",
  },
  {
    id: "tasks",
    label: "Công việc",
    icon: ClipboardList,
    href: "/admin/tasks",
    group: "",
  },
  {
    id: "kpis",
    label: "KPI & hiệu suất",
    icon: BarChart3,
    href: "/admin/kpis",
    group: "",
  },
  { id: "chat", label: "Chat nội bộ", icon: MessageCircle, href: "/admin/chat", group: "" },
  {
    id: "solutions_proof",
    label: "Giải pháp & bằng chứng",
    icon: BookOpen,
    group: "CHIẾN LƯỢC",
    available: false,
  },
  {
    id: "strategy_lab",
    label: "Thị trường & insight",
    icon: Crosshair,
    group: "",
  },
  {
    id: "campaigns_budget",
    label: "Mục tiêu & chiến dịch",
    icon: Target,
    group: "",
    available: false,
  },
  {
    id: "experiments",
    label: "Thử nghiệm & tối ưu",
    icon: FlaskConical,
    group: "",
    available: false,
  },
  {
    id: "content_channels",
    label: "Nội dung & xuất bản",
    icon: FileText,
    group: "NỘI DUNG & KÊNH",
  },
  {
    id: "channels",
    label: "Tài khoản kênh",
    icon: Megaphone,
    href: "/admin/channels",
    group: "",
  },
  {
    id: "website_seo",
    label: "Website & SEO",
    icon: Globe2,
    group: "",
    available: false,
  },
  {
    id: "crm_pipeline",
    label: "Khách hàng & cơ hội",
    icon: Waypoints,
    group: "KHÁCH HÀNG",
  },
  {
    id: "lead_sources",
    label: "Hành vi & nguồn lead",
    icon: BarChart3,
    group: "",
    available: false,
  },
  {
    id: "sales_handoff",
    label: "Bàn giao Sales",
    icon: ArrowUpRight,
    group: "",
    available: false,
  },
  {
    id: "team_cost",
    label: "Nguồn lực & chi phí",
    icon: WalletCards,
    group: "ĐỘI NGŨ",
  },
  {
    id: "team_survey",
    label: "Kết quả khảo sát",
    icon: ClipboardList,
    href: "/admin/survey",
    group: "",
  },
  {
    id: "learning_hub",
    label: "Học liệu & phát triển",
    icon: BookOpen,
    group: "",
    available: false,
  },
  {
    id: "members",
    label: "Thành viên & quyền truy cập",
    icon: ShieldCheck,
    href: "/admin/members",
    group: "QUẢN TRỊ HỆ THỐNG",
  },
  {
    id: "security_qa",
    label: "Chất lượng dữ liệu & kiểm thử",
    icon: ShieldCheck,
    group: "",
  },
  {
    id: "data_dictionary",
    label: "Từ điển dữ liệu",
    icon: Database,
    group: "",
    available: false,
  },
  {
    id: "activity_log",
    label: "Nhật ký hoạt động",
    icon: History,
    group: "",
    available: false,
  },
  {
    id: "backup_restore",
    label: "Sao lưu & khôi phục",
    icon: RotateCcw,
    group: "",
    available: false,
  },
  {
    id: "components",
    label: "Thư viện giao diện",
    icon: Sparkles,
    href: "/admin/components",
    group: "",
  },
  {
    id: "profile",
    label: "Hồ sơ cá nhân",
    icon: UserRound,
    href: "/admin/profile",
    group: "TÀI KHOẢN",
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
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(
        localStorage.getItem("hacoled_sidebar_collapsed") === "true",
      );
    } catch {}
  }, []);
  function toggleSidebar() {
    const value = !collapsed;
    setCollapsed(value);
    try {
      localStorage.setItem("hacoled_sidebar_collapsed", String(value));
    } catch {}
  }
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
    if (id === "profile" || id === "chat") return true;
    if (
      id === "tasks" ||
      id === "channels" ||
      id === "kpis"
    )
      return policy.taskScope !== "none";
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
  const searchResults = workspaceItems.filter((item) =>
    item.label.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <div className={`dashboard-app ${collapsed ? "sidebar-collapsed" : ""}`}>
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
            const unavailable = item.available === false;
            const restricted = !unavailable && !allowed(item.id);
            const disabled = unavailable || restricted;
            const active = item.href
              ? pathname === item.href
              : pathname === "/admin" && activeTab === item.id;
            return (
              <div key={item.id}>
                {item.group && <p className="nav-group">{item.group}</p>}
                <button
                  title={item.label}
                  onClick={() => !disabled && go(item.id, item.href)}
                  className={`nav-item ${active ? "active" : ""} ${disabled ? "is-disabled" : ""}`}
                  aria-current={active ? "page" : undefined}
                  disabled={disabled}
                  aria-label={`${item.label}${unavailable ? " — Sắp có" : restricted ? " — Không có quyền" : ""}`}
                >
                  <item.icon size={19} strokeWidth={1.7} />
                  <span className="nav-item-label">{item.label}</span>
                  {unavailable && <small className="nav-status">Sắp có</small>}
                  {restricted && (
                    <small className="nav-status">Không có quyền</small>
                  )}
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
          <button
            className="icon-button desktop-only sidebar-toggle"
            aria-label={
              collapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng"
            }
            aria-expanded={!collapsed}
            onClick={toggleSidebar}
          >
            <PanelLeftClose size={20} strokeWidth={1.6} />
          </button>
          <div className="workspace-search">
            <Search size={18} />
            <input
              aria-label="Tìm chức năng"
              placeholder="Tìm menu hoặc chức năng…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <div className="search-results">
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.available !== false &&
                        allowed(item.id) &&
                        go(item.id, item.href)
                      }
                      disabled={item.available === false || !allowed(item.id)}
                      className={
                        item.available === false || !allowed(item.id)
                          ? "is-disabled"
                          : ""
                      }
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                      {item.available === false ? (
                        <small>Sắp có</small>
                      ) : !allowed(item.id) ? (
                        <small>Không có quyền</small>
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  ))
                ) : (
                  <p>Không tìm thấy chức năng.</p>
                )}
              </div>
            )}
          </div>
          <div className="topbar-account">
            <NotificationBell />
            <Link
              href="/admin/profile"
              className="account-profile-link"
              aria-label="Mở hồ sơ cá nhân"
            >
              <span className="account-avatar">
                {member.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="account-description">
                <strong>{member.name}</strong>
                <small>{policy.label}</small>
              </span>
            </Link>
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
                {pathname.includes("chat") ? "Chat nội bộ" : pathname.includes("members")
                  ? "Phân quyền"
                  : pathname.includes("survey")
                    ? "Kết quả khảo sát"
                    : pathname.includes("tasks")
                      ? "Công việc"
                      : pathname.includes("profile")
                        ? "Hồ sơ"
                        : pathname.includes("kpis")
                          ? "KPI & hiệu suất"
                          : pathname.includes("channels")
                            ? "Tài khoản kênh"
                            : pathname.includes("components")
                              ? "Giao diện"
                              : "Tổng quan"}
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
