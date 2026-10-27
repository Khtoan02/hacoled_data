import type { SystemRoleId } from "../security/rbac";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: SystemRoleId;
  active: boolean;
  created_at: string;
}
