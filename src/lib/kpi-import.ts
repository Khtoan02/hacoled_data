import { SELECTABLE_OUTPUT_TYPES, type OutputType, validMonth } from "./kpis";
export const KPI_IMPORT_COLUMNS = [
  "email_nhan_su",
  "kenh",
  "nen_tang",
  "thang",
  "loai_san_pham",
  "chi_tieu",
  "ghi_chu",
] as const;
export function normalizeHeader(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
const aliases: Record<string, string> = {
  email: "email_nhan_su",
  email_nguoi_thuc_hien: "email_nhan_su",
  nhan_su: "email_nhan_su",
  assignee_email: "email_nhan_su",
  channel: "kenh",
  channel_id: "kenh",
  ten_kenh: "kenh",
  platform: "nen_tang",
  month: "thang",
  output_type: "loai_san_pham",
  dinh_dang: "loai_san_pham",
  target: "chi_tieu",
  so_luong: "chi_tieu",
  notes: "ghi_chu",
};
export function parseKpiImport(text: string): Record<string, unknown>[] {
  if (text.length > 1500000) throw new Error("Nội dung tối đa 1,5 MB.");
  const clean = text
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^```(?:json|csv|tsv)?\s*\n?/i, "")
    .replace(/\n?```$/, "")
    .trim();
  if (!clean) throw new Error("Chưa có dữ liệu import.");
  let rows: Record<string, unknown>[];
  if (clean.startsWith("[") || clean.startsWith("{")) {
    const data = JSON.parse(clean);
    const list = Array.isArray(data) ? data : data.rows;
    if (!Array.isArray(list))
      throw new Error('JSON cần là danh sách hoặc {"rows":[...]}.');
    rows = list;
  } else {
    const first = clean.split(/\r?\n/)[0],
      delimiter = first.includes("\t") ? "\t" : first.includes(";") ? ";" : ",";
    const table: string[][] = [];
    let row: string[] = [],
      cell = "",
      quoted = false;
    for (let i = 0; i < clean.length; i++) {
      const c = clean[i];
      if (c === '"') {
        if (quoted && clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = !quoted;
      } else if (c === delimiter && !quoted) {
        row.push(cell.trim());
        cell = "";
      } else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && clean[i + 1] === "\n") i++;
        row.push(cell.trim());
        if (row.some(Boolean)) table.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    if (quoted) throw new Error("CSV có dấu ngoặc kép chưa đóng.");
    if (cell || row.length) {
      row.push(cell.trim());
      if (row.some(Boolean)) table.push(row);
    }
    const headers = table.shift();
    if (!headers || !table.length)
      throw new Error("Cần dòng tiêu đề và ít nhất một dòng KPI.");
    if (new Set(headers.map(normalizeHeader)).size !== headers.length)
      throw new Error("Tiêu đề cột bị trùng.");
    rows = table.map((values, i) => {
      if (values.length !== headers.length)
        throw new Error(`Dòng ${i + 2}: số cột không khớp tiêu đề.`);
      return Object.fromEntries(headers.map((h, j) => [h, values[j]]));
    });
  }
  if (!rows.length || rows.length > 500)
    throw new Error("Mỗi lần nhập từ 1 đến 500 KPI.");
  return rows.map((row, i) => {
    if (!row || typeof row !== "object" || Array.isArray(row))
      throw new Error(`Dòng ${i + 2}: cần một đối tượng dữ liệu.`);
    const output: Record<string, unknown> = Object.create(null);
    for (const [k, v] of Object.entries(row)) {
      const n = normalizeHeader(k),
        key = Object.hasOwn(aliases, n) ? aliases[n] : n;
      if (Object.hasOwn(output, key))
        throw new Error(`Dòng ${i + 2}: nhiều cột cùng ánh xạ tới ${key}.`);
      output[key] = v;
    }
    return output;
  });
}
const types: Record<string, OutputType> = {
  bai_viet: "post",
  bai: "post",
  post: "post",
  video_dai: "video",
  video: "video",
  video_ngan: "short_video",
  video_doc_ngan: "short_video",
  short_video: "short_video",
  story: "short_video",
  shorts: "short_video",
  reels: "short_video",
  thiet_ke: "image",
  thiet_ke_anh: "image",
  image: "image",
  livestream: "livestream",
  khac: "other",
  other: "other",
};
export function importOutputType(value: unknown) {
  const key = normalizeHeader(String(value ?? ""));
  return Object.hasOwn(types, key) ? types[key] : undefined;
}
export function importMonth(value: unknown) {
  let v = String(value ?? "").trim();
  const m = v.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) v = `${m[2]}-${m[1].padStart(2, "0")}`;
  return validMonth(v) ? v : null;
}
export type ImportPreviewRow = {
  line: number;
  assignee_id: string | null;
  assignee_name: string;
  channel_id: string | null;
  channel_name: string;
  month: string;
  output_type: OutputType | null;
  target: number;
  notes: string;
  existing_id: string | null;
  existing_version: number | null;
  existing_target: number | null;
  action: "create" | "update" | "error";
  errors: string[];
};
