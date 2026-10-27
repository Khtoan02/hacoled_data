import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, checkOrigin, database, RequestError, requireManager } from "../../../../lib/auth/server";
import { SELECTABLE_OUTPUT_TYPES } from "../../../../lib/kpis";
import { TASK_PRIORITIES, TASK_STATUSES } from "../../../../lib/tasks";

export const dynamic = "force-dynamic";
const headers = ["ten_cong_viec","mo_ta_chung","email_nguoi_thuc_hien","kenh","dinh_dang","so_luong","han_hoan_thanh","do_uu_tien","trang_thai","checklist","tuyen_noi_dung","dinh_dang_noi_dung","cta","link_website","tu_khoa_chinh","slug","link_tro_di","dinh_huong_noi_dung","ghi_chu_cong_viec"];
const aliases: Record<string, string> = {
  bai_viet: "post", video_dai: "video", video_doc_ngan: "short_video",
  short_video: "short_video", story: "short_video", thiet_ke_anh: "image",
  livestream: "livestream", khac: "other",
};
const priorityAliases: Record<string, string> = { thap:"low", binh_thuong:"normal", cao:"high", khan_cap:"urgent" };
const statusAliases: Record<string, string> = { chua_bat_dau:"pending", dang_thuc_hien:"in_progress", hoan_thanh:"completed" };

