import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  getMember,
  RequestError,
} from "../../../lib/auth/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    return NextResponse.json(
      { member },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    checkOrigin(req);
    const member = await getMember();
    if (!member) throw new RequestError("Vui lòng đăng nhập.", 401);
    const body = await req.json();
    if (
      !body ||
      typeof body !== "object" ||
      Object.keys(body).some((key) => !["name", "email"].includes(key))
    )
      throw new RequestError("Chỉ được cập nhật tên và email liên hệ.");
    const name = typeof body.name === "string" ? body.name.trim() : member.name;
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : member.email;
    if (
      !name ||
      name.length > 100 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw new RequestError("Điền họ tên và email hợp lệ.");
    const rows =
      await database()`UPDATE app_members SET name = ${name}, email = ${email} WHERE id = ${member.id} AND active = true
      AND NOT EXISTS(SELECT 1 FROM app_members other WHERE other.id <> ${member.id} AND other.email = ${email})
      RETURNING id, name, email, role, active, created_at`;
    if (!rows.length)
      throw new RequestError(
        "Email đã được sử dụng hoặc tài khoản vừa thay đổi.",
        409,
      );
    return NextResponse.json({ ok: true, member: rows[0] });
  } catch (error) {
    return apiError(error);
  }
}
