import type { MemberRoleId } from "../security/rbac";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRoleId;
  active: boolean;
  created_at: string;
}