export async function GET() {
  try {
    await requireManager();
    const samples = [
      ["MẪU - Bài Facebook","Mục tiêu chung","nhanvien@hacoled.com","@kenh-facebook","bai_viet","1","2026-11-15","cao","chua_bat_dau","Viết nội dung|Duyệt","Dự án thực tế","Bài ảnh","Nhắn tin tư vấn","https://hacoled.com/du-an","","","","",""],
      ["MẪU - Bài Website","Mục tiêu SEO","nhanvien@hacoled.com","website-hacoled","bai_viet","1","2026-11-16","binh_thuong","chua_bat_dau","Viết bài|Tối ưu SEO","","","","","màn hình LED","man-hinh-led","https://hacoled.com/dich-vu","",""],
      ["MẪU - Video dọc ngắn","Video đăng đa kênh","nhanvien@hacoled.com","@kenh-facebook|@kenh-tiktok","video_doc_ngan","1","2026-11-17","cao","chua_bat_dau","Kịch bản|Quay|Dựng","","","Theo dõi HacoLED","","","","","Giới thiệu dự án trong 30 giây, mở đầu có hook",""],
      ["MẪU - Công việc khác","","nhanvien@hacoled.com","","khac","1","2026-11-18","binh_thuong","chua_bat_dau","","","","","","","","","","Ghi rõ việc cần làm và kết quả bàn giao"],
    ];
    const quote = (value: string) => `"${value.replaceAll('"','""')}"`;
    const csv = `\uFEFF${headers.map(quote).join(",")}\r\n${samples.map((sample) => sample.map(quote).join(",")).join("\r\n")}\r\n`;
    return new NextResponse(csv, { headers: { "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":'attachment; filename="mau-ke-hoach-cong-viec.csv"', "Cache-Control":"no-store" } });
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const actor = await requireManager();
    const body = await req.json();
    if (!body || !Array.isArray(body.rows) || body.rows.length < 1 || body.rows.length > 500)
      throw new RequestError("File cần có từ 1 đến 500 dòng công việc.");
    const sql = database();
    const [members, channels] = await Promise.all([
      sql`SELECT id,name,email FROM app_members WHERE active=true`,
      sql`SELECT id,name,handle,url,platform FROM app_social_channels WHERE active=true`,
    ]);
    const errors: string[] = [], prepared: Array<Record<string, unknown>> = [];
    const norm = (v: unknown) => String(v ?? "").trim().toLocaleLowerCase("vi").replace(/^@/, "");
    const allowedTypes = new Set(SELECTABLE_OUTPUT_TYPES.map(([id]) => id));
    body.rows.forEach((raw: unknown, index: number) => {
      const line = index + 2, row = raw as Record<string, unknown>;
      const title = String(row.ten_cong_viec ?? "").trim();
      if (!title || title.startsWith("MẪU -")) return;
      const member = members.find((m) => norm(m.email) === norm(row.email_nguoi_thuc_hien));
      const tokens = String(row.kenh ?? "").split("|").map(norm).filter(Boolean);
      const selected = tokens.map((token) => channels.find((c) => [norm(c.handle),norm(c.name),norm(c.url)].includes(token))).filter(Boolean) as Array<{id:string;platform:string}>;
      const outputType = aliases[norm(row.dinh_dang)] || norm(row.dinh_dang) || "other";
      const quantity = Number(row.so_luong || 1);
      const priority = priorityAliases[norm(row.do_uu_tien)] || norm(row.do_uu_tien) || "normal";
      const status = statusAliases[norm(row.trang_thai)] || norm(row.trang_thai) || "pending";
      const due = String(row.han_hoan_thanh ?? "").trim();
      const brief = {
        content_pillar:String(row.tuyen_noi_dung ?? "").trim(), content_format:String(row.dinh_dang_noi_dung ?? "").trim(),
        cta:String(row.cta ?? "").trim(), website_url:String(row.link_website ?? "").trim(), primary_keyword:String(row.tu_khoa_chinh ?? "").trim(),
        slug:String(row.slug ?? "").trim(), outbound_links:String(row.link_tro_di ?? "").trim(), content_direction:String(row.dinh_huong_noi_dung ?? "").trim(), notes:String(row.ghi_chu_cong_viec ?? "").trim(),
      };
      if (!member) errors.push(`Dòng ${line}: Không tìm thấy email nhân sự đang hoạt động.`);
      if (tokens.length !== selected.length) errors.push(`Dòng ${line}: Có kênh không khớp tên hoặc @định danh đang hoạt động.`);
      if (!allowedTypes.has(outputType as never)) errors.push(`Dòng ${line}: Định dạng không hợp lệ.`);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) errors.push(`Dòng ${line}: Số lượng phải từ 1 đến 100.000.`);
      if (!Object.hasOwn(TASK_PRIORITIES, priority)) errors.push(`Dòng ${line}: Độ ưu tiên không hợp lệ.`);
      if (!Object.hasOwn(TASK_STATUSES, status)) errors.push(`Dòng ${line}: Trạng thái không hợp lệ.`);
      if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) errors.push(`Dòng ${line}: Hạn hoàn thành phải theo YYYY-MM-DD.`);
      if (Object.values(brief).some((value) => value.length > 3000) || brief.slug.length > 200) errors.push(`Dòng ${line}: Trường yêu cầu tối đa 3.000 ký tự; slug tối đa 200 ký tự.`);
      if (outputType === "post" && selected.some((channel) => channel.platform === "facebook") && (!brief.content_pillar || !brief.content_format)) errors.push(`Dòng ${line}: Bài Facebook cần tuyến nội dung và định dạng nội dung.`);
      if (outputType === "post" && selected.some((channel) => channel.platform === "website") && (!brief.primary_keyword || !brief.slug)) errors.push(`Dòng ${line}: Bài Website cần từ khóa chính và slug.`);
      if (["video","short_video"].includes(outputType) && !brief.content_direction) errors.push(`Dòng ${line}: Video cần định hướng nội dung.`);
      if (outputType === "other" && !brief.notes) errors.push(`Dòng ${line}: Công việc khác cần ghi chú việc phải làm.`);
      const checklist = String(row.checklist ?? "").split("|").map((v) => v.trim()).filter(Boolean).slice(0,30).map((title) => ({id:randomUUID(),title,done:false}));
      if (member && tokens.length === selected.length && allowedTypes.has(outputType as never) && Number.isInteger(quantity) && quantity > 0 && quantity <= 100000 && Object.hasOwn(TASK_PRIORITIES, priority) && Object.hasOwn(TASK_STATUSES, status) && (!due || /^\d{4}-\d{2}-\d{2}$/.test(due)))
        prepared.push({ id:randomUUID(), title:title.slice(0,200), description:String(row.mo_ta_chung ?? row.mo_ta ?? "").slice(0,10000), brief:Object.fromEntries(Object.entries(brief).filter(([,value]) => value)), assignee_id:member.id, channel_ids:selected.map((c) => c.id), output_type:outputType, planned_quantity:quantity, due_at:due || null, priority, status, checklist });
    });
    if (errors.length) return NextResponse.json({ ok:false, errors:errors.slice(0,100), valid:prepared.length }, { status:400 });
    if (!prepared.length) throw new RequestError("Không có dòng công việc hợp lệ sau khi bỏ dòng mẫu.");
    const queries = prepared.flatMap((row) => [
      sql`INSERT INTO app_tasks(id,title,description,brief,assignee_id,created_by,due_at,status,priority,checklist,completed_at,channel_id,output_type,planned_quantity,delivered_quantity,delivered_on)
          VALUES(${row.id},${row.title},${row.description},${JSON.stringify(row.brief)}::jsonb,${row.assignee_id},${actor.id},${row.due_at}::date,${row.status},${row.priority},${JSON.stringify(row.checklist)}::jsonb,CASE WHEN ${row.status}='completed' THEN now() ELSE NULL END,${(row.channel_ids as string[])[0] ?? null}::uuid,${row.output_type},${row.planned_quantity},0,CASE WHEN ${row.status}='completed' THEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ELSE NULL END)`,
      sql`INSERT INTO app_task_channels(task_id,channel_id) SELECT ${row.id},x::uuid FROM jsonb_array_elements_text(${JSON.stringify(row.channel_ids)}::jsonb) x`,
    ]);
    await sql.transaction(queries);
    return NextResponse.json({ ok:true, imported:prepared.length }, { status:201 });
  } catch (e) { return apiError(e); }
}
