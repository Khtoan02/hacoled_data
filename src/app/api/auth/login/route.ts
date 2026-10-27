import { NextRequest, NextResponse } from "next/server";
import {
  database,
  checkOrigin,
  apiError,
  RequestError,
  createSession,
} from "../../../../lib/auth/server";
import { digest, verifyPassword } from "../../../../lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const body = await req.json();
    if (
      typeof body.password !== "string" ||
      body.password.length < 12 ||
      body.password.length > 128
    ) {
      throw new RequestError(
        "Mật khẩu không đúng hoặc tài khoản đã bị khóa.",
        401,
      );
    }
    const sql = database();
    // Vercel supplies x-real-ip. A trusted reverse proxy must overwrite it on other hosts.
    // Do not key throttling on the supplied password: changing guesses must not reset the limit.
    const key = digest(
      `password-login:${req.headers.get("x-real-ip") || "local-shared"}`,
    );
    const attempts =
      await sql`INSERT INTO app_auth_attempts (key) VALUES (${key})
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN app_auth_attempts.started_at < now() - interval '15 minutes' THEN 1 ELSE app_auth_attempts.attempts + 1 END,
        started_at = CASE WHEN app_auth_attempts.started_at < now() - interval '15 minutes' THEN now() ELSE app_auth_attempts.started_at END
      RETURNING attempts`;
    if (attempts[0].attempts > 10)
      throw new RequestError(
        "Bạn thử quá nhiều lần. Vui lòng thử lại sau 15 phút.",
        429,
      );
    const rows =
      await sql`SELECT id, password_hash FROM app_members WHERE active = true ORDER BY id`;
    const matches: { id: string; password_hash: string }[] = [];
    for (const member of rows) {
      if (await verifyPassword(body.password, member.password_hash))
        matches.push(member as { id: string; password_hash: string });
    }
    if (matches.length > 1)
      throw new RequestError(
        "Mật khẩu bị trùng giữa các tài khoản. Nhờ quản trị viên cấp lại mật khẩu riêng.",
        409,
      );
    if (matches.length !== 1)
      throw new RequestError(
        "Mật khẩu không đúng hoặc tài khoản đã bị khóa.",
        401,
      );
    await createSession(matches[0].id, matches[0].password_hash);
    // Remove only this successful attempt, preserving concurrent/earlier failures.
    await sql`UPDATE app_auth_attempts SET attempts = GREATEST(attempts - 1, 0) WHERE key = ${key}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
