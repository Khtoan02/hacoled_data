import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
} from "../../../lib/auth/server";
import {
  getKnowledgeCategoryMeta,
  isKnowledgeCategory,
  normalizeKnowledgeLinks,
  type KnowledgePost,
  type KnowledgeReader,
} from "../../../lib/knowledge";
import { schedulePush } from "../../../lib/push-delivery";
import { ROLE_POLICIES, type MemberRoleId } from "../../../lib/security/rbac";
import { isUuid } from "../../../lib/social";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private" };

export async function GET(req: NextRequest) {
  try {
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);

    const id = req.nextUrl.searchParams.get("id");
    if (id && !isUuid(id)) {
      throw new RequestError("Mã bài viết không hợp lệ.");
    }

    const sql = database();
    const [activeMembers, rawPosts, rawReads] = await Promise.all([
      sql`
        SELECT id::text, name, role
        FROM app_members
        WHERE active = true
        ORDER BY
          CASE role
            WHEN 'lead_marketing' THEN 1
            WHEN 'executive' THEN 2
            WHEN 'marketing_manager' THEN 3
            WHEN 'marketing_staff' THEN 4
            WHEN 'marketing_intern' THEN 5
            ELSE 6
          END,
          name,
          id
      `,
      sql`
        SELECT
          p.id::text,
          p.title,
          p.category,
          p.summary,
          p.content,
          p.links,
          p.pinned,
          p.require_ack,
          p.author_id::text,
          a.name AS author_name,
          a.role AS author_role,
          p.version,
          p.created_at,
          p.updated_at
        FROM app_knowledge_posts p
        JOIN app_members a ON a.id = p.author_id
        WHERE (${id}::uuid IS NULL OR p.id = ${id}::uuid)
        ORDER BY p.pinned DESC, p.updated_at DESC, p.id DESC
      `,
      sql`
        SELECT
          r.post_id::text,
          r.member_id::text,
          r.first_viewed_at,
          r.last_viewed_at,
          r.view_count,
          r.acknowledged_at,
          r.acknowledged_version
        FROM app_knowledge_reads r
        JOIN app_members m ON m.id = r.member_id
        WHERE m.active = true
          AND (${id}::uuid IS NULL OR r.post_id = ${id}::uuid)
      `,
    ]);

    if (id && !rawPosts.length) {
      throw new RequestError("Không tìm thấy bài viết hoặc tài liệu.", 404);
    }

    const readsByPost = new Map<
      string,
      Map<
        string,
        {
          first_viewed_at: string;
          last_viewed_at: string;
          view_count: number;
          acknowledged_at: string | null;
          acknowledged_version: number | null;
        }
      >
    >();

    for (const row of rawReads) {
      const postId = String(row.post_id);
      const memberId = String(row.member_id);
      if (!readsByPost.has(postId)) {
        readsByPost.set(postId, new Map());
      }
      readsByPost.get(postId)!.set(memberId, {
        first_viewed_at: String(row.first_viewed_at),
        last_viewed_at: String(row.last_viewed_at),
        view_count: Number(row.view_count ?? 1),
        acknowledged_at: row.acknowledged_at ? String(row.acknowledged_at) : null,
        acknowledged_version:
          row.acknowledged_version != null ? Number(row.acknowledged_version) : null,
      });
    }

    const totalMembers = activeMembers.length;

    const posts: KnowledgePost[] = rawPosts.map((row) => {
      const postId = String(row.id);
      const version = Number(row.version ?? 1);
      const postReads = readsByPost.get(postId) ?? new Map();

      const readers: KnowledgeReader[] = activeMembers.map((m) => {
        const mId = String(m.id);
        const mRole = String(m.role) as MemberRoleId;
        const r = postReads.get(mId);
        const viewed = Boolean(r);
        const acknowledged = Boolean(r?.acknowledged_at);
        const ackVersion = r?.acknowledged_version ?? null;
        return {
          member_id: mId,
          member_name: String(m.name),
          member_role: mRole,
          member_title: ROLE_POLICIES[mRole]?.label ?? mRole,
          viewed,
          first_viewed_at: r?.first_viewed_at ?? null,
          last_viewed_at: r?.last_viewed_at ?? null,
          view_count: r?.view_count ?? 0,
          acknowledged,
          acknowledged_at: r?.acknowledged_at ?? null,
          acknowledged_version: ackVersion,
          is_current_version_ack: Boolean(
            acknowledged && (ackVersion == null || ackVersion >= version),
          ),
        };
      });

      const viewedCount = readers.filter((r) => r.viewed).length;
      const acknowledgedCount = readers.filter((r) => r.acknowledged).length;
      const myRead = postReads.get(member.id);

      let parsedLinks = normalizeKnowledgeLinks(row.links);
      if (typeof row.links === "string") {
        try {
          parsedLinks = normalizeKnowledgeLinks(JSON.parse(row.links));
        } catch {
          parsedLinks = [];
        }
      }

      return {
        id: postId,
        title: String(row.title),
        category: isKnowledgeCategory(row.category) ? row.category : "announcement",
        summary: String(row.summary ?? ""),
        content: String(row.content ?? ""),
        links: parsedLinks,
        pinned: Boolean(row.pinned),
        require_ack: Boolean(row.require_ack),
        author_id: String(row.author_id),
        author_name: String(row.author_name),
        author_role: String(row.author_role),
        version,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        total_members: totalMembers,
        viewed_count: viewedCount,
        acknowledged_count: acknowledgedCount,
        my_viewed: Boolean(myRead),
        my_first_viewed_at: myRead?.first_viewed_at ?? null,
        my_last_viewed_at: myRead?.last_viewed_at ?? null,
        my_view_count: myRead?.view_count ?? 0,
        my_acknowledged: Boolean(myRead?.acknowledged_at),
        my_acknowledged_at: myRead?.acknowledged_at ?? null,
        my_acknowledged_version: myRead?.acknowledged_version ?? null,
        readers,
      };
    });

    return NextResponse.json(
      {
        posts,
        can_manage: member.role === "lead_marketing",
        total_members: totalMembers,
      },
      { headers },
    );
  } catch (e) {
    return apiError(e);
  }
}

