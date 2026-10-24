export type NewToCompanyStatus = "new_confirmed" | "known" | "unknown";
export type CaptureChannel = "form" | "hotline" | "zalo" | "messenger" | "other";
export type ValidityStatus = "valid" | "pending_check" | "spam" | "test" | "duplicate";
export type FitStatus = "yes" | "no" | "unknown";
export type ReadinessStatus = "hot" | "warm" | "cold" | "unknown";

export interface BaseInquiryRecord {
  inquiry_id: string;
  contact_id: string;
  contact_name: string;
  phone_normalized: string;
  organization_id: string;
  organization_name: string;
  organization_type: "Trường học" | "Doanh nghiệp" | "Nhà thầu" | "Chưa rõ";
  received_at: string;
  capture_channel: CaptureChannel;
  acquisition_source: string; // 'SEO' | 'Facebook' | 'YouTube' | 'TikTok' | 'Referral' | 'unknown'
  source_evidence: "UTM" | "Nền tảng" | "Khách nói" | "Sales xác nhận" | "unknown";
  need_summary: string;
  validity: ValidityStatus;
  new_to_company_status: NewToCompanyStatus;
  fit: FitStatus;
  readiness: ReadinessStatus;
  handoff_to_sales: boolean;
  first_meaningful_response: boolean;
  is_demo_record: boolean;
}

export interface BaseContentAsset {
  asset_id: string;
  brief_id: string;
  title: string;
  format: "SEO" | "Facebook chữ" | "Video ngang" | "Video dọc" | "Carousel";
  creator_role: string;
  technical_approval: "Đạt" | "Chờ duyệt" | "Cần sửa";
  rights_status: "Được dùng" | "Chờ phép" | "Hết hạn";
  hours_spent: number | null;
  publications: {
    publication_id: string;
    platform: "Website" | "Facebook" | "YouTube" | "TikTok" | "Zalo";
    status: "Đã đăng" | "Lịch đăng" | "Lỗi" | "Gỡ";
    utm_content: string;
    metrics_owner: string;
  }[];
}

export const DEMO_INQUIRIES: BaseInquiryRecord[] = [
  {
    inquiry_id: "INQ-DEMO-01",
    contact_id: "CON-DEMO-01",
    contact_name: "Thầy Minh (Phụ trách CSVC)",
    phone_normalized: "0912000101",
    organization_id: "ORG-DEMO-01",
    organization_name: "Trường THPT Chu Văn An (Giả định)",
    organization_type: "Trường học",
    received_at: "2026-10-24 09:15",
    capture_channel: "form",
    acquisition_source: "Facebook",
    source_evidence: "UTM",
    need_summary: "Tìm phương án thay máy chiếu hội trường 300 chỗ bằng màn hình LED trọn gói",
    validity: "valid",
    new_to_company_status: "new_confirmed",
    fit: "yes",
    readiness: "hot",
    handoff_to_sales: true,
    first_meaningful_response: true,
    is_demo_record: true,
  },
  {
    inquiry_id: "INQ-DEMO-02",
    contact_id: "CON-DEMO-01",
    contact_name: "Thầy Minh (Phụ trách CSVC)",
    phone_normalized: "0912000101",
    organization_id: "ORG-DEMO-01",
    organization_name: "Trường THPT Chu Văn An (Giả định)",
    organization_type: "Trường học",
    received_at: "2026-10-24 14:20",
    capture_channel: "zalo",
    acquisition_source: "Facebook",
    source_evidence: "UTM",
    need_summary: "Gửi thêm kích thước sân khấu hội trường (cùng người liên hệ CON-DEMO-01 - kiểm thử QA04)",
    validity: "valid",
    new_to_company_status: "new_confirmed",
    fit: "yes",
    readiness: "hot",
    handoff_to_sales: true,
    first_meaningful_response: true,
    is_demo_record: true,
  },
  {
    inquiry_id: "INQ-DEMO-03",
    contact_id: "CON-DEMO-02",
    contact_name: "Khách gọi Hotline (Chưa rõ tên)",
    phone_normalized: "0988000202",
    organization_id: "ORG-UNKNOWN-01",
    organization_name: "Chưa xác định tổ chức",
    organization_type: "Chưa rõ",
    received_at: "2026-10-24 10:30",
    capture_channel: "hotline",
    acquisition_source: "unknown",
    source_evidence: "unknown",
    need_summary: "Hỏi tham khảo giải pháp màn hình hội trường trường học, chưa rõ trường nào (QA06, QA07, LR14)",
    validity: "valid",
    new_to_company_status: "unknown",
    fit: "unknown",
    readiness: "warm",
    handoff_to_sales: true,
    first_meaningful_response: true,
    is_demo_record: true,
  },
  {
    inquiry_id: "INQ-DEMO-04",
    contact_id: "CON-DEMO-03",
    contact_name: "Anh Hùng (Nhà thầu cơ điện)",
    phone_normalized: "0903000303",
    organization_id: "ORG-DEMO-02",
    organization_name: "Công ty TNHHXD Thành Đạt (Khách cũ)",
    organization_type: "Nhà thầu",
    received_at: "2026-10-24 11:05",
    capture_channel: "hotline",
    acquisition_source: "unknown",
    source_evidence: "Sales xác nhận",
    need_summary: "Hỏi báo giá dự án mới cho 1 trường đại học (Khách cũ liên hệ lại - LR06)",
    validity: "valid",
    new_to_company_status: "known",
    fit: "yes",
    readiness: "hot",
    handoff_to_sales: true,
    first_meaningful_response: true,
    is_demo_record: true,
  },
  {
    inquiry_id: "INQ-DEMO-05",
    contact_id: "CON-DEMO-04",
    contact_name: "Anh Nam (Mua lẻ module)",
    phone_normalized: "0977000404",
    organization_id: "ORG-UNKNOWN-02",
    organization_name: "Cá nhân tự lắp",
    organization_type: "Chưa rõ",
    received_at: "2026-10-24 15:40",
    capture_channel: "messenger",
    acquisition_source: "Facebook",
    source_evidence: "Nền tảng",
    need_summary: "Hỏi mua lẻ 4 tấm module P3 về tự thay (Ngoài phạm vi giải pháp trọn gói - LR07: fit=no)",
    validity: "valid",
    new_to_company_status: "new_confirmed",
    fit: "no",
    readiness: "cold",
    handoff_to_sales: false,
    first_meaningful_response: true,
    is_demo_record: true,
  },
  {
    inquiry_id: "INQ-DEMO-06",
    contact_id: "CON-TEST-01",
    contact_name: "Test Form Nội Bộ",
    phone_normalized: "0900000000",
    organization_id: "ORG-TEST",
    organization_name: "HacoLED Internal Test",
    organization_type: "Doanh nghiệp",
    received_at: "2026-10-24 08:00",
    capture_channel: "form",
    acquisition_source: "SEO",
    source_evidence: "UTM",
    need_summary: "Bản ghi kiểm thử form website (validity=test -> loại khỏi M002)",
    validity: "test",
    new_to_company_status: "unknown",
    fit: "unknown",
    readiness: "unknown",
    handoff_to_sales: false,
    first_meaningful_response: false,
    is_demo_record: true,
  },
];

