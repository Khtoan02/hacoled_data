import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = "http://127.0.0.1:3100";
const password = "Test-only-password-2026!";

test("accounts, server permissions, session revocation and responsive dashboard", async ({
  page,
  playwright,
}) => {
  await mkdir(".impeccable/review", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Khởi tạo không gian" }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/login-desktop.png",
    fullPage: true,
  });
  const anonymous = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  expect((await anonymous.get("/api/members")).status()).toBe(401);
  expect((await anonymous.get("/api/survey")).status()).toBe(401);
  expect(
    (
      await anonymous.post("/api/auth/setup", {
        data: {
          name: "Owner",
          email: "owner@example.test",
          password,
          setupToken: "wrong",
        },
      })
    ).status(),
  ).toBe(403);
  await page.getByLabel("Họ và tên", { exact: true }).fill("Khánh Toàn");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page
    .getByLabel("Mã thiết lập quản trị", { exact: true })
    .fill("isolated-test-setup-token");
  await page
    .getByRole("button", { name: "Tạo quản trị viên", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(
    page.getByRole("heading", { name: "Tổng quan Marketing" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1000, 40);
  await page.waitForTimeout(200); // Let tooltip exit transitions settle before visual capture.
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.screenshot({ path: ".impeccable/review/desktop-viewport.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "hacoled_session")?.httpOnly).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "Thành viên & Phân quyền", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thành viên & Phân quyền", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Thêm thành viên", exact: true })
    .click();
  await page.getByLabel("Họ và tên", { exact: true }).fill("Minh Anh");
  await page
    .getByLabel("Email đăng nhập", { exact: true })
    .fill("intern@example.test");
  await page.getByLabel("Vai trò", { exact: true }).selectOption("intern_seo");
  await page.getByLabel("Mật khẩu ban đầu", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Tạo thành viên", exact: true })
    .click();
  await expect(
    page.getByText("intern@example.test", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/members-desktop.png",
    fullPage: true,
  });
  const api = page.request;
  const listed = await (await api.get("/api/members")).json();
  expect(JSON.stringify(listed)).not.toContain("password_hash");
  expect(new Date(listed.members[0].created_at).getFullYear()).toBe(
    new Date().getFullYear(),
  );
  const owner = listed.members.find(
    (m: { email: string }) => m.email === "owner@example.test",
  );
  const intern = listed.members.find(
    (m: { email: string }) => m.email === "intern@example.test",
  );
  expect(
    (
      await api.patch("/api/members", {
        headers: { Origin: origin },
        data: { id: owner.id, active: false },
      })
    ).status(),
  ).toBe(409);
  expect((await api.get("/api/members")).status()).toBe(200); // Rejected update must not revoke the current session.
  expect(
    (
      await anonymous.post("/api/auth/setup", {
        data: {
          name: "Other",
          email: "other@example.test",
          password,
          setupToken: "isolated-test-setup-token",
        },
      })
    ).status(),
  ).toBe(409);
  const staff = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  expect(
    (
      await staff.post("/api/auth/login", {
        data: { email: "intern@example.test", password: "wrong-password" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await staff.post("/api/auth/login", {
        data: { email: "intern@example.test", password },
      })
    ).status(),
  ).toBe(200);
  expect((await staff.get("/api/members")).status()).toBe(403);
  expect(
    (
      await staff.patch("/api/members", {
        data: { id: owner.id, role: "intern_seo" },
      })
    ).status(),
  ).toBe(403);
  expect((await staff.get("/api/survey")).status()).toBe(403);
  expect((await staff.delete("/api/survey?id=does-not-exist")).status()).toBe(
    403,
  );
  expect(
    (
      await api.patch("/api/members", {
        headers: { Origin: "https://untrusted.example" },
        data: { id: intern.id, active: false },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await api.patch("/api/members", {
        headers: { Origin: origin },
        data: { id: intern.id, password: "Reset-only-password-2026!" },
      })
    ).status(),
  ).toBe(200);
  expect((await staff.get("/api/summary")).status()).toBe(401);
  expect(
    (
      await staff.post("/api/auth/login", {
        data: { email: "intern@example.test", password },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await staff.post("/api/auth/login", {
        data: {
          email: "intern@example.test",
          password: "Reset-only-password-2026!",
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await api.patch("/api/members", {
        headers: { Origin: origin },
        data: { id: intern.id, active: false },
      })
    ).status(),
  ).toBe(200);
  expect((await staff.get("/api/summary")).status()).toBe(401);
  for (let i = 0; i < 10; i++)
    await anonymous.post("/api/auth/login", {
      data: { email: "missing@example.test", password },
    });
  expect(
    (
      await anonymous.post("/api/auth/login", {
        data: { email: "missing@example.test", password },
      })
    ).status(),
  ).toBe(429);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Thành viên & Phân quyền", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/members-mobile.png",
    fullPage: true,
  });
  const menu = page.getByRole("button", { name: "Mở menu", exact: true });
  await page.getByRole("link", { name: "Đến nội dung" }).focus();
  await page.keyboard.press("Tab");
  await expect(menu).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Đóng menu", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole("button", { name: "Tổng quan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tổng quan Marketing" }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await anonymous.dispose();
  await staff.dispose();
});
