import { NextRequest, NextResponse } from "next/server";
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
  verifyPassword,
} from "../../../../lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (
      !email ||
      email.length > 254 ||
      typeof body.password !== "string" ||
      body.password.length > 128
    ) {
      throw new RequestError("Email hoặc mật khẩu không đúng.", 401);
    }
    const sql = database();
    // Persistent throttling works across serverless instances, including non-existent accounts.
    const key = digest(`login:${email}`);
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
      await sql`SELECT id, password_hash, active FROM app_members WHERE email = ${email}`;
    const member = rows[0];
    const stored =
      member?.password_hash || (await hashPassword("unused-dummy-password"));
    if (!(await verifyPassword(body.password, stored)) || !member?.active)
      throw new RequestError("Email hoặc mật khẩu không đúng.", 401);
    await createSession(member.id);
    await sql`DELETE FROM app_auth_attempts WHERE key = ${key}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
