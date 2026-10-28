import { test, expect } from "@playwright/test";
const baseURL = "http://127.0.0.1:3100";
test("channel metadata, encrypted credentials, per-member grants and task channel selection", async ({
  playwright,
  browser,
}) => {
  const headers = { Origin: baseURL, "x-real-ip": "198.51.100.145" };
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
  const actors: Record<
    string,
    Awaited<ReturnType<typeof playwright.request.newContext>>
  > = {};
  for (const [key, role] of [
    ["channel-staff", "marketing_staff"],
    ["channel-other", "marketing_intern"],
    ["channel-sales", "sales_hotline"],
    ["channel-manager", "marketing_manager"],
  ]) {
    expect(
      (
        await admin.post("/api/members", {
          data: {
            name: key === "channel-staff" ? "Minh Hà" : key,
            email: `${key}@channels.test`,
            password: `Social-${key}-2026!`,
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
          data: { password: `Social-${key}-2026!` },
        })
      ).status(),
    ).toBe(200);
    actors[key] = c;
  }
  const members = (await (await admin.get("/api/members")).json()).members,
    staff = members.find(
      (m: { email: string }) => m.email === "channel-staff@channels.test",
    );
  const ui = await browser.newContext({
      storageState: await admin.storageState(),
      viewport: { width: 1440, height: 1000 },
    }),
    page = await ui.newPage();
  await page.goto(`${baseURL}/admin/channels`);
  await page.getByRole("button", { name: "Thêm kênh", exact: true }).click();
  await page.getByLabel("Tên kênh", { exact: true }).fill("HacoLED Việt Nam");
  await page
    .getByLabel("Link truy cập kênh", { exact: true })
    .fill("https://www.facebook.com/hacoled");
  await page
    .getByLabel("Tên định danh / @handle", { exact: true })
    .fill("@hacoled");
  await page
    .getByLabel("Ghi chú kênh", { exact: true })
    .fill("Kênh thương hiệu, nội dung dự án và giải pháp màn hình LED.");
  await page
    .getByLabel("Tài khoản đăng nhập", { exact: true })
    .fill("synthetic-social@example.test");
  await page
    .getByLabel("Mật khẩu kênh", { exact: true })
    .fill("Synthetic-social-credential-2026!");
  await page
    .getByLabel("Cấp quyền xem đăng nhập cho Minh Hà", { exact: true })
    .check();
  await page.getByRole("button", { name: "Lưu kênh", exact: true }).click();
  await expect(
    page.getByText("Đã lưu kênh và quyền truy cập.", { exact: true }),
  ).toBeVisible();
  const list = await admin.get("/api/social-channels"),
    text = await list.text();
  expect(text).not.toContain("Synthetic-social-credential");
  expect(text).not.toContain("synthetic-social@example");
  expect(text).not.toContain("credentials_cipher");
  const channel = (await list.json()).channels.find(
    (c: { name: string }) => c.name === "HacoLED Việt Nam",
  );
  expect(channel.has_credentials).toBe(true);
  const id = channel.id;
  expect(
    (await actors["channel-staff"].get("/api/social-channels")).status(),
  ).toBe(200);
  expect(
    (await actors["channel-sales"].get("/api/social-channels")).status(),
  ).toBe(403);
  expect(
    (
      await actors["channel-other"].post("/api/social-channels/credentials", {
        data: { id },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await actors["channel-staff"].post("/api/social-channels", { data: {} })
    ).status(),
  ).toBe(403);
  expect(
    (
      await actors["channel-staff"].get("/api/social-channels/credentials")
    ).status(),
  ).toBe(405);
  const secret = await actors["channel-staff"].post(
    "/api/social-channels/credentials",
    { data: { id } },
  );
  expect(secret.status()).toBe(200);
  expect(secret.headers()["cache-control"]).toContain("no-store");
  expect((await secret.json()).credentials.password).toBe(
    "Synthetic-social-credential-2026!",
  );
  // Inspect only the isolated PostgreSQL fixture, never the production database.
  const stored = await (
    await fetch("http://127.0.0.1:54339", {
      method: "POST",
      body: JSON.stringify({
        query: "SELECT credentials_cipher FROM app_social_channels WHERE id=$1",
        params: [id],
      }),
    })
  ).json();
  const cipher = stored.rows[0][0];
  expect(cipher).toMatch(/^v1\./);
  expect(cipher).not.toContain("Synthetic");
  expect(cipher).not.toContain("example.test");
  const parts = cipher.split("."),
    damaged = Buffer.from(parts[3], "base64");
  damaged[0] ^= 1;
  parts[3] = damaged.toString("base64");
  const fixtureWrite = async (value: string) =>
    fetch("http://127.0.0.1:54339", {
      method: "POST",
      body: JSON.stringify({
        query:
          "UPDATE app_social_channels SET credentials_cipher=$1 WHERE id=$2",
        params: [value, id],
      }),
    });
  await fixtureWrite(parts.join("."));
  expect(
    (
      await admin.post("/api/social-channels/credentials", { data: { id } })
    ).status(),
  ).toBe(503);
  await fixtureWrite(cipher);
  const base = {
    name: "HacoLED Việt Nam",
    platform: "facebook",
    url: "https://www.facebook.com/hacoled",
    handle: "@hacoled",
    notes: "Kênh thương hiệu",
    active: true,
    access: [staff.id],
  };
  expect(
    (
      await admin.post("/api/social-channels", {
        data: { ...base, url: "javascript:alert(1)" },
      })
    ).status(),
  ).toBe(400);
  const second = await admin.post("/api/social-channels", {
    data: {
      ...base,
      name: "HacoLED Video",
      platform: "youtube",
      url: "https://www.youtube.com/@hacoled",
      access: [],
    },
  });
  expect(second.status()).toBe(201);
  const secondId = (await second.json()).id;
  const taskRes = await admin.post("/api/tasks", {
    data: {
      title: "Nội dung theo kênh social",
      assignee_id: staff.id,
      channel_id: id,
    },
  });
  expect(taskRes.status()).toBe(201);
  const taskId = (await taskRes.json()).id;
  let task = (
    await (await actors["channel-staff"].get(`/api/tasks?id=${taskId}`)).json()
  ).tasks[0];
  expect(task.channel_name).toBe("HacoLED Việt Nam");
  expect(JSON.stringify(task)).not.toContain("credentials");
  const staffUI = await browser.newContext({
      storageState: await actors["channel-staff"].storageState(),
      viewport: { width: 1440, height: 1000 },
    }),
    staffPage = await staffUI.newPage();
  await staffPage.goto(`${baseURL}/admin/tasks`);
  await staffPage
    .getByRole("button", {
      name: "Mở chi tiết Nội dung theo kênh social",
      exact: true,
    })
    .click();
  await staffPage.getByLabel("Kênh báo cáo").click();
  await staffPage
    .getByRole("option")
    .filter({ hasText: "HacoLED Việt Nam" })
    .click();
  await staffPage
    .getByRole("option")
    .filter({ hasText: "HacoLED Video" })
    .click();
  await staffPage.getByLabel("Kênh báo cáo").click();
  await staffPage
    .getByLabel("Kết quả thực hiện", { exact: true })
    .fill("Đã chuẩn bị nội dung video cho YouTube.");
  await staffPage
    .getByRole("button", { name: "Lưu kết quả & tiến độ", exact: true })
    .click();
  await expect(
    staffPage.getByText("Đã lưu kết quả và tiến độ công việc.", {
      exact: true,
    }),
  ).toBeVisible();
  task = (await (await admin.get(`/api/tasks?id=${taskId}`)).json()).tasks[0];
  expect(task.channel_id).toBe(secondId);
  expect(task.channel_ids).toEqual([secondId]);
  const history = (
    await (await admin.get(`/api/tasks/report?id=${taskId}`)).json()
  ).reports;
  expect(history[0].channel_name).toBe("HacoLED Video");
  await staffPage
    .getByRole("button", { name: "Đóng chi tiết", exact: true })
    .click();
  await staffPage.getByLabel("Lọc kênh công việc").click();
  await staffPage
    .getByRole("option")
    .filter({ hasText: "HacoLED Việt Nam" })
    .click();
  await expect(
    staffPage.getByRole("heading", {
      name: "Không có công việc phù hợp",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(
    page.locator(".social-card").filter({
      has: page.getByRole("heading", {
        name: /^(HacoLED Việt Nam|HacoLED Video)$/,
      }),
    }),
  ).toHaveCount(2);
  await page.screenshot({
    path: ".impeccable/review/social-channels-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/social-channels-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const card = page.locator(".social-card").filter({
    has: page.getByRole("heading", { name: "HacoLED Việt Nam", exact: true }),
  });
  await card.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("button", { name: "Xem thông tin", exact: true })
    .click();
  await expect(
    page.getByLabel("Mật khẩu kênh", { exact: true }),
  ).toHaveAttribute("type", "password");
  await page
    .getByRole("button", { name: "Hiện mật khẩu kênh", exact: true })
    .click();
  await expect(page.getByLabel("Mật khẩu kênh", { exact: true })).toHaveValue(
    "Synthetic-social-credential-2026!",
  );
  await page
    .getByRole("button", { name: "Ẩn thông tin ngay", exact: true })
    .click();
  await expect(page.getByLabel("Mật khẩu kênh", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Đóng chi tiết", exact: true })
    .click();
  // Secret values expire automatically in an open drawer.
  await page.clock.install();
  await card.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("button", { name: "Xem thông tin", exact: true })
    .click();
  await expect(page.getByLabel("Mật khẩu kênh", { exact: true })).toBeVisible();
  await page.clock.fastForward(60001);
  await expect(page.getByLabel("Mật khẩu kênh", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Đóng chi tiết", exact: true })
    .click();
  // Grant revocation is atomic and stale editors cannot restore old grants or change secrets.
  expect(
    (
      await admin.patch("/api/social-channels", {
        data: { ...base, id, version: channel.version, access: [] },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await actors["channel-staff"].post("/api/social-channels/credentials", {
        data: { id },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await admin.patch("/api/social-channels", {
        data: { ...base, id, version: channel.version },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await actors["channel-staff"].post("/api/social-channels/credentials", {
        data: { id },
      })
    ).status(),
  ).toBe(403);
  const preserved = await admin.post("/api/social-channels/credentials", {
    data: { id },
  });
  expect((await preserved.json()).credentials.username).toBe(
    "synthetic-social@example.test",
  );
  const current = (
    await (await admin.get(`/api/social-channels?id=${id}`)).json()
  ).channels[0];
  expect(
    (
      await admin.patch("/api/social-channels", {
        data: {
          ...base,
          id,
          version: current.version,
          active: false,
          access: [],
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.post("/api/social-channels/credentials", { data: { id } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await admin.post("/api/tasks", {
        data: {
          title: "Invalid archive assignment",
          assignee_id: staff.id,
          channel_id: id,
        },
      })
    ).status(),
  ).toBe(400);
  const archived = (
    await (await admin.get(`/api/social-channels?id=${id}`)).json()
  ).channels[0];
  expect(
    (
      await admin.patch("/api/social-channels", {
        data: {
          ...base,
          id,
          version: archived.version,
          clear_credentials: true,
          access: [],
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await (await admin.get(`/api/social-channels?id=${id}`)).json())
      .channels[0].has_credentials,
  ).toBe(false);
  const audit = await (
    await fetch("http://127.0.0.1:54339", {
      method: "POST",
      body: JSON.stringify({
        query:
          "SELECT action FROM app_social_channel_audit WHERE channel_id=$1",
        params: [id],
      }),
    })
  ).json();
  expect(
    audit.rows.some((r: string[]) => r[0] === "credentials_viewed"),
  ).toBeTruthy();
  // Channel management is independent of system-wide account/KPI administration.
  const manager = actors["channel-manager"];
  expect((await manager.get("/api/members")).status()).toBe(403);
  expect((await manager.post("/api/kpis", {data:{}})).status()).toBe(403);
  const createdByManager = await manager.post("/api/social-channels", {
    data: {...base,name:"Kênh do trưởng phòng quản lý",access:[],credentials:{username:"manager-channel",password:"Synthetic-manager-channel!"}},
  });
  expect(createdByManager.status()).toBe(201);
  const managedId = (await createdByManager.json()).id;
  const detail = await (await manager.get(`/api/social-channels?id=${managedId}`)).json();
  expect(detail.channels[0].can_view_credentials).toBe(true);
  expect(detail.access).toEqual([]);
  expect(detail.members.some((m:{id:string})=>m.id===staff.id)).toBe(true);
  expect(JSON.stringify(detail)).not.toContain("Synthetic-manager-channel!");
  expect((await manager.post("/api/social-channels/credentials",{data:{id:managedId}})).status()).toBe(200);
  expect((await manager.patch("/api/social-channels",{data:{...base,id:managedId,version:0,access:[staff.id]}})).status()).toBe(200);
  expect((await actors["channel-staff"].post("/api/social-channels/credentials",{data:{id:managedId}})).status()).toBe(200);
  const managerUI = await browser.newContext({storageState:await manager.storageState()});
  const managerPage = await managerUI.newPage();
  await managerPage.goto(`${baseURL}/admin/channels`);
  await managerPage.getByRole("button",{name:"Thêm kênh",exact:true}).click();
  await expect(managerPage.getByLabel("Tên kênh",{exact:true})).toBeVisible();
  await expect(managerPage.getByLabel("Cấp quyền xem đăng nhập cho Minh Hà",{exact:true})).toBeVisible();
  await managerPage.getByRole("button",{name:"Đóng chi tiết",exact:true}).click();
  expect((await manager.patch("/api/social-channels",{data:{...base,id:managedId,version:1,active:false,access:[]}})).status()).toBe(200);
  expect((await manager.post("/api/social-channels/credentials",{data:{id:managedId}})).status()).toBe(403);
  await managerUI.close();
  await ui.close();
  await staffUI.close();
  for (const c of Object.values(actors)) await c.dispose();
  await admin.dispose();
});
