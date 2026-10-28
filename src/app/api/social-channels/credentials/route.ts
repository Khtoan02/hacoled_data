import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
} from "../../../../lib/auth/server";
import { canManageChannels, ROLE_POLICIES } from "../../../../lib/security/rbac";
import { isUuid } from "../../../../lib/social";
import { openCredentials } from "../../../../lib/social/credentials";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    if (ROLE_POLICIES[member.role].taskScope === "none")
      throw new RequestError("Chưa được cấp quyền kênh social.", 403);
    const b = await req.json();
    if (!b || !isUuid(b.id)) throw new RequestError("Mã kênh không hợp lệ.");
    const sql = database(),
      results = await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(724110)`,
        sql`WITH allowed AS (SELECT c.id,c.credentials_cipher FROM app_social_channels c WHERE c.id=${b.id} AND c.active=true AND c.credentials_cipher IS NOT NULL AND
     (${canManageChannels(member.role)} OR EXISTS(SELECT 1 FROM app_social_channel_access a WHERE a.channel_id=c.id AND a.member_id=${member.id}))),
     logged AS (INSERT INTO app_social_channel_audit(id,channel_id,actor_id,action) SELECT ${randomUUID()},id,${member.id},'credentials_viewed' FROM allowed RETURNING channel_id)
     SELECT a.credentials_cipher FROM allowed a JOIN logged l ON l.channel_id=a.id`,
      ]);
    if (!results[1].length)
      throw new RequestError(
        "Bạn chưa được cấp quyền, kênh đã lưu trữ hoặc chưa có thông tin đăng nhập.",
        403,
      );
    return NextResponse.json(
      { credentials: openCredentials(results[1][0].credentials_cipher) },
      { headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
