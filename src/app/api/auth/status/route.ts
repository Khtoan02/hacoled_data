import { NextResponse } from "next/server";
import { database } from "../../../../lib/auth/server";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ configured: false, needsSetup: false });
  try {
    const rows =
      await database()`SELECT EXISTS(SELECT 1 FROM app_members) AS populated`;
    return NextResponse.json({
      configured: true,
      needsSetup: !rows[0].populated,
    });
  } catch {
    return NextResponse.json({
      configured: false,
      needsSetup: false,
      migrationRequired: true,
    });
  }
}
