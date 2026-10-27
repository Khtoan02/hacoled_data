"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "../components/dashboard/shell";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<{
    configured: boolean;
    needsSetup: boolean;
    migrationRequired?: boolean;
    connectionFailed?: boolean;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    setupToken: "",
  });
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() =>
        setError("Chưa tải được trạng thái hệ thống. Vui lòng tải lại trang."),
      );
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(
        status?.needsSetup ? "/api/auth/setup" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            status?.needsSetup ? form : { password: form.password },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Đăng nhập chưa thành công.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Lỗi kết nối. Kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-panel">
        <Brand />
        <div className="login-form-wrap">
          <span className="login-lock">
            <LockKeyhole size={24} strokeWidth={1.5} />
          </span>
          <h1>
            {status?.needsSetup ? "Khởi tạo không gian" : "Chào mừng trở lại"}
          </h1>
          <p>
            {status?.needsSetup
              ? "Tạo tài khoản quản trị đầu tiên cho HacoLED Data."
              : "Nhập mật khẩu riêng được cấp để vào không gian HacoLED."}
          </p>
          {status && !status.configured && (
            <div className="setup-notice">
              <strong>
                {status.migrationRequired
                  ? "Cần khởi tạo bảng tài khoản"
                  : status.connectionFailed
                    ? "Chưa kết nối được database"
                    : "Cần kết nối database"}
              </strong>
              <p>
                {status.migrationRequired
                  ? "Trên Vercel, redeploy để tự khởi tạo bảng. Khi chạy local, dùng npm run db:migrate rồi tải lại trang."
                  : status.connectionFailed
                    ? "Kiểm tra DATABASE_URL trong Vercel và trạng thái database Neon, sau đó redeploy."
                    : "Thêm DATABASE_URL của Neon vào môi trường chạy ứng dụng, chạy npm run db:migrate rồi tải lại trang."}
              </p>
              <small>
                Thiết lập quản trị viên lần đầu cần ADMIN_SETUP_TOKEN ở server.
              </small>
            </div>
          )}
          <form onSubmit={submit} className="account-form">
            {status?.needsSetup && (
              <label>
                Họ và tên
                <input
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tên quản trị viên"
                />
              </label>
            )}
            {status?.needsSetup && (
              <label>
                Email
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="username"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ban@hacoled.com"
                />
              </label>
            )}
            <label>
              Mật khẩu
              <span className="password-input">
                <input
                  aria-label="Mật khẩu"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={status?.needsSetup ? 12 : undefined}
                  maxLength={128}
                  autoComplete={
                    status?.needsSetup ? "new-password" : "current-password"
                  }
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={
                    status?.needsSetup
                      ? "Tối thiểu 12 ký tự"
                      : "Nhập mật khẩu được cấp"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {status?.needsSetup && (
              <label>
                Mã thiết lập quản trị
                <input
                  aria-label="Mã thiết lập quản trị"
                  type="password"
                  required
                  autoComplete="off"
                  value={form.setupToken}
                  onChange={(e) =>
                    setForm({ ...form, setupToken: e.target.value })
                  }
                  placeholder="Mã ADMIN_SETUP_TOKEN đã cấu hình"
                />
                <small>Chỉ dùng một lần để tạo quản trị viên đầu tiên.</small>
              </label>
            )}
            {error && (
              <p className="form-message error" role="alert">
                {error}
              </p>
            )}
            <button
              className="primary-button login-submit"
              disabled={loading || !status?.configured}
              type="submit"
            >
              {loading
                ? "Đang xử lý…"
                : status?.needsSetup
                  ? "Tạo quản trị viên"
                  : "Đăng nhập"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-help">
            {status?.needsSetup
              ? "Sau khi khởi tạo, bạn có thể thêm thành viên và gán vai trò trong dashboard."
              : "Cần cấp tài khoản hoặc đặt lại mật khẩu? Liên hệ quản trị viên HacoLED."}
          </p>
          <div className="login-security">
            <ShieldCheck size={16} />
            Không gian nội bộ · Truy cập theo vai trò
          </div>
        </div>
        <footer>
          © {new Date().getFullYear()} HacoLED. Marketing Data Workspace.
        </footer>
      </section>
      <section
        className="login-brand-panel"
        aria-label="HacoLED Marketing Data"
      >
        <div className="dongson-pattern" aria-hidden="true" />
        <div className="login-brand-top">
          <span className="brand-pill">
            HACO<span>LED</span>
          </span>
          <span>Đồng hành cùng sự phát triển</span>
        </div>
        <div className="login-brand-copy">
          <span className="gold-rule" />
          <h2>
            Kết nối dữ liệu.
            <br />
            Thắp sáng
            <br />
            <em>quyết định.</em>
          </h2>
          <p>
            Một không gian cho chiến lược, nội dung và những cơ hội tiếp theo
            của HacoLED.
          </p>
        </div>
        <div className="login-brand-bottom">
          <span>MARKETING · PEOPLE · GROWTH</span>
          <span>HacoLED Data</span>
        </div>
      </section>
    </div>
  );
}
