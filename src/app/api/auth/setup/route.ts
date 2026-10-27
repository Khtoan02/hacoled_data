import { NextRequest, NextResponse } from "next/server";
import { randomUUID, timingSafeEqual } from "node:crypto";
import {
  database,
  checkOrigin,
  apiError,
  RequestError,
  createSession,
} from "../../../../lib/auth/server";
import {
  digest,
  hashPassword,
  validPassword,
} from "../../../../lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const body = await req.json();
    const expected = process.env.ADMIN_SETUP_TOKEN;
    if (
      !expected ||
      typeof body.setupToken !== "string" ||
      body.setupToken.length > 512 ||
      !timingSafeEqual(
        Buffer.from(digest(expected)),
        Buffer.from(digest(body.setupToken)),
      )
    ) {
      throw new RequestError(
        "Mã thiết lập không đúng hoặc chưa được cấu hình.",
        403,
      );
    }
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (
      !name ||
      name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      !validPassword(body.password)
    ) {
      throw new RequestError(
        "Điền tên, email hợp lệ và mật khẩu từ 12 đến 128 ký tự.",
      );
    }
    const id = randomUUID(),
      passwordHash = await hashPassword(body.password),
      sql = database();
    const result = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(724109)`,
      sql`INSERT INTO app_members (id, name, email, password_hash, role)
        SELECT ${id}, ${name}, ${email}, ${passwordHash}, 'lead_marketing'
        WHERE NOT EXISTS(SELECT 1 FROM app_members) RETURNING id`,
    ]);
    if (!result[1].length)
      throw new RequestError(
        "Hệ thống đã có quản trị viên. Hãy đăng nhập.",
        409,
      );
    await createSession(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