function validatePostPayload(b: Record<string, unknown>) {
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title || title.length > 200) {
    throw new RequestError("Vui lòng nhập tiêu đề bài viết (tối đa 200 ký tự).");
  }
  if (!isKnowledgeCategory(b.category)) {
    throw new RequestError("Danh mục bài viết không hợp lệ.");
  }
  const summary = typeof b.summary === "string" ? b.summary.trim() : "";
  if (summary.length > 500) {
    throw new RequestError("Tóm tắt ngắn không vượt quá 500 ký tự.");
  }
  const content = typeof b.content === "string" ? b.content.trim() : "";
  if (!content || content.length > 30000) {
    throw new RequestError("Vui lòng nhập nội dung chi tiết (tối đa 30.000 ký tự).");
  }
  const links = normalizeKnowledgeLinks(b.links);
  const pinned = Boolean(b.pinned);
  const require_ack = b.require_ack !== undefined ? Boolean(b.require_ack) : true;
  const notify = b.notify !== undefined ? Boolean(b.notify) : true;

  return {
    title,
    category: b.category,
    summary,
    content,
    links,
    pinned,
    require_ack,
    notify,
  };
}

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await getMember();
    if (!actor) throw new RequestError("Vui lòng đăng nhập.", 401);
    if (actor.role !== "lead_marketing") {
      throw new RequestError(
        "Chỉ Leader Marketing được đăng thông báo, quy trình và tài liệu.",
        403,
      );
    }

    const b = await req.json();
    if (!b || typeof b !== "object" || Array.isArray(b)) {
      throw new RequestError("Dữ liệu gửi lên không hợp lệ.");
    }

    const payload = validatePostPayload(b as Record<string, unknown>);
    const id = randomUUID();
    const sql = database();
    const categoryMeta = getKnowledgeCategoryMeta(payload.category);
    const notifTitle =
      payload.category === "announcement"
        ? "Thông báo nội bộ mới"
        : payload.category === "sop"
          ? "Quy trình (SOP) mới cần nắm bắt"
          : "Tài liệu & kiến thức mới";
    const notifBody = `[${categoryMeta.shortLabel}] ${payload.title} · ${actor.name}`;

    await sql`
      INSERT INTO app_knowledge_posts (
        id, title, category, summary, content, links, pinned, require_ack, author_id, version
      ) VALUES (
        ${id}::uuid,
        ${payload.title},
        ${payload.category},
        ${payload.summary},
        ${payload.content},
        ${JSON.stringify(payload.links)}::jsonb,
        ${payload.pinned},
        ${payload.require_ack},
        ${actor.id}::uuid,
        1
      )
    `;

    await sql`
      INSERT INTO app_knowledge_reads (
        post_id, member_id, first_viewed_at, last_viewed_at, view_count, acknowledged_at, acknowledged_version
      ) VALUES (
        ${id}::uuid,
        ${actor.id}::uuid,
        clock_timestamp(),
        clock_timestamp(),
        1,
        clock_timestamp(),
        1
      )
      ON CONFLICT (post_id, member_id) DO NOTHING
    `;

    if (payload.notify) {
      await sql`
        INSERT INTO app_notifications (member_id, post_id, event_key, kind, title, body)
        SELECT
          m.id,
          ${id}::uuid,
          ${`knowledge:${id}:1`},
          'knowledge_post',
          ${notifTitle},
          ${notifBody}
        FROM app_members m
        WHERE m.active = true AND m.id <> ${actor.id}::uuid
        ON CONFLICT (member_id, event_key) DO NOTHING
      `;
      schedulePush();
    }

    return NextResponse.json({ ok: true, id }, { status: 201, headers });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await getMember();
    if (!actor) throw new RequestError("Vui lòng đăng nhập.", 401);

    const b = await req.json();
    if (!b || typeof b !== "object" || Array.isArray(b)) {
      throw new RequestError("Dữ liệu gửi lên không hợp lệ.");
    }

    const action = (b as { action?: unknown }).action;
    const postId = (b as { id?: unknown }).id;
    if (!isUuid(postId)) {
      throw new RequestError("Mã bài viết không hợp lệ.");
    }

    const sql = database();

    if (action === "view" || action === "acknowledge") {
      const existing = await sql`
        SELECT id::text, version FROM app_knowledge_posts WHERE id = ${postId}::uuid
      `;
      if (!existing.length) {
        throw new RequestError("Không tìm thấy bài viết hoặc tài liệu.", 404);
      }
      const currentVersion = Number(existing[0].version ?? 1);

      if (action === "view") {
        await sql`
          INSERT INTO app_knowledge_reads (
            post_id, member_id, first_viewed_at, last_viewed_at, view_count
          ) VALUES (
            ${postId}::uuid,
            ${actor.id}::uuid,
            clock_timestamp(),
            clock_timestamp(),
            1
          )
          ON CONFLICT (post_id, member_id) DO UPDATE
          SET
            last_viewed_at = clock_timestamp(),
            view_count = app_knowledge_reads.view_count + 1
        `;
      } else {
        await sql`
          INSERT INTO app_knowledge_reads (
            post_id, member_id, first_viewed_at, last_viewed_at, view_count, acknowledged_at, acknowledged_version
          ) VALUES (
            ${postId}::uuid,
            ${actor.id}::uuid,
            clock_timestamp(),
            clock_timestamp(),
            1,
            clock_timestamp(),
            ${currentVersion}
          )
          ON CONFLICT (post_id, member_id) DO UPDATE
          SET
            last_viewed_at = clock_timestamp(),
            acknowledged_at = clock_timestamp(),
            acknowledged_version = ${currentVersion}
        `;
      }

      await sql`
        UPDATE app_notifications
        SET read_at = COALESCE(read_at, clock_timestamp())
        WHERE member_id = ${actor.id}::uuid
          AND post_id = ${postId}::uuid
          AND read_at IS NULL
      `;

      return NextResponse.json({ ok: true, version: currentVersion }, { headers });
    }

    if (actor.role !== "lead_marketing") {
      throw new RequestError(
        "Chỉ Leader Marketing được chỉnh sửa thông báo, quy trình và tài liệu.",
        403,
      );
    }

    const payload = validatePostPayload(b as Record<string, unknown>);
    const updated = await sql`
      UPDATE app_knowledge_posts
      SET
        title = ${payload.title},
        category = ${payload.category},
        summary = ${payload.summary},
        content = ${payload.content},
        links = ${JSON.stringify(payload.links)}::jsonb,
        pinned = ${payload.pinned},
        require_ack = ${payload.require_ack},
        version = version + 1,
        updated_at = clock_timestamp()
      WHERE id = ${postId}::uuid
      RETURNING id::text, version
    `;

    if (!updated.length) {
      throw new RequestError("Không tìm thấy bài viết để cập nhật.", 404);
    }

    const newVersion = Number(updated[0].version);

    await sql`
      INSERT INTO app_knowledge_reads (
        post_id, member_id, first_viewed_at, last_viewed_at, view_count, acknowledged_at, acknowledged_version
      ) VALUES (
        ${postId}::uuid,
        ${actor.id}::uuid,
        clock_timestamp(),
        clock_timestamp(),
        1,
        clock_timestamp(),
        ${newVersion}
      )
      ON CONFLICT (post_id, member_id) DO UPDATE
      SET
        last_viewed_at = clock_timestamp(),
        acknowledged_at = clock_timestamp(),
        acknowledged_version = ${newVersion}
    `;

    if (payload.notify) {
      const categoryMeta = getKnowledgeCategoryMeta(payload.category);
      const notifTitle =
        payload.category === "announcement"
          ? "Cập nhật thông báo nội bộ"
          : payload.category === "sop"
            ? "Cập nhật quy trình (SOP)"
            : "Cập nhật tài liệu & kiến thức";
      const notifBody = `[${categoryMeta.shortLabel}] ${payload.title} (v${newVersion}) · ${actor.name}`;

      await sql`
        INSERT INTO app_notifications (member_id, post_id, event_key, kind, title, body)
        SELECT
          m.id,
          ${postId}::uuid,
          ${`knowledge:${postId}:${newVersion}`},
          'knowledge_post',
          ${notifTitle},
          ${notifBody}
        FROM app_members m
        WHERE m.active = true AND m.id <> ${actor.id}::uuid
        ON CONFLICT (member_id, event_key) DO NOTHING
      `;
      schedulePush();
    }

    return NextResponse.json(
      { ok: true, id: postId, version: newVersion },
      { headers },
    );
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await getMember();
    if (!actor) throw new RequestError("Vui lòng đăng nhập.", 401);
    if (actor.role !== "lead_marketing") {
      throw new RequestError(
        "Chỉ Leader Marketing được xóa thông báo, quy trình và tài liệu.",
        403,
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!isUuid(id)) {
      throw new RequestError("Mã bài viết không hợp lệ.");
    }

    const sql = database();
    const removed = await sql`
      WITH target AS (
        DELETE FROM app_knowledge_posts
        WHERE id = ${id}::uuid
        RETURNING *
      ),
      audited AS (
        INSERT INTO app_deletion_audit (id, entity_type, entity_id, actor_id, snapshot)
        SELECT ${randomUUID()}::uuid, 'knowledge_post', t.id, ${actor.id}::uuid, to_jsonb(t)
        FROM target t
      )
      SELECT id::text FROM target
    `;

    if (!removed.length) {
      throw new RequestError("Không tìm thấy bài viết để xóa.", 404);
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch (e) {
    return apiError(e);
  }
}
