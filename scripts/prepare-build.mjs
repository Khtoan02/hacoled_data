import { spawnSync } from "node:child_process";

// Preview/local builds must not modify the production database.
if (process.env.VERCEL_ENV === "production") {
  console.log("Khởi tạo schema tài khoản cho Vercel Production…");
  const result = spawnSync(process.execPath, ["scripts/migrate.mjs"], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
