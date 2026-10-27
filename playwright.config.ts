import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    actionTimeout: 10000,
  },
  webServer: [
    {
      command: "node tests/support/neon-proxy.mjs",
      url: "http://127.0.0.1:54339",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command:
        "node --import ./tests/support/neon-fetch.mjs node_modules/next/dist/bin/next dev -p 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: "postgresql://test:test@ep-hacoled-test.neon.tech/test",
        ADMIN_SETUP_TOKEN: "isolated-test-setup-token",
        SOCIAL_CREDENTIALS_KEY: "11".repeat(32),
      },
      timeout: 90000,
    },
  ],
});
