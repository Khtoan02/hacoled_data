import { createHash } from "node:crypto";
import { isUuid } from "../../../../lib/social";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  RequestError,
  requireManager,
} from "../../../../lib/auth/server";
import { validMonth } from "../../../../lib/kpis";
import { SELECTABLE_OUTPUT_TYPES } from "../../../../lib/kpis";
import { TASK_PRIORITIES, TASK_STATUSES } from "../../../../lib/tasks";

export const dynamic = "force-dynamic";
const headers = [
  "ten_cong_viec",
  "mo_ta_chung",
  "email_nguoi_thuc_hien",
  "kenh",
  "dinh_dang",
  "so_luong",
  "han_hoan_thanh",
  "trang_thai",
  "checklist",
  "tuyen_noi_dung",
  "dinh_dang_noi_dung",
  "cta",
  "link_website",
  "tu_khoa_chinh",
  "slug",
  "link_tro_di",
  "dinh_huong_noi_dung",
  "ghi_chu_cong_viec",
];
const aliases: Record<string, string> = {
  bai_viet: "post",
  video_dai: "video",
  video_doc_ngan: "short_video",
  short_video: "short_video",
  story: "short_video",
  thiet_ke_anh: "image",
  livestream: "livestream",
  khac: "other",
};
const statusAliases: Record<string, string> = {
  chua_bat_dau: "pending",
  dang_thuc_hien: "in_progress",
  hoan_thanh: "completed",
};

