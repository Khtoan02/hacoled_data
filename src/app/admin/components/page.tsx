import { redirect } from "next/navigation";
import { getMember } from "../../../lib/auth/server";
import { ComponentLibrary } from "../../../components/dashboard/component-library";
export default async function Page() {
  const member = await getMember();
  if (!member) redirect("/");
  if (member.role !== "lead_marketing") redirect("/admin");
  return <ComponentLibrary />;
}
