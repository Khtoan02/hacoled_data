"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import { ROLE_POLICIES, TASK_SCOPE_LABELS } from "../../lib/security/rbac";
import { formatDate } from "../../lib/tasks";
import { Avatar, Notice, Panel } from "./ui";
export function ProfilePage() {
  const member = useMember(),
    router = useRouter(),
    policy = ROLE_POLICIES[member.role];
  const [form, setForm] = useState({ name: member.name, email: member.email });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setForm({ name: data.member.name, email: data.member.email });
      setMessage("Đã cập nhật hồ sơ cá nhân.");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Chưa lưu được hồ sơ. Hãy thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <DashboardShell
      title="Hồ sơ cá nhân"
      description="Thông tin của bạn và quyền truy cập trong không gian HacoLED."
    >
      <section className="profile-cover">
        <div className="dongson-pattern" aria-hidden="true" />
        <div className="profile-identity">
          <Avatar name={member.name} size="large" tone="brand" />
          <div>
            <h2>{member.name}</h2>
            <p>{policy.label}</p>
            <span>
              <span className="status-light" />
              Tài khoản đang hoạt động
            </span>
          </div>
        </div>
        <div className="profile-since">
          <span>Thành viên từ</span>
          <strong>{formatDate(member.created_at)}</strong>
        </div>
      </section>
      {error && <Notice>{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <div className="profile-layout">
        <Panel
          title="Thông tin cá nhân"
          description="Email chỉ dùng liên hệ; bạn vẫn đăng nhập bằng mật khẩu được cấp."
        >
          <form className="account-form profile-form" onSubmit={save}>
            <label>
              <span>
                <UserRound size={15} />
                Họ và tên
              </span>
              <input
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </label>
            <label>
              <span>
                <Mail size={15} />
                Email liên hệ
              </span>
              <input
                type="email"
                required
                maxLength={254}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => {
                  setForm({ name: member.name, email: member.email });
                  setError("");
                  setMessage("");
                }}
              >
                Hủy thay đổi
              </button>
              <button className="primary-button" disabled={busy}>
                <Save size={16} />
                {busy ? "Đang lưu…" : "Lưu hồ sơ"}
              </button>
            </div>
          </form>
        </Panel>
        <div className="profile-aside">
          <Panel title="Vai trò & quyền truy cập">
            <div className="profile-policy">
              <ShieldCheck size={25} />
              <strong>{policy.label}</strong>
              <p>{policy.summary}</p>
              <dl>
                <dt>Phạm vi công việc</dt>
                <dd>{TASK_SCOPE_LABELS[policy.taskScope]}</dd>
                <dt>Quản lý tài khoản</dt>
                <dd>
                  {policy.canManagePermissions ? "Có quyền" : "Không có quyền"}
                </dd>
              </dl>
            </div>
          </Panel>
          <Panel title="Bảo mật">
            <div className="profile-security">
              <KeyRound size={22} />
              <p>
                Mật khẩu được cấp riêng cho từng thành viên. Liên hệ Leader
                Marketing hoặc Giám đốc khi cần đặt lại mật khẩu.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
