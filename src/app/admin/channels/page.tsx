import { redirect } from "next/navigation";
import { getMember } from "../../../lib/auth/server";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
import { ChannelsPage } from "../../../components/dashboard/channels";
export default async function Page() {
  const member = await getMember();
  if (!member) redirect("/");
  if (ROLE_POLICIES[member.role].taskScope === "none") redirect("/admin");
  return <ChannelsPage />;
}
