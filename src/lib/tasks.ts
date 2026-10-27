import type { MemberRoleId } from "./security/rbac";
export const TASK_STATUSES = {
  pending: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
} as const;
export const TASK_PRIORITIES = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
} as const;
export type TaskStatus = keyof typeof TASK_STATUSES;
export type TaskPriority = keyof typeof TASK_PRIORITIES;
export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}
export interface Task {
  id: string;
  title: string;
  description: string;
  assignee_id: string;
  assignee_name: string;
  assignee_role: MemberRoleId;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  checklist: ChecklistItem[];
  result_text: string;
  evidence_links: string[];
  completed_at: string | null;
  report_version: number;
}
export function isOverdue(task: Task) {
  return (
    task.status !== "completed" &&
    Boolean(task.due_at) &&
    new Date(task.due_at!).getTime() < Date.now()
  );
}
export function formatDate(value: string | null, fallback = "Chưa đặt hạn") {
  return value
    ? new Date(value).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : fallback;
}
export function dateInputValue(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(value))
    : "";
}

export function validEvidenceUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      value.length <= 2048
    );
  } catch {
    return false;
  }
}
export interface TaskReport {
  id: string;
  actor_name: string;
  status: TaskStatus;
  result_text: string;
  evidence_links: string[];
  checklist: ChecklistItem[];
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
}
