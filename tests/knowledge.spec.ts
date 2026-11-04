import { test, expect } from "@playwright/test";

test("Leader Marketing publishes SOP/Announcements, team receives notifications, and readership is tracked accurately", async ({
  playwright,
}) => {
  const baseURL = "http://127.0.0.1:3100";
  const extraHTTPHeaders = { Origin: baseURL, "x-real-ip": "198.51.100.241" };
  const leader = await playwright.request.newContext({ baseURL, extraHTTPHeaders });

  const auth = await (await leader.get("/api/auth/status")).json();
  if (auth.needsSetup) {
    await leader.post("/api/auth/setup", {
      data: {
        name: "Khánh Toàn",
        email: "owner@example.test",
        password: "Test-only-password-2026!",
        setupToken: "isolated-test-setup-token",
      },
    });
  } else {
    await leader.post("/api/auth/login", {
      data: { password: "Test-only-password-2026!" },
    });
  }

  // Create a staff member and a manager member
  const staffPassword = "Knowledge-Staff-2026!";
  const managerPassword = "Knowledge-Manager-2026!";
  expect(
    (
      await leader.post("/api/members", {
        data: {
          name: "Nhân sự Nội dung",
          email: "knowledge-staff@example.test",
          password: staffPassword,
          role: "marketing_staff",
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await leader.post("/api/members", {
        data: {
          name: "Quản lý Marketing",
          email: "knowledge-manager@example.test",
          password: managerPassword,
          role: "marketing_manager",
        },
      })
    ).status(),
  ).toBe(201);

  const staff = await playwright.request.newContext({ baseURL, extraHTTPHeaders });
  await staff.post("/api/auth/login", { data: { password: staffPassword } });

  const manager = await playwright.request.newContext({ baseURL, extraHTTPHeaders });
  await manager.post("/api/auth/login", { data: { password: managerPassword } });

  // Non-leader cannot create, edit, or delete posts
  expect(
    (
      await manager.post("/api/knowledge", {
        data: {
          title: "Trái phép",
          category: "announcement",
          content: "Không có quyền",
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await staff.post("/api/knowledge", {
        data: {
          title: "Trái phép",
          category: "sop",
          content: "Không có quyền",
        },
      })
    ).status(),
  ).toBe(403);

  // Leader creates an SOP post with notification enabled
  const createRes = await leader.post("/api/knowledge", {
    data: {
      title: "Quy trình chuẩn bàn giao Lead chiến dịch HacoLED",
      category: "sop",
      summary: "Các bước kiểm tra và bàn giao lead trong 15 phút.",
      content: "## Bước 1\nKiểm tra thông tin SĐT\n## Bước 2\nCập nhật CRM",
      links: [{ label: "File biểu mẫu SOP", url: "https://hacoled.com/sop" }],
      pinned: true,
      require_ack: true,
      notify: true,
    },
  });
  expect(createRes.status()).toBe(201);
  const { id: postId } = await createRes.json();

  // Verify staff received in-app notification for the new SOP post
  const notifRes = await staff.get("/api/notifications");
  expect(notifRes.status()).toBe(200);
  const notifData = await notifRes.json();
  expect(
    notifData.notifications.some(
      (n: { kind: string; post_id: string }) =>
        n.kind === "knowledge_post" && n.post_id === postId,
    ),
  ).toBe(true);

  // Staff views the post
  const viewRes = await staff.patch("/api/knowledge", {
    data: { id: postId, action: "view" },
  });
  expect(viewRes.status()).toBe(200);

  // Check readership before staff acknowledges: staff has viewed=true, acknowledged=false; manager has viewed=false
  const listAfterView = await (await leader.get(`/api/knowledge?id=${postId}`)).json();
  const postAfterView = listAfterView.posts[0];
  const staffReader1 = postAfterView.readers.find(
    (r: { member_name: string }) => r.member_name === "Nhân sự Nội dung",
  );
  const managerReader1 = postAfterView.readers.find(
    (r: { member_name: string }) => r.member_name === "Quản lý Marketing",
  );
  expect(staffReader1.viewed).toBe(true);
  expect(staffReader1.view_count).toBe(1);
  expect(staffReader1.acknowledged).toBe(false);
  expect(managerReader1.viewed).toBe(false);

  // Staff acknowledges the post
  const ackRes = await staff.patch("/api/knowledge", {
    data: { id: postId, action: "acknowledge" },
  });
  expect(ackRes.status()).toBe(200);

  const listAfterAck = await (await leader.get(`/api/knowledge?id=${postId}`)).json();
  const postAfterAck = listAfterAck.posts[0];
  const staffReader2 = postAfterAck.readers.find(
    (r: { member_name: string }) => r.member_name === "Nhân sự Nội dung",
  );
  expect(staffReader2.acknowledged).toBe(true);
  expect(staffReader2.is_current_version_ack).toBe(true);

  // Non-leader cannot delete post
  expect((await manager.delete(`/api/knowledge?id=${postId}`)).status()).toBe(403);

  // Leader deletes the test post & cleans up test members
  expect((await leader.delete(`/api/knowledge?id=${postId}`)).status()).toBe(200);

  const allMembers = (await (await leader.get("/api/members")).json()).members;
  for (const email of ["knowledge-staff@example.test", "knowledge-manager@example.test"]) {
    const m = allMembers.find((item: { email: string }) => item.email === email);
    if (m) {
      await leader.patch("/api/members", { data: { id: m.id, active: false } });
    }
  }

  await staff.dispose();
  await manager.dispose();
  await leader.dispose();
});