export const DEMO_ASSETS: BaseContentAsset[] = [
  {
    asset_id: "ASSET-DEMO-01",
    brief_id: "DEMO-BRIEF-01",
    title: "Bài SEO: Checklist chọn màn hình LED hội trường trường học theo khoảng cách xem",
    format: "SEO",
    creator_role: "Thực tập sinh SEO",
    technical_approval: "Đạt",
    rights_status: "Được dùng",
    hours_spent: 5.5,
    publications: [
      {
        publication_id: "PUB-DEMO-01",
        platform: "Website",
        status: "Đã đăng",
        utm_content: "khong_gan_utm_link_noi_bo",
        metrics_owner: "Thực tập sinh SEO",
      },
    ],
  },
  {
    asset_id: "ASSET-DEMO-02",
    brief_id: "DEMO-BRIEF-01",
    title: "Bài Facebook: Tóm lược 3 sai lầm khi chọn màn hình hội trường & dẫn link checklist",
    format: "Facebook chữ",
    creator_role: "Full-time / điều phối",
    technical_approval: "Đạt",
    rights_status: "Được dùng",
    hours_spent: 2.0,
    publications: [
      {
        publication_id: "PUB-DEMO-02",
        platform: "Facebook",
        status: "Đã đăng",
        utm_content: "fb_post_demo_brief_01",
        metrics_owner: "Full-time / điều phối",
      },
    ],
  },
  {
    asset_id: "ASSET-DEMO-03",
    brief_id: "DEMO-BRIEF-01",
    title: "Video ngang: Giải thích checklist so sánh LED hội trường và máy chiếu",
    format: "Video ngang",
    creator_role: "Thực tập sinh video dài",
    technical_approval: "Đạt",
    rights_status: "Được dùng",
    hours_spent: 8.0,
    publications: [
      {
        publication_id: "PUB-DEMO-03A",
        platform: "YouTube",
        status: "Đã đăng",
        utm_content: "yt_long_demo_brief_01",
        metrics_owner: "Thực tập sinh video dài",
      },
      {
        publication_id: "PUB-DEMO-03B",
        platform: "Facebook",
        status: "Đã đăng",
        utm_content: "fb_video_demo_brief_01",
        metrics_owner: "Full-time / điều phối",
      },
    ],
  },
  {
    asset_id: "ASSET-DEMO-04",
    brief_id: "DEMO-BRIEF-01",
    title: "Video ngắn (Dọc): 1 câu hỏi - 1 tiêu chí chọn màn hình hội trường (Kiểm thử QA09: 1 Asset -> 3 Publications)",
    format: "Video dọc",
    creator_role: "Thực tập sinh video ngắn",
    technical_approval: "Đạt",
    rights_status: "Được dùng",
    hours_spent: 3.5,
    publications: [
      {
        publication_id: "PUB-DEMO-04A",
        platform: "TikTok",
        status: "Đã đăng",
        utm_content: "tt_short_demo_brief_01",
        metrics_owner: "Thực tập sinh video ngắn",
      },
      {
        publication_id: "PUB-DEMO-04B",
        platform: "Facebook",
        status: "Đã đăng",
        utm_content: "fb_reels_demo_brief_01",
        metrics_owner: "Thực tập sinh video ngắn",
      },
      {
        publication_id: "PUB-DEMO-04C",
        platform: "YouTube",
        status: "Đã đăng",
        utm_content: "yt_shorts_demo_brief_01",
        metrics_owner: "Thực tập sinh video ngắn",
      },
    ],
  },
];
