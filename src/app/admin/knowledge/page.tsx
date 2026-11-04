import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMember } from "../../../lib/auth/server";
import { KnowledgePage } from "../../../components/dashboard/knowledge";

export default async function Page() {
  const member = await getMember();
  if (!member) redirect("/");
  return (
    <Suspense fallback={null}>
      <KnowledgePage />
    </Suspense>
  );
}
