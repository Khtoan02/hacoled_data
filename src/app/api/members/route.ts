import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  apiError,
  checkOrigin,
  database,
  RequestError,
  requireManager,
} from "../../../lib/auth/server";
import { hashPassword, validPassword } from "../../../lib/auth/password";
import { uniquePasswordSnapshot } from "../../../lib/auth/credentials";
import { isMemberRole, type MemberRoleId } from "../../../lib/security/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireManager();
    const members =
      await database()`SELECT id, name, email, role, active, created_at FROM app_members ORDER BY created_at`;
    return NextResponse.json(
      { members },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireManager(),
      body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (
      !name ||
      name.length > 100 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !isMemberRole(body.role) ||
      !validPassword(body.password)
    ) {
      throw new RequestError(
        "Điền tên, email, vai trò hợp lệ và mật khẩu từ 12 đến 128 ký tự.",
      );
    }
    const id = randomUUID(),
      hash = await hashPassword(body.password),
      sql = database();
    const snapshot = await uniquePasswordSnapshot(body.password);
    const results = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(724109)`,
      sql`INSERT INTO app_members (id, name, email, role, password_hash)
        SELECT ${id}, ${name}, ${email}, ${body.role}, ${hash}
        WHERE (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'password_hash', password_hash) ORDER BY id), '[]'::jsonb) FROM app_members) = ${snapshot}::jsonb
        ON CONFLICT (email) DO NOTHING RETURNING id`,
      sql`INSERT INTO app_member_audit (actor_id, target_id, action)
        SELECT ${actor.id}, id, 'member_created' FROM app_members WHERE id = ${id}`,
    ]);
    if (!results[1].length)
      throw new RequestError(
        "Email đã tồn tại hoặc danh sách tài khoản vừa thay đổi. Kiểm tra và thử lại.",
        409,
      );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireManager(),
      body = await req.json();
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id))
      throw new RequestError("Thành viên không hợp lệ.");
    const role = body.role as MemberRoleId | undefined;
    if (
      (role !== undefined && !isMemberRole(role)) ||
      (body.active !== undefined && typeof body.active !== "boolean") ||
      (body.password !== undefined && !validPassword(body.password)) ||
      (role === undefined &&
        body.active === undefined &&
        body.password === undefined)
    ) {
      throw new RequestError(
        "Thông tin cập nhật không hợp lệ. Mật khẩu cần từ 12 đến 128 ký tự.",
      );
    }
    const passwordHash =
      body.password === undefined ? null : await hashPassword(body.password);
    const snapshot =
      body.password === undefined
        ? null
        : await uniquePasswordSnapshot(body.password, body.id);
    const sql = database();
    // Serialize account changes and preserve at least one active administrator, even under concurrent requests.
    const results = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(724109)`,
      sql`WITH updated AS (UPDATE app_members SET role = COALESCE(${role ?? null}, role), active = COALESCE(${body.active ?? null}, active),
        password_hash = COALESCE(${passwordHash}, password_hash)
        WHERE id = ${body.id}
        AND (${snapshot}::jsonb IS NULL OR (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'password_hash', password_hash) ORDER BY id), '[]'::jsonb) FROM app_members) = ${snapshot}::jsonb)
        AND (
          role NOT IN ('lead_marketing', 'executive') OR NOT active OR
          (COALESCE(${role ?? null}, role) IN ('lead_marketing', 'executive') AND COALESCE(${body.active ?? null}, active)) OR
          EXISTS(SELECT 1 FROM app_members other WHERE other.id <> ${body.id} AND other.active AND other.role IN ('lead_marketing', 'executive'))
        ) RETURNING id), revoked AS (
          DELETE FROM app_sessions WHERE member_id IN (SELECT id FROM updated)
        ), audited AS (
          INSERT INTO app_member_audit (actor_id, target_id, action)
          SELECT ${actor.id}, id, ${passwordHash ? "password_reset" : "permissions_updated"} FROM updated
        ) SELECT id FROM updated`,
    ]);
    if (!results[1].length)
      throw new RequestError(
        "Không thể cập nhật: tài khoản không tồn tại hoặc đây là quản trị viên hoạt động cuối cùng.",
        409,
      );
    return NextResponse.json({ ok: true, selfUpdated: actor.id === body.id });
  } catch (error) {
    return apiError(error);
  }
}
