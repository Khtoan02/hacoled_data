/**
 * HacoLED Marketing OS — Role-Based Access Control (RBAC), Field-Level PII Redaction & Audit Engine
 * Enforces:
 * - 09_PHAN_QUYEN (8 strict roles & boundaries)
 * - QA18 (Interns cannot view raw Contact PII; access attempts are logged)
 * - QA20 (AI Assistant cannot validate insights, approve technical claims, publish, or spend budget)
 * - QA22 (Revoking an employee's active flag blocks all permissions while preserving company assets)
 */

export const MEMBER_ROLE_IDS = [
  "sales_hotline",
  "executive",
  "lead_marketing",
  "marketing_manager",
  "marketing_staff",
  "marketing_intern",
] as const;
export type MemberRoleId = (typeof MEMBER_ROLE_IDS)[number];
// The AI sandbox remains internal to the legacy QA engine, never an assignable member role.
export type SystemRoleId = MemberRoleId | "ai_assistant";
export type TaskScope = "all" | "marketing_team" | "own" | "none";

export interface RolePolicy {
  roleId: SystemRoleId;
  label: string;
  badgeCode: string;
  taskScope: TaskScope;
  canViewRawPii: boolean;
  canViewSalaryAndHrPrivate: boolean;
  canApproveClaimsAndInsights: boolean;
  canApproveTechnicalAssets: boolean;
  canPublishContent: boolean;
  canEditRawMetrics: boolean;
  canConfirmCustomerStatus: boolean;
  canExportFullPii: boolean;
  canManagePermissions: boolean;
  summary: string;
  guardrail: string;
}

const restricted = {
  canViewRawPii: false,
  canViewSalaryAndHrPrivate: false,
  canApproveClaimsAndInsights: false,
  canApproveTechnicalAssets: false,
  canPublishContent: false,
  canEditRawMetrics: false,
  canConfirmCustomerStatus: false,
  canExportFullPii: false,
  canManagePermissions: false,
};
const full = Object.fromEntries(
  Object.keys(restricted).map((key) => [key, true]),
) as typeof restricted;
const personal = { ...restricted, taskScope: "own" as const };
export const ROLE_POLICIES: Record<SystemRoleId, RolePolicy> = {
  sales_hotline: {
    ...restricted,
    roleId: "sales_hotline",
    label: "Kinh doanh",
    badgeCode: "SALES",
    taskScope: "none",
    summary: "Chờ thiết lập quyền kinh doanh.",
    guardrail: "Chưa cấp quyền nghiệp vụ khi chưa có yêu cầu cụ thể.",
  },
  executive: {
    ...full,
    roleId: "executive",
    label: "Giám đốc",
    badgeCode: "DIRECTOR",
    taskScope: "all",
    summary: "Quản lý hệ thống, tài khoản và theo dõi công việc; tạo/sửa/xoá KPI và xoá công việc dành riêng cho Leader Marketing.",
    guardrail: "Thao tác tài khoản được ghi nhật ký.",
  },
  lead_marketing: {
    ...full,
    roleId: "lead_marketing",
    label: "Leader Marketing",
    badgeCode: "LEADER",
    taskScope: "all",
    summary: "Toàn quyền hệ thống, tài khoản và công việc.",
    guardrail: "Thao tác tài khoản được ghi nhật ký.",
  },
  marketing_manager: {
    ...restricted,
    roleId: "marketing_manager",
    label: "Trưởng phòng Marketing",
    badgeCode: "MANAGER",
    taskScope: "marketing_team",
    summary:
      "Quản lý kênh social; theo dõi việc của mình, nhân viên và thực tập; báo cáo kết quả việc được giao cho mình.",
    guardrail:
      "Không mặc định xem việc của trưởng phòng khác, Leader, Giám đốc hoặc dữ liệu nhân sự riêng tư.",
  },
  marketing_staff: {
    ...personal,
    roleId: "marketing_staff",
    label: "Nhân viên Marketing",
    badgeCode: "STAFF",
    summary:
      "Tạo công việc cho mình, theo dõi tiến độ và báo cáo kết quả; không tạo KPI hoặc xoá công việc.",
    guardrail: "Không xem công việc của người khác hoặc quản lý tài khoản.",
  },
  marketing_intern: {
    ...personal,
    roleId: "marketing_intern",
    label: "Thực tập Marketing",
    badgeCode: "INTERN",
    summary:
      "Tạo công việc cho mình, theo dõi và báo cáo kết quả; quyền giống nhân viên Marketing.",
    guardrail: "Không xem công việc của người khác hoặc quản lý tài khoản.",
  },
  ai_assistant: {
    ...restricted,
    roleId: "ai_assistant",
    label: "AI nội bộ (kiểm thử)",
    badgeCode: "AI",
    taskScope: "none",
    summary: "Chỉ phục vụ mô phỏng nội bộ.",
    guardrail: "Không được gán cho tài khoản thành viên.",
  },
};
export const MEMBER_ROLES = MEMBER_ROLE_IDS.map((role) => ROLE_POLICIES[role]);
export function isMemberRole(value: unknown): value is MemberRoleId {
  return (
    typeof value === "string" && MEMBER_ROLE_IDS.includes(value as MemberRoleId)
  );
}
export function isFullAccess(role: SystemRoleId) {
  return role === "lead_marketing" || role === "executive";
}
export function canManageChannels(role: SystemRoleId) {
  return isFullAccess(role) || role === "marketing_manager";
}
export const TASK_SCOPE_LABELS: Record<TaskScope, string> = {
  all: "Tất cả công việc",
  marketing_team: "Của mình + nhân viên + thực tập",
  own: "Chỉ công việc của mình",
  none: "Chờ thiết lập",
};
export function canViewTask(
  viewer: { id: string; role: SystemRoleId },
  task: { assignee_id: string; assignee_role: SystemRoleId },
) {
  const scope = ROLE_POLICIES[viewer.role].taskScope;
  if (scope === "none") return false;
  return (
    scope === "all" ||
    task.assignee_id === viewer.id ||
    (scope === "marketing_team" &&
      ["marketing_staff", "marketing_intern"].includes(task.assignee_role))
  );
}
export function normalizeLegacyRole(role: string): SystemRoleId {
  const legacy: Record<string, SystemRoleId> = {
    fulltime_coord: "marketing_staff",
    intern_seo: "marketing_intern",
    intern_video_long: "marketing_intern",
    intern_video_short: "marketing_intern",
  };
  return (
    legacy[role] ||
    (isMemberRole(role) || role === "ai_assistant" ? role : "marketing_staff")
  );
}

