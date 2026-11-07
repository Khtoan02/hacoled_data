"use client";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, MessageSquareWarning, RotateCcw } from "lucide-react";
import type { Task, TaskReviewStatus } from "../../lib/tasks";
import { Notice } from "./ui";

function formatReviewTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ReviewBadge({ task }: { task: Pick<Task, "review_status" | "review_comment"> }) {
  if (task.review_status === "passed") {
    return (
      <span className="ui-review-badge passed" title={task.review_comment || "Đánh giá: Đạt"}>
        <CheckCircle2 size={13} />
        Đạt
      </span>
    );
  }
  if (task.review_status === "failed") {
    return (
      <span className="ui-review-badge failed" title={task.review_comment || "Đánh giá: Chưa đạt"}>
        <AlertCircle size={13} />
        Chưa đạt
      </span>
    );
  }
  if (task.review_comment?.trim()) {
    return (
      <span className="ui-review-badge commented" title={task.review_comment}>
        <MessageSquareWarning size={13} />
        Có nhận xét
      </span>
    );
  }
  return null;
}

export function ReviewCommentSnippet({ task }: { task: Pick<Task, "review_status" | "review_comment" | "reviewer_name"> }) {
  const comment = task.review_comment?.trim();
  if (!comment && !task.review_status) return null;
  const tone = task.review_status === "failed" ? "failed" : task.review_status === "passed" ? "passed" : "neutral";
  return (
    <div className={`task-review-snippet ${tone}`}>
      <div className="task-review-snippet-head">
        <ReviewBadge task={task} />
        {task.reviewer_name && (
          <span className="task-review-snippet-author">Đánh giá bởi {task.reviewer_name}</span>
        )}
      </div>
      {comment && <p className="task-review-snippet-text">{comment}</p>}
    </div>
  );
}

