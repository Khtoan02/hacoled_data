"use client";
import { useState } from "react";
import { Drawer, Notice } from "./ui";
import { parseTableImport } from "../../lib/table-import";
export function TaskImport({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (count: number) => void;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [preview, setPreview] = useState<{
      fingerprint: string;
      valid: number;
      errors: string[];
      rows: {
        title: string;
        kpi_id: string | null;
        planned_quantity: number;
      }[];
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [batch, setBatch] = useState("");
  async function inspect(file: File) {
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      if (file.size > 1500000) throw new Error("File tối đa 1,5 MB.");
      const r = parseTableImport(await file.text());
      const res = await fetch("/api/tasks/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: r, stage: "preview" }),
        }),
        d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setRows(r);
      setBatch(crypto.randomUUID());
      setPreview(d);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không kiểm tra được kế hoạch.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/tasks/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows,
            stage: "commit",
            import_id: batch,
            fingerprint: preview?.fingerprint,
          }),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.errors?.join("\n") || d.error);
      onDone(d.imported);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không nhận được kết quả. Bấm xác nhận lại với cùng lần import; hệ thống không tạo lại dữ liệu đã lưu.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer
      title="Import kế hoạch công việc"
      description="Import KPI trước; hệ thống tự nối công việc theo tháng hạn hoàn thành."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="kpi-import-body">
        {error && <Notice>{error}</Notice>}
        <a className="secondary-button" href="/api/tasks/import">
          Tải mẫu CSV kế hoạch
        </a>
        <p className="result-hint">
          Mỗi dòng là một công việc. Hệ thống tự gắn KPI theo người, kênh chính, loại sản phẩm và tháng hạn hoàn thành. Chưa có hạn hoặc chưa có KPI phù hợp thì ghi việc ngoài KPI. Nhiều kênh phân cách bằng |; kênh đầu tiên là kênh chính. Các dòng MẪU - được bỏ qua.
        </p>
        <label className="import-file">
          Chọn file CSV
          <input
            aria-label="File kế hoạch công việc"
            disabled={busy}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void inspect(f);
            }}
          />
        </label>
        {preview && (
          <>
            <p>
              {preview.valid} dòng được đọc · {preview.errors.length} lỗi
            </p>
            {preview.errors.length > 0 && (
              <Notice>
                <ul>
                  {preview.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Notice>
            )}
            <div className="table-scroll">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Công việc</th>
                    <th>KPI</th>
                    <th>Dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.title}</td>
                      <td>{r.kpi_id ? "Đã khớp chỉ tiêu" : "Ngoài KPI"}</td>
                      <td>{r.planned_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="primary-button"
              disabled={busy || preview.errors.length > 0 || !preview.valid}
              onClick={() => void commit()}
            >
              {busy ? "Đang lưu…" : `Xác nhận nhập ${preview.valid} công việc`}
            </button>
          </>
        )}
      </div>
    </Drawer>
  );
}
