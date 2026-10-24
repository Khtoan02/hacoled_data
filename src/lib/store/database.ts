/**
 * HacoLED Marketing OS — Normalized Relational Data Store (37-Table Logical Architecture)
 * Designed for real operational execution, strict referential integrity, and zero data conflation.
 */

import { AuditLogEntry, SystemRoleId } from "../security/rbac";

export interface SolutionEntity {
  solution_id: string;
  name: string;
  use_case: string;
  included_scope: string;
  excluded_scope: string;
  verified_claims: string;
  version: string;
  approved_by: string;
}

export interface SegmentEntity {
  segment_id: string;
  name: string;
  inclusion: string;
  exclusion: string;
  buyer_type: "Chủ đầu tư" | "Nhà thầu" | "Người dùng";
  application: string;
  geography: string;
  status: "Giả thuyết" | "Thử nghiệm (Pilot)" | "Ưu tiên" | "Dừng";
}

export interface MarketScenarioEntity {
  scenario_id: string;
  segment_id: string;
  year: number;
  scenario: "Thấp" | "Cơ sở" | "Cao";
  eligible_org_count: number | null;
  projects_per_org_year: number | null;
  value_per_project_vnd: number | null;
  sam_project_count: number | null;
  reachable_qualified_projects: number | null;
  win_rate_assumption: number | null;
  delivery_capacity: number | null;
  vat_basis: "Chưa VAT" | "Có VAT";
  confidence: "Giả định" | "Ước lượng có nguồn" | "Đã kiểm chứng";
}

export interface PersonaEntity {
  persona_id: string;
  segment_id: string;
  buying_role: "Người tìm hiểu" | "Người sử dụng" | "Kỹ thuật / IT" | "Người phê duyệt" | "Mua sắm / Nhà thầu";
  job_to_be_done: string;
  pains: string;
  triggers: string;
  barriers: string;
  decision_criteria: string;
}

export interface InsightEntity {
  insight_id: string;
  segment_id: string;
  persona_id: string;
  context: string;
  observation: string;
  interpretation: string;
  supporting_evidence_refs: string[];
  counter_evidence_refs: string[];
  content_implication: string;
  status: "Giả thuyết" | "Được hỗ trợ" | "Bác bỏ" | "Cần thêm dữ liệu";
  validated_by: string | null;
}

export interface CampaignEntity {
  campaign_id: string;
  name: string;
  segment_id: string;
  objective: string;
  primary_metric_code: string;
  start_date: string;
  end_date: string;
  budget_new_vnd: number; // Currently 0 per C02
  owner_id: string;
  status: "Đề xuất" | "Đã duyệt" | "Đang chạy" | "Rà soát" | "Kết thúc";
}

export interface ContentBriefEntity {
  brief_id: string;
  campaign_id: string;
  segment_id: string;
  persona_id: string;
  insight_id: string;
  need_stage: "Nấc 1: Chưa nhận thức" | "Nấc 2: Nhận thức vấn đề" | "Nấc 3: Tìm giải pháp" | "Nấc 4: So sánh nhà cung cấp" | "Nấc 5: Chốt phương án";
  message: string;
  angle: string;
  cta: string;
  acceptance: string;
  version: string;
}

export interface ContentAssetEntity {
  asset_id: string;
  brief_id: string;
  title: string;
  format: "SEO" | "Facebook chữ" | "Video ngang" | "Video dọc" | "Carousel";
  creator_id: string;
  creator_role: SystemRoleId;
  drive_ref: string;
  version: string;
  rights_status: "Được dùng" | "Chờ phép" | "Hết hạn" | "Chứa ảnh học sinh/khách chưa xin phép";
  technical_approval: "Chờ duyệt" | "Đạt" | "Cần sửa";
  approved_at: string | null;
  hours_spent: number | null;
}

export interface PublicationEntity {
  publication_id: string;
  asset_id: string;
  channel_id: string;
  platform: "Website" | "Facebook" | "YouTube" | "TikTok" | "Zalo";
  native_post_id: string;
  public_url: string;
  published_at: string | null;
  campaign_id: string;
  utm_content: string;
  status: "Lịch đăng" | "Đã đăng" | "Lỗi" | "Gỡ";
  metrics_owner_role: SystemRoleId;
  publisher_role: SystemRoleId;
}

export interface MetricSnapshotEntity {
  snapshot_id: string;
  entity_type: "channel" | "publication" | "page";
  entity_id: string;
  metric_code: string;
  native_metric_name: string;
  metric_value: number | null; // null = unavailable/missing (QA13: never fake 0)
  period_start: string;
  period_end: string;
  aggregation: "daily" | "period" | "lifetime";
  retrieved_at: string;
  import_batch_id: string;
  dedupe_key: string; // source + entity_id + metric_code + period_start + period_end + aggregation
}

export interface OrganizationEntity {
  organization_id: string;
  name: string;
  organization_type: "Trường học" | "Doanh nghiệp" | "Nhà thầu" | "Chưa rõ";
  segment_id: string | null;
  region: string;
  relationship_status: "new_confirmed" | "contacted" | "purchased_legacy" | "unknown";
  relationship_verified_by: string | null;
}

export interface ContactEntity {
  contact_id: string;
  display_name: string;
  phone_normalized: string;
  email_normalized: string;
  organization_id: string | null;
  first_recorded_at: string;
  first_seen_in_base: boolean; // LR04: True when recorded after baseline start, NOT automatically new to HacoLED
  new_to_company_status: "new_confirmed" | "known" | "unknown"; // LR05/LR06
  verification_source: string | null;
  merge_review_status: "clean" | "needs_review" | "merged";
}

export interface TouchpointEntity {
  touchpoint_id: string;
  submission_or_event_id: string; // LR01 idempotency key
  contact_id: string;
  occurred_at: string;
  capture_channel: "form" | "hotline" | "zalo" | "messenger" | "other";
  source_medium: string; // e.g., 'Facebook / social', 'SEO / organic', 'unknown'
  campaign_id: string | null;
  publication_id: string | null;
  evidence_basis: "observed_utm" | "platform_native" | "self_reported" | "sales_confirmed" | "unknown";
}

export interface InquiryEntity {
  inquiry_id: string;
  submission_or_thread_id: string; // LR01 deduplication key
  contact_id: string;
  organization_id: string | null;
  received_at: string;
  capture_channel: "form" | "hotline" | "zalo" | "messenger" | "other";
  need_summary: string;
  acquisition_source: "Facebook" | "SEO" | "YouTube" | "TikTok" | "Referral" | "Direct" | "unknown";
  source_evidence: "UTM" | "Nền tảng" | "Khách nói" | "Sales xác nhận" | "unknown";
  publication_id: string | null;
  validity: "valid" | "pending_check" | "spam" | "test" | "duplicate";
  fit: "yes" | "no" | "unknown"; // LR07 / LR08
  fit_reason: string;
  readiness: "hot" | "warm" | "cold" | "unknown"; // LR09 / LR10 / LR11
  readiness_evidence: string;
  need_stage: "Nấc 1" | "Nấc 2" | "Nấc 3" | "Nấc 4" | "Nấc 5" | "unknown";
  new_relationship_status: "new_confirmed" | "known" | "unknown";
  first_meaningful_response_at: string | null; // M014 / M015
  handoff_at: string | null; // M012
  sales_accepted_at: string | null; // M013
  feedback_status: "pending" | "accepted" | "unqualified" | "unreachable" | "not_ready";
}

