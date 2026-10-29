import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
const baseURL = "http://127.0.0.1:3100";
test("assignees report outcomes with inline images, immutable history and scoped permissions", async ({
  playwright,
  browser,
}) => {
  const headers = { Origin: baseURL, "x-real-ip": "198.51.100.131" };
  const admin = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: headers,
  });
  const auth = await (await admin.get("/api/auth/status")).json();
  if (auth.needsSetup)
    expect(
      (
        await admin.post("/api/auth/setup", {
          data: {
            name: "Khánh Toàn",
            email: "owner@example.test",
            password: "Test-only-password-2026!",
            setupToken: "isolated-test-setup-token",
          },
        })
      ).status(),
    ).toBe(200);
  else
    expect(
      (
        await admin.post("/api/auth/login", {
          data: { password: "Test-only-password-2026!" },
        })
      ).status(),
    ).toBe(200);
  const people = [
    ["report-staff", "marketing_staff"],
    ["report-intern", "marketing_intern"],
    ["report-manager", "marketing_manager"],
    ["report-sales", "sales_hotline"],
  ];
  const clients: Record<
    string,
    Awaited<ReturnType<typeof playwright.request.newContext>>
  > = {};
  for (const [key, role] of people) {
    expect(
      (
        await admin.post("/api/members", {
          data: {
            name: key === "report-staff" ? "Mai Anh" : key,
            email: `${key}@proof.test`,
            role,
            password: `Evidence-${key}-2026!`,
          },
        })
      ).status(),
    ).toBe(201);
    const c = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: headers,
    });
    expect(
      (
        await c.post("/api/auth/login", {
          data: { password: `Evidence-${key}-2026!` },
        })
      ).status(),
    ).toBe(200);
    clients[key] = c;
  }
  const members = (await (await admin.get("/api/members")).json()).members;
  const staff = members.find(
    (m: { email: string }) => m.email === "report-staff@proof.test",
  );
  const item = randomUUID();
  const created = await admin.post("/api/tasks", {
    data: {
      title: "Báo cáo nội dung chiến dịch LED",
      description: "Bàn giao nội dung và hình ảnh thực tế.",
      assignee_id: staff.id,
      due_at: "2030-01-31T10:00:00Z",
      checklist: [
        { id: item, title: "Đăng nội dung và kiểm tra hiển thị", done: false },
      ],
    },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).id;
  const report = {
    id,
    version: 0,
    status: "in_progress",
    result_text: "Đã chuẩn bị nội dung.",
    evidence_links: [],
    completed_items: [],
  };
  expect(
    (
      await clients["report-intern"].patch("/api/tasks/report", {
        data: report,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await clients["report-manager"].patch("/api/tasks/report", {
        data: report,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await clients["report-sales"].patch("/api/tasks/report", { data: report })
    ).status(),
  ).toBe(403);
  expect(
    (await clients["report-intern"].get(`/api/tasks/report?id=${id}`)).status(),
  ).toBe(404);
  for (const data of [
    { ...report, assignee_id: staff.id },
    { ...report, evidence_links: ["javascript:alert(1)"] },
    { ...report, completed_items: [randomUUID()] },
    { ...report, completed_at: "2000-01-01" },
  ]) {
    expect([400, 409]).toContain(
      (
        await clients["report-staff"].patch("/api/tasks/report", { data })
      ).status(),
    );
  }
  expect(
    (
      await clients["report-staff"].patch("/api/tasks/report", { data: report })
    ).status(),
  ).toBe(200);
  expect(
    (
      await clients["report-staff"].patch("/api/tasks/report", { data: report })
    ).status(),
  ).toBe(409);
  const context = await browser.newContext({
    storageState: await clients["report-staff"].storageState(),
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.route("https://evidence.example.test/proof.png", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: readFileSync("src/app/icon.png"),
    }),
  );
  await page.route("https://evidence.example.test/broken", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto(`${baseURL}/admin/tasks`);
  await page
    .getByRole("button", {
      name: "Mở chi tiết Báo cáo nội dung chiến dịch LED",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kết quả & tiến độ", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Kết quả thực hiện", { exact: true })
    .fill(
      "Đã đăng 3 bài nội dung, bàn giao hình ảnh chiến dịch. Chờ quản lý đối chiếu chất lượng.",
    );
  await page
    .getByRole("button", { name: "Kết quả & tiến độ", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Đóng chi tiết", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Báo cáo hoàn tất Đăng nội dung và kiểm tra hiển thị")
    .check();
  await page.getByLabel("Đã hoàn thành công việc", { exact: true }).check();
  await page
    .getByLabel("Link ảnh minh chứng")
    .fill("https://evidence.example.test/proof.png");
  await page.getByRole("button", { name: "Thêm ảnh", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Ảnh minh chứng 1", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Phóng to ảnh minh chứng 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Thu nhỏ ảnh minh chứng 1", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  expect(context.pages()).toHaveLength(1);
  await page
    .getByRole("button", { name: "Thu nhỏ ảnh minh chứng 1", exact: true })
    .click();
  await page
    .getByLabel("Link ảnh minh chứng")
    .fill("https://evidence.example.test/broken");
  await page.getByRole("button", { name: "Thêm ảnh", exact: true }).click();
  await expect(
    page.getByText(
      "Không tải được ảnh. Kiểm tra quyền truy cập hoặc dùng link ảnh trực tiếp.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xóa ảnh minh chứng 2", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lưu kết quả & tiến độ", exact: true })
    .click();
  await expect(
    page.getByText("Đã lưu kết quả và tiến độ công việc.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".result-history li")).toHaveCount(2);
  await page.locator(".ui-drawer").evaluate((el) => el.scrollTo(0, 0));
  await page.screenshot({ path: ".impeccable/review/task-report-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.locator(".ui-drawer").evaluate((el) => el.scrollTo(0, 0));
  await page.screenshot({ path: ".impeccable/review/task-report-mobile.png" });
  await page
    .getByRole("button", { name: "Phóng to ảnh minh chứng 1", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: ".impeccable/review/task-evidence-mobile.png",
  });
  const saved = (
    await (await clients["report-staff"].get(`/api/tasks?id=${id}`)).json()
  ).tasks[0];
  expect(saved.status).toBe("completed");
  expect(saved.completed_at).toBeTruthy();
  expect(saved.checklist[0].done).toBe(true);
  expect(saved.evidence_links).toEqual([
    "https://evidence.example.test/proof.png",
  ]);
  const history = (
    await (
      await clients["report-manager"].get(`/api/tasks/report?id=${id}`)
    ).json()
  ).reports;
  expect(history[0].actor_name).toBe("Mai Anh");
  expect(history[0].result_text).toContain("3 bài");
  expect(history[0].due_at).toBeTruthy();
  const sameStatus = await clients["report-staff"].patch("/api/tasks/report", {
    data: {
      ...report,
      version: saved.report_version,
      status: "completed",
      result_text: "Bổ sung kết quả",
      evidence_links: saved.evidence_links,
      completed_items: [item],
    },
  });
  expect(sameStatus.status()).toBe(200);
  expect((await sameStatus.json()).task.completed_at).toBe(saved.completed_at);
  const reopened = await admin.patch("/api/tasks", {
    data: { id, status: "in_progress" },
  });
  expect(reopened.status()).toBe(200);
  const after = (await (await admin.get(`/api/tasks?id=${id}`)).json())
    .tasks[0];
  expect(after.completed_at).toBeNull();
  const afterHistory = (
    await (await admin.get(`/api/tasks/report?id=${id}`)).json()
  ).reports;
  expect(afterHistory).toHaveLength(4);
  expect(
    afterHistory.some(
      (r: { completed_at: string }) => r.completed_at === saved.completed_at,
    ),
  ).toBeTruthy();
  // Staff and interns have the same reporting capability on their own assignments.
  const intern = members.find(
    (m: { email: string }) => m.email === "report-intern@proof.test",
  );
  expect(
    (
      await admin.patch("/api/tasks", { data: { id, assignee_id: intern.id } })
    ).status(),
  ).toBe(200);
  const reassigned = (
    await (await clients["report-intern"].get(`/api/tasks?id=${id}`)).json()
  ).tasks[0];
  expect(
    (
      await clients["report-staff"].patch("/api/tasks/report", {
        data: { ...report, version: reassigned.report_version },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await clients["report-intern"].patch("/api/tasks/report", {
        data: { ...report, version: reassigned.report_version },
      })
    ).status(),
  ).toBe(200);
  const latest = (
    await (await clients["report-intern"].get(`/api/tasks?id=${id}`)).json()
  ).tasks[0];
  const competing = await Promise.all(
    [1, 2].map(() =>
      clients["report-intern"].patch("/api/tasks/report", {
        data: { ...report, version: latest.report_version },
      }),
    ),
  );
  expect(competing.map((r) => r.status()).sort()).toEqual([200, 409]);
  await context.close();
  for (const c of Object.values(clients)) await c.dispose();
  await admin.dispose();
});
