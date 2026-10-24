/**
 * HacoLED Marketing OS — Role-Based Access Control (RBAC), Field-Level PII Redaction & Audit Engine
 * Enforces:
 * - 09_PHAN_QUYEN (8 strict roles & boundaries)
 * - QA18 (Interns cannot view raw Contact PII; access attempts are logged)
 * - QA20 (AI Assistant cannot validate insights, approve technical claims, publish, or spend budget)
 * - QA22 (Revoking an employee's active flag blocks all permissions while preserving company assets)
 */

export type SystemRoleId =
  | "lead_marketing"
  | "fulltime_coord"
  | "intern_seo"
  | "intern_video_long"
  | "intern_video_short"
  | "sales_hotline"
  | "executive"
  | "ai_assistant";

export interface RolePolicy {
  roleId: SystemRoleId;
  label: string;
  badgeCode: string;
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

export const ROLE_POLICIES: Record<SystemRoleId, RolePolicy> = {
  lead_marketing: {
    roleId: "lead_marketing",
    label: "Lead Marketing (Remote)",
    badgeCode: "LEAD",
    canViewRawPii: true,
    canViewSalaryAndHrPrivate: true,
    canApproveClaimsAndInsights: true,
    canApproveTechnicalAssets: true,
    canPublishContent: true,
    canEditRawMetrics: true,
    canConfirmCustomerStatus: true,
    canExportFullPii: true,
    canManagePermissions: true,
    summary: "Duyệt target, định nghĩa KPI, insight, nội dung nhạy cảm, hợp nhất dữ liệu.",
    guardrail: "Không tự gọi dữ liệu chưa xác minh là thật; chi phí mới phải xin duyệt Lãnh đạo.",
  },
  fulltime_coord: {
    roleId: "fulltime_coord",
    label: "Full-time / Điều phối",
    badgeCode: "COORD",
    canViewRawPii: false, // Chỉ xem lead chi tiết khi được giao tiếp nhận riêng
    canViewSalaryAndHrPrivate: false,
    canApproveClaimsAndInsights: false,
    canApproveTechnicalAssets: true,
    canPublishContent: true,
    canEditRawMetrics: true,
    canConfirmCustomerStatus: false,
    canExportFullPii: false,
    canManagePermissions: false,
    summary: "Giao việc chi tiết, kiểm nội dung theo checklist, quản lý Facebook & tổng hợp số.",
    guardrail: "Không mặc định xem lương, hồ sơ khảo sát riêng tư hoặc toàn bộ danh bạ PII.",
  },
  intern_seo: {
    roleId: "intern_seo",
    label: "Thực tập sinh SEO",
    badgeCode: "SEO",
    canViewRawPii: false,
    canViewSalaryAndHrPrivate: false,
    canApproveClaimsAndInsights: false,
    canApproveTechnicalAssets: false,
    canPublishContent: false,
    canEditRawMetrics: true,
    canConfirmCustomerStatus: false,
    canExportFullPii: false,
    canManagePermissions: false,
    summary: "Sản xuất bài SEO theo brief đã duyệt; nhập chỉ số GSC/Web được giao.",
    guardrail: "Không truy cập danh bạ khách hàng (QA18); không tự đổi thông số/giá/target.",
  },
  intern_video_long: {
    roleId: "intern_video_long",
    label: "Thực tập sinh Video dài",
    badgeCode: "VID-L",
    canViewRawPii: false,
    canViewSalaryAndHrPrivate: false,
    canApproveClaimsAndInsights: false,
    canApproveTechnicalAssets: false,
    canPublishContent: false,
    canEditRawMetrics: true,
    canConfirmCustomerStatus: false,
    canExportFullPii: false,
    canManagePermissions: false,
    summary: "Sản xuất video ngang (YouTube/FB) theo brief; nhập số liệu video được giao.",
    guardrail: "Không giả ảnh/video AI thành dự án thật; không truy cập danh bạ PII (QA18).",
  },
  intern_video_short: {
    roleId: "intern_video_short",
    label: "Thực tập sinh Video ngắn",
    badgeCode: "VID-S",
    canViewRawPii: false,
    canViewSalaryAndHrPrivate: false,
    canApproveClaimsAndInsights: false,
    canApproveTechnicalAssets: false,
    canPublishContent: false,
    canEditRawMetrics: true,
    canConfirmCustomerStatus: false,
    canExportFullPii: false,
    canManagePermissions: false,
    summary: "Sản xuất video dọc (TikTok/Reels/Shorts) theo brief; nhập số liệu được giao.",
    guardrail: "Không tự công bố hình ảnh học sinh/khách khi chưa có quyền (QA23); chặn PII.",
  },
  sales_hotline: {
    roleId: "sales_hotline",
    label: "Đầu mối Sales / Hotline",
    badgeCode: "SALES",
    canViewRawPii: true,
    canViewSalaryAndHrPrivate: false,
    canApproveClaimsAndInsights: false,
    canApproveTechnicalAssets: false,
    canPublishContent: false,
    canEditRawMetrics: false,
    canConfirmCustomerStatus: true,
    canExportFullPii: false,
    canManagePermissions: false,
    summary: "Tiếp nhận hotline/inbox, xác nhận khách mới/cũ, phản hồi chất lượng lead & cơ hội.",
    guardrail: "Nguồn không biết giữ unknown; không bắt hỏi nguồn mọi cuộc gọi.",
  },
  executive: {
    roleId: "executive",
    label: "Ban Lãnh đạo",
    badgeCode: "EXEC",
    canViewRawPii: true,
    canViewSalaryAndHrPrivate: true,
    canApproveClaimsAndInsights: true,
    canApproveTechnicalAssets: false,
    canPublishContent: false,
    canEditRawMetrics: false,
    canConfirmCustomerStatus: false,
    canExportFullPii: true,
    canManagePermissions: false,
    summary: "Xem báo cáo quyết định (D01–D08), hiệu quả đầu tư, rủi ro dữ liệu & phê duyệt ngân sách.",
    guardrail: "Chế độ đọc chiến lược (Read-only trên dữ liệu gốc để tránh lệch log vận hành).",
  },
  ai_assistant: {
    roleId: "ai_assistant",
    label: "AI Hỗ trợ (Sandbox)",
    badgeCode: "AI",
    canViewRawPii: false,
    canViewSalaryAndHrPrivate: false,
    canApproveClaimsAndInsights: false,
    canApproveTechnicalAssets: false,
    canPublishContent: false,
    canEditRawMetrics: false,
    canConfirmCustomerStatus: false,
    canExportFullPii: false,
    canManagePermissions: false,
    summary: "Gợi ý phân loại, tóm tắt phản hồi ẩn danh, soạn nháp nội dung, phát hiện bất thường.",
    guardrail: "Cấm tự xác nhận insight (QA20), cấm quyết định nhân sự, xuất bản hoặc duyệt chi.",
  },
};

/**
 * Mask phone number for non-privileged roles (e.g., 0912345889 -> 0912***889)
 */
export function maskPhone(phone: string | null | undefined, roleId: SystemRoleId): string {
  if (!phone || phone === "unknown") return "unknown";
  if (ROLE_POLICIES[roleId].canViewRawPii) return phone;
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 7) return "***REDACTED***";
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

/**
 * Mask email for non-privileged roles (e.g., minh.quan@school.edu.vn -> mi***@school.edu.vn)
 */
export function maskEmail(email: string | null | undefined, roleId: SystemRoleId): string {
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
export function maskContactName(name: string | null | undefined, roleId: SystemRoleId): string {
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
  action: "create" | "update" | "merge" | "delete" | "export" | "permission_denied" | "revoke_access" | "restore_backup";
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
  const { roleId, employeeActive = true, actionType, entityType, entityId } = params;

  // QA22: Thu hồi quyền nhân sự rời nhóm
  if (!employeeActive) {
    const reason = "Tài khoản nhân sự đã ngừng hoạt động (active=false - Quy tắc QA22). Từ chối mọi quyền truy cập.";
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