/**
 * Mask phone number for non-privileged roles (e.g., 0912345889 -> 0912***889)
 */
export function maskPhone(
  phone: string | null | undefined,
  roleId: SystemRoleId,
): string {
  if (!phone || phone === "unknown") return "unknown";
  if (ROLE_POLICIES[roleId].canViewRawPii) return phone;
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 7) return "***REDACTED***";
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

/**
 * Mask email for non-privileged roles (e.g., minh.quan@school.edu.vn -> mi***@school.edu.vn)
 */
export function maskEmail(
  email: string | null | undefined,
  roleId: SystemRoleId,
): string {
  if (!email || email === "unknown") return "unknown";
  if (ROLE_POLICIES[roleId].canViewRawPii) return email;
  const parts = email.split("@");
  if (parts.length !== 2) return "***REDACTED***";
  const prefix = parts[0].slice(0, 2);
  return `${prefix}***@${parts[1]}`;
}

/**
 * Mask display name of contact for non-privileged roles (QA18)
 */
export function maskContactName(
  name: string | null | undefined,
  roleId: SystemRoleId,
): string {
  if (!name || name === "unknown") return "Chưa rõ tên";
  if (ROLE_POLICIES[roleId].canViewRawPii) return name;
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return `${name.slice(0, 1)}*** (Ẩn PII)`;
  return `${words[0]} *** ${words[words.length - 1].slice(0, 1)}. (Ẩn PII)`;
}

export interface AuditLogEntry {
  audit_id: string;
  actor_id: string;
  actor_role: SystemRoleId;
  entity_type: string;
  entity_id: string;
  action:
    | "create"
    | "update"
    | "merge"
    | "delete"
    | "export"
    | "permission_denied"
    | "revoke_access"
    | "restore_backup";
  changed_at: string;
  changed_fields: string;
  reason: string;
  before_after_redacted: string;
}

/**
 * Check if a role is allowed to perform a sensitive action; returns decision + audit entry if blocked
 */
