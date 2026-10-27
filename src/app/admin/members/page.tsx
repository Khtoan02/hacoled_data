import { redirect } from "next/navigation";
import { canManageMembers, getMember } from "../../../lib/auth/server";
import { MembersPage } from "../../../components/dashboard/members";

export default async function Page() {
  const member = await getMember();
  if (!member) redirect("/");
  if (!canManageMembers(member)) redirect("/admin");
  return <MembersPage />;
}
