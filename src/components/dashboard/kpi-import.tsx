"use client";
import { useState } from "react";
import { Download, Upload, Check } from "lucide-react";
import { Drawer, Notice } from "./ui";
import { OUTPUT_TYPES } from "../../lib/kpis";
import { parseKpiImport, type ImportPreviewRow } from "../../lib/kpi-import";
import type { Member } from "../../lib/auth/types";
import type { SocialChannel } from "../../lib/social";
export function KpiImport({
  members,
  channels,
  onClose,
  onDone,
}: {
  members: Member[];
  channels: SocialChannel[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [text, setText] = useState(""),
    [mode, setMode] = useState("create"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [preview, setPreview] = useState<{
      rows: ImportPreviewRow[];
      summary: { create: number; update: number; errors: number };
      fingerprint: string;
    } | null>(null),
    [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [batch, setBatch] = useState("");
  function change(value: string) {
    setText(value);
    setPreview(null);
    setError("");
  }
  async function inspect() {
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const parsed = parseKpiImport(text);
      const r = await fetch("/api/kpis/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: parsed, mode, stage: "preview" }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRows(parsed);
      setBatch(crypto.randomUUID());
      setPreview(d);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không đọc được dữ liệu import.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/kpis/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows,
            mode,
            stage: "commit",
            fingerprint: preview.fingerprint,
            import_id: batch,
          }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const months = [...new Set(preview.rows.map((r) => r.month))].join(", ");
      onDone(
        `Đã import ${d.imported} KPI: ${d.created} mới, ${d.updated} cập nhật. Các tháng: ${months}. Chọn tháng tương ứng để xem.`,
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Chưa nhận được kết quả. Có thể bấm xác nhận lại với cùng lần import; hệ thống không tạo trùng.",
      );
    } finally {
      setBusy(false);
    }
  }
  function directory() {
    const data = {
      nhan_su: members.map((m) => ({ ten: m.name, email_nhan_su: m.email })),
      kenh: channels
        .filter((c) => c.active)
        .map((c) => ({
          kenh: c.id,
          ten: c.name,
          nen_tang: c.platform,
          dinh_danh: c.handle,
          url: c.url,
        })),
      huong_dan:
        "Dùng email_nhan_su và UUID kenh chính xác. Một dòng cho mỗi người × kênh × tháng × loại sản phẩm. Chỉ tiêu là số nguyên; không tự tạo người/kênh mới.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "danh-muc-doi-chieu-kpi.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Drawer
      title="Import KPI hàng loạt"
      description="Xem trước, đối chiếu nhân sự/kênh và kiểm tra toàn bộ dòng trước khi ghi dữ liệu."
      onClose={() => {
        if (
          !busy &&
          (!text ||
            window.confirm(
              "Đóng phần import? Nội dung chưa xác nhận sẽ không được lưu.",
            ))
        )
          onClose();
      }}
    >
      <div className="kpi-import-body">
        {error && <Notice>{error}</Notice>}
        <div className="import-tools">
          <a className="secondary-button" href="/api/kpis/import">
            <Download size={15} />
            Tải mẫu CSV
          </a>
          <button
            className="secondary-button"
            type="button"
            onClick={directory}
          >
            <Download size={15} />
            Danh mục cho AI
          </button>
        </div>
        <details className="import-instructions">
          <summary>Cách yêu cầu AI xuất kế hoạch phù hợp</summary>
          <p>
            Đưa danh mục đối chiếu cho AI và yêu cầu xuất CSV, TSV hoặc JSON với
            các cột:{" "}
            <code>
              email_nhan_su, kenh, nen_tang, thang, loai_san_pham, chi_tieu,
              ghi_chu
            </code>
            .
          </p>
          <p>
            Mỗi dòng là một KPI. Loại sản phẩm dùng: bai_viet, video_dai,
            video_doc_ngan, thiet_ke_anh, livestream, khac. Tháng dùng YYYY-MM
            hoặc MM/YYYY. Chỉ tiêu chỉ là số, ví dụ 20; yêu cầu chi tiết đặt
            trong ghi_chu. Dùng UUID kênh nếu tên/@định danh bị trùng.
          </p>
          <p>
            File Excel: lưu CSV UTF-8, hoặc sao chép vùng bảng và dán bên dưới.
            Chưa nhập KPI lượt xem, lead, doanh thu trong giai đoạn này.
          </p>
        </details>
        <fieldset className="account-form import-source" disabled={busy}>
          <label>
            Chế độ import
            <select
              aria-label="Chế độ import KPI"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setPreview(null);
              }}
            >
              <option value="create">Chỉ tạo KPI mới</option>
              <option value="update">Tạo mới và cập nhật KPI trùng khóa</option>
            </select>
          </label>
          <p className="result-hint">
            Cập nhật sẽ thay chỉ tiêu/ghi chú sau khi xem trước, giữ nguyên công
            việc và lịch sử. Không cộng dồn chỉ tiêu, không tự bật lại KPI tạm
            dừng.
          </p>
          <label className="import-file">
            <Upload size={16} />
            Chọn CSV / TSV / JSON
            <input
              aria-label="File import KPI"
              type="file"
              accept=".csv,.tsv,.json,text/csv,application/json,text/tab-separated-values"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 1500000) {
                  setError("File tối đa 1,5 MB.");
                  return;
                }
                change(await f.text());
              }}
            />
          </label>
          <label>
            Dữ liệu KPI
            <textarea
              aria-label="Dữ liệu import KPI"
              rows={9}
              value={text}
              onChange={(e) => change(e.target.value)}
              placeholder={
                "email_nhan_su,kenh,nen_tang,thang,loai_san_pham,chi_tieu,ghi_chu\n"
              }
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            disabled={!text.trim()}
            onClick={() => void inspect()}
          >
            {busy ? "Đang kiểm tra…" : "Xem trước KPI"}
          </button>
        </fieldset>
        {preview && (
          <section className="import-preview">
            <h3>Kết quả đối chiếu</h3>
            <p>
              {preview.summary.create} mới · {preview.summary.update} cập nhật ·{" "}
              {preview.summary.errors} dòng lỗi
            </p>
            {preview.summary.errors > 0 && (
              <Notice>
                Chưa lưu dòng nào. Sửa toàn bộ dòng lỗi rồi xem trước lại.
              </Notice>
            )}
            <div className="table-scroll">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Dòng / nhân sự</th>
                    <th>Kênh / tháng</th>
                    <th>Chỉ tiêu</th>
                    <th>Kiểm tra</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line}>
                      <td>
                        {r.line} · {r.assignee_name}
                      </td>
                      <td>
                        {r.channel_name}
                        <small className="task-channel-label">
                          {r.month} ·{" "}
                          {r.output_type
                            ? OUTPUT_TYPES[r.output_type].label
                            : "Chưa khớp loại"}
                        </small>
                      </td>
                      <td>
                        {r.existing_target !== null
                          ? `${r.existing_target} → `
                          : ""}
                        {r.target}
                      </td>
                      <td>
                        {r.errors.length ? (
                          <ul className="import-row-errors">
                            {r.errors.map((e) => (
                              <li key={e}>{e}</li>
                            ))}
                          </ul>
                        ) : r.action === "create" ? (
                          "Tạo mới"
                        ) : (
                          "Cập nhật"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="primary-button import-confirm"
              type="button"
              disabled={busy || preview.summary.errors > 0}
              onClick={() => void commit()}
            >
              <Check size={16} />
              {busy
                ? "Đang lưu…"
                : `Xác nhận import ${preview.rows.length} KPI`}
            </button>
          </section>
        )}
      </div>
    </Drawer>
  );
}
