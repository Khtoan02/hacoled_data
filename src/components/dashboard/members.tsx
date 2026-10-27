"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import {
  MEMBER_ROLES,
  TASK_SCOPE_LABELS,
  isFullAccess,
  type MemberRoleId,
} from "../../lib/security/rbac";
import type { Member } from "../../lib/auth/types";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "marketing_staff" as MemberRoleId,
};
export function MembersPage() {
  const self = useMember();
  const [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(true);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(""),
    [roleFilter, setRoleFilter] = useState("all");
  const [adding, setAdding] = useState(false),
    [resetMember, setResetMember] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm),
    [showPassword, setShowPassword] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/members", { cache: "no-store" }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMembers(data.members);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không tải được danh sách. Hãy thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function mutate(
    body: object,
    method: "POST" | "PATCH",
    success: string,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/members", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.selfUpdated) {
        window.location.assign("/");
        return;
      }
      setAdding(false);
      setResetMember(null);
      setForm(emptyForm);
      setShowPassword(false);
      await load();
      setMessage(success);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Chưa lưu được. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  const filtered = members.filter(
    (m) =>
      (roleFilter === "all" || m.role === roleFilter) &&
      `${m.name} ${m.email}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <DashboardShell
      title="Thành viên & Phân quyền"
      description="Đúng người, đúng vai trò. Quản lý quyền truy cập trong một không gian."
      actions={
        <button
          className="primary-button"
          onClick={() => {
            setAdding(true);
            setResetMember(null);
            setError("");
            setForm(emptyForm);
          }}
        >
          <Plus size={17} />
          Thêm thành viên
        </button>
      }
    >
      <section className="members-intro">
        <div>
          <span className="intro-icon">
            <ShieldCheck size={24} strokeWidth={1.5} />
          </span>
          <h2>Đội ngũ HacoLED</h2>
          <p>
            Mỗi thành viên có tài khoản riêng.
            <br />
            Quyền truy cập được áp dụng theo vai trò được giao.
          </p>
        </div>
        <div className="members-intro-numbers">
          <div>
            <Users size={19} />
            <strong>{loading ? "—" : members.length}</strong>
            <span>Thành viên</span>
          </div>
          <div>
            <UserCheck size={19} />
            <strong>
              {loading ? "—" : members.filter((m) => m.active).length}
            </strong>
            <span>Đang hoạt động</span>
          </div>
          <div>
            <ShieldCheck size={19} />
            <strong>{MEMBER_ROLES.length}</strong>
            <span>Vai trò</span>
          </div>
        </div>
        <div className="dongson-pattern" aria-hidden="true" />
      </section>
      {message && (
        <p className="form-message success" role="status">
          <Check size={17} />
          {message}
        </p>
      )}
      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      {(adding || resetMember) && (
        <section
          className="member-editor"
          aria-labelledby="member-editor-title"
        >
          <div className="section-heading">
            <div>
              <h2 id="member-editor-title">
                {resetMember
                  ? `Đặt lại mật khẩu · ${resetMember.name}`
                  : "Thêm thành viên mới"}
              </h2>
              <p>
                {resetMember
                  ? "Các phiên đăng nhập cũ sẽ được thu hồi sau khi lưu."
                  : "Mỗi người đăng nhập bằng mật khẩu riêng; email chỉ dùng để quản lý hồ sơ."}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label="Đóng biểu mẫu"
              disabled={busy}
              onClick={() => {
                setAdding(false);
                setResetMember(null);
                setForm(emptyForm);
                setShowPassword(false);
              }}
            >
              <X size={20} />
            </button>
          </div>
          <form
            className="account-form member-form"
            onSubmit={(e) => {
              e.preventDefault();
              void mutate(
                resetMember
                  ? { id: resetMember.id, password: form.password }
                  : form,
                resetMember ? "PATCH" : "POST",
                resetMember
                  ? "Đã đặt lại mật khẩu và thu hồi phiên đăng nhập cũ."
                  : "Đã thêm thành viên. Bạn có thể bàn giao thông tin đăng nhập cho thành viên.",
              );
            }}
          >
            {!resetMember && (
              <>
                <label>
                  Họ và tên
                  <input
                    autoFocus
                    required
                    maxLength={100}
                    autoComplete="off"
                    placeholder="Nhập họ và tên"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Email liên hệ
                  <input
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="off"
                    placeholder="thanhvien@hacoled.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Vai trò
                  <select
                    aria-label="Vai trò"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as MemberRoleId })
                    }
                  >
                    {MEMBER_ROLES.map((p) => (
                      <option key={p.roleId} value={p.roleId}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              {resetMember ? "Mật khẩu mới" : "Mật khẩu ban đầu"}
              <span className="password-input">
                <input
                  aria-label={resetMember ? "Mật khẩu mới" : "Mật khẩu ban đầu"}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 12 ký tự"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <div className="member-form-actions">
              <p>
                <LockKeyhole size={15} />
                Mật khẩu phải riêng cho từng người; không thể xem lại sau khi
                lưu.
              </p>
              <button className="primary-button" disabled={busy}>
                {busy ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}
                {resetMember ? "Lưu mật khẩu mới" : "Tạo thành viên"}
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="members-table-panel">
        <div className="section-heading">
          <div>
            <h2>
              Danh sách thành viên{" "}
              <span className="count-badge">{members.length}</span>
            </h2>
            <p>Thêm, cập nhật vai trò và kiểm soát trạng thái truy cập.</p>
          </div>
          <button
            className="secondary-button"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={17} />
            <input
              aria-label="Tìm tên hoặc email thành viên"
              placeholder="Tìm tên hoặc email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            {MEMBER_ROLES.map((p) => (
              <option key={p.roleId} value={p.roleId}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="members-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    <Loader2 className="animate-spin inline mr-2" size={18} />
                    Đang tải thành viên…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="member-identity">
                        <span
                          className={`member-avatar ${isFullAccess(m.role) ? "admin" : ""}`}
                        >
                          {m.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>
                            {m.name}
                            {m.id === self.id && (
                              <small className="you-badge">Bạn</small>
                            )}
                          </strong>
                          <small>{m.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <select
                        aria-label={`Vai trò của ${m.name}`}
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => {
                          if (
                            window.confirm(
                              `Đổi vai trò của ${m.name}? Thành viên sẽ cần đăng nhập lại.`,
                            )
                          )
                            void mutate(
                              { id: m.id, role: e.target.value },
                              "PATCH",
                              "Đã cập nhật vai trò và thu hồi phiên đăng nhập cũ.",
                            );
                        }}
                      >
                        {MEMBER_ROLES.map((p) => (
                          <option value={p.roleId} key={p.roleId}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={`member-status ${m.active ? "enabled" : "disabled"}`}
                      >
                        <span />
                        {m.active ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(m.created_at).toLocaleDateString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          title="Đặt lại mật khẩu"
                          aria-label={`Đặt lại mật khẩu cho ${m.name}`}
                          disabled={busy}
                          onClick={() => {
                            setResetMember(m);
                            setAdding(false);
                            setForm(emptyForm);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <KeyRound size={17} />
                        </button>
                        <button
                          className="secondary-button compact"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `${m.active ? "Khóa" : "Mở khóa"} tài khoản ${m.name}?`,
                              )
                            )
                              void mutate(
                                { id: m.id, active: !m.active },
                                "PATCH",
                                m.active
                                  ? "Đã khóa tài khoản và thu hồi phiên đăng nhập."
                                  : "Đã mở khóa tài khoản.",
                              );
                          }}
                        >
                          {m.active ? "Khóa" : "Mở khóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="table-empty">
                    {error
                      ? "Chưa tải được dữ liệu. Bấm Làm mới để thử lại."
                      : "Không có thành viên phù hợp với bộ lọc."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footnote">
          Hiển thị {filtered.length} / {members.length} thành viên
          <span>Leader Marketing và Giám đốc được quản lý tài khoản.</span>
        </div>
      </section>
      <section className="role-reference">
        <div className="section-heading">
          <div>
            <h2>Quyền theo vai trò</h2>
            <p>
              Phạm vi xem công việc và dữ liệu theo vị trí. Quyền duyệt sẽ được
              thiết lập trong quản lý công việc.
            </p>
          </div>
          <ShieldCheck size={22} />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Vai trò</th>
                <th>Phạm vi công việc</th>
                <th>Khách hàng / PII</th>
                <th>Nhân sự / Khảo sát</th>
                <th>Quản lý tài khoản</th>
              </tr>
            </thead>
            <tbody>
              {MEMBER_ROLES.map((p) => (
                <tr key={p.roleId}>
                  <td>
                    <strong>{p.label}</strong>
                    <small>{p.summary}</small>
                  </td>
                  <td>{TASK_SCOPE_LABELS[p.taskScope]}</td>
                  {[
                    p.canViewRawPii,
                    p.canViewSalaryAndHrPrivate,
                    p.canManagePermissions,
                  ].map((yes, i) => (
                    <td key={i}>
                      {yes ? (
                        <span className="permission-yes">
                          <Check size={15} />
                          Có quyền
                        </span>
                      ) : (
                        <span className="permission-no">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