export interface OpportunityEntity {
  opportunity_id: string;
  project_name: string;
  end_user_org_id: string; // Trường học / Chủ đầu tư hưởng lợi
  buyer_org_id: string; // Đơn vị ký hợp đồng (có thể là Nhà thầu)
  linked_inquiry_ids: string[];
  opened_at: string;
  current_stage: "evaluating" | "proposal_sent" | "pending" | "won" | "lost";
  expected_amount_vnd: number | null; // M022 Pipeline (NOT revenue)
  closed_at: string | null;
  loss_reason: string | null;
}

export interface FinancialEntryEntity {
  entry_id: string;
  document_ref: string; // Idempotency key per accounting voucher
  opportunity_id: string;
  entry_type: "contract_signed" | "revenue_recognized" | "cash_collected" | "adjustment";
  effective_date: string;
  amount_vnd: number; // Signed; negative adjustments preserved
  vat_basis: "Có VAT" | "Chưa VAT";
  confirmed_by: string;
}

export interface CostEntryEntity {
  cost_id: string;
  period: string; // e.g., "2026-10"
  campaign_id: string | null;
  cost_type: "ads" | "tools" | "outsourced" | "allocated_labor";
  incremental_cash_vnd: number; // M061 (New cash spent = 0 in P0)
  economic_cost_vnd: number | null; // M062 (Full economic cost including labor & existing tools; null if incomplete)
  completeness: "full" | "cash_only" | "incomplete";
  note: string;
}

export interface ExperimentEntity {
  experiment_id: string;
  campaign_id: string;
  segment_id: string;
  hypothesis: string;
  variable: string;
  primary_metric_code: string;
  guardrails: string;
  start_at: string;
  review_at: string;
  sample_size_note: string;
  decision: "Giữ" | "Sửa" | "Dừng" | "Chưa đủ dữ liệu";
}

export interface EmployeeEntity {
  employee_id: string;
  name: string;
  role_id: SystemRoleId;
  weekly_available_hours: number;
  work_schedule: string;
  active: boolean; // QA22: false = revoked access
  autonomy_level: "Chưa quan sát" | "Cần hướng dẫn" | "Tự làm" | "Cải tiến";
  practice_passed: number;
  practice_due: number;
}

export interface TaskEntity {
  task_id: string;
  brief_id: string | null;
  title: string;
  assignee_id: string;
  reviewer_id: string;
  deliverable: string;
  due_at: string;
  completed_at: string | null;
  estimated_hours: number;
  actual_hours: number | null;
  first_review_passed: boolean | null; // M057
  status: "Chờ" | "Đang làm" | "Bị chặn" | "Chờ duyệt" | "Cần sửa" | "Đạt";
}

export interface MetricDefinitionVersion {
  metric_code: string;
  name: string;
  formula: string;
  version: string;
  effective_at: string;
  change_note: string;
}

export interface HacoledDatabase {
  meta: {
    version: string;
    baselineStartDate: string; // C09: Only count baseline from verified tracking date
    currentPeriod: string;
    isPeriodComplete: boolean; // QA14: Warn when comparing incomplete month (e.g. Oct 1-25) with full month
    cohortWindowDays: number; // M018 / QA15: e.g. 30 days
  };
  solutions: SolutionEntity[];
  segments: SegmentEntity[];
  marketScenarios: MarketScenarioEntity[];
  personas: PersonaEntity[];
  insights: InsightEntity[];
  campaigns: CampaignEntity[];
  briefs: ContentBriefEntity[];
  assets: ContentAssetEntity[];
  publications: PublicationEntity[];
  snapshots: MetricSnapshotEntity[];
  organizations: OrganizationEntity[];
  contacts: ContactEntity[];
  touchpoints: TouchpointEntity[];
  inquiries: InquiryEntity[];
  opportunities: OpportunityEntity[];
  financialEntries: FinancialEntryEntity[];
  costs: CostEntryEntity[];
  experiments: ExperimentEntity[];
  employees: EmployeeEntity[];
  tasks: TaskEntity[];
  metricVersions: MetricDefinitionVersion[];
  auditLog: AuditLogEntry[];
}

