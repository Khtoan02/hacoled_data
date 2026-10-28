export function parseTableImport(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new Error("CSV có dấu ngoặc kép chưa đóng.");
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((value) => value.replace(/^\uFEFF/, ""));
  if (headers.some((h) => !h) || new Set(headers).size !== headers.length)
    throw new Error("Tên cột CSV bị trống hoặc trùng.");
  if (rows.slice(1).some((r) => r.length !== headers.length))
    throw new Error("Số ô trong dòng không khớp số cột CSV.");
  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
}
