import { Suspense } from "react";
import { FloatingChat } from "../../components/dashboard/floating-chat";
import { redirect } from "next/navigation";
import { getMember } from "../../lib/auth/server";
import { SessionProvider } from "../../components/dashboard/session";

export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getMember();
  if (!member) redirect("/");
  return (
    <SessionProvider member={JSON.parse(JSON.stringify(member))}>
      {children}
      <Suspense fallback={null}><FloatingChat /></Suspense>
    </SessionProvider>
  );
}
