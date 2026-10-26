import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

const DATA_FILE = path.join(process.cwd(), "data", "survey-responses.json");
const BLOB_PATH = "survey-responses.json";

function isVercelBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// ─── Local fs Fallback ────────────────────────────────────────────────────────
function ensureLocalFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readLocal(): unknown[] {
  ensureLocalFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeLocal(data: unknown[]) {
  ensureLocalFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Unified Read / Write ────────────────────────────────────────────────────
async function readAll(): Promise<unknown[]> {
  if (isVercelBlob()) {
    try {
      const { blobs } = await list({ prefix: BLOB_PATH });
      const target = blobs.find((b) => b.pathname === BLOB_PATH);
      if (!target) return [];
      // Bypass edge CDN cache by cache: 'no-store'
      const res = await fetch(`${target.url}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    } catch (e) {
      console.error("Vercel Blob read error:", e);
      return [];
    }
  }

  return readLocal();
}

async function writeAll(data: unknown[]): Promise<void> {
  if (isVercelBlob()) {
    await put(BLOB_PATH, JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  writeLocal(data);
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

// GET /api/survey — lấy toàn bộ kết quả
export async function GET() {
  try {
    const responses = await readAll();
    return NextResponse.json({ ok: true, responses });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// POST /api/survey — lưu 1 phiếu mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.response_id || !body?.respondent_name) {
      return NextResponse.json({ ok: false, error: "Thiếu dữ liệu bắt buộc." }, { status: 400 });
    }
    const responses = await readAll();
    // Chặn trùng response_id
    const exists = responses.some(
      (r: unknown) => (r as { response_id: string }).response_id === body.response_id
    );
    if (exists) {
      return NextResponse.json({ ok: false, error: "Phiếu đã tồn tại." }, { status: 409 });
    }
    responses.push(body);
    await writeAll(responses);
    return NextResponse.json({ ok: true, saved: body.response_id });
  } catch (err) {
    console.error("Save error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// DELETE /api/survey?id=RESP-xxx — xóa 1 phiếu
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Thiếu id." }, { status: 400 });
    const responses = await readAll();
    const filtered = responses.filter(
      (r: unknown) => (r as { response_id: string }).response_id !== id
    );
    await writeAll(filtered);
    return NextResponse.json({ ok: true, deleted: id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
