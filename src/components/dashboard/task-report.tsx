"use client";
import { matchDeadlineKpi } from "../../lib/task-planning";
import { useCallback, useEffect, useState } from "react";
import { Check, ImagePlus, Plus, RefreshCw, X } from "lucide-react";
import {
  TASK_STATUSES,
  validEvidenceUrl,
  type Task,
  type TaskReport,
} from "../../lib/tasks";
import Link from "next/link";
import {
  OUTPUT_TYPES,
  SELECTABLE_OUTPUT_TYPES,
  monthLabel,
  kpiProgress,
  type Kpi,
  type OutputType,
} from "../../lib/kpis";
import type { SocialChannel } from "../../lib/social";
import { Notice, StatusBadge } from "./ui";
import { ChannelMultiSelect } from "./channel-picker";
function timestamp(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function EvidenceImage({ url, index }: { url: string; index: number }) {
  const [failed, setFailed] = useState(false),
    [expanded, setExpanded] = useState(false);
  return (
    <div className={`evidence-preview ${expanded ? "expanded" : ""}`}>
      {failed ? (
        <div className="evidence-unavailable">
          <ImagePlus size={22} />
          <span>
            Không tải được ảnh. Dùng link ảnh trực tiếp có quyền xem công khai.
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="evidence-image"
          aria-label={`${expanded ? "Thu nhỏ" : "Phóng to"} ảnh minh chứng ${index + 1}`}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {/* External URLs load in the browser only; never proxy arbitrary URLs through the server. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Ảnh minh chứng ${index + 1}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
          <span>{expanded ? "Thu nhỏ" : "Bấm để phóng to"}</span>
        </button>
      )}
      <p className="evidence-url">{url}</p>
    </div>
  );
}
export function TaskResult({
  task,
  canReport,
  onSaved,
  onBusy,
  onDirty,
  channels,
  kpis,
}: {
  task: Task;
  channels: SocialChannel[];
  kpis: Kpi[];
  canReport: boolean;
  onSaved: (task: Task) => void;
  onBusy: (busy: boolean) => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [kpiId, setKpiId] = useState(task.kpi_id ?? ""),
    [outputType, setOutputType] = useState<OutputType>(task.output_type),
    [quantity, setQuantity] = useState(task.delivered_quantity),
    [deliveredOn, setDeliveredOn] = useState(task.delivered_on ?? "");
  const selectedKpi = kpis.find((k) => k.id === kpiId);
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [channelIds, setChannelIds] = useState(task.channel_ids?.length ? task.channel_ids : task.channel_id ? [task.channel_id] : []);
  const automaticGoal = task.due_at ? matchDeadlineKpi(kpis,{assignee_id:task.assignee_id,channel_ids:channelIds,output_type:outputType,due_at:task.due_at},task.kpi_id) : null;
  const automaticId = task.due_at ? automaticGoal?.id ?? "" : task.kpi_id ?? "";
  useEffect(() => {setKpiId(automaticId);},[automaticId]);
  const [status, setStatus] = useState(task.status),
    [result, setResult] = useState(task.result_text),
    [links, setLinks] = useState(task.evidence_links);
  const [checklist, setChecklist] = useState(task.checklist),
    [link, setLink] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [history, setHistory] = useState<TaskReport[]>([]),
    [historyLoading, setHistoryLoading] = useState(true),
    [historyError, setHistoryError] = useState("");
  const dirty =
    canReport &&
    (kpiId !== (task.kpi_id ?? "") ||
      outputType !== task.output_type ||
      quantity !== task.delivered_quantity ||
      deliveredOn !== (task.delivered_on ?? "") ||
      JSON.stringify(channelIds) !== JSON.stringify(task.channel_ids?.length ? task.channel_ids : task.channel_id ? [task.channel_id] : []) ||
      status !== task.status ||
      result !== task.result_text ||
      JSON.stringify(links) !== JSON.stringify(task.evidence_links) ||
      JSON.stringify(checklist) !== JSON.stringify(task.checklist) ||
      Boolean(link.trim()));
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const r = await fetch(`/api/tasks/report?id=${task.id}`, {
          cache: "no-store",
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setHistory(d.reports);
    } catch (e) {
      setHistoryError(
        e instanceof Error ? e.message : "Không tải được lịch sử.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [task.id]);
  useEffect(() => {
    void loadHistory();
  }, [loadHistory, task.report_version]);
  function addLinks(raw: string) {
    const values = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!values.length) return;
    if (values.some((v) => !validEvidenceUrl(v))) {
      setError(
        "Dán link HTTP/HTTPS hợp lệ. Link ảnh trực tiếp sẽ hiện preview bên dưới.",
      );
      return;
    }
    const next = [...new Set([...links, ...values])];
    if (next.length > 10) {
      setError("Mỗi công việc lưu tối đa 10 link minh chứng.");
      return;
    }
    setLinks(next);
    setLink("");
    setError("");
    setMessage("");
  }
  async function reloadLatest() {
    if (
      !window.confirm(
        "Tải bản mới nhất sẽ thay thế phần kết quả chưa lưu. Tiếp tục?",
      )
    )
      return;
    setBusy(true);
    onBusy(true);
    try {
      const r = await fetch(`/api/tasks?id=${task.id}`, { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const latest: Task = d.tasks[0];
      setKpiId(latest.kpi_id ?? "");
      setOutputType(latest.output_type);
      setQuantity(latest.delivered_quantity);
      setDeliveredOn(latest.delivered_on ?? "");
      setChannelIds(latest.channel_ids?.length ? latest.channel_ids : latest.channel_id ? [latest.channel_id] : []);
      setStatus(latest.status);
      setResult(latest.result_text);
      setLinks(latest.evidence_links);
      setChecklist(latest.checklist);
      setLink("");
      onSaved(latest);
      setConflict(false);
      setError("");
      setMessage("Đã tải phiên bản mới nhất.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được công việc.");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (link.trim()) {
      setError("Bấm Thêm ảnh để đưa link đang nhập vào kết quả trước khi lưu.");
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/tasks/report", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: task.id,
            version: task.report_version,
            channel_ids: channelIds,
            kpi_id: kpiId || null,
            output_type: outputType,
            delivered_quantity: quantity,
            delivered_on: deliveredOn || null,
            status,
            result_text: result,
            evidence_links: links,
            completed_items: checklist.filter((c) => c.done).map((c) => c.id),
          }),
        }),
        d = await r.json();
      if (!r.ok) {
        setConflict(r.status === 409);
        throw new Error(d.error);
      }
      setConflict(false);
      setKpiId(d.task.kpi_id ?? "");
      setOutputType(d.task.output_type);
      setQuantity(d.task.delivered_quantity);
      setDeliveredOn(d.task.delivered_on ?? "");
      setResult(d.task.result_text);
      setChannelIds(d.task.channel_ids?.length ? d.task.channel_ids : d.task.channel_id ? [d.task.channel_id] : []);
      setStatus(d.task.status);
      setLinks(d.task.evidence_links);
      setChecklist(d.task.checklist);
      onSaved({ ...task, ...d.task });
      setMessage("Đã lưu kết quả và tiến độ công việc.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Chưa lưu được kết quả. Hãy thử lại.",
      );
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="task-result">
      <div className="result-heading">
        <h3>Kết quả & tiến độ</h3>
        <p>
          {canReport
            ? "Cập nhật kết quả tại đây, kèm hình ảnh để người quản lý theo dõi."
            : "Kết quả và minh chứng do người thực hiện cập nhật."}
        </p>
      </div>
      {error && <Notice>{error}</Notice>}
      {conflict && (
        <button
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={() => void reloadLatest()}
        >
          <RefreshCw size={15} />
          Tải bản mới nhất
        </button>
      )}
      {message && <Notice tone="success">{message}</Notice>}
      {selectedKpi && (
        <div className="task-kpi-progress">
          <strong>
            KPI tháng {monthLabel(selectedKpi.month)} ·{" "}
            {selectedKpi.assignee_name}
          </strong>
          <span>
            {selectedKpi.delivered}/{selectedKpi.target}{" "}
            {OUTPUT_TYPES[selectedKpi.output_type].unit} ·{" "}
            {kpiProgress(selectedKpi).percent}%
          </span>
          <Link href={`/admin/kpis?channel=${selectedKpi.channel_id}`}>
            Xem hiệu suất theo tháng
          </Link>
        </div>
      )}
      {selectedKpi &&
        status === "completed" &&
        (deliveredOn || today).slice(0, 7) !== selectedKpi.month && (
          <Notice tone="info">
            Ngày sản lượng nằm ngoài tháng {monthLabel(selectedKpi.month)}. Kết
            quả vẫn được lưu nhưng chưa cộng vào KPI của tháng này.
          </Notice>
        )}
      <form className="account-form result-form" onSubmit={submit}>
        <fieldset disabled={!canReport || busy}>
          <section className="task-kpi-fields">
            <h4>KPI & sản lượng thực tế</h4>
            <label>
              Chỉ tiêu liên quan
              <input aria-label="KPI báo cáo" readOnly value={selectedKpi ? `${OUTPUT_TYPES[selectedKpi.output_type].label} · ${selectedKpi.channel_name} · ${monthLabel(selectedKpi.month)}` : "Không gắn KPI · công việc ngoài chỉ tiêu"} />
            </label>
            <div className="field-pair">
              <label>
                Loại sản phẩm
                <select
                  aria-label="Loại sản phẩm báo cáo"
                  disabled={!canReport || busy}
                  value={outputType}
                  onChange={(e) => setOutputType(e.target.value as OutputType)}
                >
                  {SELECTABLE_OUTPUT_TYPES.map(([id, v]) => (
                    <option key={id} value={id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Sản lượng hoàn thành
                <input
                  aria-label="Sản lượng hoàn thành"
                  type="number"
                  required
                  min={0}
                  max={100000}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </label>
            </div>
            <label>
              Ngày sản lượng
              <input
                aria-label="Ngày sản lượng"
                type="date"
                min="2000-01-01"
                max={today}
                value={deliveredOn}
                onChange={(e) => setDeliveredOn(e.target.value)}
              />
            </label>
            <p className="result-hint">
              Dự kiến {task.planned_quantity} {OUTPUT_TYPES[outputType].unit}.
              Chỉ sản lượng của việc đã hoàn thành trong đúng tháng KPI mới được
              cộng; 0 nghĩa là chưa ghi nhận sản lượng. Để trống ngày khi hoàn
              thành sẽ lấy ngày hôm nay.
            </p>
          </section>
          <label>
            Kênh thực hiện
            <ChannelMultiSelect
              ariaLabel="Kênh báo cáo"
              values={channelIds}
              channels={channels.filter(
                (c) => c.active || channelIds.includes(c.id),
              )}
              onChange={(values) => {
                setChannelIds(values);
                if (selectedKpi && !values.includes(selectedKpi.channel_id)) setKpiId("");
              }}
            />
          </label>
          {kpiId && (
            <p className="result-hint">
              KPI tự đối chiếu theo kênh chính, loại sản phẩm và tháng hạn hoàn thành.
            </p>
          )}
          <label>
            Tiến độ công việc
            <select
              aria-label="Tiến độ báo cáo"
              value={status}
              onChange={(e) => setStatus(e.target.value as Task["status"])}
            >
              {Object.entries(TASK_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="result-complete">
            <input
              type="checkbox"
              checked={status === "completed"}
              onChange={(e) =>
                setStatus(e.target.checked ? "completed" : "in_progress")
              }
            />
            Đã hoàn thành công việc
          </label>
          {checklist.length > 0 && (
            <section className="task-checklist">
              <h4>
                Các bước thực hiện{" "}
                <span>
                  {checklist.filter((c) => c.done).length}/{checklist.length}
                </span>
              </h4>
              {checklist.map((item) => (
                <label className="checklist-item" key={item.id}>
                  <input
                    type="checkbox"
                    aria-label={`Báo cáo hoàn tất ${item.title}`}
                    checked={item.done}
                    onChange={(e) =>
                      setChecklist(
                        checklist.map((c) =>
                          c.id === item.id
                            ? { ...c, done: e.target.checked }
                            : c,
                        ),
                      )
                    }
                  />
                  <span>{item.title}</span>
                </label>
              ))}
            </section>
          )}
          <label>
            Kết quả thực hiện
            <textarea
              aria-label="Kết quả thực hiện"
              rows={5}
              maxLength={10000}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Đã thực hiện những gì? Kết quả, số liệu đạt được, link bài đăng hoặc vướng mắc cần hỗ trợ…"
            />
          </label>
        </fieldset>
        {task.channel_url && (
          <a
            className="task-channel-link"
            href={task.channel_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mở kênh {task.channel_name}
          </a>
        )}
        {!canReport && !result && (
          <p className="result-hint">Chưa có kết quả được báo cáo.</p>
        )}
        <section className="result-evidence">
          <h4>
            <ImagePlus size={17} />
            Hình ảnh minh chứng <span>{links.length}/10</span>
          </h4>
          <p className="result-hint">
            Dán link ảnh trực tiếp để xem ngay tại đây. Link Drive hoặc trang
            web có thể không hiển thị ảnh; bạn vẫn có thể lưu làm nguồn đối
            chiếu.
          </p>
          {canReport && (
            <div className="evidence-add">
              <input
                aria-label="Link ảnh minh chứng"
                type="url"
                maxLength={2048}
                value={link}
                disabled={busy}
                placeholder="https://…/ket-qua.jpg"
                onChange={(e) => setLink(e.target.value)}
                onPaste={(e) => {
                  const raw = e.clipboardData.getData("text");
                  if (
                    raw.trim() &&
                    raw
                      .split(/\r?\n/)
                      .filter(Boolean)
                      .every((v) => validEvidenceUrl(v.trim()))
                  ) {
                    e.preventDefault();
                    addLinks(raw);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLinks(link);
                  }
                }}
              />
              <button
                className="secondary-button"
                type="button"
                disabled={busy || !link.trim()}
                onClick={() => addLinks(link)}
              >
                <Plus size={16} />
                Thêm ảnh
              </button>
            </div>
          )}
          <div className="evidence-list">
            {links.map((url, index) => (
              <div className="evidence-item" key={url}>
                <EvidenceImage url={url} index={index} />
                {canReport && (
                  <button
                    type="button"
                    className="icon-button"
                    disabled={busy}
                    aria-label={`Xóa ảnh minh chứng ${index + 1}`}
                    onClick={() => setLinks(links.filter((v) => v !== url))}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        {task.completed_at && (
          <p className="result-completed-at">
            Hoàn thành lúc {timestamp(task.completed_at)}
          </p>
        )}
        {canReport && (
          <button
            className="primary-button result-save"
            disabled={busy}
            type="submit"
          >
            <Check size={16} />
            {busy ? "Đang lưu…" : "Lưu kết quả & tiến độ"}
          </button>
        )}
      </form>
      <section className="result-history">
        <h3>Lịch sử cập nhật</h3>
        <p className="result-hint">
          Lưu người cập nhật, trạng thái và kết quả để đối chiếu tiến độ sau
          này. Hiển thị 50 lần gần nhất.
        </p>
        {historyLoading ? (
          <p role="status">Đang tải lịch sử…</p>
        ) : historyError ? (
          <>
            <Notice>{historyError}</Notice>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadHistory()}
            >
              <RefreshCw size={15} />
              Tải lại lịch sử
            </button>
          </>
        ) : !history.length ? (
          <p className="result-hint">Chưa có lần cập nhật nào được ghi nhận.</p>
        ) : (
          <ol>
            {history.map((entry) => (
              <li key={entry.id}>
                <div className="history-meta">
                  <strong>{entry.actor_name}</strong>
                  <time dateTime={entry.created_at}>
                    {timestamp(entry.created_at)}
                  </time>
                </div>
                <StatusBadge status={entry.status} />
                <p className="task-channel-label">
                  {entry.delivered_quantity}{" "}
                  {OUTPUT_TYPES[entry.output_type].unit} ·{" "}
                  {entry.kpi_id ? "Trong KPI" : "Ngoài KPI"}
                  {entry.delivered_on
                    ? ` · ${entry.delivered_on.split("-").reverse().join("/")}`
                    : ""}
                </p>
                {entry.channel_name && (
                  <p className="task-channel-label">{entry.channel_name}</p>
                )}
                <details>
                  <summary>Xem kết quả tại thời điểm này</summary>
                  <p className="history-text">
                    {entry.result_text || "Chưa ghi nội dung kết quả."}
                  </p>
                  {entry.checklist.length > 0 && (
                    <p className="result-hint">
                      Checklist: {entry.checklist.filter((c) => c.done).length}/
                      {entry.checklist.length}
                    </p>
                  )}
                  {entry.completed_at && (
                    <p className="result-hint">
                      Hoàn thành: {timestamp(entry.completed_at)}
                    </p>
                  )}
                  <div className="evidence-list">
                    {entry.evidence_links.map((url, index) => (
                      <EvidenceImage key={url} url={url} index={index} />
                    ))}
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
