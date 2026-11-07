import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  RequestError,
  requireManager,
} from "../../../../lib/auth/server";
import { TASK_REVIEW_STATUSES, type TaskReviewStatus } from "../../../../lib/tasks";
import { ensureTaskReviewSchema } from "../../../../lib/task-review-schema";
import { schedulePush } from "../../../../lib/push-delivery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const isId = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function PATCH(req: NextRequest) {
  try {
    checkOrigin(req);
    await ensureTaskReviewSchema();
    const actor = await requireManager();
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body) || !isId(body.id)) {
      throw new RequestError("Mã công việc không hợp lệ.");
    }

    const rawStatus = body.review_status;
    if (
      rawStatus !== null &&
      rawStatus !== undefined &&
      rawStatus !== "" &&
      (typeof rawStatus !== "string" || !Object.hasOwn(TASK_REVIEW_STATUSES, rawStatus))
    ) {
      throw new RequestError("Trạng thái đánh giá không hợp lệ (Đạt hoặc Chưa đạt).");
    }
    const reviewStatus: TaskReviewStatus | null =
      rawStatus === null || rawStatus === undefined || rawStatus === ""
        ? null
        : (rawStatus as TaskReviewStatus);

    const rawComment = body.review_comment ?? "";
    if (typeof rawComment !== "string" || rawComment.length > 5000) {
      throw new RequestError("Nội dung nhận xét tối đa 5.000 ký tự.");
    }
    const reviewComment = rawComment.trim();

    const isCleared = reviewStatus === null && !reviewComment;
    const sql = database();
    const rows = await sql`
      UPDATE app_tasks
      SET
        review_status = ${reviewStatus},
        review_comment = ${reviewComment},
        reviewed_by = CASE WHEN ${isCleared} THEN NULL ELSE ${actor.id}::uuid END,
        reviewer_name = CASE WHEN ${isCleared} THEN NULL ELSE ${actor.name} END,
        reviewed_at = CASE WHEN ${isCleared} THEN NULL ELSE now() END,
        updated_at = now()
      WHERE id = ${body.id}::uuid
      RETURNING id, title, assignee_id, report_version, review_status, review_comment, reviewed_by, reviewer_name, reviewed_at, updated_at
    `;

    if (!rows.length) {
      throw new RequestError("Không tìm thấy công việc.", 404);
    }

    const updated = rows[0];

    if (!isCleared && updated.assignee_id && updated.assignee_id !== actor.id) {
      const notifKind = reviewStatus === "passed" ? "task_completed" : "task_assigned";
      const notifTitle =
        reviewStatus === "passed"
          ? "Đánh giá công việc: ĐẠT"
          : reviewStatus === "failed"
          ? "Đánh giá công việc: CHƯA ĐẠT (Cần sửa)"
          : "Nhận xét đánh giá công việc mới";
      const snippet = reviewComment
        ? ` · Nhận xét: ${reviewComment.slice(0, 140)}${reviewComment.length > 140 ? "..." : ""}`
        : "";
      const notifBody = `${updated.title}${snippet}`;
      const eventKey = `review:${updated.id}:${Date.now()}`;

      await sql`
        INSERT INTO app_notifications (member_id, task_id, event_key, kind, title, body)
        VALUES (${updated.assignee_id}::uuid, ${updated.id}::uuid, ${eventKey}, ${notifKind}, ${notifTitle}, ${notifBody})
        ON CONFLICT (member_id, event_key) DO NOTHING
      `;
      schedulePush();
    }

    return NextResponse.json({
      ok: true,
      task: {
        id: updated.id,
        review_status: updated.review_status,
        review_comment: updated.review_comment,
        reviewed_by: updated.reviewed_by,
        reviewer_name: updated.reviewer_name,
        reviewed_at: updated.reviewed_at,
        updated_at: updated.updated_at,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
