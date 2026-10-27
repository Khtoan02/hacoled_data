import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
  requireManager,
} from "../../../lib/auth/server";
import { isFullAccess, ROLE_POLICIES } from "../../../lib/security/rbac";
import { SOCIAL_PLATFORMS, isUuid } from "../../../lib/social";
import { validEvidenceUrl } from "../../../lib/tasks";
import { sealCredentials } from "../../../lib/social/credentials";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    if (ROLE_POLICIES[member.role].taskScope === "none")
      throw new RequestError("Chưa được cấp quyền kênh social.", 403);
    const full = isFullAccess(member.role),
      id = req.nextUrl.searchParams.get("id");
    if (id && !isUuid(id)) throw new RequestError("Mã kênh không hợp lệ.");
    const channels =
      await database()`SELECT c.id,c.name,c.platform,c.url,c.handle,c.notes,c.active,c.version,c.updated_at,(c.credentials_cipher IS NOT NULL) AS has_credentials,
    (${full} OR EXISTS(SELECT 1 FROM app_social_channel_access a WHERE a.channel_id=c.id AND a.member_id=${member.id})) AS can_view_credentials
    FROM app_social_channels c WHERE (${id}::uuid IS NULL OR c.id=${id}::uuid) ORDER BY c.active DESC,c.name,c.id`;
    if (id && !channels.length)
      throw new RequestError("Không tìm thấy kênh.", 404);
    let access: unknown[] = [];
    if (full && id)
      access =
        await database()`SELECT a.member_id FROM app_social_channel_access a WHERE channel_id=${id}`;
    return NextResponse.json(
      {
        channels,
        ...(full
          ? {
              credentials_configured: /^[0-9a-f]{64}$/i.test(
                process.env.SOCIAL_CREDENTIALS_KEY ?? "",
              ),
            }
          : {}),
        ...(full && id ? { access } : {}),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
async function save(req: NextRequest, create: boolean) {
  try {
    checkOrigin(req);
    const actor = await requireManager(),
      b = await req.json();
    if (
      !b ||
      typeof b !== "object" ||
      Array.isArray(b) ||
      Object.keys(b).some(
        (k) =>
          ![
            "id",
            "version",
            "name",
            "platform",
            "url",
            "handle",
            "notes",
            "active",
            "credentials",
            "clear_credentials",
            "access",
          ].includes(k),
      )
    )
      throw new RequestError("Thông tin kênh không hợp lệ.");
    if (
      !create &&
      (!isUuid(b.id) || !Number.isSafeInteger(b.version) || b.version < 0)
    )
      throw new RequestError("Phiên bản kênh không hợp lệ.");
    if (
      typeof b.name !== "string" ||
      !b.name.trim() ||
      b.name.length > 150 ||
      typeof b.platform !== "string" ||
      !Object.hasOwn(SOCIAL_PLATFORMS, b.platform) ||
      typeof b.url !== "string" ||
      !validEvidenceUrl(b.url)
    )
      throw new RequestError(
        "Điền tên kênh, nền tảng và link HTTP/HTTPS hợp lệ.",
      );
    if (
      typeof b.handle !== "string" ||
      b.handle.length > 200 ||
      typeof b.notes !== "string" ||
      b.notes.length > 3000 ||
      typeof b.active !== "boolean"
    )
      throw new RequestError("Thông tin mô tả kênh không hợp lệ.");
    if (
      !Array.isArray(b.access) ||
      b.access.length > 100 ||
      b.access.some((v: unknown) => !isUuid(v)) ||
      new Set(b.access).size !== b.access.length
    )
      throw new RequestError("Danh sách người được cấp quyền không hợp lệ.");
    if (
      b.clear_credentials !== undefined &&
      typeof b.clear_credentials !== "boolean"
    )
      throw new RequestError("Thao tác xóa thông tin đăng nhập không hợp lệ.");
    let encrypted: string | null = null;
    if (b.credentials !== undefined) {
      if (
        b.clear_credentials ||
        !b.credentials ||
        typeof b.credentials !== "object" ||
        Object.keys(b.credentials).some(
          (k) => !["username", "password"].includes(k),
        ) ||
        typeof b.credentials.username !== "string" ||
        typeof b.credentials.password !== "string" ||
        b.credentials.username.length > 254 ||
        b.credentials.password.length > 1000 ||
        (!b.credentials.username.trim() && !b.credentials.password)
      )
        throw new RequestError("Thông tin đăng nhập không hợp lệ.");
      encrypted = sealCredentials({
        username: b.credentials.username.trim(),
        password: b.credentials.password,
      });
    }
    const id = create ? randomUUID() : b.id,
      sql = database(),
      ids = JSON.stringify(b.access);
    // Serialize changes to credentials and grants with reveal operations; failed versions never mutate grants.
    const write = create
      ? `INSERT INTO app_social_channels (id,name,platform,url,handle,notes,active,credentials_cipher,created_by)
    SELECT id,name,platform,url,handle,notes,active,encrypted,actor FROM valid RETURNING id`
      : `UPDATE app_social_channels c SET name=v.name,platform=v.platform,url=v.url,handle=v.handle,notes=v.notes,active=v.active,
    credentials_cipher=CASE WHEN v.clear THEN NULL ELSE COALESCE(v.encrypted,c.credentials_cipher) END,version=c.version+1,updated_at=now()
    FROM valid v WHERE c.id=v.id AND c.version=v.version RETURNING c.id`;
    const results = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(724110)`,
      sql.query(
        `WITH input AS (SELECT $1::uuid id,$2::text name,$3::text platform,$4::text url,$5::text handle,$6::text notes,$7::boolean active,$8::text encrypted,$9::uuid actor,$10::int version,$11::boolean clear,$12::jsonb access),
    valid AS (SELECT i.* FROM input i WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(i.access) a(id) WHERE NOT EXISTS(SELECT 1 FROM app_members m WHERE m.id=a.id::uuid AND m.active=true AND m.role IN ('lead_marketing','executive','marketing_manager','marketing_staff','marketing_intern')))),
    saved AS (${write}),
    removed AS (DELETE FROM app_social_channel_access a WHERE a.channel_id IN (SELECT id FROM saved) AND a.member_id NOT IN (SELECT jsonb_array_elements_text(access)::uuid FROM input)),
    granted AS (INSERT INTO app_social_channel_access(channel_id,member_id) SELECT s.id,jsonb_array_elements_text(i.access)::uuid FROM saved s CROSS JOIN input i WHERE true ON CONFLICT DO NOTHING),
    audited AS (INSERT INTO app_social_channel_audit(id,channel_id,actor_id,action) SELECT $13::uuid,s.id,i.actor,$14::text FROM saved s CROSS JOIN input i)
    SELECT id FROM saved`,
        [
          id,
          b.name.trim(),
          b.platform,
          b.url.trim(),
          b.handle.trim(),
          b.notes.trim(),
          b.active,
          encrypted,
          actor.id,
          b.version ?? 0,
          b.clear_credentials === true,
          ids,
          randomUUID(),
          create ? "created" : "updated",
        ],
      ),
    ]);
    const result = results[1];
    if (!result.length)
      throw new RequestError(
        "Kênh vừa thay đổi hoặc người được cấp quyền không còn hợp lệ. Tải lại trước khi lưu.",
        409,
      );
    return NextResponse.json(
      { ok: true, id: result[0].id },
      { status: create ? 201 : 200 },
    );
  } catch (e) {
    return apiError(e);
  }
}
export const POST = (req: NextRequest) => save(req, true);
export const PATCH = (req: NextRequest) => save(req, false);