export function TaskReviewPanel({
  task,
  canReview,
  onUpdated,
}: {
  task: Task;
  canReview: boolean;
  onUpdated: (patch: Partial<Task>) => void;
}) {
  const [status, setStatus] = useState<TaskReviewStatus | null>(task.review_status ?? null);
  const [comment, setComment] = useState(task.review_comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    setStatus(task.review_status ?? null);
    setComment(task.review_comment ?? "");
    setError("");
    setSavedMsg("");
  }, [task.id]);

  async function saveReview(nextStatus: TaskReviewStatus | null, nextComment: string) {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch("/api/tasks/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          review_status: nextStatus,
          review_comment: nextComment,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Không lưu được đánh giá công việc.");
        setSaving(false);
        return;
      }
      setSaving(false);
      setStatus(data.task.review_status ?? null);
      setComment(data.task.review_comment ?? "");
      setSavedMsg(
        data.task.review_status === "passed"
          ? "Đã đánh giá công việc: ĐẠT."
          : data.task.review_status === "failed"
          ? "Đã đánh giá: CHƯA ĐẠT kèm nhận xét lỗi."
          : data.task.review_comment
          ? "Đã lưu nhận xét đánh giá."
          : "Đã xóa đánh giá.",
      );
      onUpdated({
        review_status: data.task.review_status ?? null,
        review_comment: data.task.review_comment ?? "",
        reviewed_by: data.task.reviewed_by ?? null,
        reviewer_name: data.task.reviewer_name ?? null,
        reviewed_at: data.task.reviewed_at ?? null,
        updated_at: data.task.updated_at ?? task.updated_at,
      });
    } catch {
      setSaving(false);
      setError("Không kết nối được máy chủ khi lưu đánh giá.");
    }
  }

  const hasExistingReview = Boolean(task.review_status || task.review_comment?.trim());
  const toneClass =
    (canReview ? status : task.review_status) === "failed"
      ? "is-failed"
      : (canReview ? status : task.review_status) === "passed"
      ? "is-passed"
      : "";

  if (!canReview) {
    return (
      <section className={`task-review-panel readonly ${toneClass}`} aria-label="Đánh giá công việc từ Leader">
        <div className="task-review-header">
          <div className="task-review-title-wrap">
            <ClipboardCheck size={18} />
            <div>
              <h4>Đánh giá & Nhận xét từ Leader</h4>
              <p>Phản hồi chất lượng công việc và các lỗi cần lưu ý chỉnh sửa</p>
            </div>
          </div>
          <ReviewBadge task={task} />
        </div>

        {hasExistingReview ? (
          <div className="task-review-readonly-body">
            {task.review_status === "failed" && (
              <div className="task-review-alert failed">
                <AlertCircle size={16} />
                <span>Công việc CHƯA ĐẠT yêu cầu — Vui lòng xem kỹ nhận xét bên dưới để khắc phục lỗi.</span>
              </div>
            )}
            {task.review_status === "passed" && (
              <div className="task-review-alert passed">
                <CheckCircle2 size={16} />
                <span>Công việc ĐẠT yêu cầu chất lượng.</span>
              </div>
            )}
            {task.review_comment?.trim() ? (
              <div className="task-review-comment-box">
                <strong>Nhận xét / Chi tiết lỗi cần sửa:</strong>
                <p>{task.review_comment}</p>
              </div>
            ) : (
              <p className="result-hint">Leader không để lại ghi chú chi tiết thêm.</p>
            )}
            {(task.reviewer_name || task.reviewed_at) && (
              <p className="task-review-meta">
                Đánh giá bởi <strong>{task.reviewer_name || "Leader"}</strong>
                {task.reviewed_at ? ` · ${formatReviewTime(task.reviewed_at)}` : ""}
              </p>
            )}
          </div>
        ) : (
          <p className="task-review-empty">Chưa có đánh giá từ Leader cho công việc này.</p>
        )}
      </section>
    );
  }

  return (
    <section className={`task-review-panel editable ${toneClass}`} aria-label="Đánh giá chất lượng công việc">
      <div className="task-review-header">
        <div className="task-review-title-wrap">
          <ClipboardCheck size={18} />
          <div>
            <h4>Đánh giá công việc (Leader)</h4>
            <p>Chọn Đạt / Chưa đạt và ghi rõ lỗi hoặc nhận xét để nhân sự nắm bắt</p>
          </div>
        </div>
        <ReviewBadge task={{ review_status: status, review_comment: comment }} />
      </div>

      {error && <Notice>{error}</Notice>}
      {savedMsg && <Notice tone="success">{savedMsg}</Notice>}

      <div className="task-review-actions" role="group" aria-label="Chọn kết quả đánh giá">
        <button
          type="button"
          className={`task-review-choice pass ${status === "passed" ? "active" : ""}`}
          disabled={saving}
          onClick={() => {
            setStatus("passed");
            void saveReview("passed", comment);
          }}
        >
          <CheckCircle2 size={16} />
          <span>Đạt</span>
        </button>
        <button
          type="button"
          className={`task-review-choice fail ${status === "failed" ? "active" : ""}`}
          disabled={saving}
          onClick={() => {
            setStatus("failed");
            void saveReview("failed", comment);
          }}
        >
          <AlertCircle size={16} />
          <span>Chưa đạt</span>
        </button>
        {(status !== null || comment.trim().length > 0 || hasExistingReview) && (
          <button
            type="button"
            className="task-review-clear"
            disabled={saving}
            onClick={() => {
              setStatus(null);
              setComment("");
              void saveReview(null, "");
            }}
          >
            <RotateCcw size={14} />
            <span>Bỏ đánh giá</span>
          </button>
        )}
      </div>

      <label className="task-review-field">
        <span>Soạn đánh giá / Chỉ rõ lỗi công việc đang mắc phải</span>
        <textarea
          rows={3}
          maxLength={5000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét chi tiết: công việc đang mắc lỗi gì, cần sửa ở đâu, hoặc điểm nào làm tốt..."
        />
      </label>

      <div className="task-review-footer">
        <div className="task-review-meta">
          {task.reviewer_name || task.reviewed_at ? (
            <span>
              Cập nhật gần nhất: <strong>{task.reviewer_name || "Leader"}</strong>
              {task.reviewed_at ? ` · ${formatReviewTime(task.reviewed_at)}` : ""}
            </span>
          ) : (
            <span>Nhân sự thực hiện ({task.assignee_name}) sẽ thấy ngay đánh giá này.</span>
          )}
        </div>
        <button
          type="button"
          className="primary-button task-review-save"
          disabled={saving}
          onClick={() => void saveReview(status, comment)}
        >
          {saving ? "Đang lưu đánh giá…" : "Lưu đánh giá"}
        </button>
      </div>
    </section>
  );
}
