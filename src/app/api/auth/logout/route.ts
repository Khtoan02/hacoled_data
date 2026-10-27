import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  checkOrigin,
  database,
  SESSION_COOKIE,
  apiError,
} from "../../../../lib/auth/server";
import { digest } from "../../../../lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token)
      await database()`DELETE FROM app_sessions WHERE token_hash = ${digest(token)}`;
    (await cookies()).delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