export const INITIAL_HACOLED_DB: HacoledDatabase = {
  meta: {
    version: "1.0.0",
    baselineStartDate: "2026-10-20",
    currentPeriod: "2026-10",
    isPeriodComplete: false, // Today is Oct 25 -> MTD incomplete month warning (QA14)
    cohortWindowDays: 30,
  },
  solutions: [
    {
      solution_id: "SOL-01",
      name: "Giải pháp Màn hình LED Hội trường & Giảng đường Trọn gói",
      use_case: "Hội trường trường học, phòng họp đa năng 150–600 chỗ ngồi",
      included_scope: "Khảo sát không gian, tư vấn khoảng cách xem (P2/P2.5/P3), khung giá đỡ, bộ xử lý hình ảnh, thi công & bảo hành tận nơi",
      excluded_scope: "Không bán lẻ tấm module rời tự lắp; không nhận sửa chữa màn hình trôi nổi không rõ nguồn linh kiện (B01-01)",
      verified_claims: "Độ sáng ≥ 600–800 nits chống lóa đèn hội trường; tần số làm tươi ≥ 3840Hz không nháy khi quay camera nhà trường",
      version: "v1.0",
      approved_by: "Lead Marketing + Kỹ thuật trưởng",
    },
    {
      solution_id: "SOL-02",
      name: "Giải pháp Màn hình LED Sân khấu & Sự kiện Ngoài trời Trường học",
      use_case: "Sân trường, lễ khai giảng, nhà thi đấu đa năng",
      included_scope: "Cabinet chống nước chuẩn IP65 (P3.91/P4), hệ thống tủ điện an toàn, kết cấu chịu lực & hướng dẫn vận hành",
      excluded_scope: "Không cho thuê ngắn hạn 1 buổi; không bán lẻ nguồn/card rời",
      verified_claims: "Chuẩn bảo vệ IP65 mặt trước; độ sáng ≥ 4500 nits nhìn rõ dưới ánh nắng sân trường",
      version: "v1.0",
      approved_by: "Lead Marketing + Kỹ thuật trưởng",
    },
  ],
  segments: [
    {
      segment_id: "SEG-SCHOOL-HALL",
      name: "Trường học nâng cấp hiển thị Hội trường / Giảng đường (Pilot C07)",
      inclusion: "Trường THPT, Cao đẳng, Đại học, Trường liên cấp có hội trường ≥ 150 chỗ đang dùng máy chiếu mờ hoặc phông bạt cũ",
      exclusion: "Điểm trường nhỏ không có hội trường riêng; đơn vị hỏi mua lẻ vài tấm module về tự hàn",
      buyer_type: "Chủ đầu tư",
      application: "Hội trường & Giảng đường",
      geography: "Hà Nội & Miền Bắc (Giai đoạn Pilot)",
      status: "Thử nghiệm (Pilot)",
    },
    {
      segment_id: "SEG-CONTRACTOR-MEP",
      name: "Nhà thầu Cơ điện / Tích hợp Hệ thống (SI) cho Dự án Giáo dục",
      inclusion: "Nhà thầu thi công gói thiết bị trường học cần đơn vị LED trọn gói có đủ hồ sơ năng lực, CO/CQ",
      exclusion: "Đơn vị thương mại chỉ xin giá dò không có dự án thực",
      buyer_type: "Nhà thầu",
      application: "Gói thầu Thiết bị Giáo dục / Hội trường",
      geography: "Toàn quốc",
      status: "Ưu tiên",
    },
  ],
  marketScenarios: [
    {
      scenario_id: "SCEN-2026-BASE",
      segment_id: "SEG-SCHOOL-HALL",
      year: 2026,
      scenario: "Cơ sở",
      eligible_org_count: 850,
      projects_per_org_year: 0.18,
      value_per_project_vnd: 220_000_000,
      sam_project_count: 95,
      reachable_qualified_projects: 40,
      win_rate_assumption: 0.2,
      delivery_capacity: 12,
      vat_basis: "Chưa VAT",
      confidence: "Ước lượng có nguồn",
    },
    {
      scenario_id: "SCEN-2026-LOW",
      segment_id: "SEG-SCHOOL-HALL",
      year: 2026,
      scenario: "Thấp",
      eligible_org_count: 850,
      projects_per_org_year: 0.12,
      value_per_project_vnd: 180_000_000,
      sam_project_count: 60,
      reachable_qualified_projects: 25,
      win_rate_assumption: 0.15,
      delivery_capacity: 12,
      vat_basis: "Chưa VAT",
      confidence: "Giả định",
    },
  ],
  personas: [
    {
      persona_id: "PER-EQUIP-OFFICER",
      segment_id: "SEG-SCHOOL-HALL",
      buying_role: "Người tìm hiểu",
      job_to_be_done: "Tìm 2–3 phương án nâng cấp màn hình hội trường đúng kỹ thuật để trình Ban Giám hiệu",
      pains: "Sợ chọn sai độ phân giải (P2 hay P3), sợ lóa mắt học sinh, sợ vượt dự toán hoặc thiếu hồ sơ nghiệm thu",
      triggers: "Máy chiếu hội trường bị mờ khi bật đèn sáng trong lễ sơ kết/hội thảo",
      barriers: "Chưa có bảng thông số chuẩn theo diện tích phòng để giải trình với Hiệu trưởng",
      decision_criteria: "Có checklist tính kích thước/khoảng cách xem rõ ràng, có công trình thực tế, báo giá trọn gói minh bạch",
    },
    {
      persona_id: "PER-PRINCIPAL",
      segment_id: "SEG-SCHOOL-HALL",
      buying_role: "Người phê duyệt",
      job_to_be_done: "Đảm bảo hội trường trang trọng, bền bỉ nhiều năm, an toàn điện và đúng quy trình tài chính",
      pains: "Ngại phát sinh chi phí ẩn sau khi ký hợp đồng hoặc bảo hành chậm trễ khi trường có sự kiện gấp",
      triggers: "Kế hoạch đầu tư cơ sở vật chất đầu năm học / chuẩn kiểm định chất lượng giáo dục",
      barriers: "Chưa tin tưởng các lời quảng cáo giá rẻ bất thường trên mạng",
      decision_criteria: "Pháp nhân rõ ràng, cam kết bảo hành bằng văn bản, biên bản nghiệm thu dự án tương đương",
    },
  ],
  insights: [
    {
      insight_id: "INS-01",
      segment_id: "SEG-SCHOOL-HALL",
      persona_id: "PER-EQUIP-OFFICER",
      context: "Khi cán bộ phụ trách cơ sở vật chất được giao khảo sát phương án thay thế máy chiếu hội trường",
      observation: "7/9 cuộc gọi hỏi 'Hội trường dài 20m rộng 10m thì nên dùng P2.5 hay P3 và có cần tắt đèn như máy chiếu không?'",
      interpretation: "Khách hàng lo ngại chọn sai cấu hình không phù hợp không gian thực tế hơn là chỉ so giá trên mỗi m2",
      supporting_evidence_refs: ["EVID-SALES-01", "EVID-CALL-04"],
      counter_evidence_refs: ["Một số nhà thầu phụ đã có sẵn BOQ chỉ quan tâm đơn giá/m2"],
      content_implication: "Xây dựng bộ Checklist chọn màn hình LED hội trường theo khoảng cách xem & ánh sáng thay vì bài viết quảng cáo chung chung",
      status: "Được hỗ trợ",
      validated_by: "Lead Marketing",
    },
    {
      insight_id: "INS-02",
      segment_id: "SEG-SCHOOL-HALL",
      persona_id: "PER-PRINCIPAL",
      context: "Khi xem video quay màn hình LED bằng điện thoại trong hội trường",
      observation: "3 bình luận trên TikTok hỏi vì sao màn hình LED quay lên điện thoại bị sọc gợn sóng",
      interpretation: "Giả thuyết: Các trường rất quan tâm việc chụp ảnh/quay video truyền thông sự kiện không bị sọc màn hình",
      supporting_evidence_refs: ["EVID-TT-COMMENT-03"],
      counter_evidence_refs: [],
      content_implication: "Làm video ngắn giải thích tần số quét 3840Hz giúp chụp ảnh kỷ yếu/khai giảng sắc nét",
      status: "Giả thuyết", // QA20: 3 comments only -> must stay Hypothesis until verified
      validated_by: null,
    },
  ],
  campaigns: [
    {
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      name: "Chiến dịch Pilot T10: Chuẩn hóa Hiển thị Hội trường Trường học",
      segment_id: "SEG-SCHOOL-HALL",
      objective: "Thu hút yêu cầu tư vấn thực từ các trường học & nhà thầu giáo dục với ngân sách quảng cáo mới = 0 ₫",
      primary_metric_code: "M009",
      start_date: "2026-10-20",
      end_date: "2026-11-20",
      budget_new_vnd: 0, // C02: 0 VND new budget
      owner_id: "EMP-LEAD",
      status: "Đang chạy",
    },
  ],
  briefs: [
    {
      brief_id: "DEMO-BRIEF-01",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      segment_id: "SEG-SCHOOL-HALL",
      persona_id: "PER-EQUIP-OFFICER",
      insight_id: "INS-01",
      need_stage: "Nấc 3: Tìm giải pháp",
      message: "Chọn giải pháp màn hình LED hội trường theo nội dung hiển thị, khoảng cách xem và điều kiện ánh sáng thực tế",
      angle: "Checklist đối chiếu LED Hội trường vs Máy chiếu truyền thống (5 tiêu chí kỹ thuật & dự toán)",
      cta: "Gửi kích thước hội trường (Dài × Rộng × Cao) để nhận bảng tính cấu hình sơ bộ",
      acceptance: "Đúng tệp trường học, không hứa khảo sát miễn phí ngoài vùng phục vụ, không dùng ảnh AI giả làm dự án thật",
      version: "v1.0",
    },
  ],
  assets: [
    {
      asset_id: "ASSET-01",
      brief_id: "DEMO-BRIEF-01",
      title: "Bài chuẩn SEO: Hướng dẫn chọn màn hình LED hội trường trường học theo khoảng cách nhìn",
      format: "SEO",
      creator_id: "EMP-SEO",
      creator_role: "intern_seo",
      drive_ref: "https://drive.hacoled.internal/assets/asset-01-seo",
      version: "v1.0",
      rights_status: "Được dùng",
      technical_approval: "Đạt",
      approved_at: "2026-10-21T10:00:00Z",
      hours_spent: 5.5,
    },
    {
      asset_id: "ASSET-02",
      brief_id: "DEMO-BRIEF-01",
      title: "Bài Facebook: 3 thông số cán bộ thiết bị trường học cần kiểm tra trước khi trình dự toán LED hội trường",
      format: "Facebook chữ",
      creator_id: "EMP-COORD",
      creator_role: "fulltime_coord",
      drive_ref: "https://drive.hacoled.internal/assets/asset-02-fb",
      version: "v1.0",
      rights_status: "Được dùng",
      technical_approval: "Đạt",
      approved_at: "2026-10-21T14:00:00Z",
      hours_spent: 2.0,
    },
    {
      asset_id: "ASSET-03",
      brief_id: "DEMO-BRIEF-01",
      title: "Video ngang: Phân tích sơ đồ khoảng cách nhìn P2, P2.5 và P3 cho hội trường 200–500 chỗ",
      format: "Video ngang",
      creator_id: "EMP-VID-L",
      creator_role: "intern_video_long",
      drive_ref: "https://drive.hacoled.internal/assets/asset-03-long",
      version: "v1.0",
      rights_status: "Được dùng",
      technical_approval: "Đạt",
      approved_at: "2026-10-22T09:30:00Z",
      hours_spent: 8.0,
    },
    {
      asset_id: "ASSET-04",
      brief_id: "DEMO-BRIEF-01",
      title: "Video dọc (Shorts/Reels/TikTok): Cách tính nhanh diện tích màn hình LED theo chiều rộng sân khấu",
      format: "Video dọc",
      creator_id: "EMP-VID-S",
      creator_role: "intern_video_short",
      drive_ref: "https://drive.hacoled.internal/assets/asset-04-short",
      version: "v1.0",
      rights_status: "Được dùng",
      technical_approval: "Đạt",
      approved_at: "2026-10-22T15:00:00Z",
      hours_spent: 3.5,
    },
    {
      asset_id: "ASSET-05-BLOCKED",
      brief_id: "DEMO-BRIEF-01",
      title: "Video dọc: Quay cận cảnh học sinh trong lễ khai giảng (Chưa có văn bản đồng ý quyền hình ảnh)",
      format: "Video dọc",
      creator_id: "EMP-VID-S",
      creator_role: "intern_video_short",
      drive_ref: "https://drive.hacoled.internal/assets/asset-05-unconsented",
      version: "v0.9",
      rights_status: "Chứa ảnh học sinh/khách chưa xin phép", // QA23: Must block publication!
      technical_approval: "Chờ duyệt",
      approved_at: null,
      hours_spent: 2.5,
    },
  ],
  publications: [
    {
      publication_id: "PUB-01-WEB",
      asset_id: "ASSET-01",
      channel_id: "CH-WEB",
      platform: "Website",
      native_post_id: "post-seo-101",
      public_url: "https://hacoled.com/man-hinh-led-hoi-truong-truong-hoc",
      published_at: "2026-10-21T11:00:00Z",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      utm_content: "", // Internal website page
      status: "Đã đăng",
      metrics_owner_role: "intern_seo",
      publisher_role: "intern_seo",
    },
    {
      publication_id: "PUB-02-FB",
      asset_id: "ASSET-02",
      channel_id: "CH-FB",
      platform: "Facebook",
      native_post_id: "fb-post-201",
      public_url: "https://facebook.com/hacoled/posts/201",
      published_at: "2026-10-21T15:00:00Z",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      utm_content: "pub_02_fb_checklist",
      status: "Đã đăng",
      metrics_owner_role: "fulltime_coord",
      publisher_role: "fulltime_coord",
    },
    {
      publication_id: "PUB-03-YT",
      asset_id: "ASSET-03",
      channel_id: "CH-YT",
      platform: "YouTube",
      native_post_id: "yt-vid-301",
      public_url: "https://youtube.com/watch?v=hacoled301",
      published_at: "2026-10-22T11:00:00Z",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      utm_content: "pub_03_yt_long",
      status: "Đã đăng",
      metrics_owner_role: "intern_video_long",
      publisher_role: "intern_video_long",
    },
    // QA09: 1 Video Asset (ASSET-04) published across 3 platforms = 1 Asset, 3 Publications
    {
      publication_id: "PUB-04A-TT",
      asset_id: "ASSET-04",
      channel_id: "CH-TT",
      platform: "TikTok",
      native_post_id: "tt-vid-401",
      public_url: "https://tiktok.com/@hacoled/video/401",
      published_at: "2026-10-22T16:00:00Z",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      utm_content: "pub_04a_tt_short",
      status: "Đã đăng",
      metrics_owner_role: "intern_video_short",
      publisher_role: "intern_video_short",
    },
    {
      publication_id: "PUB-04B-FBREELS",
      asset_id: "ASSET-04",
      channel_id: "CH-FB",
      platform: "Facebook",
      native_post_id: "fb-reel-402",
      public_url: "https://facebook.com/reel/402",
      published_at: "2026-10-22T16:15:00Z",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      utm_content: "pub_04b_fbreels_short",
      status: "Đã đăng",
      metrics_owner_role: "intern_video_short",
      publisher_role: "intern_video_short",
    },
    {
      publication_id: "PUB-04C-YTSHORTS",
      asset_id: "ASSET-04",
      channel_id: "CH-YT",
      platform: "YouTube",
      native_post_id: "yt-shorts-403",
      public_url: "https://youtube.com/shorts/403",
      published_at: "2026-10-22T16:30:00Z",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      utm_content: "pub_04c_ytshorts_short",
      status: "Đã đăng",
      metrics_owner_role: "intern_video_short",
      publisher_role: "intern_video_short",
    },
  ],
  snapshots: [
    // QA10: Two lifetime snapshots for PUB-04A-TT (100 views on Oct 23, 150 views on Oct 24 -> latest = 150, delta = +50, NEVER 250!)
    {
      snapshot_id: "SNAP-01",
      entity_type: "publication",
      entity_id: "PUB-04A-TT",
      metric_code: "M041",
      native_metric_name: "video_views_lifetime",
      metric_value: 100,
      period_start: "2026-10-22",
      period_end: "2026-10-23",
      aggregation: "lifetime",
      retrieved_at: "2026-10-23T20:00:00Z",
      import_batch_id: "BATCH-TT-01",
      dedupe_key: "tiktok:PUB-04A-TT:M041:2026-10-22:2026-10-23:lifetime",
    },
    {
      snapshot_id: "SNAP-02",
      entity_type: "publication",
      entity_id: "PUB-04A-TT",
      metric_code: "M041",
      native_metric_name: "video_views_lifetime",
      metric_value: 150,
      period_start: "2026-10-22",
      period_end: "2026-10-24",
      aggregation: "lifetime",
      retrieved_at: "2026-10-24T20:00:00Z",
      import_batch_id: "BATCH-TT-02",
      dedupe_key: "tiktok:PUB-04A-TT:M041:2026-10-22:2026-10-24:lifetime",
    },
    // QA13: Missing metric export (completion rate unavailable -> null, NOT 0)
    {
      snapshot_id: "SNAP-03-NULL",
      entity_type: "publication",
      entity_id: "PUB-04A-TT",
      metric_code: "M053",
      native_metric_name: "completion_rate",
      metric_value: null,
      period_start: "2026-10-22",
      period_end: "2026-10-24",
      aggregation: "lifetime",
      retrieved_at: "2026-10-24T20:00:00Z",
      import_batch_id: "BATCH-TT-02",
      dedupe_key: "tiktok:PUB-04A-TT:M053:2026-10-22:2026-10-24:lifetime",
    },
    // Website & GSC Period Snapshots
    {
      snapshot_id: "SNAP-GSC-IMPR",
      entity_type: "channel",
      entity_id: "CH-WEB",
      metric_code: "M026",
      native_metric_name: "gsc_impressions",
      metric_value: 14800,
      period_start: "2026-10-01",
      period_end: "2026-10-24",
      aggregation: "period",
      retrieved_at: "2026-10-24T21:00:00Z",
      import_batch_id: "BATCH-GSC-01",
      dedupe_key: "gsc:CH-WEB:M026:2026-10-01:2026-10-24:period",
    },
    {
      snapshot_id: "SNAP-GSC-CLICKS",
      entity_type: "channel",
      entity_id: "CH-WEB",
      metric_code: "M027",
      native_metric_name: "gsc_clicks",
      metric_value: 412,
      period_start: "2026-10-01",
      period_end: "2026-10-24",
      aggregation: "period",
      retrieved_at: "2026-10-24T21:00:00Z",
      import_batch_id: "BATCH-GSC-01",
      dedupe_key: "gsc:CH-WEB:M027:2026-10-01:2026-10-24:period",
    },
    {
      snapshot_id: "SNAP-GA4-SESSIONS",
      entity_type: "channel",
      entity_id: "CH-WEB",
      metric_code: "M032",
      native_metric_name: "ga4_sessions",
      metric_value: 1240,
      period_start: "2026-10-01",
      period_end: "2026-10-24",
      aggregation: "period",
      retrieved_at: "2026-10-24T21:00:00Z",
      import_batch_id: "BATCH-GA4-01",
      dedupe_key: "ga4:CH-WEB:M032:2026-10-01:2026-10-24:period",
    },
  ],
  organizations: [
    {
      organization_id: "ORG-SCHOOL-01",
      name: "Trường THPT Chuyên Bắc Ninh",
      organization_type: "Trường học",
      segment_id: "SEG-SCHOOL-HALL",
      region: "Miền Bắc",
      relationship_status: "new_confirmed",
      relationship_verified_by: "Đầu mối Sales",
    },
    {
      organization_id: "ORG-SCHOOL-OLD-02",
      name: "Trường Đại học Kinh tế Kỹ thuật Công nghiệp (Khách cũ 2025)",
      organization_type: "Trường học",
      segment_id: "SEG-SCHOOL-HALL",
      region: "Hà Nội",
      relationship_status: "purchased_legacy", // QA05: Existing customer organization
      relationship_verified_by: "Đầu mối Sales",
    },
    {
      organization_id: "ORG-CONTRACTOR-03",
      name: "Công ty CP Cơ điện & Tích hợp Hệ thống Thăng Long",
      organization_type: "Nhà thầu",
      segment_id: "SEG-CONTRACTOR-MEP",
      region: "Hà Nội",
      relationship_status: "new_confirmed",
      relationship_verified_by: "Đầu mối Sales",
    },
  ],
  contacts: [
    {
      contact_id: "CON-01",
      display_name: "Thầy Nguyễn Văn Minh",
      phone_normalized: "0912345101",
      email_normalized: "minhnv@thptbacninh.edu.vn",
      organization_id: "ORG-SCHOOL-01",
      first_recorded_at: "2026-10-22T09:15:00Z",
      first_seen_in_base: true,
      new_to_company_status: "new_confirmed",
      verification_source: "Sales đối chiếu danh sách dự án",
      merge_review_status: "clean",
    },
    {
      contact_id: "CON-02-NEW-IN-OLD-ORG",
      display_name: "Cô Trần Thu Trang (Phòng Quản trị Thiết bị)",
      phone_normalized: "0988777202",
      email_normalized: "trangtt@uneti.edu.vn",
      organization_id: "ORG-SCHOOL-OLD-02", // QA05: New person from an organization that already bought before
      first_recorded_at: "2026-10-23T10:20:00Z",
      first_seen_in_base: true,
      new_to_company_status: "known", // Belongs to existing client org
      verification_source: "Sales xác nhận trường đã lắp màn P2.5 năm 2025",
      merge_review_status: "clean",
    },
    {
      contact_id: "CON-03-HOTLINE-UNK",
      display_name: "Khách gọi Hotline 0904***303",
      phone_normalized: "0904555303",
      email_normalized: "",
      organization_id: null,
      first_recorded_at: "2026-10-24T11:05:00Z",
      first_seen_in_base: true,
      new_to_company_status: "unknown", // QA06: Unverified hotline caller stays unknown, NOT new_confirmed
      verification_source: null,
      merge_review_status: "clean",
    },
    {
      contact_id: "CON-04-CONTRACTOR",
      display_name: "KS. Lê Hoàng Bảo",
      phone_normalized: "0936888404",
      email_normalized: "baolh@thanglongmep.vn",
      organization_id: "ORG-CONTRACTOR-03",
      first_recorded_at: "2026-10-23T14:00:00Z",
      first_seen_in_base: true,
      new_to_company_status: "new_confirmed",
      verification_source: "Sales xác nhận nhà thầu mới",
      merge_review_status: "clean",
    },
    {
      contact_id: "CON-05-UNFIT",
      display_name: "Anh Đỗ Tùng (Mua lẻ module)",
      phone_normalized: "0979111505",
      email_normalized: "",
      organization_id: null,
      first_recorded_at: "2026-10-24T16:10:00Z",
      first_seen_in_base: true,
      new_to_company_status: "new_confirmed",
      verification_source: "Hotline",
      merge_review_status: "clean",
    },
  ],
  touchpoints: [
    // QA04: 3 touchpoints (Form + Hotline + Zalo) from the SAME contact CON-01 -> 3 touchpoints, 1 unique contact
    {
      touchpoint_id: "TP-01",
      submission_or_event_id: "SUB-FORM-1001",
      contact_id: "CON-01",
      occurred_at: "2026-10-22T09:15:00Z",
      capture_channel: "form",
      source_medium: "Facebook / social",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      publication_id: "PUB-02-FB",
      evidence_basis: "observed_utm", // QA08: Social UTM to Website Form
    },
    {
      touchpoint_id: "TP-02",
      submission_or_event_id: "CALL-1002",
      contact_id: "CON-01",
      occurred_at: "2026-10-22T10:00:00Z",
      capture_channel: "hotline",
      source_medium: "Facebook / social",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      publication_id: "PUB-02-FB",
      evidence_basis: "sales_confirmed",
    },
    {
      touchpoint_id: "TP-03",
      submission_or_event_id: "ZALO-1003",
      contact_id: "CON-01",
      occurred_at: "2026-10-22T14:30:00Z",
      capture_channel: "zalo",
      source_medium: "Facebook / social",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      publication_id: "PUB-02-FB",
      evidence_basis: "sales_confirmed",
    },
    {
      touchpoint_id: "TP-04",
      submission_or_event_id: "SUB-FORM-1004",
      contact_id: "CON-02-NEW-IN-OLD-ORG",
      occurred_at: "2026-10-23T10:20:00Z",
      capture_channel: "form",
      source_medium: "SEO / organic",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      publication_id: "PUB-01-WEB",
      evidence_basis: "observed_utm",
    },
    {
      touchpoint_id: "TP-05",
      submission_or_event_id: "CALL-1005",
      contact_id: "CON-03-HOTLINE-UNK",
      occurred_at: "2026-10-24T11:05:00Z",
      capture_channel: "hotline",
      source_medium: "unknown", // QA07: Unverified hotline source = unknown
      campaign_id: null,
      publication_id: null,
      evidence_basis: "unknown",
    },
  ],
  inquiries: [
    {
      inquiry_id: "INQ-01",
      submission_or_thread_id: "SUB-FORM-1001",
      contact_id: "CON-01",
      organization_id: "ORG-SCHOOL-01",
      received_at: "2026-10-22T09:15:00Z",
      capture_channel: "form",
      need_summary: "Tư vấn màn hình LED P2.5 cho hội trường 400 chỗ (18m × 12m), xin báo giá dự toán trình Hiệu trưởng",
      acquisition_source: "Facebook", // QA08: Source = Facebook, Capture = form
      source_evidence: "UTM",
      publication_id: "PUB-02-FB",
      validity: "valid",
      fit: "yes",
      fit_reason: "Đúng giải pháp trọn gói hội trường trường học (SOL-01)",
      readiness: "hot",
      readiness_evidence: "Đã gửi bản vẽ kích thước sân khấu qua Zalo và hẹn lịch khảo sát thứ Năm (LR10)",
      need_stage: "Nấc 4",
      new_relationship_status: "new_confirmed",
      first_meaningful_response_at: "2026-10-22T09:35:00Z", // 20 mins response time
      handoff_at: "2026-10-22T09:40:00Z",
      sales_accepted_at: "2026-10-22T09:50:00Z",
      feedback_status: "accepted",
    },
    {
      inquiry_id: "INQ-02",
      submission_or_thread_id: "SUB-FORM-1004",
      contact_id: "CON-02-NEW-IN-OLD-ORG",
      organization_id: "ORG-SCHOOL-OLD-02",
      received_at: "2026-10-23T10:20:00Z",
      capture_channel: "form",
      need_summary: "Lắp thêm 1 màn hình LED P2 cho phòng họp Hội đồng cơ sở 2 (Trường cũ đã lắp năm 2025)",
      acquisition_source: "SEO",
      source_evidence: "UTM",
      publication_id: "PUB-01-WEB",
      validity: "valid",
      fit: "yes",
      fit_reason: "Đúng phạm vi giải pháp phòng họp/hội trường",
      readiness: "hot",
      readiness_evidence: "Xin báo giá theo cấu hình tương đương hợp đồng năm 2025",
      need_stage: "Nấc 5",
      new_relationship_status: "known", // QA05: Existing organization
      first_meaningful_response_at: "2026-10-23T10:45:00Z",
      handoff_at: "2026-10-23T10:50:00Z",
      sales_accepted_at: "2026-10-23T11:00:00Z",
      feedback_status: "accepted",
    },
    {
      inquiry_id: "INQ-03",
      submission_or_thread_id: "CALL-1005",
      contact_id: "CON-03-HOTLINE-UNK",
      organization_id: null,
      received_at: "2026-10-24T11:05:00Z",
      capture_channel: "hotline",
      need_summary: "Hỏi tham khảo suất đầu tư màn hình LED hội trường khoảng 15m2, chưa tiết lộ tên trường",
      acquisition_source: "unknown", // QA07 & LR14: Hotline without known source stays unknown
      source_evidence: "unknown",
      publication_id: null,
      validity: "valid",
      fit: "unknown", // LR08: Missing org/timeline info -> unknown, not 0
      fit_reason: "Chưa rõ địa điểm và phạm vi thi công",
      readiness: "warm",
      readiness_evidence: "Đang so sánh giữa máy chiếu laser và màn hình LED (LR09)",
      need_stage: "Nấc 3",
      new_relationship_status: "unknown", // QA06
      first_meaningful_response_at: "2026-10-24T11:05:00Z",
      handoff_at: "2026-10-24T11:20:00Z",
      sales_accepted_at: null, // Pending Sales acceptance
      feedback_status: "pending",
    },
    {
      inquiry_id: "INQ-04",
      submission_or_thread_id: "ZALO-1006",
      contact_id: "CON-04-CONTRACTOR",
      organization_id: "ORG-CONTRACTOR-03",
      received_at: "2026-10-23T14:00:00Z",
      capture_channel: "zalo",
      need_summary: "Nhà thầu MEP gửi BOQ gói màn hình LED hội trường & sân khấu cho Trường Liên cấp Quốc tế",
      acquisition_source: "YouTube",
      source_evidence: "Khách nói",
      publication_id: "PUB-03-YT",
      validity: "valid",
      fit: "yes",
      fit_reason: "Gói thầu trọn gói đúng năng lực HacoLED",
      readiness: "hot",
      readiness_evidence: "Đã gửi bản vẽ CAD & BOQ, cần báo giá đóng dấu trước ngày 28/10",
      need_stage: "Nấc 4",
      new_relationship_status: "new_confirmed",
      first_meaningful_response_at: "2026-10-23T14:15:00Z",
      handoff_at: "2026-10-23T14:20:00Z",
      sales_accepted_at: "2026-10-23T14:30:00Z",
      feedback_status: "accepted",
    },
    {
      inquiry_id: "INQ-05-UNFIT",
      submission_or_thread_id: "MSG-1007",
      contact_id: "CON-05-UNFIT",
      organization_id: null,
      received_at: "2026-10-24T16:10:00Z",
      capture_channel: "messenger",
      need_summary: "Hỏi mua lẻ 6 tấm module P3 실내 về tự thay thế",
      acquisition_source: "Facebook",
      source_evidence: "Nền tảng",
      publication_id: null,
      validity: "valid",
      fit: "no", // LR07: Buying loose modules -> fit=no
      fit_reason: "Ngoài phạm vi phục vụ (B01-01: Không bán lẻ tấm module rời)",
      readiness: "cold",
      readiness_evidence: "Không có nhu cầu lắp đặt giải pháp trọn gói",
      need_stage: "unknown",
      new_relationship_status: "new_confirmed",
      first_meaningful_response_at: "2026-10-24T16:20:00Z",
      handoff_at: null,
      sales_accepted_at: null,
      feedback_status: "unqualified",
    },
    {
      inquiry_id: "INQ-06-TEST",
      submission_or_thread_id: "TEST-SUB-999",
      contact_id: "CON-01",
      organization_id: "ORG-SCHOOL-01",
      received_at: "2026-10-20T08:00:00Z",
      capture_channel: "form",
      need_summary: "[TEST] Kiểm tra kết nối biểu mẫu website B08-03",
      acquisition_source: "Direct",
      source_evidence: "unknown",
      publication_id: null,
      validity: "test", // Excluded from M001/M002 production metrics
      fit: "unknown",
      fit_reason: "Bản ghi test kỹ thuật",
      readiness: "unknown",
      readiness_evidence: "",
      need_stage: "unknown",
      new_relationship_status: "unknown",
      first_meaningful_response_at: null,
      handoff_at: null,
      sales_accepted_at: null,
      feedback_status: "pending",
    },
  ],
  opportunities: [
    {
      opportunity_id: "OPP-01",
      project_name: "Dự án Màn hình LED P2.5 Hội trường Trường THPT Chuyên Bắc Ninh",
      end_user_org_id: "ORG-SCHOOL-01",
      buyer_org_id: "ORG-SCHOOL-01",
      linked_inquiry_ids: ["INQ-01"],
      opened_at: "2026-10-22T15:00:00Z",
      current_stage: "proposal_sent",
      expected_amount_vnd: 245_000_000,
      closed_at: null,
      loss_reason: null,
    },
    {
      opportunity_id: "OPP-02",
      project_name: "Dự án Màn hình LED P2 Phòng họp Cơ sở 2 - ĐH Kinh tế Kỹ thuật Công nghiệp",
      end_user_org_id: "ORG-SCHOOL-OLD-02",
      buyer_org_id: "ORG-SCHOOL-OLD-02",
      linked_inquiry_ids: ["INQ-02"],
      opened_at: "2026-10-23T11:30:00Z",
      current_stage: "won",
      expected_amount_vnd: 200_000_000,
      closed_at: "2026-10-24T17:00:00Z",
      loss_reason: null,
    },
    {
      opportunity_id: "OPP-03",
      project_name: "Gói thầu Màn hình LED Trường Liên cấp Quốc tế (Qua Nhà thầu Thăng Long MEP)",
      end_user_org_id: "ORG-SCHOOL-01", // End user is school, buyer is contractor (B07-01)
      buyer_org_id: "ORG-CONTRACTOR-03",
      linked_inquiry_ids: ["INQ-04"],
      opened_at: "2026-10-23T16:00:00Z",
      current_stage: "evaluating",
      expected_amount_vnd: 420_000_000,
      closed_at: null,
      loss_reason: null,
    },
  ],
  // QA16: Contract value (200M), Recognized Revenue (100M), Cash Collected (50M) stored separately, NEVER summed together into 350M!
  financialEntries: [
    {
      entry_id: "FIN-01-CONTRACT",
      document_ref: "HD-2026-10-88",
      opportunity_id: "OPP-02",
      entry_type: "contract_signed",
      effective_date: "2026-10-24",
      amount_vnd: 200_000_000,
      vat_basis: "Chưa VAT",
      confirmed_by: "Kế toán trưởng",
    },
    {
      entry_id: "FIN-02-REVENUE",
      document_ref: "BB-NGHIEM-THU-DOT1-88",
      opportunity_id: "OPP-02",
      entry_type: "revenue_recognized",
      effective_date: "2026-10-24",
      amount_vnd: 100_000_000,
      vat_basis: "Chưa VAT",
      confirmed_by: "Kế toán trưởng",
    },
    {
      entry_id: "FIN-03-CASH",
      document_ref: "UNC-VCB-241088",
      opportunity_id: "OPP-02",
      entry_type: "cash_collected",
      effective_date: "2026-10-24",
      amount_vnd: 50_000_000,
      vat_basis: "Chưa VAT",
      confirmed_by: "Kế toán thanh toán",
    },
  ],
  costs: [
    {
      cost_id: "COST-2026-10-ADS",
      period: "2026-10",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      cost_type: "ads",
      incremental_cash_vnd: 0, // C02: 0 VND new cash budget
      economic_cost_vnd: 0,
      completeness: "full",
      note: "Giai đoạn Pilot P0 không chi tiền quảng cáo mới (C02)",
    },
    {
      cost_id: "COST-2026-10-LABOR",
      period: "2026-10",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      cost_type: "allocated_labor",
      incremental_cash_vnd: 0,
      economic_cost_vnd: 18_500_000, // Recognized economic cost of labor & existing tools (B04-03)
      completeness: "full",
      note: "Phân bổ giờ công thực tế của 1 Full-time + 3 Thực tập sinh + Lead remote (Không coi 0 chi mới là miễn phí nhân công)",
    },
  ],
  experiments: [
    {
      experiment_id: "EXP-01",
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      segment_id: "SEG-SCHOOL-HALL",
      hypothesis: "Nếu bài viết & video cung cấp bảng tra cứu khoảng cách xem (P2 vs P2.5 vs P3) kèm mẫu dự toán, tỷ lệ liên hệ đúng tệp trường học (M010) sẽ cao hơn bài giới thiệu chung.",
      variable: "Góc tiếp cận nội dung: Checklist thông số không gian vs Giới thiệu tính năng sản phẩm",
      primary_metric_code: "M009",
      guardrails: "Không hứa khảo sát miễn phí ngoài quy định; không giảm chất lượng lead (fit=yes)",
      start_at: "2026-10-20",
      review_at: "2026-11-05",
      sample_size_note: "Hiện mới có 5 yêu cầu hợp lệ sau 5 ngày — chưa đủ cỡ mẫu kết luận (B10-03)",
      decision: "Chưa đủ dữ liệu",
    },
  ],
  employees: [
    {
      employee_id: "EMP-LEAD",
      name: "Khánh Toàn (Lead Marketing - Remote)",
      role_id: "lead_marketing",
      weekly_available_hours: 25,
      work_schedule: "Remote linh hoạt - Duyệt & Chiến lược",
      active: true,
      autonomy_level: "Cải tiến",
      practice_passed: 5,
      practice_due: 5,
    },
    {
      employee_id: "EMP-COORD",
      name: "Thu Hà (Full-time Điều phối & Facebook)",
      role_id: "fulltime_coord",
      weekly_available_hours: 44,
      work_schedule: "Full-time 08:00 - 17:30",
      active: true,
      autonomy_level: "Tự làm",
      practice_passed: 4,
      practice_due: 4,
    },
    {
      employee_id: "EMP-SEO",
      name: "Hoàng Nam (TTS SEO & Web)",
      role_id: "intern_seo",
      weekly_available_hours: 24,
      work_schedule: "Part-time 6 buổi/tuần",
      active: true,
      autonomy_level: "Cần hướng dẫn",
      practice_passed: 2,
      practice_due: 3,
    },
    {
      employee_id: "EMP-VID-L",
      name: "Minh Đức (TTS Video dài)",
      role_id: "intern_video_long",
      weekly_available_hours: 20,
      work_schedule: "Part-time 5 buổi/tuần",
      active: true,
      autonomy_level: "Cần hướng dẫn",
      practice_passed: 2,
      practice_due: 2,
    },
    {
      employee_id: "EMP-VID-S",
      name: "Ngọc Ánh (TTS Video ngắn)",
      role_id: "intern_video_short",
      weekly_available_hours: 20,
      work_schedule: "Part-time 5 buổi/tuần",
      active: true,
      autonomy_level: "Cần hướng dẫn",
      practice_passed: 3,
      practice_due: 3,
    },
    {
      employee_id: "EMP-SALES",
      name: "Đức Trọng (Đầu mối Sales & Hotline)",
      role_id: "sales_hotline",
      weekly_available_hours: 44,
      work_schedule: "Full-time Kinh doanh",
      active: true,
      autonomy_level: "Tự làm",
      practice_passed: 2,
      practice_due: 2,
    },
  ],
  tasks: [
    {
      task_id: "TSK-01",
      brief_id: "DEMO-BRIEF-01",
      title: "Viết bài chuẩn SEO Checklist chọn màn hình LED hội trường trường học",
      assignee_id: "EMP-SEO",
      reviewer_id: "EMP-LEAD",
      deliverable: "ASSET-01 (Bài viết 1800 từ + bảng thông số đã duyệt)",
      due_at: "2026-10-21T17:00:00Z",
      completed_at: "2026-10-21T10:00:00Z",
      estimated_hours: 6,
      actual_hours: 5.5,
      first_review_passed: true,
      status: "Đạt",
    },
    {
      task_id: "TSK-02",
      brief_id: "DEMO-BRIEF-01",
      title: "Biên tập bài Facebook & gắn UTM chuẩn dẫn về trang giải pháp",
      assignee_id: "EMP-COORD",
      reviewer_id: "EMP-LEAD",
      deliverable: "ASSET-02 + PUB-02-FB",
      due_at: "2026-10-21T18:00:00Z",
      completed_at: "2026-10-21T14:00:00Z",
      estimated_hours: 2,
      actual_hours: 2.0,
      first_review_passed: true,
      status: "Đạt",
    },
    {
      task_id: "TSK-03",
      brief_id: "DEMO-BRIEF-01",
      title: "Dựng video ngang phân tích khoảng cách xem P2 / P2.5 / P3",
      assignee_id: "EMP-VID-L",
      reviewer_id: "EMP-LEAD",
      deliverable: "ASSET-03 + PUB-03-YT",
      due_at: "2026-10-22T12:00:00Z",
      completed_at: "2026-10-22T09:30:00Z",
      estimated_hours: 8,
      actual_hours: 8.0,
      first_review_passed: false, // Needed 1 revision for technical spec claim
      status: "Đạt",
    },
    {
      task_id: "TSK-04",
      brief_id: "DEMO-BRIEF-01",
      title: "Dựng video ngắn 60s đăng 3 kênh (TikTok, Reels, Shorts)",
      assignee_id: "EMP-VID-S",
      reviewer_id: "EMP-COORD",
      deliverable: "ASSET-04 + 3 Publications",
      due_at: "2026-10-22T18:00:00Z",
      completed_at: "2026-10-22T15:00:00Z",
      estimated_hours: 4,
      actual_hours: 3.5,
      first_review_passed: true,
      status: "Đạt",
    },
    {
      task_id: "TSK-05",
      brief_id: "DEMO-BRIEF-01",
      title: "Xin xác nhận bản quyền hình ảnh lễ khai giảng trước khi đăng ASSET-05",
      assignee_id: "EMP-COORD",
      reviewer_id: "EMP-LEAD",
      deliverable: "Văn bản đồng ý của nhà trường hoặc thay bằng tư liệu đã duyệt (QA23)",
      due_at: "2026-10-26T17:00:00Z",
      completed_at: null,
      estimated_hours: 2,
      actual_hours: null,
      first_review_passed: null,
      status: "Bị chặn",
    },
  ],
  metricVersions: [
    {
      metric_code: "M009",
      name: "Liên hệ đủ điều kiện trong cohort (Qualified Leads)",
      formula: "COUNT DISTINCT contact_id WHERE validity=valid AND fit=yes",
      version: "v1.0",
      effective_at: "2026-10-20",
      change_note: "Khởi tạo định nghĩa chuẩn v1.0: Yêu cầu phải được xác nhận fit=yes (không bán lẻ module).",
    },
  ],
  auditLog: [
    {
      audit_id: "AUD-INIT-01",
      actor_id: "EMP-LEAD",
      actor_role: "lead_marketing",
      entity_type: "system",
      entity_id: "HACOLED_BASE_V1",
      action: "create",
      changed_at: "2026-10-24T16:00:00Z",
      changed_fields: "schema_version, rbac_policies, pii_firewall",
      reason: "Khởi tạo hệ thống Quản trị & Phân tích Quyết định Marketing HacoLED v1.0",
      before_after_redacted: "baselineStartDate=2026-10-20; budget_new_vnd=0",
    },
  ],
};
