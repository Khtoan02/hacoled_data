import { test, expect } from "@playwright/test";
const baseURL = "http://127.0.0.1:3100";
const ownerPassword = "Test-only-password-2026!";

test("six roles enforce task ownership, marketing team visibility and director administration", async ({
  playwright,
  browser,
}) => {
  const owner = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL, "x-real-ip": "198.51.100.100" },
  });
  const status = await (await owner.get("/api/auth/status")).json();
  if (status.needsSetup)
    expect(
      (
        await owner.post("/api/auth/setup", {
          data: {
            name: "Khánh Toàn",
            email: "owner@example.test",
            password: ownerPassword,
            setupToken: "isolated-test-setup-token",
          },
        })
      ).status(),
    ).toBe(200);
  else
    expect(
      (
        await owner.post("/api/auth/login", {
          data: { password: ownerPassword },
        })
      ).status(),
    ).toBe(200);
  const definitions = [
    { key: "manager-a", name: "Trưởng phòng A", role: "marketing_manager" },
    { key: "manager-b", name: "Trưởng phòng B", role: "marketing_manager" },
    { key: "staff-a", name: "Nhân viên A", role: "marketing_staff" },
    { key: "staff-b", name: "Nhân viên B", role: "marketing_staff" },
    { key: "intern-a", name: "Thực tập A", role: "marketing_intern" },
    { key: "director-a", name: "Giám đốc", role: "executive" },
    { key: "sales-a", name: "Kinh doanh", role: "sales_hotline" },
  ];
  for (const d of definitions)
    expect(
      (
        await owner.post("/api/members", {
          data: {
            name: d.name,
            email: `${d.key}@roles.test`,
            role: d.role,
            password: `Role-specific-${d.key}-2026!`,
          },
        })
      ).status(),
    ).toBe(201);
  expect(
    (
      await owner.post("/api/members", {
        data: {
          name: "AI",
          email: "ai@roles.test",
          role: "ai_assistant",
          password: "Not-an-assignable-role-2026!",
        },
      })
    ).status(),
  ).toBe(400);
  const members = (await (await owner.get("/api/members")).json()).members;
  const leader = members.find(
    (m: { email: string }) => m.email === "owner@example.test",
  );
  const taskByKey: Record<string, string> = {};
  for (const d of [
    ...definitions,
    { key: "leader", name: "Leader", role: "lead_marketing" },
  ]) {
    const assignee =
      d.key === "leader"
        ? leader
        : members.find(
            (m: { email: string }) => m.email === `${d.key}@roles.test`,
          );
    const result = await owner.post("/api/tasks", {
      data: { title: `Công việc · ${d.name}`, assignee_id: assignee.id },
    });
    expect(result.status()).toBe(201);
    taskByKey[d.key] = (await result.json()).id;
  }
  const contexts: Record<
    string,
    Awaited<ReturnType<typeof playwright.request.newContext>>
  > = {};
  for (const d of definitions) {
    const api = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL, "x-real-ip": "198.51.100.101" },
    });
    contexts[d.key] = api;
    expect(
      (
        await api.post("/api/auth/login", {
          data: { password: `Role-specific-${d.key}-2026!` },
        })
      ).status(),
    ).toBe(200);
    const response = await api.get("/api/tasks");
    if (d.key === "sales-a") {
      expect(response.status()).toBe(403);
      continue;
    }
    expect(response.status()).toBe(200);
    const visibleTasks = (await response.json()).tasks;
    const ids = visibleTasks
      .filter((t: { id: string }) => Object.values(taskByKey).includes(t.id))
      .map((t: { id: string }) => t.id)
      .sort();
    if (d.role !== "executive") {
      const current = members.find(
        (m: { email: string }) => m.email === `${d.key}@roles.test`,
      );
      expect(
        visibleTasks.every(
          (t: { assignee_id: string; assignee_role: string }) =>
            t.assignee_id === current.id ||
            (d.role === "marketing_manager" &&
              ["marketing_staff", "marketing_intern"].includes(
                t.assignee_role,
              )),
        ),
      ).toBe(true);
    }
    const expectedKeys =
      d.role === "executive"
        ? Object.keys(taskByKey)
        : d.role === "marketing_manager"
          ? [d.key, "staff-a", "staff-b", "intern-a"]
          : [d.key];
    expect(ids).toEqual(expectedKeys.map((k) => taskByKey[k]).sort());
    if (d.role !== "executive") {
      expect(
        (await api.get(`/api/tasks?id=${taskByKey.leader}`)).status(),
      ).toBe(404);
      expect(
        (
          await api.post("/api/tasks", {
            data: { title: "Không được giao", assignee_id: leader.id },
          })
        ).status(),
      ).toBe(403);
      expect(
        (
          await api.patch("/api/tasks", {
            data: { id: taskByKey[d.key], status: "completed" },
          })
        ).status(),
      ).toBe(403);
      expect((await api.get("/api/members")).status()).toBe(403);
      expect((await api.get("/api/summary")).status()).toBe(403);
    }
  }
  expect((await owner.get("/api/tasks")).status()).toBe(200);
  const director = contexts["director-a"];
  expect((await director.get("/api/members")).status()).toBe(200);
  expect((await director.get("/api/summary")).status()).toBe(200);
  expect(
    (
      await director.patch("/api/tasks", {
        data: { id: taskByKey["staff-a"], status: "completed" },
      })
    ).status(),
  ).toBe(200);

  const ui = await browser.newContext({
    storageState: await owner.storageState(),
    viewport: { width: 1440, height: 1000 },
  });
  const page = await ui.newPage();
  await page.goto(`${baseURL}/admin/members`);
  await expect(page.locator(".role-reference tbody tr")).toHaveCount(6);
  await expect(
    page.getByRole("columnheader", { name: "Duyệt nội dung", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("columnheader", { name: "Phạm vi công việc" }),
  ).toBeVisible();
  await page
    .getByLabel("Tìm tên hoặc email thành viên")
    .fill("manager-a@roles.test");
  await expect(
    page.getByText("manager-a@roles.test", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/roles-members.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Công việc", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Danh sách công việc" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tạo công việc", exact: true })
    .click();
  await page
    .getByLabel("Tên công việc", { exact: true })
    .fill("Kế hoạch marketing tuần");
  await page
    .getByLabel("Người thực hiện", { exact: true })
    .selectOption(leader.id);
  await page
    .getByLabel(/^Ghi chú công việc/)
    .fill("Lập kế hoạch marketing và kết quả bàn giao.");
  await page
    .getByRole("button", { name: "Giao công việc", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Tìm công việc",{exact:true}).fill("Kế hoạch marketing tuần");
  await expect(
    page.getByText("Kế hoạch marketing tuần", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/tasks-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/tasks-mobile.png",
    fullPage: true,
  });
  await ui.close();
  const staffUI = await browser.newContext({
    storageState: await contexts["staff-a"].storageState(),
  });
  const staffPage = await staffUI.newPage();
  await staffPage.goto(`${baseURL}/admin?tab=crm_pipeline`);
  await expect(staffPage).toHaveURL(/\/admin\/tasks/);
  await expect(
    staffPage.getByText("Công việc · Nhân viên A", { exact: true }),
  ).toBeVisible();
  await expect(
    staffPage.getByText("Công việc · Nhân viên B", { exact: true }),
  ).toHaveCount(0);
  await staffUI.close();

  // Director counts as a full administrator when protecting the last privileged account.
  expect(
    (
      await director.patch("/api/members", {
        data: { id: leader.id, role: "marketing_staff" },
      })
    ).status(),
  ).toBe(200);
  const directorMember = members.find(
    (m: { email: string }) => m.email === "director-a@roles.test",
  );
  expect(
    (
      await director.patch("/api/members", {
        data: { id: directorMember.id, active: false },
      })
    ).status(),
  ).toBe(409);
  expect((await director.get("/api/members")).status()).toBe(200);
  expect(
    (
      await director.patch("/api/members", {
        data: { id: leader.id, role: "lead_marketing" },
      })
    ).status(),
  ).toBe(200);
  for (const api of Object.values(contexts)) await api.dispose();
  await owner.dispose();
});
