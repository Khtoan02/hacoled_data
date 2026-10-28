import { isFullAccess, ROLE_POLICIES, type MemberRoleId } from "./security/rbac";

// These sections contain browser-local examples rather than operational data.
export const PREVIEW_WORKSPACE_IDS = new Set([
  "solutions_proof", "strategy_lab", "campaigns_budget", "experiments",
  "content_channels", "website_seo", "crm_pipeline", "lead_sources",
  "sales_handoff", "team_cost", "learning_hub", "security_qa",
  "data_dictionary", "activity_log", "backup_restore", "components",
]);
export function canViewWorkspaceItem(role: MemberRoleId, id: string) {
  if (PREVIEW_WORKSPACE_IDS.has(id)) return role === "lead_marketing";
  if (id === "profile" || id === "chat") return true;
  if (["tasks", "channels", "kpis"].includes(id)) return ROLE_POLICIES[role].taskScope !== "none";
  if (["executive", "members", "team_survey"].includes(id)) return isFullAccess(role);
  return false;
}
