import { NextResponse } from "next/server";
import {
  database,
  isLocalAuthBypassEnabled,
} from "../../../../lib/auth/server";

export const dynamic = "force-dynamic";
export async function GET() {
  if (isLocalAuthBypassEnabled())
    return NextResponse.json({
      configured: true,
      needsSetup: false,
      localAuthBypass: true,
    });

  if (!process.env.DATABASE_URL)
    return NextResponse.json({ configured: false, needsSetup: false });
  try {
    const rows =
      await database()`SELECT EXISTS(SELECT 1 FROM app_members) AS populated`;
    return NextResponse.json({
      configured: true,
      needsSetup: !rows[0].populated,
    });
  } catch (error) {
    const migrationRequired =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "42P01";
    return NextResponse.json({
      configured: false,
      needsSetup: false,
      migrationRequired,
      connectionFailed: !migrationRequired,
    });
  }
}
