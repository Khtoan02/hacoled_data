"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import { isFullAccess, ROLE_POLICIES } from "../../lib/security/rbac";
import {
  SOCIAL_PLATFORMS,
  type SocialChannel,
  type SocialPlatform,
} from "../../lib/social";
import type { Member } from "../../lib/auth/types";
import {
  Drawer,
  EmptyState,
  LoadingState,
  Notice,
  Pagination,
  Panel,
} from "./ui";
type Draft = {
  id?: string;
  version?: number;
  name: string;
  platform: SocialPlatform;
  url: string;
  handle: string;
  notes: string;
  active: boolean;
  access: string[];
  username: string;
  password: string;
  replace: boolean;
  clear: boolean;
};
const fresh = (): Draft => ({
  name: "",
  platform: "facebook",
  url: "",
  handle: "",
  notes: "",
  active: true,
  access: [],
  username: "",
  password: "",
  replace: false,
  clear: false,
});
export function ChannelsPage() {
  const member = useMember(),
    full = isFullAccess(member.role);
  const [channels, setChannels] = useState<SocialChannel[]>([]),
    [members, setMembers] = useState<Member[]>([]),
    [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [search, setSearch] = useState(""),
    [platform, setPlatform] = useState("all"),
    [archived, setArchived] = useState(false),
    [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Draft | null>(null),
    [editorLoading, setEditorLoading] = useState(false);
  const [initialDraft, setInitialDraft] = useState("");
  const [view, setView] = useState<SocialChannel | null>(null),
    [credentials, setCredentials] = useState<{
      username: string;
      password: string;
    } | null>(null),
    [reveal, setReveal] = useState(false),
    [secretError, setSecretError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/social-channels", { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setChannels(d.channels);
      setConfigured(d.credentials_configured === true);
      if (full) {
        const m = await fetch("/api/members", { cache: "no-store" }),
          md = await m.json();
        if (!m.ok) throw new Error(md.error);
        setMembers(
          md.members.filter(
            (m: Member) =>
              m.active &&
              ROLE_POLICIES[m.role].taskScope !== "none" &&
              !isFullAccess(m.role),
          ),
        );
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không tải được kênh. Hãy thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, [full]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!credentials) return;
    const timer = setTimeout(() => {
      setCredentials(null);
      setReveal(false);
      setSecretError(
        "Thông tin đã tự ẩn sau 60 giây. Bấm Xem thông tin để mở lại.",
      );
    }, 60000);
    const hide = () => {
      if (document.hidden) {
        setCredentials(null);
        setReveal(false);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [credentials]);
  async function edit(channel?: SocialChannel) {
    setError("");
    setMessage("");
    const blank = fresh();
    setDraft(blank);
    setInitialDraft(JSON.stringify(blank));
    if (!channel) return;
    setEditorLoading(true);
    try {
      const r = await fetch(`/api/social-channels?id=${channel.id}`, {
          cache: "no-store",
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const c = d.channels[0];
      const loaded = {
        ...fresh(),
        ...c,
        access: d.access.map((a: { member_id: string }) => a.member_id),
      };
      setDraft(loaded);
      setInitialDraft(JSON.stringify(loaded));
    } catch (e) {
      setDraft(null);
      setError(e instanceof Error ? e.message : "Không mở được kênh.");
    } finally {
      setEditorLoading(false);
    }
  }
  function closeEditor() {
    if (busy || editorLoading) return;
    if (
      draft &&
      JSON.stringify(draft) !== initialDraft &&
      !window.confirm("Thông tin kênh chưa lưu. Đóng và bỏ thay đổi?")
    )
      return;
    setDraft(null);
    setError("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    const { replace, clear, username, password, ...metadata } = draft;
    // Build an explicit payload: GET metadata such as permission flags never returns to the write API.
    const body = {
      id: metadata.id,
      version: metadata.version,
      name: metadata.name,
      platform: metadata.platform,
      url: metadata.url,
      handle: metadata.handle,
      notes: metadata.notes,
      active: metadata.active,
      access: metadata.access,
      ...(clear
        ? { clear_credentials: true }
        : replace
          ? { credentials: { username, password } }
          : {}),
    };
    try {
      const r = await fetch("/api/social-channels", {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDraft(null);
      await load();
      setMessage("Đã lưu kênh và quyền truy cập.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa lưu được kênh.");
    } finally {
      setBusy(false);
    }
  }
  async function showCredentials() {
    if (!view) return;
    setBusy(true);
    setSecretError("");
    setCredentials(null);
    setReveal(false);
    try {
      const r = await fetch("/api/social-channels/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: view.id }),
          cache: "no-store",
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCredentials(d.credentials);
    } catch (e) {
      setSecretError(
        e instanceof Error ? e.message : "Không mở được thông tin đăng nhập.",
      );
    } finally {
      setBusy(false);
    }
  }
  const filtered = channels.filter(
      (c) =>
        (archived || c.active) &&
        (platform === "all" || c.platform === platform) &&
        `${c.name} ${c.handle} ${c.url}`
          .toLocaleLowerCase("vi")
          .includes(search.toLocaleLowerCase("vi")),
    ),
    count = Math.max(1, Math.ceil(filtered.length / 9)),
    current = Math.min(page, count),
    visible = filtered.slice((current - 1) * 9, current * 9);
  return (
    <DashboardShell
      title="Tài khoản kênh"
      description="Quản lý danh mục kênh, đường dẫn và quyền sử dụng tài khoản của HacoLED."
      actions={
        full ? (
          <button className="primary-button" onClick={() => void edit()}>
            <Plus size={17} />
            Thêm kênh
          </button>
        ) : undefined
      }
    >
      {error && !draft && <Notice>{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      {full && !configured && (
        <Notice tone="info">
          Danh mục kênh vẫn sử dụng được. Để lưu tài khoản/mật khẩu, cấu hình
          SOCIAL_CREDENTIALS_KEY trong môi trường server.
        </Notice>
      )}
      <Panel
        title="Danh mục kênh"
        description="Chọn kênh khi giao việc hoặc báo cáo kết quả để theo dõi công việc theo từng kênh."
        action={
          <button
            className="secondary-button"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
        }
      >
        <div className="advanced-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              aria-label="Tìm kênh social"
              placeholder="Tìm tên kênh, đường dẫn…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Lọc nền tảng social"
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Mọi nền tảng</option>
            {Object.entries(SOCIAL_PLATFORMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <label className="social-archived">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => {
                setArchived(e.target.checked);
                setPage(1);
              }}
            />
            Gồm kênh lưu trữ
          </label>
        </div>
        {loading ? (
          <LoadingState label="Đang tải kênh…" />
        ) : !visible.length ? (
          <EmptyState
            title="Chưa có kênh phù hợp"
            description={
              full
                ? "Thêm kênh social đầu tiên hoặc điều chỉnh bộ lọc."
                : "Người quản lý sẽ thêm các kênh để bạn chọn khi làm việc."
            }
          />
        ) : (
          <div className="social-grid">
            {visible.map((c) => (
              <article className="social-card" key={c.id}>
                <div className="social-card-top">
                  <span className="social-platform">
                    {SOCIAL_PLATFORMS[c.platform]}
                  </span>
                  <span className={`social-state ${c.active ? "active" : ""}`}>
                    {c.active ? "Đang sử dụng" : "Đã lưu trữ"}
                  </span>
                </div>
                <h3>{c.name}</h3>
                {c.handle && <p className="social-handle">{c.handle}</p>}
                <a
                  className="social-url"
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={14} />
                  <span>{c.url}</span>
                </a>
                {c.notes && <p className="social-notes">{c.notes}</p>}
                <div className="social-security">
                  <ShieldCheck size={15} />
                  {c.has_credentials
                    ? c.can_view_credentials
                      ? "Bạn có quyền xem đăng nhập"
                      : "Đăng nhập được giới hạn quyền"
                    : "Chưa lưu thông tin đăng nhập"}
                </div>
                <div className="social-card-actions">
                  <Link
                    className="secondary-button"
                    href={`/admin/kpis?channel=${c.id}`}
                  >
                    KPI kênh
                  </Link>
                  <button
                    className="secondary-button"
                    disabled={
                      !c.has_credentials || !c.can_view_credentials || !c.active
                    }
                    onClick={() => {
                      setView(c);
                      setCredentials(null);
                      setSecretError("");
                      setReveal(false);
                    }}
                  >
                    <KeyRound size={15} />
                    Đăng nhập
                  </button>
                  {full && (
                    <button
                      className="secondary-button"
                      onClick={() => void edit(c)}
                    >
                      Quản lý
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && (
          <Pagination
            page={current}
            total={filtered.length}
            pageSize={9}
            onChange={setPage}
          />
        )}
      </Panel>
      {draft && (
        <Drawer
          title={draft.id ? "Quản lý kênh" : "Thêm kênh social"}
          description="Thông tin kênh được dùng chung trong phần công việc."
          onClose={closeEditor}
        >
          {editorLoading ? (
            <LoadingState label="Đang tải quyền truy cập…" />
          ) : (
            <form
              className="account-form task-editor social-editor"
              onSubmit={save}
            >
              {error && <Notice>{error}</Notice>}
              <label>
                Tên kênh
                <input
                  required
                  maxLength={150}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Ví dụ: HacoLED Việt Nam"
                />
              </label>
              <div className="field-pair">
                <label>
                  Nền tảng
                  <select
                    value={draft.platform}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        platform: e.target.value as SocialPlatform,
                      })
                    }
                  >
                    {Object.entries(SOCIAL_PLATFORMS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tên định danh / @handle
                  <input
                    maxLength={200}
                    value={draft.handle}
                    onChange={(e) =>
                      setDraft({ ...draft, handle: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Link truy cập kênh
                <input
                  type="url"
                  required
                  maxLength={2048}
                  value={draft.url}
                  placeholder="https://facebook.com/…"
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
              </label>
              <label>
                Ghi chú kênh
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={draft.notes}
                  placeholder="Mục đích, nhóm nội dung… Không điền mật khẩu vào ghi chú."
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                />
              </label>
              <label className="social-checkbox">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.checked })
                  }
                />
                Kênh đang sử dụng
              </label>
              <section className="social-editor-section">
                <h3>Thông tin đăng nhập</h3>
                <p className="result-hint">
                  Thông tin được mã hóa. Bỏ chọn thay thế để giữ nguyên thông
                  tin đã lưu.
                </p>
                <label className="social-checkbox">
                  <input
                    type="checkbox"
                    disabled={!configured}
                    checked={draft.replace}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        replace: e.target.checked,
                        clear: false,
                      })
                    }
                  />
                  Nhập hoặc thay thế tài khoản/mật khẩu
                </label>
                {draft.replace && (
                  <>
                    <label>
                      Tài khoản đăng nhập
                      <input
                        autoComplete="off"
                        maxLength={254}
                        value={draft.username}
                        onChange={(e) =>
                          setDraft({ ...draft, username: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Mật khẩu kênh
                      <input
                        type="password"
                        autoComplete="new-password"
                        maxLength={1000}
                        value={draft.password}
                        onChange={(e) =>
                          setDraft({ ...draft, password: e.target.value })
                        }
                      />
                    </label>
                    <p className="result-hint">
                      Điền thông tin muốn lưu mới. Để trống mật khẩu sẽ lưu tài
                      khoản không kèm mật khẩu.
                    </p>
                  </>
                )}
                {draft.id && (
                  <label className="social-checkbox">
                    <input
                      type="checkbox"
                      checked={draft.clear}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          clear: e.target.checked,
                          replace: false,
                          username: "",
                          password: "",
                        })
                      }
                    />
                    Xóa thông tin đăng nhập đang lưu
                  </label>
                )}
              </section>
              <section className="social-editor-section">
                <h3>Ai được xem thông tin đăng nhập?</h3>
                <p className="result-hint">
                  Leader Marketing và Giám đốc luôn có quyền. Chọn thêm thành
                  viên theo từng kênh. Quyền này không cấp quyền sửa thông tin
                  kênh.
                </p>
                {members.length ? (
                  members.map((m) => (
                    <label className="social-checkbox social-grant" key={m.id}>
                      <input
                        type="checkbox"
                        aria-label={`Cấp quyền xem đăng nhập cho ${m.name}`}
                        checked={draft.access.includes(m.id)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            access: e.target.checked
                              ? [...draft.access, m.id]
                              : draft.access.filter((id) => id !== m.id),
                          })
                        }
                      />
                      <span>
                        {m.name}
                        <small>{ROLE_POLICIES[m.role].label}</small>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="result-hint">
                    Chưa có thành viên khác để cấp quyền.
                  </p>
                )}
              </section>
              <footer className="task-editor-footer">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={closeEditor}
                >
                  Hủy
                </button>
                <button
                  className="primary-button"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Đang lưu…" : "Lưu kênh"}
                </button>
              </footer>
            </form>
          )}
        </Drawer>
      )}
      {view && (
        <Drawer
          title={`Đăng nhập · ${view.name}`}
          description="Chỉ hiển thị khi có quyền. Mỗi lần mở thông tin đều được ghi nhật ký."
          onClose={() => {
            if (!busy) {
              setView(null);
              setCredentials(null);
              setReveal(false);
            }
          }}
        >
          <div className="social-secret account-form">
            {secretError && <Notice>{secretError}</Notice>}
            {credentials ? (
              <>
                <label>
                  Tài khoản đăng nhập
                  <input
                    readOnly
                    autoComplete="off"
                    value={credentials.username}
                  />
                </label>
                <label>
                  Mật khẩu kênh
                  <div className="social-password">
                    <input
                      readOnly
                      autoComplete="off"
                      type={reveal ? "text" : "password"}
                      value={credentials.password}
                    />
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={
                        reveal ? "Ẩn mật khẩu kênh" : "Hiện mật khẩu kênh"
                      }
                      onClick={() => setReveal(!reveal)}
                    >
                      {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <p className="result-hint">
                  Tự ẩn sau 60 giây hoặc khi chuyển sang tab khác.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setCredentials(null);
                    setReveal(false);
                  }}
                >
                  Ẩn thông tin ngay
                </button>
              </>
            ) : (
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => void showCredentials()}
              >
                <KeyRound size={16} />
                {busy ? "Đang mở…" : "Xem thông tin"}
              </button>
            )}
          </div>
        </Drawer>
      )}
    </DashboardShell>
  );
}
