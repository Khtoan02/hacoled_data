import { redirect } from "next/navigation";
import { getMember } from "../../../lib/auth/server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
import { DashboardShell } from "../../../components/dashboard/shell";
import { MonthlyReview } from "../../../components/dashboard/monthly-review";
export default async function Page() {
  const member = await getMember();
  if (!member) redirect("/");
  if (ROLE_POLICIES[member.role].taskScope === "none") redirect("/admin");
  return (
    <DashboardShell
      title="Đánh giá theo tháng"
      description="Đối chiếu công việc và KPI trong phạm vi quyền của bạn."
    >
      <MonthlyReview />
    </DashboardShell>
  );
}
