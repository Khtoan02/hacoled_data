import "server-only";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ROLE_POLICIES } from "../security/rbac";
import { digest } from "./password";
import type { Member } from "./types";

export const SESSION_COOKIE = "hacoled_session";

const LOCAL_DEVELOPMENT_MEMBER: Member = {
  id: "local-development-user",
  name: "Local Admin",
  email: "local@hacoled.test",
  role: "executive",
  active: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

export function isLocalAuthBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.LOCAL_AUTH_BYPASS === "true"
  );
}

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_NOT_CONFIGURED");
  return neon(url);
}

export async function getMember(): Promise<Member | null> {
  if (isLocalAuthBypassEnabled()) return LOCAL_DEVELOPMENT_MEMBER;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !process.env.DATABASE_URL) return null;
  const rows = await database()`
    SELECT m.id, m.name, m.email, m.role, m.active, m.created_at
    FROM app_sessions s JOIN app_members m ON m.id = s.member_id
    WHERE s.token_hash = ${digest(token)} AND s.expires_at > now() AND m.active = true
  `;
  return (rows[0] as Member) || null;
}

export async function createSession(memberId: string, expectedHash?: string) {
  const token = randomBytes(32).toString("hex");
  const sql = database();
  const results = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(724109)`,
    sql`INSERT INTO app_sessions (token_hash, member_id, expires_at)
    SELECT ${digest(token)}, id, now() + interval '7 days' FROM app_members
    WHERE id = ${memberId} AND active = true AND (${expectedHash ?? null}::text IS NULL OR password_hash = ${expectedHash ?? null})
    RETURNING member_id`,
  ]);
  if (!results[1].length)
    throw new RequestError(
      "Tài khoản vừa thay đổi. Vui lòng đăng nhập lại.",
      401,
    );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function canManageMembers(member: Member) {
  return ROLE_POLICIES[member.role]?.canManagePermissions === true;
}

export function checkOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) {
    throw new RequestError("Yêu cầu không hợp lệ. Hãy tải lại trang.", 403);
  }
}

export class RequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function apiError(error: unknown) {
  if (error instanceof RequestError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  // Do not serialize database errors or connection strings to clients/logs.
  return NextResponse.json(
    {
      error:
        "Chưa thể kết nối dữ liệu. Kiểm tra DATABASE_URL và chạy migration database.",
    },
    { status: 503 },
  );
}

export async function requireManager() {
  const member = await getMember();
  if (!member) throw new RequestError("Vui lòng đăng nhập lại.", 401);
  if (!canManageMembers(member))
    throw new RequestError("Bạn không có quyền quản lý thành viên.", 403);
  return member;
}

export async function requireLeader() {
 const member=await getMember();
 if(!member)throw new RequestError("Vui lòng đăng nhập lại.",401);
 if(member.role!=="lead_marketing")throw new RequestError("Chỉ Leader Marketing được quản lý KPI hoặc xoá công việc.",403);
 return member;
}
