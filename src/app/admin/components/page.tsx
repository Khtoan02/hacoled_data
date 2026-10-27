import { redirect } from "next/navigation";
import { getMember, canManageMembers } from "../../../lib/auth/server";
import { ComponentLibrary } from "../../../components/dashboard/component-library";
export default async function Page() {
  const member = await getMember();
  if (!member) redirect("/");
  if (!canManageMembers(member)) redirect("/admin");
  return <ComponentLibrary />;
}
