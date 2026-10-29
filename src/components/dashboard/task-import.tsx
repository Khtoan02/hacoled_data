"use client";
import { useEffect,useState } from "react";
import { Drawer, Notice } from "./ui";
import { currentMonth,validMonth } from "../../lib/kpis";
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
      total: number;
      invalid: number;
      skipped: number;
      errors_total: number;
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
  const [templateMonth,setTemplateMonth]=useState(currentMonth());
  const [directory,setDirectory]=useState<{members:number;channels:number;goals:number;samples:number;omitted_samples:number}|null>(null),[directoryError,setDirectoryError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();setDirectory(null);setDirectoryError('');
    if(!validMonth(templateMonth))return;
    fetch(`/api/tasks/import?kind=summary&month=${templateMonth}`,{cache:'no-store',signal:controller.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setDirectory(d);}).catch(e=>{if(!controller.signal.aborted)setDirectoryError(e instanceof Error?e.message:'Chưa tải được danh mục hiện tại.');});
    return()=>controller.abort();
  },[templateMonth]);
  const templateHref=(kind:string)=>`/api/tasks/import?month=${templateMonth}&kind=${kind}`;
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
        <section className="task-template-download">
          <h3>Mẫu theo nhân sự & kênh hiện tại</h3>
          <label>Tháng cần lập kế hoạch<input aria-label="Tháng của file mẫu" type="month" min="2000-01" max="2100-12" value={templateMonth} onChange={e=>setTemplateMonth(e.target.value)}/></label>
          {directory&&<p className="result-hint">{directory.members} nhân sự · {directory.channels} kênh đang hoạt động · {directory.goals} KPI trong tháng. Chỉ gồm Trưởng phòng, Nhân viên và Thực tập Marketing.</p>}
          {directoryError&&<Notice>{directoryError}</Notice>}
          {directory?.members===0&&<Notice tone="info">Chưa có nhân sự Marketing phù hợp đang hoạt động. Mẫu chỉ có tiêu đề cột; hãy bổ sung thành viên trước khi lập kế hoạch.</Notice>}
          {directory?.omitted_samples!==undefined&&directory.omitted_samples>0&&<Notice tone="info">Mẫu gồm 500 ví dụ đầu tiên. Tải bộ tham chiếu JSON để xem đầy đủ danh mục nhân sự, kênh và KPI.</Notice>}
          {validMonth(templateMonth)&&<div className="task-template-links"><a className="primary-button" href={templateHref('plan')}>Tải mẫu CSV kế hoạch</a><a className="secondary-button" href={templateHref('members')}>Danh mục nhân sự</a><a className="secondary-button" href={templateHref('channels')}>Danh mục kênh</a><a className="secondary-button" href={templateHref('reference')}>Bộ tham chiếu cho AI (JSON)</a></div>}
        </section>
        <p className="result-hint">
          CSV mẫu điền sẵn email thật, ID kênh và ví dụ theo KPI của tháng đã chọn; đây là dòng tham khảo, chưa phải công việc đã giao. Sau khi sửa nội dung, bỏ tiền tố MẪU - ở tên việc để import. Nhiều kênh phân cách bằng |; kênh đầu tiên là kênh chính. Dùng video_doc_ngan cho Reels/Shorts/TikTok và khac cho Audit. Bộ JSON dành cho AI có danh mục và quy tắc để soạn CSV đúng hệ thống.
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
              {preview.total} dòng trong file · {preview.valid} hợp lệ · {preview.invalid} cần sửa{preview.skipped>0?` · ${preview.skipped} dòng mẫu/trống bỏ qua`:""}
            </p>
            {preview.errors_total>preview.errors.length&&<p className="result-hint">Đang hiển thị {preview.errors.length}/{preview.errors_total} lỗi. Hãy sửa các dòng được liệt kê rồi kiểm tra lại file.</p>}
            {preview.errors.length > 0 && (
              <Notice>
                <ul>
                  {preview.errors.map((e,index) => (
                    <li key={index}>{e}</li>
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
