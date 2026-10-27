import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.error("Thiếu DATABASE_URL trong môi trường hoặc .env.local.");
  process.exit(1);
}
try {
  const sql = neon(process.env.DATABASE_URL);
  const statements = readFileSync(
    new URL("../db/001-auth.sql", import.meta.url),
    "utf8",
  )
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  await sql.transaction(statements.map((statement) => sql.query(statement)));
  console.log("Đã tạo schema tài khoản. Dữ liệu hiện có được giữ nguyên.");
} catch {
  console.error(
    "Migration thất bại. Kiểm tra kết nối PostgreSQL; thông tin bí mật không được in ra.",
  );
  process.exit(1);
}
