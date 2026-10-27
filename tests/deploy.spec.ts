import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";

test("production initializes account tables; preview skips and invalid configuration fails", () => {
  const run = (environment: string, connection: string) =>
    spawnSync(process.execPath, ["scripts/prepare-build.mjs"], {
      env: {
        ...process.env,
        VERCEL_ENV: environment,
        DATABASE_URL: connection,
        NODE_OPTIONS: "--import ./tests/support/neon-fetch.mjs",
      },
      encoding: "utf8",
    });
  const testUrl = "postgresql://test:test@ep-hacoled-test.neon.tech/test";
  for (let i = 0; i < 2; i++) {
    const migrated = run("production", testUrl);
    expect(migrated.status, migrated.stderr).toBe(0);
    expect(migrated.stdout).toContain("Đã tạo schema tài khoản");
  }
  const preview = run("preview", "intentionally-invalid");
  expect(preview.status).toBe(0);
  expect(preview.stdout).toBe("");
  const missing = run("production", "");
  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain("Thiếu DATABASE_URL");
});
