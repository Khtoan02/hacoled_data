import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseKpiImport } from "../src/lib/kpi-import";
import { currentMonth } from "../src/lib/kpis";
import { compareTaskDeadline, deadlineMonth } from "../src/lib/task-planning";
import { shiftMonth } from "../src/lib/performance";
const baseURL = "http://127.0.0.1:3100";
test("bulk KPI preview, atomic commit, conflict/retry, linked task import and scoped monthly performance", async ({
  playwright,
  browser,
}) => {
  expect(
    parseKpiImport(
      "Email\tKênh\tTháng\tLoại sản phẩm\tChỉ tiêu\nuser@test.vn\tchannel\t10/2026\tbai_viet\t20",
    )[0].email_nhan_su,
  ).toBe("user@test.vn");
  expect(
    parseKpiImport(
      '```json\n[{"email":"user@test.vn","notes":"Có, dấu phẩy"}]\n```',
    )[0].ghi_chu,
  ).toBe("Có, dấu phẩy");
  expect(() => parseKpiImport('email,kenh\n"chua dong,kenh')).toThrow();
  expect(deadlineMonth("2026-10-31T18:00:00Z")).toBe("2026-11");
  expect([{id:"none",due_at:null},{id:"late",due_at:"2026-11-30"},{id:"early",due_at:"2026-11-01"}].sort(compareTaskDeadline).map(t=>t.id)).toEqual(["early","late","none"]);
  const headers = { Origin: baseURL, "x-real-ip": "198.51.100.160" },
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
  const clients: Record<
    string,
    Awaited<ReturnType<typeof playwright.request.newContext>>
  > = {};
  for (const [key, role, name] of [
    ["bulk-staff", "marketing_staff", "An Nội Dung"],
    ["bulk-intern", "marketing_intern", "Bình Thực Tập"],
    ["bulk-manager", "marketing_manager", "Quản lý báo cáo"],
    ["bulk-sales", "sales_hotline", "Kinh doanh báo cáo"],
  ]) {
    expect(
      (
        await admin.post("/api/members", {
          data: {
            name,
            email: `${key}@bulk.test`,
            password: `Unique-${key}-2026!`,
            role,
          },
        })
      ).status(),
    ).toBe(201);
    const api = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: headers,
    });
    expect(
      (
        await api.post("/api/auth/login", {
          data: { password: `Unique-${key}-2026!` },
        })
      ).status(),
    ).toBe(200);
    clients[key] = api;
  }
  const members = (await (await admin.get("/api/members")).json()).members,
    staff = members.find(
      (m: { email: string }) => m.email === "bulk-staff@bulk.test",
    ),
    intern = members.find(
      (m: { email: string }) => m.email === "bulk-intern@bulk.test",
    );
  const c = {
    name: "Kênh đối chiếu Facebook",
    platform: "facebook",
    url: "https://www.facebook.com/bulk-test",
    handle: "@duplicate-bulk",
    notes: "Dữ liệu kiểm thử",
    active: true,
    access: [],
  };
  const first = await admin.post("/api/social-channels", { data: c });
  expect(first.status()).toBe(201);
  const channelId = (await first.json()).id;
  expect(
    (
      await admin.post("/api/social-channels", {
        data: {
          ...c,
          name: "Kênh trùng định danh",
          url: "https://www.facebook.com/bulk-test-2",
        },
      })
    ).status(),
  ).toBe(201);
  const video = await admin.post("/api/social-channels", {
    data: {
      ...c,
      name: "Kênh video đối chiếu",
      platform: "youtube",
      url: "https://www.youtube.com/@bulk-test",
      handle: "@bulk-video",
    },
  });
  const videoId = (await video.json()).id;
  const month = currentMonth(),
    previous = shiftMonth(month, -1),
    today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const row = {
    email_nhan_su: staff.email,
    kenh: channelId,
    nen_tang: "facebook",
    thang: month,
    loai_san_pham: "bai_viet",
    chi_tieu: 20,
    ghi_chu: "Ưu tiên giải pháp LED",
  };
  expect(
    (
      await clients["bulk-staff"].post("/api/kpis/import", {
        data: { rows: [row], stage: "preview", mode: "create" },
      })
    ).status(),
  ).toBe(403);
  const invalid = [
    row,
    { ...row, email_nhan_su: "khong-co@bulk.test" },
    { ...row, kenh: "@duplicate-bulk" },
    { ...row, loai_san_pham: "luot_xem" },
  ];
  const bad = await (
    await admin.post("/api/kpis/import", {
      data: { rows: invalid, stage: "preview", mode: "create" },
    })
  ).json();
  expect(bad.summary.errors).toBe(3);
  expect(
    (
      await admin.post("/api/kpis/import", {
        data: {
          rows: invalid,
          mode: "create",
          stage: "commit",
          fingerprint: bad.fingerprint,
          import_id: randomUUID(),
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (await (await admin.get(`/api/kpis?month=${month}`)).json()).kpis.some(
      (k: { assignee_id: string }) => k.assignee_id === staff.id,
    ),
  ).toBe(false);
  const ui = await browser.newContext({
      storageState: await admin.storageState(),
      viewport: { width: 1440, height: 1000 },
    }),
    page = await ui.newPage();
  await page.goto(`${baseURL}/admin/kpis`);
  await page.getByRole("button", { name: "Import KPI", exact: true }).click();
  const text = `email_nhan_su,kenh,nen_tang,thang,loai_san_pham,chi_tieu,ghi_chu\n${staff.email},${channelId},facebook,${month},bai_viet,20,Ưu tiên giải pháp LED\n${staff.email},${videoId},youtube,${month},video_dai,4,Video hướng dẫn`;
  await page.getByLabel("Dữ liệu import KPI").fill(text);
  await page
    .getByRole("button", { name: "Xem trước KPI", exact: true })
    .click();
  await expect(
    page.getByText("2 mới · 0 cập nhật · 0 dòng lỗi", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/kpi-import-preview-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/kpi-import-preview-mobile.png",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const committing = page.waitForRequest(
    (r) =>
      r.url().endsWith("/api/kpis/import") &&
      r.method() === "POST" &&
      r.postDataJSON().stage === "commit",
  );
  await page
    .getByRole("button", { name: "Xác nhận import 2 KPI", exact: true })
    .click();
  const batch = (await committing).postDataJSON();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const replay = await admin.post("/api/kpis/import", { data: batch });
  expect(replay.status()).toBe(200);
  expect((await replay.json()).replayed).toBe(true);
  const goals = (await (await admin.get(`/api/kpis?month=${month}`)).json())
      .kpis,
    goal = goals.find(
      (k: { channel_id: string }) => k.channel_id === channelId,
    );
  expect(goal.target).toBe(20);
  const updatedRows = [{ ...row, chi_tieu: 24 }],
    inspect = async () =>
      await (
        await admin.post("/api/kpis/import", {
          data: { rows: updatedRows, mode: "update", stage: "preview" },
        })
      ).json();
  const preview = await inspect();
  expect(preview.rows[0].existing_target).toBe(20);
  expect(
    (
      await admin.patch("/api/kpis", {
        data: {
          id: goal.id,
          version: goal.version,
          target: 22,
          notes: "Đổi trước khi import",
          active: true,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.post("/api/kpis/import", {
        data: {
          rows: updatedRows,
          mode: "update",
          stage: "commit",
          fingerprint: preview.fingerprint,
          import_id: randomUUID(),
        },
      })
    ).status(),
  ).toBe(409);
  const fresh = await inspect();
  expect(
    (
      await admin.post("/api/kpis/import", {
        data: {
          rows: updatedRows,
          mode: "update",
          stage: "commit",
          fingerprint: fresh.fingerprint,
          import_id: randomUUID(),
        },
      })
    ).status(),
  ).toBe(201);
  const workRows = [
    {
      ten_cong_viec: "Kế hoạch nội dung đã khớp KPI",
      email_nguoi_thuc_hien: staff.email,
      kenh: channelId,
      dinh_dang: "bai_viet",
      so_luong: 24,
      han_hoan_thanh: `${month}-01`,
      tuyen_noi_dung: "Giải pháp LED",
      dinh_dang_noi_dung: "Carousel",
      thang_kpi: month,
    },
  ];
  const invalidWork = await (await admin.post("/api/tasks/import", {data:{rows:[{...workRows[0],so_luong:0}],stage:"preview"}})).json();
  expect(invalidWork.valid).toBe(0);
  expect(invalidWork.errors.length).toBeGreaterThan(0);
  const wp = await (
    await admin.post("/api/tasks/import", {
      data: { rows: workRows, stage: "preview" },
    })
  ).json();
  expect(wp.errors).toEqual([]);
  expect(wp.rows[0].kpi_id).toBe(goal.id);
  const workBatch = {
      rows: workRows,
      stage: "commit",
      fingerprint: wp.fingerprint,
      import_id: randomUUID(),
    },
    imported = await admin.post("/api/tasks/import", { data: workBatch });
  expect(imported.status()).toBe(201);
  expect(
    (await (await admin.post("/api/tasks/import", { data: workBatch })).json())
      .replayed,
  ).toBe(true);
  expect((await admin.post("/api/tasks/import",{data:{...workBatch,import_id:randomUUID()}})).status()).toBe(409);
  const own = clients["bulk-staff"];
  let task = (await (await own.get("/api/tasks")).json()).tasks.find(
    (t: { title: string }) => t.title === "Kế hoạch nội dung đã khớp KPI",
  );
  expect(new Date(task.due_at).toISOString()).toBe(
    new Date(`${month}-01T17:00:00+07:00`).toISOString(),
  );
  expect(
    (
      await own.patch("/api/tasks/report", {
        data: {
          id: task.id,
          version: task.report_version,
          status: "completed",
          result_text: "Đã bàn giao sản lượng",
          evidence_links: ["https://example.test/proof.png"],
          completed_items: [],
          kpi_id: goal.id,
          output_type: "post",
          delivered_quantity: 24,
          delivered_on: today,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await own.post("/api/tasks", {
        data: {
          title: "Nội dung tháng trước",
          assignee_id: staff.id,
          status: "completed",
          output_type: "post",
          channel_id: channelId,
          delivered_quantity: 10,
          delivered_on: `${previous}-15`,
          brief: { content_pillar: "Giải pháp LED", content_format: "Bài ảnh" },
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await own.post("/api/tasks", {
        data: {
          title: "Thiết kế hỗ trợ ngoài KPI",
          assignee_id: staff.id,
          status: "completed",
          output_type: "image",
          delivered_quantity: 2,
          delivered_on: today,
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await clients["bulk-intern"].post("/api/tasks", {
        data: {
          title: "Hỗ trợ ngoài kỳ của thực tập",
          assignee_id: intern.id,
          status: "completed",
          output_type: "other",
          delivered_quantity: 1,
          delivered_on: today,
          brief: { notes: "Bàn giao hỗ trợ" },
        },
      })
    ).status(),
  ).toBe(201);
  expect((await clients["bulk-sales"].get("/api/performance")).status()).toBe(
    403,
  );
  const report = await (
    await own.get(`/api/performance?month=${month}`)
  ).json();
  expect(report.people).toHaveLength(1);
  expect(report.people[0].id).toBe(staff.id);
  expect(report.summary.met).toBe(1);
  expect(report.summary.extra).toBe(1);
  expect(report.summary.on_time_rate).toBe(0);
  expect(
    report.outputs.find(
      (o: { output_type: string }) => o.output_type === "post",
    ).change,
  ).toBe(140);
  expect(
    report.outputs.find(
      (o: { output_type: string }) => o.output_type === "image",
    ).change,
  ).toBeNull();
  expect(
    report.breakdown.find(
      (b: { pillar: string }) => b.pillar === "Giải pháp LED",
    ).with_evidence,
  ).toBe(1);
  const manager = await (
    await clients["bulk-manager"].get(`/api/performance?month=${month}`)
  ).json();
  expect(manager.people.some((p: { id: string }) => p.id === intern.id)).toBe(
    true,
  );
  const empty = await (await own.get("/api/performance?month=2000-01")).json();
  expect(empty.summary.on_time_rate).toBeNull();
  expect(empty.summary.completion_rate).toBeNull();
  await page.goto(`${baseURL}/admin/performance?month=${previous}`);
  await expect(page).toHaveURL(new RegExp(`/admin/kpis\\?view=review&month=${previous}$`));
  await expect(page.getByRole("heading",{name:"KPI & hiệu suất",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"KPI & hiệu suất",exact:true})).toHaveCount(1);
  await expect(page.getByRole("button",{name:"Đánh giá theo tháng",exact:true})).toHaveCount(0);
  await expect(page.getByLabel("Tháng đánh giá vận hành")).toHaveValue(previous);
  await page.getByRole("link",{name:"Chỉ tiêu tháng",exact:true}).click();
  await expect(page.getByLabel("Tháng KPI")).toHaveValue(previous);
  await page.getByLabel("Tháng KPI").fill(month);
  await page.getByRole("link",{name:"Đánh giá hiệu suất",exact:true}).click();
  await expect(page.getByLabel("Tháng đánh giá vận hành")).toHaveValue(month);
  await expect(page.getByRole("heading",{name:"Đánh giá vận hành theo tháng",exact:true})).toBeVisible();
  await page.goto(`${baseURL}/admin`);
  await expect(
    page.getByRole("heading", {
      name: "Đánh giá vận hành theo tháng",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".review-people").getByText(staff.name, { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/monthly-performance-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/monthly-performance-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", {
      name: `Chi tiết tháng của ${staff.name}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: ".impeccable/review/person-month-detail.png" });
  await page
    .getByRole("button", { name: "Đóng chi tiết", exact: true })
    .click();
  await page.goto(`${baseURL}/admin/tasks?create=1`);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Tự động gắn KPI phù hợp",{exact:true})).toHaveCount(0);
  await expect(page.getByLabel("Độ ưu tiên công việc")).toHaveCount(0);
  await page.getByLabel("Người thực hiện",{exact:true}).selectOption(staff.id);
  await page.getByLabel("Loại sản phẩm công việc").selectOption("post");
  await page.getByLabel("Kênh thực hiện",{exact:true}).click();
  await page.getByRole("listbox").getByRole("option").filter({hasText:"Kênh đối chiếu Facebook"}).click();
  await page.getByLabel("Kênh thực hiện",{exact:true}).click();
  await page.getByLabel("Hạn hoàn thành",{exact:true}).fill("2000-01-10");
  await expect(page.getByLabel("KPI liên quan",{exact:true})).toHaveValue(/Không gắn KPI/);
  await page.getByLabel("Hạn hoàn thành",{exact:true}).fill(`${month}-01`);
  await expect(page.getByLabel("KPI liên quan",{exact:true})).toHaveValue(/Kênh đối chiếu Facebook/);
  await page.getByLabel("Tên công việc",{exact:true}).fill("Tạo việc tự gắn KPI");
  await page.getByLabel(/^Tuyến nội dung/).fill("Giải pháp LED");
  await page.getByLabel(/^Định dạng nội dung/).fill("Bài ảnh");
  await page.getByRole("button",{name:"Giao công việc",exact:true}).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const automaticTask = (await (await admin.get("/api/tasks")).json()).tasks.find((t:{title:string})=>t.title==="Tạo việc tự gắn KPI");
  expect(automaticTask.kpi_id).toBe(goal.id);
  expect((await admin.patch("/api/tasks",{data:{id:automaticTask.id,due_at:"2000-01-10T10:00:00Z"}})).status()).toBe(200);
  expect((await (await admin.get(`/api/tasks?id=${automaticTask.id}`)).json()).tasks[0].kpi_id).toBeNull();
  expect((await admin.patch("/api/tasks",{data:{id:automaticTask.id,due_at:`${month}-01T10:00:00Z`}})).status()).toBe(200);
  expect((await (await admin.get(`/api/tasks?id=${automaticTask.id}`)).json()).tasks[0].kpi_id).toBe(goal.id);
  const orderedTasks=(await (await admin.get("/api/tasks")).json()).tasks;
  expect(orderedTasks.map((t:{id:string})=>t.id)).toEqual([...orderedTasks].sort(compareTaskDeadline).map(t=>t.id));

  expect((await admin.delete(`/api/kpis?id=${goal.id}`)).status()).toBe(200);
  task = (await (await own.get(`/api/tasks?id=${task.id}`)).json()).tasks[0];
  expect(task.kpi_id).toBe(goal.id);
  expect(
    (await (await own.get(`/api/kpis?month=${month}`)).json()).extras,
  ).toHaveLength(1);
  await ui.close();
  for (const c of Object.values(clients)) await c.dispose();
  await admin.dispose();
});
