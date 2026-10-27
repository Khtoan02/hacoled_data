import { redirect } from "next/navigation";
import { getMember } from "../../../lib/auth/server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";

export default async function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getMember();
  if (!member) redirect("/");
  if (!ROLE_POLICIES[member.role].canViewSalaryAndHrPrivate) redirect("/admin");
  return children;
}