export function authorizeAction(params: {
  roleId: SystemRoleId;
  employeeActive?: boolean;
  actionType:
    | "VIEW_RAW_PII"
    | "VALIDATE_INSIGHT"
    | "APPROVE_CLAIM"
    | "PUBLISH_CONTENT"
    | "CONFIRM_CUSTOMER_STATUS"
    | "EXPORT_FULL_PII"
    | "VIEW_HR_PRIVATE";
  entityType: string;
  entityId: string;
}): {
  allowed: boolean;
  denialReason?: string;
  auditEntry?: AuditLogEntry;
} {
  const {
    roleId,
    employeeActive = true,
    actionType,
    entityType,
    entityId,
  } = params;

  // QA22: Thu hồi quyền nhân sự rời nhóm
  if (!employeeActive) {
    const reason =
      "Tài khoản nhân sự đã ngừng hoạt động (active=false - Quy tắc QA22). Từ chối mọi quyền truy cập.";
    return {
      allowed: false,
      denialReason: reason,
      auditEntry: {
        audit_id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        actor_id: `emp_${roleId}`,
        actor_role: roleId,
        entity_type: entityType,
        entity_id: entityId,
        action: "permission_denied",
        changed_at: new Date().toISOString(),
        changed_fields: actionType,
        reason,
        before_after_redacted: "[BLOCKED_REVOKED_USER]",
      },
    };
  }

  const policy = ROLE_POLICIES[roleId];
  let allowed = false;
  let denialReason = "";

  switch (actionType) {
    case "VIEW_RAW_PII":
      allowed = policy.canViewRawPii;
      if (!allowed) {
        denialReason = `Vai trò [${policy.label}] không có quyền xem dữ liệu cá nhân (PII) gốc của khách hàng (Quy tắc QA18 & B12-02).`;
      }
      break;
    case "VALIDATE_INSIGHT":
      allowed = policy.canApproveClaimsAndInsights && roleId !== "ai_assistant";
      if (!allowed) {
        denialReason = `Vai trò [${policy.label}] không được phép tự xác nhận Insight thành 'Được hỗ trợ' (Quy tắc QA20: AI/TTS chỉ tạo giả thuyết, Lead phải duyệt).`;
      }
      break;
    case "APPROVE_CLAIM":
      allowed = policy.canApproveClaimsAndInsights;
      if (!allowed) {
        denialReason = `Vai trò [${policy.label}] không có thẩm quyền duyệt thông số/cam kết kỹ thuật (B01-02).`;
      }
      break;
    case "PUBLISH_CONTENT":
      allowed = policy.canPublishContent;
      if (!allowed) {
        denialReason = `Vai trò [${policy.label}] không được tự xuất bản khi chưa qua cổng duyệt kỹ thuật & bản quyền hình ảnh (B05-03).`;
      }
      break;
    case "CONFIRM_CUSTOMER_STATUS":
      allowed = policy.canConfirmCustomerStatus;
      if (!allowed) {
        denialReason = `Chỉ Đầu mối tiếp nhận / Sales / Lead mới được xác nhận trạng thái Mới/Cũ với HacoLED (LR05/LR06).`;
      }
      break;
    case "EXPORT_FULL_PII":
      allowed = policy.canExportFullPii;
      if (!allowed) {
        denialReason = `Vai trò [${policy.label}] bị chặn xuất danh bạ chứa PII gốc ra file ngoài.`;
      }
      break;
    case "VIEW_HR_PRIVATE":
      allowed = policy.canViewSalaryAndHrPrivate;
      if (!allowed) {
        denialReason = `Vai trò [${policy.label}] không có quyền xem đánh giá năng lực cá nhân hoặc chi phí lương (09_PHAN_QUYEN).`;
      }
      break;
  }

  if (!allowed) {
    return {
      allowed: false,
      denialReason,
      auditEntry: {
        audit_id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        actor_id: `actor_${roleId}`,
        actor_role: roleId,
        entity_type: entityType,
        entity_id: entityId,
        action: "permission_denied",
        changed_at: new Date().toISOString(),
        changed_fields: actionType,
        reason: denialReason,
        before_after_redacted: `[REDACTED_ACCESS_ATTEMPT by ${roleId}]`,
      },
    };
  }

  return { allowed: true };
}
