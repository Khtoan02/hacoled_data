import { readFileSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.error("Thiếu DATABASE_URL trong môi trường hoặc .env.local.");
  process.exit(1);
}
try {
  const sql = neon(process.env.DATABASE_URL);
  const directory = new URL("../db/", import.meta.url);
  const statements = readdirSync(directory)
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort()
    .flatMap((name) =>
      readFileSync(new URL(name, directory), "utf8")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(724109)`,
    ...statements.map((statement) => sql.query(statement)),
  ]);
  console.log("Đã tạo schema tài khoản. Dữ liệu hiện có được giữ nguyên.");
} catch {
  console.error(
    "Migration thất bại. Kiểm tra kết nối PostgreSQL; thông tin bí mật không được in ra.",
  );
  process.exit(1);
}
