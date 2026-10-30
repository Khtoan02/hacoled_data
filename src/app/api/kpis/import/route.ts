import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  checkOrigin,
  database,
  RequestError,
  requireLeader,
} from "../../../../lib/auth/server";
import {
  KPI_IMPORT_COLUMNS,
  importMonth,
  importOutputType,
  type ImportPreviewRow,
} from "../../../../lib/kpi-import";
import { isUuid } from "../../../../lib/social";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireLeader();
    return new NextResponse("\uFEFF" + KPI_IMPORT_COLUMNS.join(",") + "\r\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mau-kpi-thang.csv"',
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
    const actor = await requireLeader(),
      b = await req.json();
    if (
      !b ||
      !Array.isArray(b.rows) ||
      !b.rows.length ||
      b.rows.length > 500 ||
      !["create", "update"].includes(b.mode) ||
      !["preview", "commit"].includes(b.stage) ||
      JSON.stringify(b.rows).length > 1500000
    )
      throw new RequestError(
        "Cần 1–500 dòng KPI, chế độ tạo mới/cập nhật và bước xem trước/xác nhận hợp lệ.",
      );
    const sql = database(),
      [members, channels, existing] = await Promise.all([
        sql`SELECT id,name,email FROM app_members WHERE active=true AND role IN ('lead_marketing','executive','marketing_manager','marketing_staff','marketing_intern')`,
        sql`SELECT id,name,url,handle,platform FROM app_social_channels WHERE active=true`,
        sql`SELECT id,assignee_id,channel_id,to_char(month,'YYYY-MM') AS month,output_type,target,version,active FROM app_kpis`,
      ]);
    const norm = (v: unknown) =>
      String(v ?? "")
        .trim()
        .toLocaleLowerCase("vi")
        .replace(/^@/, "");
    const seen = new Set<string>();
    const preview: ImportPreviewRow[] = b.rows.map(
      (raw: unknown, index: number) => {
        const r = (
            raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}
          ) as Record<string, unknown>,
          errors: string[] = [];
        if (
          Object.keys(r).some((k) => !KPI_IMPORT_COLUMNS.includes(k as never))
        )
          errors.push("Có cột chưa hỗ trợ. Dùng mẫu KPI hoặc đổi tên cột.");
        const person = members.find(
          (m) => norm(m.email) === norm(r.email_nhan_su),
        );
        if (!person)
          errors.push(
            "Email không khớp nhân sự Marketing đang hoạt động; không tự tạo tài khoản.",
          );
        const matches = channels.filter(
          (c) =>
            [c.id, c.name, c.url, c.handle].some(
              (v) => norm(v) && norm(v) === norm(r.kenh),
            ) &&
            (!r.nen_tang || norm(c.platform) === norm(r.nen_tang)),
        );
        if (matches.length !== 1)
          errors.push(
            matches.length
              ? "Có nhiều kênh trùng định danh; thêm nền tảng hoặc dùng UUID/URL kênh."
              : "Kênh/nền tảng không khớp kênh đang sử dụng.",
          );
        const channel = matches.length === 1 ? matches[0] : null,
          month = importMonth(r.thang),
          type = importOutputType(r.loai_san_pham),
          target =
            typeof r.chi_tieu === "number"
              ? r.chi_tieu
              : Number(String(r.chi_tieu ?? "").trim());
        if (!month) errors.push("Tháng cần YYYY-MM hoặc MM/YYYY (2000–2100).");
        if (!type)
          errors.push(
            "Loại sản lượng chưa hỗ trợ. Chỉ nhập bài viết, video, thiết kế, livestream hoặc công việc khác; chưa nhập lượt xem/lead/doanh thu.",
          );
        if (!Number.isInteger(target) || target < 1 || target > 100000)
          errors.push(
            "Chỉ tiêu phải là số nguyên 1–100.000; không đọc số từ mô tả như “20 bài”.",
          );
        const notes =
          typeof r.ghi_chu === "string"
            ? r.ghi_chu.trim()
            : r.ghi_chu == null
              ? ""
              : String(r.ghi_chu);
        if (notes.length > 3000) errors.push("Ghi chú tối đa 3.000 ký tự.");
        const key = [person?.id, channel?.id, month, type].join("|");
        if (person && channel && month && type) {
          if (seen.has(key))
            errors.push(
              "Trùng người × kênh × tháng × loại sản phẩm trong cùng file.",
            );
          seen.add(key);
        }
        const old = existing.find(
          (k) =>
            k.assignee_id === person?.id &&
            k.channel_id === channel?.id &&
            k.month === month &&
            k.output_type === type,
        );
        if (old && b.mode === "create")
          errors.push(
            "KPI đã tồn tại. Chọn Cập nhật chỉ tiêu nếu muốn thay thế giá trị.",
          );
        if (old && !old.active)
          errors.push(
            "KPI đang tạm dừng. Khôi phục thủ công trước khi cập nhật; import không tự bật lại.",
          );
        return {
          line: index + 2,
          assignee_id: person?.id ?? null,
          assignee_name: String(person?.name ?? r.email_nhan_su ?? ""),
          channel_id: channel?.id ?? null,
          channel_name: String(channel?.name ?? r.kenh ?? ""),
          month: month ?? String(r.thang ?? ""),
          output_type: type ?? null,
          target: Number.isFinite(target) ? target : 0,
          notes,
          existing_id: old?.id ?? null,
          existing_version: old?.version ?? null,
          existing_target: old?.target ?? null,
          action: errors.length ? "error" : old ? "update" : "create",
          errors,
        };
      },
    );
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ actor: actor.id, mode: b.mode, rows: preview }))
      .digest("hex");
    const summary = {
      create: preview.filter((r) => r.action === "create").length,
      update: preview.filter((r) => r.action === "update").length,
      errors: preview.filter((r) => r.errors.length).length,
    };
    if (b.stage === "preview")
      return NextResponse.json(
        { rows: preview, summary, fingerprint },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (!isUuid(b.import_id))
      throw new RequestError("Mã lần import không hợp lệ.");
    const requestHash = createHash("sha256")
      .update(JSON.stringify({ actor: actor.id, mode: b.mode, rows: b.rows }))
      .digest("hex");
    const prior =
      await sql`SELECT actor_id,request_hash,created_count,updated_count,row_count FROM app_kpi_imports WHERE id=${b.import_id}`;
    if (prior.length) {
      if (
        prior[0].actor_id !== actor.id ||
        prior[0].request_hash !== requestHash
      )
        throw new RequestError("Mã import đã dùng cho nội dung khác.", 409);
      return NextResponse.json({
        ok: true,
        replayed: true,
        imported: prior[0].row_count,
        created: prior[0].created_count,
        updated: prior[0].updated_count,
      });
    }
    if (summary.errors)
      return NextResponse.json(
        {
          error: "Chưa lưu dòng nào. Sửa toàn bộ dòng lỗi rồi xem trước lại.",
          rows: preview,
          summary,
        },
        { status: 400 },
      );
    if (b.fingerprint !== fingerprint)
      throw new RequestError(
        "Dữ liệu nhân sự/kênh/KPI đã thay đổi sau khi xem trước. Xem trước lại trước khi lưu.",
        409,
      );
    const payload = preview.map((r) => ({
      ...r,
      id: r.existing_id ?? randomUUID(),
      audit_id: randomUUID(),
    }));
    // Serializable + one transaction: conflict or inactive references roll back the entire file, including audit/batch.
    const results = await sql.transaction(
      [
        sql`SELECT pg_advisory_xact_lock(724111)`,
        sql`WITH batch AS (INSERT INTO app_kpi_imports(id,actor_id,request_hash,row_count,created_count,updated_count) VALUES(${b.import_id},${actor.id},${requestHash},${payload.length},${summary.create},${summary.update}) RETURNING id),
   input AS (SELECT * FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS r(id uuid,audit_id uuid,assignee_id uuid,channel_id uuid,month text,output_type text,target int,notes text,existing_id uuid,existing_version int)),
   safe AS (SELECT i.* FROM input i JOIN app_members m ON m.id=i.assignee_id AND m.active=true AND m.role IN ('lead_marketing','executive','marketing_manager','marketing_staff','marketing_intern') JOIN app_social_channels c ON c.id=i.channel_id AND c.active=true CROSS JOIN batch),
   saved AS (INSERT INTO app_kpis(id,assignee_id,channel_id,month,output_type,target,notes,active,created_by)
    SELECT id,assignee_id,channel_id,(month||'-01')::date,output_type,target,notes,true,${actor.id} FROM safe
    ON CONFLICT(assignee_id,channel_id,month,output_type) DO UPDATE SET target=excluded.target,notes=excluded.notes,version=app_kpis.version+1,updated_at=now()
    WHERE ${b.mode === "update"} AND app_kpis.active=true AND app_kpis.version=(SELECT existing_version FROM input WHERE id=app_kpis.id)
    RETURNING id,target,active,notes),
   audited AS (INSERT INTO app_kpi_audit(id,kpi_id,actor_id,target,active,notes) SELECT i.audit_id,s.id,${actor.id},s.target,s.active,s.notes FROM saved s JOIN input i ON i.id=s.id RETURNING id)
   SELECT COUNT(*)::int AS applied,1 / CASE WHEN COUNT(*)=${payload.length} THEN 1 ELSE 0 END AS all_saved FROM audited`,
      ],
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json(
      {
        ok: true,
        imported: results[1][0].applied,
        created: summary.create,
        updated: summary.update,
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof RequestError) return apiError(e);
    return NextResponse.json(
      {
        error:
          "Import chưa hoàn tất; chưa có dữ liệu được ghi một phần. Xem trước lại để kiểm tra xung đột rồi thử lại với cùng mã import.",
      },
      { status: 409 },
    );
  }
}
