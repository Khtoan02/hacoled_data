"use client";

import { createContext, useContext } from "react";
import type { Member } from "../../lib/auth/types";

const SessionContext = createContext<Member | null>(null);
export function SessionProvider({
  member,
  children,
}: {
  member: Member;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={member}>{children}</SessionContext.Provider>
  );
}
export function useMember() {
  const member = useContext(SessionContext);
  if (!member) throw new Error("SessionProvider required");
  return member;
}
