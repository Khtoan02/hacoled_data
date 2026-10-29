import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:3100",
  password = "Test-only-password-2026!";

test("polished table, kanban, todo, team and profile share real data and preserve permissions", async ({
  page,
  playwright,
}) => {
  const headers = { Origin: base, "x-real-ip": "198.51.100.120" };
  const status = await (await page.request.get("/api/auth/status")).json();
  if (status.needsSetup)
    expect(
      (
        await page.request.post("/api/auth/setup", {
          headers,
          data: {
            name: "Khánh Toàn",
            email: "owner@example.test",
            password,
            setupToken: "isolated-test-setup-token",
          },
        })
      ).status(),
    ).toBe(200);
  else
    expect(
      (
        await page.request.post("/api/auth/login", {
          headers,
          data: { password },
        })
      ).status(),
    ).toBe(200);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/tasks");
  await expect(
    page.getByRole("heading", { name: "Danh sách công việc" }),
  ).toBeVisible();
  await expect(
    page.getByText("Đang tải công việc…", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Tạo công việc", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Tên công việc", { exact: true })
    .fill("Hoàn thiện nội dung HacoLED");
  await dialog
    .getByLabel("Mô tả chung (nếu cần)", { exact: true })
    .fill("Kiểm tra thông điệp, thiết kế và bàn giao nội dung cho chiến dịch.");
  await dialog
    .getByLabel(/^Ghi chú công việc/)
    .fill("Kiểm tra thông điệp và bàn giao nội dung.");
  await expect(dialog.getByLabel("Độ ưu tiên công việc")).toHaveCount(0);
  await dialog.getByLabel("Hạn hoàn thành", { exact: true }).fill("2020-01-15");
  await dialog.getByLabel("Thêm mục checklist").fill("Kiểm tra nội dung");
  await dialog.getByRole("button", { name: "Thêm", exact: true }).click();
  await dialog.getByLabel("Hoàn tất Kiểm tra nội dung").check();
  await page.screenshot({
    path: ".impeccable/review/task-editor-desktop.png",
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Giao công việc", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const response = await page.request.get("/api/tasks");
  const tasks = (await response.json()).tasks;
  const task = tasks.find(
    (t: { title: string }) => t.title === "Hoàn thiện nội dung HacoLED",
  );
  expect(task.priority).toBe("normal");
  expect(task.checklist[0].done).toBe(true);
  for (const data of [
    { id: task.id, priority: "invalid" },
    { id: task.id, checklist: [{ id: "bad", title: "Bad", done: true }] },
  ]) {
    expect(
      (await page.request.patch("/api/tasks", { headers, data })).status(),
    ).toBe(400);
  }
  await page.getByRole("button", { name: "Kanban", exact: true }).click();
  await expect(page).toHaveURL(/view=board/);
  const card = page.locator(".kanban-card").filter({
    has: page.getByRole("button", {
      name: "Hoàn thiện nội dung HacoLED",
      exact: true,
    }),
  });
  const target = page.getByRole("region", {
    name: "Đang thực hiện",
    exact: true,
  });
  await card.dragTo(target);
  await expect(
    page.locator(".kanban-column.in_progress").getByRole("button", {
      name: "Hoàn thiện nội dung HacoLED",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/kanban-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "To-do", exact: true }).click();
  await page
    .getByLabel("Hoàn thành Hoàn thiện nội dung HacoLED", { exact: true })
    .check();
  await expect(
    page.getByLabel("Hoàn thành Hoàn thiện nội dung HacoLED", { exact: true }),
  ).toBeChecked();
  await page.screenshot({
    path: ".impeccable/review/todo-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Table", exact: true }).click();
  await page.getByLabel("Tìm công việc").fill("không có dữ liệu tương ứng");
  await expect(
    page.getByRole("heading", { name: "Không có công việc phù hợp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByLabel("Tìm công việc").fill("Hoàn thiện nội dung HacoLED");
  await page
    .getByRole("button", {
      name: "Mở chi tiết Hoàn thiện nội dung HacoLED",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Tên công việc", { exact: true })
    .fill("Hoàn thiện nội dung HacoLED đã sửa");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lưu thay đổi", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Hoàn thiện nội dung HacoLED đã sửa",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Tìm công việc").fill("");
  await page.screenshot({
    path: ".impeccable/review/tasks-polished-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Kanban", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/kanban-mobile.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Thành viên & quyền truy cập", exact: true })
    .click();
  await expect(
    page.getByText("Đang tải thành viên…", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Hiển thị dạng thẻ", exact: true })
    .click();
  await expect(page.locator(".team-card").first()).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/team-grid-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/team-grid-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("link", { name: "Mở hồ sơ cá nhân", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Hồ sơ cá nhân", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Họ và tên", { exact: true })
    .fill("Khánh Toàn Marketing");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(
    page.getByText("Đã cập nhật hồ sơ cá nhân.", { exact: true }),
  ).toBeVisible();
  const profile = (await (await page.request.get("/api/profile")).json())
    .member;
  expect(profile.name).toBe("Khánh Toàn Marketing");
  expect(profile.password_hash).toBeUndefined();
  expect(
    (
      await page.request.patch("/api/profile", {
        headers,
        data: { role: "executive" },
      })
    ).status(),
  ).toBe(400);
  await page.screenshot({
    path: ".impeccable/review/profile-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/profile-mobile.png",
    fullPage: true,
  });
  await page.request.patch("/api/profile", {
    headers,
    data: { name: "Khánh Toàn" },
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", {
      name: "Đánh giá vận hành theo tháng",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".bar-chart .recharts-wrapper")).toBeVisible();
  await expect(
    page.getByText("Đang tải tổng quan…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: ".impeccable/review/overview-polished-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Thu gọn thanh điều hướng", exact: true })
    .click();
  await expect(page.locator(".dashboard-app")).toHaveClass(/sidebar-collapsed/);
  await page
    .getByRole("button", { name: "Mở rộng thanh điều hướng", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/overview-polished-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/components");
  await expect(
    page.getByRole("heading", { name: "Thư viện giao diện", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mở bảng chi tiết", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Mở bảng chi tiết", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: ".impeccable/review/components-desktop.png",
    fullPage: true,
  });
  expect(
    (
      await page.request.delete(`/api/tasks?id=${task.id}`, { headers })
    ).status(),
  ).toBe(200);
  expect((await page.request.get(`/api/tasks?id=${task.id}`)).status()).toBe(
    404,
  );

  const viewerPassword = "UI-viewer-password-2026!";
  expect(
    (
      await page.request.post("/api/members", {
        headers,
        data: {
          name: "Người xem UI",
          email: "ui-viewer@roles.test",
          role: "marketing_staff",
          password: viewerPassword,
        },
      })
    ).status(),
  ).toBe(201);
  const viewer = await playwright.request.newContext({
    baseURL: base,
    extraHTTPHeaders: { Origin: base, "x-real-ip": "198.51.100.121" },
  });
  expect(
    (
      await viewer.post("/api/auth/login", {
        data: { password: viewerPassword },
      })
    ).status(),
  ).toBe(200);
  expect((await viewer.get("/api/profile")).status()).toBe(200);
  expect(
    (
      await viewer.patch("/api/profile", {
        data: { name: "Người xem cập nhật" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await viewer.patch("/api/profile", {
        data: { id: profile.id, name: "Không được phép" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await viewer.patch("/api/tasks", {
        data: { id: task.id, status: "pending" },
      })
    ).status(),
  ).toBe(403);
  expect((await viewer.delete(`/api/tasks?id=${task.id}`)).status()).toBe(403);
  await viewer.dispose();
});
