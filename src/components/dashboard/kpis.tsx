"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CheckCheck,
  ClipboardList,
  Plus,
  RefreshCw,
  Target,
} from "lucide-react";
import { DashboardShell } from "./shell";
import { useMember } from "./session";
import { isFullAccess, ROLE_POLICIES } from "../../lib/security/rbac";
import {
  OUTPUT_TYPES,
  currentMonth,
  kpiProgress,
  monthLabel,
  type Kpi,
  type OutputType,
} from "../../lib/kpis";
import type { Member } from "../../lib/auth/types";
import type { SocialChannel } from "../../lib/social";
import {
  Drawer,
  EmptyState,
  LoadingState,
  Notice,
  Pagination,
  Panel,
} from "./ui";
type Extra = {
  id: string;
  title: string;
  assignee_id: string;
  assignee_name: string;
  channel_id: string | null;
  channel_name: string | null;
  output_type: OutputType;
  delivered_quantity: number;
  delivered_on: string;
};
type Draft = {
  id?: string;
  version?: number;
  assignee_id: string;
  channel_id: string;
  month: string;
  output_type: OutputType;
  target: number;
  notes: string;
  active: boolean;
};
export function KpisPage() {
  const member = useMember(),
    full = isFullAccess(member.role),
    params = useSearchParams();
  const [month, setMonth] = useState(currentMonth()),
    [kpis, setKpis] = useState<Kpi[]>([]),
    [extras, setExtras] = useState<Extra[]>([]),
    [channels, setChannels] = useState<SocialChannel[]>([]),
    [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [person, setPerson] = useState("all"),
    [channel, setChannel] = useState(params.get("channel") || "all"),
    [includePaused, setIncludePaused] = useState(false),
    [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Draft | null>(null),
    [baseline, setBaseline] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/kpis?month=${month}`, { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setKpis(d.kpis);
      setExtras(d.extras);
      const cr = await fetch("/api/social-channels", { cache: "no-store" }),
        cd = await cr.json();
      if (!cr.ok) throw new Error(cd.error);
      setChannels(cd.channels);
      if (full) {
        const mr = await fetch("/api/members", { cache: "no-store" }),
          md = await mr.json();
        if (!mr.ok) throw new Error(md.error);
        setMembers(
          md.members.filter(
            (m: Member) =>
              m.active && ROLE_POLICIES[m.role].taskScope !== "none",
          ),
        );
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không tải được KPI. Hãy thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, [month, full]);
  useEffect(() => {
    void load();
  }, [load]);
  function edit(k?: Kpi) {
    const d: Draft = k
      ? {
          id: k.id,
          version: k.version,
          assignee_id: k.assignee_id,
          channel_id: k.channel_id,
          month: k.month,
          output_type: k.output_type,
          target: k.target,
          notes: k.notes,
          active: k.active,
        }
      : {
          assignee_id: member.id,
          channel_id:
            channel === "all"
              ? channels.find((c) => c.active)?.id || ""
              : channel,
          month,
          output_type: "post",
          target: 20,
          notes: "",
          active: true,
        };
    setDraft(d);
    setBaseline(JSON.stringify(d));
    setError("");
    setMessage("");
  }
  function close() {
    if (busy) return;
    if (
      draft &&
      JSON.stringify(draft) !== baseline &&
      !window.confirm("KPI chưa lưu. Đóng và bỏ thay đổi?")
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
    const body = draft.id
      ? {
          id: draft.id,
          version: draft.version,
          target: draft.target,
          notes: draft.notes,
          active: draft.active,
        }
      : draft;
    try {
      const r = await fetch("/api/kpis", {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDraft(null);
      if (draft.month !== month) setMonth(draft.month);
      else await load();
      setMessage(
        "Đã lưu chỉ tiêu KPI. Thành viên có thể xem và liên kết công việc.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa lưu được KPI.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = kpis.filter(
      (k) =>
        (includePaused || k.active) &&
        (person === "all" || k.assignee_id === person) &&
        (channel === "all" || k.channel_id === channel),
    ),
    extra = extras.filter(
      (t) =>
        (person === "all" || t.assignee_id === person) &&
        (channel === "all" || t.channel_id === channel),
    );
  const active = filtered.filter((k) => k.active),
    met = active.filter((k) => k.delivered >= k.target),
    over = active.filter((k) => k.delivered > k.target),
    currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 8))),
    visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const people = Array.from(
    new Map(
      [...kpis, ...extras].map((k) => [k.assignee_id, k.assignee_name]),
    ).entries(),
  );
  return (
    <DashboardShell
      title="KPI tháng"
      description="Theo dõi chỉ tiêu, sản lượng hoàn thành và công việc ngoài KPI theo từng tháng."
      actions={
        full ? (
          <button
            className="primary-button"
            disabled={loading}
            onClick={() => edit()}
          >
            <Plus size={17} />
            Giao KPI
          </button>
        ) : (
          <Link className="primary-button" href="/admin/tasks?create=1">
            <Plus size={17} />
            Ghi nhận công việc
          </Link>
        )
      }
    >
      {error && !draft && <Notice>{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <div className="kpi-toolbar">
        <label>
          Tháng theo dõi
          <input
            aria-label="Tháng KPI"
            type="month"
            min="2000-01"
            max="2100-12"
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                setMonth(e.target.value);
                setPage(1);
              }
            }}
          />
        </label>
        <select
          aria-label="Lọc nhân sự KPI"
          value={person}
          onChange={(e) => {
            setPerson(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Mọi nhân sự trong phạm vi</option>
          {people.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc kênh KPI"
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Mọi kênh</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          className="secondary-button"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>
      {loading ? (
        <LoadingState label="Đang tải KPI…" />
      ) : (
        <>
          <div className="summary-grid kpi-summary">
            {[
              {
                label: "KPI đang theo dõi",
                value: active.length,
                icon: Target,
                tone: "neutral",
              },
              {
                label: "Đạt chỉ tiêu",
                value: met.length,
                icon: CheckCheck,
                tone: "green",
              },
              {
                label: "Vượt chỉ tiêu",
                value: over.length,
                icon: ArrowUpRight,
                tone: "brand",
              },
              {
                label: "Việc ngoài KPI đã xong",
                value: extra.length,
                icon: ClipboardList,
                tone: "amber",
              },
            ].map((s) => (
              <div className={`summary-tile ${s.tone}`} key={s.label}>
                <span className="summary-icon">
                  <s.icon size={21} />
                </span>
                <div>
                  <span>{s.label}</span>
                  <strong>{s.value}</strong>
                </div>
              </div>
            ))}
          </div>
          <Panel
            className="kpi-target-panel"
            title={`Chỉ tiêu tháng ${monthLabel(month)}`}
            description="Tiến độ = sản lượng của việc đã hoàn thành trong tháng / chỉ tiêu. Mỗi công việc chỉ được cộng một lần theo số hiện tại."
            action={
              <label className="social-archived">
                <input
                  type="checkbox"
                  checked={includePaused}
                  onChange={(e) => setIncludePaused(e.target.checked)}
                />
                Gồm KPI tạm dừng
              </label>
            }
          >
            {!visible.length ? (
              <EmptyState
                title="Chưa có KPI phù hợp"
                description={
                  full
                    ? "Giao chỉ tiêu theo người, kênh và loại sản phẩm để bắt đầu theo dõi."
                    : "Chỉ tiêu được giao cho bạn sẽ xuất hiện tại đây. Có thể ghi nhận các việc ngoài KPI ở tab Công việc."
                }
                action={
                  full ? (
                    <button className="primary-button" onClick={() => edit()}>
                      <Plus size={16} />
                      Giao KPI đầu tiên
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="kpi-grid">
                {visible.map((k) => {
                  const progress = kpiProgress(k);
                  return (
                    <article key={k.id} className="kpi-card">
                      <div className="kpi-card-head">
                        <div>
                          <h3>
                            {OUTPUT_TYPES[k.output_type].label} ·{" "}
                            {k.channel_name}
                          </h3>
                          <p>
                            {k.assignee_name} · {monthLabel(k.month)}
                          </p>
                        </div>
                        <span
                          className={`kpi-state ${!k.active ? "paused" : progress.excess ? "over" : progress.remaining ? "pending" : "met"}`}
                        >
                          {!k.active
                            ? "Tạm dừng"
                            : progress.excess
                              ? "Vượt KPI"
                              : progress.remaining
                                ? "Còn thiếu"
                                : "Đạt KPI"}
                        </span>
                      </div>
                      <div className="kpi-numbers">
                        <strong>
                          {k.delivered}
                          <span>
                            {" "}
                            / {k.target} {OUTPUT_TYPES[k.output_type].unit}
                          </span>
                        </strong>
                        <b>{progress.percent}%</b>
                      </div>
                      <progress
                        max={k.target}
                        value={Math.min(k.delivered, k.target)}
                        aria-label={`Tiến độ KPI ${k.channel_name} ${k.assignee_name}`}
                      />
                      <div className="kpi-progress-caption">
                        <span>
                          {progress.excess
                            ? `Vượt ${progress.excess} ${OUTPUT_TYPES[k.output_type].unit}`
                            : progress.remaining
                              ? `Còn ${progress.remaining} ${OUTPUT_TYPES[k.output_type].unit}`
                              : "Đã đủ chỉ tiêu"}
                        </span>
                        <span>
                          {k.task_count} việc · Dự kiến {k.planned}{" "}
                          {OUTPUT_TYPES[k.output_type].unit}
                        </span>
                      </div>
                      {k.outside_month > 0 && (
                        <p className="kpi-note">
                          {k.outside_month} {OUTPUT_TYPES[k.output_type].unit}{" "}
                          hoàn thành ngoài tháng, chưa cộng vào chỉ tiêu tháng
                          này.
                        </p>
                      )}
                      {k.notes && <p className="kpi-note">{k.notes}</p>}
                      <div className="kpi-actions">
                        <Link
                          className="secondary-button"
                          href={`/admin/tasks?kpi=${k.id}`}
                        >
                          Xem công việc
                        </Link>
                        {k.active && (
                          <Link
                            className="secondary-button"
                            href={`/admin/tasks?kpi=${k.id}&create=1`}
                          >
                            Lập công việc
                          </Link>
                        )}
                        {full && (
                          <button
                            className="icon-button"
                            aria-label={`Sửa KPI ${k.channel_name} ${k.assignee_name}`}
                            onClick={() => edit(k)}
                          >
                            <Target size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <Pagination
              page={currentPage}
              total={filtered.length}
              pageSize={8}
              onChange={setPage}
            />
          </Panel>
          <Panel
            className="kpi-extra-panel"
            title="Công việc ngoài KPI"
            action={
              <Link className="secondary-button" href="/admin/tasks?kpi=none">
                Xem mọi việc ngoài KPI
              </Link>
            }
            description="Các việc đã hoàn thành trong tháng chưa gắn chỉ tiêu. Hiển thị riêng từng loại sản lượng để tránh cộng lẫn bài viết với video."
          >
            {!extra.length ? (
              <EmptyState
                title="Chưa có việc ngoài KPI đã hoàn thành"
                description="Khi có kết quả ngoài chỉ tiêu, ghi nhận trong Công việc và chọn Không gắn KPI."
              />
            ) : (
              <div className="table-scroll">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Công việc</th>
                      <th>Người thực hiện</th>
                      <th>Kênh</th>
                      <th>Sản lượng</th>
                      <th>Ngày sản lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extra.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <Link
                            className="table-task-title"
                            href={`/admin/tasks?task=${t.id}`}
                          >
                            {t.title}
                          </Link>
                        </td>
                        <td>{t.assignee_name}</td>
                        <td>{t.channel_name || "Chưa gắn kênh"}</td>
                        <td>
                          {t.delivered_quantity}{" "}
                          {OUTPUT_TYPES[t.output_type].unit}
                          <small className="task-channel-label">
                            {OUTPUT_TYPES[t.output_type].label}
                          </small>
                        </td>
                        <td>
                          {t.delivered_on?.split("-").reverse().join("/")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <p className="kpi-disclaimer">
            Sản lượng do người thực hiện báo cáo; đạt KPI số lượng chưa thay thế
            bước duyệt chất lượng. Công việc đang làm chưa được cộng vào sản
            lượng hoàn thành.
          </p>
        </>
      )}
      {draft && (
        <Drawer
          title={draft.id ? "Điều chỉnh KPI" : "Giao KPI theo tháng"}
          description="Một chỉ tiêu cho mỗi người, kênh, loại sản phẩm và tháng."
          onClose={close}
        >
          <form className="account-form task-editor" onSubmit={save}>
            {error && <Notice>{error}</Notice>}
            <fieldset
              className="kpi-identity"
              disabled={Boolean(draft.id) || busy}
            >
              <label>
                Nhân sự nhận KPI
                <select
                  required
                  aria-label="Nhân sự nhận KPI"
                  value={draft.assignee_id}
                  onChange={(e) =>
                    setDraft({ ...draft, assignee_id: e.target.value })
                  }
                >
                  {draft.id &&
                    !members.some((m) => m.id === draft.assignee_id) && (
                      <option value={draft.assignee_id}>
                        {kpis.find((k) => k.id === draft.id)?.assignee_name}
                      </option>
                    )}
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Kênh được giao
                <select
                  required
                  aria-label="Kênh được giao KPI"
                  value={draft.channel_id}
                  onChange={(e) =>
                    setDraft({ ...draft, channel_id: e.target.value })
                  }
                >
                  <option value="">Chọn kênh</option>
                  {channels
                    .filter((c) => c.active || c.id === draft.channel_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="field-pair">
                <label>
                  Tháng giao KPI
                  <input
                    required
                    type="month"
                    min="2000-01"
                    max="2100-12"
                    value={draft.month}
                    onChange={(e) =>
                      setDraft({ ...draft, month: e.target.value })
                    }
                  />
                </label>
                <label>
                  Loại sản phẩm
                  <select
                    aria-label="Loại sản phẩm KPI"
                    value={draft.output_type}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        output_type: e.target.value as OutputType,
                      })
                    }
                  >
                    {Object.entries(OUTPUT_TYPES).map(([id, v]) => (
                      <option key={id} value={id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>
            <label>
              Chỉ tiêu ({OUTPUT_TYPES[draft.output_type].unit})
              <input
                aria-label="Chỉ tiêu KPI"
                required
                type="number"
                min={1}
                max={100000}
                step={1}
                value={draft.target}
                onChange={(e) =>
                  setDraft({ ...draft, target: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Yêu cầu và ghi chú
              <textarea
                aria-label="Ghi chú KPI"
                rows={4}
                maxLength={3000}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Nội dung trọng tâm, tiêu chuẩn bàn giao…"
              />
            </label>
            <label className="social-checkbox kpi-active">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.checked })
                }
              />
              Đang theo dõi chỉ tiêu này
            </label>
            {draft.id && (
              <p className="result-hint">
                Giữ nguyên người, kênh, loại sản phẩm và tháng để bảo toàn đối
                chiếu. Mọi thay đổi chỉ tiêu được ghi nhật ký.
              </p>
            )}
            <footer className="task-editor-footer">
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={close}
              >
                Hủy
              </button>
              <button className="primary-button" disabled={busy} type="submit">
                {busy ? "Đang lưu…" : "Lưu KPI"}
              </button>
            </footer>
          </form>
        </Drawer>
      )}
    </DashboardShell>
  );
}
