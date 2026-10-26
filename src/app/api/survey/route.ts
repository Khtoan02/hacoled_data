import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "survey-responses.json");

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeAll(data: unknown[]) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/survey — lấy toàn bộ kết quả
export async function GET() {
  try {
    const responses = readAll();
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
    const responses = readAll();
    // Chặn trùng response_id
    const exists = responses.some((r: { response_id: string }) => r.response_id === body.response_id);
    if (exists) {
      return NextResponse.json({ ok: false, error: "Phiếu đã tồn tại." }, { status: 409 });
    }
    responses.push(body);
    writeAll(responses);
    return NextResponse.json({ ok: true, saved: body.response_id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// DELETE /api/survey?id=RESP-xxx — xóa 1 phiếu
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Thiếu id." }, { status: 400 });
    const responses = readAll();
    const filtered = responses.filter((r: { response_id: string }) => r.response_id !== id);
    writeAll(filtered);
    return NextResponse.json({ ok: true, deleted: id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