export async function GET() {
  try {
    await requireManager();
    const samples = [
      [
        "MẪU - Bài Facebook",
        "Mục tiêu chung",
        "nhanvien@hacoled.com",
        "@kenh-facebook",
        "bai_viet",
        "1",
        "2026-11-15",
        "cao",
        "chua_bat_dau",
        "Viết nội dung|Duyệt",
        "Dự án thực tế",
        "Bài ảnh",
        "Nhắn tin tư vấn",
        "https://hacoled.com/du-an",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "MẪU - Bài Website",
        "Mục tiêu SEO",
        "nhanvien@hacoled.com",
        "website-hacoled",
        "bai_viet",
        "1",
        "2026-11-16",
        "binh_thuong",
        "chua_bat_dau",
        "Viết bài|Tối ưu SEO",
        "",
        "",
        "",
        "",
        "màn hình LED",
        "man-hinh-led",
        "https://hacoled.com/dich-vu",
        "",
        "",
      ],
      [
        "MẪU - Video dọc ngắn",
        "Video đăng đa kênh",
        "nhanvien@hacoled.com",
        "@kenh-facebook|@kenh-tiktok",
        "video_doc_ngan",
        "1",
        "2026-11-17",
        "cao",
        "chua_bat_dau",
        "Kịch bản|Quay|Dựng",
        "",
        "",
        "Theo dõi HacoLED",
        "",
        "",
        "",
        "",
        "Giới thiệu dự án trong 30 giây, mở đầu có hook",
        "",
      ],
      [
        "MẪU - Công việc khác",
        "",
        "nhanvien@hacoled.com",
        "",
        "khac",
        "1",
        "2026-11-18",
        "binh_thuong",
        "chua_bat_dau",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Ghi rõ việc cần làm và kết quả bàn giao",
      ],
    ];
    samples.forEach((row) => row.splice(7,1));
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = `\uFEFF${headers.map(quote).join(",")}\r\n${samples.map((sample) => sample.map(quote).join(",")).join("\r\n")}\r\n`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="mau-ke-hoach-cong-viec.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireManager();
    const body = await req.json();
    if (
      !body ||
      !Array.isArray(body.rows) ||
      body.rows.length < 1 ||
      body.rows.length > 500
    )
      throw new RequestError("File cần có từ 1 đến 500 dòng công việc.");
    if (JSON.stringify(body.rows).length > 1_500_000)
      throw new RequestError("File tối đa 1,5 MB dữ liệu.");
    const sql = database();
    if (body.stage === "commit" && isUuid(body.import_id)) {
      const hash = createHash("sha256")
        .update(JSON.stringify({ actor: actor.id, rows: body.rows }))
        .digest("hex");
      const prior =
        await sql`SELECT actor_id,request_hash,row_count FROM app_task_plan_imports WHERE id=${body.import_id}`;
      if (prior.length) {
        if (prior[0].actor_id !== actor.id || prior[0].request_hash !== hash)
          throw new RequestError("Mã import đã dùng cho dữ liệu khác.", 409);
        return NextResponse.json({
          ok: true,
          replayed: true,
          imported: prior[0].row_count,
        });
      }
    }
    const contentHash = createHash("sha256")
      .update(JSON.stringify({ actor: actor.id, rows: body.rows }))
      .digest("hex");
    const duplicate =
      await sql`SELECT id FROM app_task_plan_imports WHERE actor_id=${actor.id} AND request_hash=${contentHash} LIMIT 1`;
    if (duplicate.length)
      throw new RequestError(
        "Nội dung kế hoạch này đã được nhập. Kiểm tra danh sách công việc; không nhập lại file cũ bằng lần import mới.",
        409,
      );
    const [members, channels, kpis] = await Promise.all([
      sql`SELECT id,name,email FROM app_members WHERE active=true AND role IN ('lead_marketing','executive','marketing_manager','marketing_staff','marketing_intern')`,
      sql`SELECT id,name,handle,url,platform FROM app_social_channels WHERE active=true`,
      sql`SELECT id,assignee_id,channel_id,to_char(month,'YYYY-MM') AS month,output_type FROM app_kpis WHERE active=true`,
    ]);
    const errors: string[] = [],
      prepared: Array<Record<string, unknown>> = [];
    const norm = (v: unknown) =>
      String(v ?? "")
        .trim()
        .toLocaleLowerCase("vi")
        .replace(/^@/, "");
    const allowedTypes = new Set(SELECTABLE_OUTPUT_TYPES.map(([id]) => id));
    body.rows.forEach((raw: unknown, index: number) => {
      const beforeErrors = errors.length;
      const line = index + 2,
        row = raw as Record<string, unknown>;
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        errors.push(`Dòng ${line}: Dữ liệu dòng không hợp lệ.`);
        return;
      }
      const title = String(row.ten_cong_viec ?? "").trim();
      if(title.startsWith("MẪU -"))return;
      if(!title){if(Object.values(row).some(v=>String(v??"").trim()))errors.push(`Dòng ${line}: Tên công việc bắt buộc.`);return;}
      if(Object.keys(row).some(k=>!headers.includes(k)&&!["mo_ta","thang_kpi","do_uu_tien"].includes(k)))errors.push(`Dòng ${line}: Có cột chưa hỗ trợ, kiểm tra lại tên cột theo mẫu.`);
      const member = members.find(
        (m) => norm(m.email) === norm(row.email_nguoi_thuc_hien),
      );
      const tokens = String(row.kenh ?? "")
        .split("|")
        .map(norm)
        .filter(Boolean);
      const selected = tokens
        .map((token) => {
          const matches = channels.filter((c) =>
            [norm(c.id), norm(c.handle), norm(c.name), norm(c.url)]
              .filter(Boolean)
              .includes(token),
          );
          return matches.length === 1 ? matches[0] : undefined;
        })
        .filter(Boolean) as Array<{ id: string; platform: string }>;
      const due = String(row.han_hoan_thanh ?? "").trim();
      const legacyMonth = String(row.thang_kpi ?? "").trim();
      const kpiMonth = due ? due.slice(0,7) : legacyMonth;
      if (due && legacyMonth && legacyMonth !== kpiMonth)
        errors.push(`Dòng ${line}: Tháng KPI cũ khác tháng hạn hoàn thành; sửa hoặc bỏ cột thang_kpi.`);
      if (kpiMonth && !validMonth(kpiMonth))
        errors.push(`Dòng ${line}: Tháng KPI cần YYYY-MM.`);
      const outputType =
        aliases[norm(row.dinh_dang)] || norm(row.dinh_dang) || "other";
      const matching = kpiMonth
        ? kpis.filter(
            (k) =>
              k.assignee_id === member?.id &&
              k.month === kpiMonth &&
              k.output_type === outputType &&
              selected[0]?.id === k.channel_id,
          )
        : [];
      const linked = matching.length === 1 ? matching[0] : null;
      const channelIds = Array.from(new Set(selected.map((c) => c.id)));
      if (linked) {
        channelIds.splice(channelIds.indexOf(linked.channel_id), 1);
        channelIds.unshift(linked.channel_id);
      }
      const quantity = String(row.so_luong??"").trim()===""?1:Number(row.so_luong);
      const priority = "normal";
      const status =
        statusAliases[norm(row.trang_thai)] ||
        norm(row.trang_thai) ||
        "pending";
      const brief = {
        content_pillar: String(row.tuyen_noi_dung ?? "").trim(),
        content_format: String(row.dinh_dang_noi_dung ?? "").trim(),
        cta: String(row.cta ?? "").trim(),
        website_url: String(row.link_website ?? "").trim(),
        primary_keyword: String(row.tu_khoa_chinh ?? "").trim(),
        slug: String(row.slug ?? "").trim(),
        outbound_links: String(row.link_tro_di ?? "").trim(),
        content_direction: String(row.dinh_huong_noi_dung ?? "").trim(),
        notes: String(row.ghi_chu_cong_viec ?? "").trim(),
      };
      if (
        title.length > 200 ||
        String(row.mo_ta_chung ?? row.mo_ta ?? "").length > 10000
      )
        errors.push(`Dòng ${line}: Tên tối đa 200, mô tả tối đa 10.000 ký tự.`);
      if (tokens.length > 20 || channelIds.length !== tokens.length)
        errors.push(`Dòng ${line}: Tối đa 20 kênh và không lặp kênh.`);
      if (!member)
        errors.push(
          `Dòng ${line}: Không tìm thấy email nhân sự đang hoạt động.`,
        );
      if (tokens.length !== selected.length)
        errors.push(
          `Dòng ${line}: Có kênh không khớp tên hoặc @định danh đang hoạt động.`,
        );
      if (!allowedTypes.has(outputType as never))
        errors.push(`Dòng ${line}: Định dạng không hợp lệ.`);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000)
        errors.push(`Dòng ${line}: Số lượng phải từ 1 đến 100.000.`);
      if (!Object.hasOwn(TASK_PRIORITIES, priority))
        errors.push(`Dòng ${line}: Độ ưu tiên không hợp lệ.`);
      if (!Object.hasOwn(TASK_STATUSES, status))
        errors.push(`Dòng ${line}: Trạng thái không hợp lệ.`);
      if (
        due &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(due) ||
          !Number.isFinite(Date.parse(due)) ||
          new Date(due).toISOString().slice(0, 10) !== due)
      )
        errors.push(`Dòng ${line}: Hạn hoàn thành phải theo YYYY-MM-DD.`);
      if (
        Object.values(brief).some((value) => value.length > 3000) ||
        brief.slug.length > 200
      )
        errors.push(
          `Dòng ${line}: Trường yêu cầu tối đa 3.000 ký tự; slug tối đa 200 ký tự.`,
        );
      if (
        outputType === "post" &&
        selected.some((channel) => channel.platform === "facebook") &&
        (!brief.content_pillar || !brief.content_format)
      )
        errors.push(
          `Dòng ${line}: Bài Facebook cần tuyến nội dung và định dạng nội dung.`,
        );
      if (
        outputType === "post" &&
        selected.some((channel) => channel.platform === "website") &&
        (!brief.primary_keyword || !brief.slug)
      )
        errors.push(`Dòng ${line}: Bài Website cần từ khóa chính và slug.`);
      if (
        ["video", "short_video"].includes(outputType) &&
        !brief.content_direction
      )
        errors.push(`Dòng ${line}: Video cần định hướng nội dung.`);
      if (outputType === "other" && !brief.notes)
        errors.push(`Dòng ${line}: Công việc khác cần ghi chú việc phải làm.`);
      const checklist = String(row.checklist ?? "")
        .split("|")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((title) => ({ id: randomUUID(), title, done: false }));
      if(checklist.length>30||checklist.some(c=>c.title.length>200))errors.push(`Dòng ${line}: Checklist tối đa 30 mục, mỗi mục 200 ký tự.`);
      if (
        errors.length === beforeErrors &&
        member &&
        tokens.length === selected.length &&
        allowedTypes.has(outputType as never) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 100000 &&
        Object.hasOwn(TASK_PRIORITIES, priority) &&
        Object.hasOwn(TASK_STATUSES, status) &&
        (!due || /^\d{4}-\d{2}-\d{2}$/.test(due))
      )
        prepared.push({
          id: randomUUID(),
          title: title.slice(0, 200),
          description: String(row.mo_ta_chung ?? row.mo_ta ?? "").slice(
            0,
            10000,
          ),
          brief: Object.fromEntries(
            Object.entries(brief).filter(([, value]) => value),
          ),
          assignee_id: member.id,
          channel_ids: channelIds,
          kpi_id: linked?.id ?? null,
          output_type: outputType,
          planned_quantity: quantity,
          due_at: due ? new Date(`${due}T17:00:00+07:00`).toISOString() : null,
          priority,
          status,
          checklist,
        });
    });
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          actor: actor.id,
          rows: body.rows,
          resolved: prepared.map(({ id, checklist, ...r }) => ({
            ...r,
            checklist: (checklist as { title: string }[]).map((c) => c.title),
          })),
        }),
      )
      .digest("hex");
    if (body.stage === "preview")
      return NextResponse.json(
        {
          fingerprint,
          valid: prepared.length,
          errors: errors.slice(0, 100),
          rows: prepared.map((r) => ({
            title: r.title,
            assignee_id: r.assignee_id,
            channel_ids: r.channel_ids,
            kpi_id: r.kpi_id,
            planned_quantity: r.planned_quantity,
          })),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (errors.length)
      return NextResponse.json(
        { ok: false, errors: errors.slice(0, 100), valid: prepared.length },
        { status: 400 },
      );
    if (!prepared.length)
      throw new RequestError(
        "Không có dòng công việc hợp lệ sau khi bỏ dòng mẫu.",
      );
    if (body.stage !== "commit" || !isUuid(body.import_id))
      throw new RequestError(
        "Xem trước kế hoạch và xác nhận bằng mã import hợp lệ.",
      );
    const requestHash = createHash("sha256")
      .update(JSON.stringify({ actor: actor.id, rows: body.rows }))
      .digest("hex");
    const prior =
      await sql`SELECT actor_id,request_hash,row_count FROM app_task_plan_imports WHERE id=${body.import_id}`;
    if (prior.length) {
      if (
        prior[0].actor_id !== actor.id ||
        prior[0].request_hash !== requestHash
      )
        throw new RequestError("Mã import đã dùng cho dữ liệu khác.", 409);
      return NextResponse.json({
        ok: true,
        replayed: true,
        imported: prior[0].row_count,
      });
    }
    if (body.fingerprint !== fingerprint)
      throw new RequestError(
        "Dữ liệu đã thay đổi sau khi xem trước. Kiểm tra lại trước khi nhập.",
        409,
      );
    const queries = prepared.flatMap((row) => [
      sql`INSERT INTO app_tasks(id,title,description,brief,assignee_id,created_by,due_at,status,priority,checklist,completed_at,channel_id,kpi_id,output_type,planned_quantity,delivered_quantity,delivered_on)
          VALUES(${row.id},${row.title},${row.description},${JSON.stringify(row.brief)}::jsonb,${row.assignee_id},${actor.id},${row.due_at}::timestamptz,${row.status},${row.priority},${JSON.stringify(row.checklist)}::jsonb,CASE WHEN ${row.status}='completed' THEN now() ELSE NULL END,${(row.channel_ids as string[])[0] ?? null}::uuid,${row.kpi_id}::uuid,${row.output_type},${row.planned_quantity},0,CASE WHEN ${row.status}='completed' THEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ELSE NULL END)`,
      sql`INSERT INTO app_task_channels(task_id,channel_id) SELECT ${row.id},x::uuid FROM jsonb_array_elements_text(${JSON.stringify(row.channel_ids)}::jsonb) x`,
    ]);
    await sql.transaction(
      [
        sql`SELECT pg_advisory_xact_lock(724112)`,
        sql`INSERT INTO app_task_plan_imports(id,actor_id,request_hash,row_count) VALUES(${body.import_id},${actor.id},${requestHash},${prepared.length})`,
        sql`WITH input AS(SELECT * FROM jsonb_to_recordset(${JSON.stringify(prepared)}::jsonb) AS r(assignee_id uuid,channel_ids jsonb,kpi_id uuid,output_type text)), invalid AS(
        SELECT 1 FROM input i WHERE NOT EXISTS(SELECT 1 FROM app_members m WHERE m.id=i.assignee_id AND m.active=true AND m.role IN ('lead_marketing','executive','marketing_manager','marketing_staff','marketing_intern'))
        OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(i.channel_ids) c(id) WHERE NOT EXISTS(SELECT 1 FROM app_social_channels s WHERE s.id=c.id::uuid AND s.active=true))
        OR (i.kpi_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM app_kpis k WHERE k.id=i.kpi_id AND k.active=true AND k.assignee_id=i.assignee_id AND k.channel_id=(i.channel_ids->>0)::uuid AND k.output_type=i.output_type)))
        SELECT 1 / CASE WHEN EXISTS(SELECT 1 FROM invalid) THEN 0 ELSE 1 END AS valid`,
        ...queries,
      ],
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json(
      { ok: true, imported: prepared.length },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
