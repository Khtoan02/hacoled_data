import { NextRequest, NextResponse } from "next/server";

// ─── JSONBin.io Config ───────────────────────────────────────────────────────
// Lưu data dạng JSON trên cloud, hoạt động tốt với Vercel serverless
// Cần set env vars: JSONBIN_API_KEY và JSONBIN_BIN_ID
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || "";
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || "";
const JSONBIN_BASE = "https://api.jsonbin.io/v3";

// Tự tạo bin mới nếu chưa có BIN_ID
async function createBin(initialData: unknown[]) {
  const res = await fetch(`${JSONBIN_BASE}/b`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_API_KEY,
      "X-Bin-Name": "hacoled-survey-responses",
      "X-Bin-Private": "true",
    },
    body: JSON.stringify(initialData),
  });
  const json = await res.json();
  return json.metadata?.id as string | undefined;
}

async function readAll(): Promise<unknown[]> {
  if (!JSONBIN_API_KEY) return [];
  if (!JSONBIN_BIN_ID) return [];
  const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Master-Key": JSONBIN_API_KEY },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.record) ? json.record : [];
}

async function writeAll(data: unknown[]) {
  if (!JSONBIN_API_KEY) return;
  let binId = JSONBIN_BIN_ID;
  // Nếu chưa có BIN_ID, tự tạo mới
  if (!binId) {
    binId = (await createBin(data)) || "";
    if (!binId) throw new Error("Không thể tạo JSONBin.");
    // Log ra console để lấy BIN_ID lần đầu
    console.log("📦 JSONBin created, set env JSONBIN_BIN_ID =", binId);
    return;
  }
  const res = await fetch(`${JSONBIN_BASE}/b/${binId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_API_KEY,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`JSONBin write failed: ${res.status}`);
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

// GET /api/survey — lấy toàn bộ kết quả
export async function GET() {
  try {
    if (!JSONBIN_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Chưa cấu hình JSONBIN_API_KEY trong Vercel environment variables." },
        { status: 503 }
      );
    }
    const responses = await readAll();
    return NextResponse.json({ ok: true, responses });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// POST /api/survey — lưu 1 phiếu mới
export async function POST(req: NextRequest) {
  try {
    if (!JSONBIN_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Chưa cấu hình JSONBIN_API_KEY." },
        { status: 503 }
      );
    }
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
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// DELETE /api/survey?id=RESP-xxx — xóa 1 phiếu
export async function DELETE(req: NextRequest) {
  try {
    if (!JSONBIN_API_KEY) {
      return NextResponse.json({ ok: false, error: "Chưa cấu hình JSONBIN_API_KEY." }, { status: 503 });
    }
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
