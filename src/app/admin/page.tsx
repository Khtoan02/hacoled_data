import { redirect } from "next/navigation";
import { getMember } from "../../lib/auth/server";
import { isFullAccess, ROLE_POLICIES } from "../../lib/security/rbac";
import { DashboardShell } from "../../components/dashboard/shell";
import Workspace from "./workspace";

export default async function AdminPage() {
  const member = await getMember();
  if (!member) redirect("/");
  if (isFullAccess(member.role)) return <Workspace />;
  if (ROLE_POLICIES[member.role].taskScope !== "none") redirect("/admin/tasks");
  return (
    <DashboardShell
      title="Quyền truy cập đang chờ thiết lập"
      description="Tài khoản Kinh doanh đã được tạo. Quyền nghiệp vụ sẽ được cấp khi có yêu cầu cụ thể."
    >
      <section className="members-table-panel">
        <div className="section-heading">
          <p>
            Vui lòng liên hệ Leader Marketing hoặc Giám đốc để được cấp quyền.
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}
