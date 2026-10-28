import { test, expect } from "@playwright/test";
import { currentMonth } from "../src/lib/kpis";
const baseURL = "http://127.0.0.1:3100";
test("monthly KPIs reconcile quantities once, enforce scope and show extra work", async ({
  playwright,
  browser,
}) => {
  const headers = { Origin: baseURL, "x-real-ip": "198.51.100.151" },
    admin = await playwright.request.newContext({
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
  const actors: Record<
    string,
    Awaited<ReturnType<typeof playwright.request.newContext>>
  > = {};
  for (const [key, role, name] of [
    ["kpi-staff", "marketing_staff", "Thu Hà"],
    ["kpi-intern", "marketing_intern", "Minh Anh KPI"],
    ["kpi-manager", "marketing_manager", "Trưởng phòng KPI"],
    ["kpi-sales", "sales_hotline", "Kinh doanh KPI"],
  ]) {
    expect(
      (
        await admin.post("/api/members", {
          data: {
            name,
            email: `${key}@kpis.test`,
            password: `KPI-${key}-2026!`,
            role,
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
          data: { password: `KPI-${key}-2026!` },
        })
      ).status(),
    ).toBe(200);
    actors[key] = c;
  }
  const members = (await (await admin.get("/api/members")).json()).members,
    staff = members.find(
      (m: { email: string }) => m.email === "kpi-staff@kpis.test",
    ),
    intern = members.find(
      (m: { email: string }) => m.email === "kpi-intern@kpis.test",
    );
  const channelBase = {
    platform: "facebook",
    url: "https://www.facebook.com/hacoled",
    handle: "@hacoled",
    notes: "Kênh dùng cho kiểm thử KPI",
    active: true,
    access: [],
  };
  const channel = await admin.post("/api/social-channels", {
    data: { ...channelBase, name: "HacoLED KPI Facebook" },
  });
  expect(channel.status()).toBe(201);
  const channelId = (await channel.json()).id;
  const yt = await admin.post("/api/social-channels", {
    data: {
      ...channelBase,
      name: "HacoLED KPI YouTube",
      platform: "youtube",
      url: "https://www.youtube.com/@hacoled",
    },
  });
  expect(yt.status()).toBe(201);
  const ytId = (await yt.json()).id;
  const month = currentMonth(),
    today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const previous = new Date(`${month}-01T00:00:00Z`);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const prior = previous.toISOString().slice(0, 10);
  const ui = await browser.newContext({
      storageState: await admin.storageState(),
      viewport: { width: 1440, height: 1000 },
    }),
    page = await ui.newPage();
  await page.goto(`${baseURL}/admin/kpis?channel=${channelId}`);
  await page.getByRole("button", { name: "Giao KPI", exact: true }).click();
  await page
    .getByLabel("Nhân sự nhận KPI", { exact: true })
    .selectOption(staff.id);
  await page.getByLabel("Kênh được giao KPI", { exact: true }).click();
  await page
    .getByRole("option")
    .filter({ hasText: "HacoLED KPI Facebook" })
    .click();
  await page.getByLabel("Chỉ tiêu KPI", { exact: true }).fill("20");
  await page
    .getByLabel("Ghi chú KPI", { exact: true })
    .fill("Ưu tiên nội dung dự án và giải pháp LED.");
  await page.getByRole("button", { name: "Lưu KPI", exact: true }).click();
  await expect(
    page.getByText(
      "Đã lưu chỉ tiêu KPI. Thành viên có thể xem và liên kết công việc.",
      { exact: true },
    ),
  ).toBeVisible();
  const first = (
    await (await admin.get(`/api/kpis?month=${month}`)).json()
  ).kpis.find(
    (k: { channel_id: string; assignee_id: string }) =>
      k.channel_id === channelId && k.assignee_id === staff.id,
  );
  expect(first.target).toBe(20);
  const base = {
    assignee_id: staff.id,
    channel_id: channelId,
    month,
    output_type: "post",
    target: 20,
    notes: "Chỉ tiêu nội dung",
    active: true,
  };
  expect((await admin.post("/api/kpis", { data: base })).status()).toBe(409);
  expect(
    (await admin.post("/api/kpis", { data: { ...base, target: 0 } })).status(),
  ).toBe(400);
  expect(
    (await actors["kpi-staff"].post("/api/kpis", { data: base })).status(),
  ).toBe(403);
  expect((await actors["kpi-sales"].get("/api/kpis")).status()).toBe(403);
  const video = await admin.post("/api/kpis", {
    data: { ...base, channel_id: ytId, output_type: "video", target: 4 },
  });
  expect(video.status()).toBe(201);
  const videoId = (await video.json()).id;
  const internGoal = await admin.post("/api/kpis", {
    data: { ...base, assignee_id: intern.id, target: 10 },
  });
  expect(internGoal.status()).toBe(201);
  const internGoalId = (await internGoal.json()).id;
  const staffClient = actors["kpi-staff"];
  const own = await staffClient.post("/api/tasks", {
    data: {
      title: "Sản xuất bài viết Facebook tháng này",
      assignee_id: staff.id,
      channel_id: channelId,
      kpi_id: first.id,
      output_type: "post",
      planned_quantity: 20,
    },
  });
  expect(own.status()).toBe(201);
  const taskId = (await own.json()).id;
  const fetchTask = async () =>
    (await (await staffClient.get(`/api/tasks?id=${taskId}`)).json()).tasks[0];
  const update = async (extra: object = {}) => {
    const t = await fetchTask();
    return staffClient.patch("/api/tasks/report", {
      data: {
        id: taskId,
        version: t.report_version,
        status: "completed",
        result_text: "Đã hoàn thành và bàn giao nội dung.",
        evidence_links: [],
        completed_items: [],
        channel_id: channelId,
        kpi_id: first.id,
        output_type: "post",
        delivered_quantity: 22,
        delivered_on: today,
        ...extra,
      },
    });
  };
  const goal = async () =>
    (
      await (await staffClient.get(`/api/kpis?month=${month}`)).json()
    ).kpis.find((k: { id: string }) => k.id === first.id);
  expect((await update({ status: "in_progress" })).status()).toBe(200);
  expect((await goal()).delivered).toBe(0);
  expect((await update()).status()).toBe(200);
  expect((await goal()).delivered).toBe(22);
  expect((await goal()).planned).toBe(20);
  expect((await update()).status()).toBe(200);
  expect((await goal()).delivered).toBe(22);
  expect((await update({ status: "in_progress" })).status()).toBe(200);
  expect((await goal()).delivered).toBe(0);
  expect((await update({ delivered_on: prior })).status()).toBe(200);
  expect((await goal()).delivered).toBe(0);
  expect((await goal()).outside_month).toBe(22);
  expect((await update({ delivered_quantity: -1 })).status()).toBe(400);
  expect((await update({ delivered_quantity: 1.5 })).status()).toBe(400);
  expect((await update({ delivered_on: "2099-01-01" })).status()).toBe(400);
  expect((await update({ kpi_id: internGoalId })).status()).toBe(409);
  expect((await update()).status()).toBe(200);
  expect(
    (
      await admin.patch("/api/tasks", {
        data: { id: taskId, assignee_id: intern.id },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await staffClient.post("/api/tasks", {
        data: { title: "Không được giao người khác", assignee_id: intern.id },
      })
    ).status(),
  ).toBe(403);
  for (const amount of [1, 3])
    expect(
      (
        await staffClient.post("/api/tasks", {
          data: {
            title: `Bàn giao ${amount} video YouTube`,
            assignee_id: staff.id,
            channel_id: ytId,
            kpi_id: videoId,
            output_type: "video",
            planned_quantity: amount,
            delivered_quantity: amount,
            delivered_on: today,
            status: "completed",
          },
        })
      ).status(),
    ).toBe(201);
  const extraTask = await staffClient.post("/api/tasks", {
    data: {
      title: "Thiết kế thêm banner sự kiện",
      assignee_id: staff.id,
      channel_id: channelId,
      output_type: "image",
      planned_quantity: 2,
      delivered_quantity: 2,
      delivered_on: today,
      status: "completed",
    },
  });
  expect(extraTask.status()).toBe(201);
  expect(
    (
      await actors["kpi-intern"].post("/api/tasks", {
        data: {
          title: "Hỗ trợ nội dung ngoài chỉ tiêu",
          assignee_id: intern.id,
          output_type: "other",
          status: "completed",
          delivered_quantity: 1,
          delivered_on: today,
        },
      })
    ).status(),
  ).toBe(201);
  const staffData = await (
    await staffClient.get(`/api/kpis?month=${month}`)
  ).json();
  expect(
    staffData.kpis.every(
      (k: { assignee_id: string }) => k.assignee_id === staff.id,
    ),
  ).toBe(true);
  expect(staffData.extras.map((t: { title: string }) => t.title)).toContain(
    "Thiết kế thêm banner sự kiện",
  );
  expect(
    staffData.extras.every(
      (t: { assignee_id: string }) => t.assignee_id === staff.id,
    ),
  ).toBe(true);
  expect(
    staffData.kpis.find((k: { id: string }) => k.id === videoId).delivered,
  ).toBe(4);
  const manager = await (
    await actors["kpi-manager"].get(`/api/kpis?month=${month}`)
  ).json();
  expect(manager.kpis.some((k: { id: string }) => k.id === internGoalId)).toBe(
    true,
  );
  expect(
    (
      await actors["kpi-manager"].patch("/api/kpis", {
        data: { id: first.id, version: 0, target: 1, notes: "", active: true },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await admin.patch("/api/kpis", {
        data: {
          id: first.id,
          version: 0,
          target: 24,
          notes: "Điều chỉnh chỉ tiêu",
          active: true,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.patch("/api/kpis", {
        data: { id: first.id, version: 0, target: 1, notes: "", active: true },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await admin.patch("/api/kpis", {
        data: {
          id: first.id,
          version: 1,
          target: 20,
          notes: "Ưu tiên nội dung dự án và giải pháp LED.",
          active: true,
        },
      })
    ).status(),
  ).toBe(200);
  const reportHistory = (
    await (await staffClient.get(`/api/tasks/report?id=${taskId}`)).json()
  ).reports;
  expect(reportHistory[0].kpi_id).toBe(first.id);
  expect(reportHistory[0].delivered_quantity).toBe(22);
  await page.getByLabel("Lọc kênh KPI").click();
  await page.getByRole("option", { name: "Mọi kênh", exact: true }).click();
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.getByText("110%", { exact: true })).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Thiết kế thêm banner sự kiện", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/kpis-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/kpis-mobile.png",
    fullPage: true,
  });
  const staffUI = await browser.newContext({
      storageState: await staffClient.storageState(),
      viewport: { width: 1440, height: 1000 },
    }),
    staffPage = await staffUI.newPage();
  await staffPage.goto(`${baseURL}/admin/kpis`);
  await expect(staffPage.getByText("110%", { exact: true })).toBeVisible();
  await expect(
    staffPage.getByRole("button", { name: "Giao KPI", exact: true }),
  ).toHaveCount(0);
  const firstCard = staffPage.locator(".kpi-card").filter({
    has: staffPage.getByRole("heading", {
      name: "Bài viết",
      exact: true,
    }),
  });
  await firstCard
    .getByRole("link", { name: "Lập công việc", exact: true })
    .click();
  await expect(staffPage.getByRole("dialog")).toBeVisible();
  await expect(staffPage.getByLabel("KPI liên quan")).toHaveValue(first.id);
  await staffPage
    .getByLabel("Tên công việc", { exact: true })
    .fill("Bài bổ sung sau khi vượt KPI");
  await staffPage.getByLabel("Khối lượng dự kiến").fill("2");
  await staffPage.getByLabel(/^Tuyến nội dung/).fill("Dự án LED");
  await staffPage.getByLabel(/^Định dạng nội dung/).fill("Bài ảnh");
  await staffPage
    .getByRole("button", { name: "Giao công việc", exact: true })
    .click();
  await expect(staffPage.getByRole("dialog")).toHaveCount(0);
  await expect(
    staffPage.getByRole("button", {
      name: "Bài bổ sung sau khi vượt KPI",
      exact: true,
    }),
  ).toBeVisible();
  await staffPage
    .getByRole("button", {
      name: "Mở chi tiết Bài bổ sung sau khi vượt KPI",
      exact: true,
    })
    .click();
  await staffPage.getByLabel("Sản lượng hoàn thành").fill("2");
  await staffPage.getByLabel("Ngày sản lượng").fill(today);
  await staffPage
    .getByLabel("Đã hoàn thành công việc", { exact: true })
    .check();
  await staffPage
    .getByRole("button", { name: "Lưu kết quả & tiến độ", exact: true })
    .click();
  await expect(
    staffPage.getByText("24/20 bài · 120%", { exact: true }),
  ).toBeVisible();
  await staffPage.locator(".ui-drawer").evaluate((el) => el.scrollTo(0, 0));
  await staffPage.screenshot({
    path: ".impeccable/review/kpi-task-report.png",
  });
  await staffPage.setViewportSize({ width: 390, height: 844 });
  expect(
    await staffPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await staffPage.screenshot({
    path: ".impeccable/review/kpi-task-report-mobile.png",
  });
  await staffUI.close();
  await ui.close();
  for (const c of Object.values(actors)) await c.dispose();
  await admin.dispose();
});
