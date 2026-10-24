export type MarketingChannel =
  | "Google Ads"
  | "Facebook Ads"
  | "SEO Website"
  | "TikTok"
  | "Zalo OA"
  | "Đối tác / Giới thiệu";

export type CampaignStatus = "Đang chạy" | "Tạm dừng" | "Hoàn thành";

export type LeadStage =
  | "Mới tiếp nhận"
  | "Đang tư vấn"
  | "Đã khảo sát & Báo giá"
  | "Chốt hợp đồng"
  | "Tạm hoãn";

export type ProductLine =
  | "Màn hình LED Indoor (P1.5 - P2.5)"
  | "Màn hình LED Outdoor (P3 - P5)"
  | "Màn hình ghép LCD Videowall"
  | "Màn hình LED Hội trường / Sân khấu"
  | "Standee LED / Quảng cáo";

export interface CampaignItem {
  id: string;
  code: string;
  name: string;
  channel: MarketingChannel;
  productLine: ProductLine;
  status: CampaignStatus;
  budget: number; // VNĐ
  spent: number; // VNĐ
  impressions: number;
  clicks: number;
  leads: number;
  closedDeals: number;
  revenue: number; // VNĐ
  owner: string;
  startDate: string;
}

export interface LeadItem {
  id: string;
  code: string;
  customerName: string;
  company: string;
  phone: string;
  region: "Hà Nội" | "TP.HCM" | "Miền Bắc" | "Miền Trung" | "Miền Nam";
  channel: MarketingChannel;
  productLine: ProductLine;
  estimatedValue: number; // VNĐ
  stage: LeadStage;
  assignedTo: string;
  createdAt: string;
  note: string;
}

export interface MonthlyMetric {
  month: string;
  spend: number;
  leads: number;
  qualifiedLeads: number;
  deals: number;
  revenue: number;
}

export const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: "camp-1",
    code: "GG-IND-01",
    name: "Search Google Ads - Màn hình LED Hội trường P2 / P2.5",
    channel: "Google Ads",
    productLine: "Màn hình LED Hội trường / Sân khấu",
    status: "Đang chạy",
    budget: 45000000,
    spent: 38500000,
    impressions: 84200,
    clicks: 4950,
    leads: 64,
    closedDeals: 7,
    revenue: 1120000000,
    owner: "Minh Quân (Ads)",
    startDate: "2026-10-01",
  },
  {
    id: "camp-2",
    code: "GG-OUT-02",
    name: "Search Google Ads - Thi công Màn hình LED Ngoài trời P3/P4",
    channel: "Google Ads",
    productLine: "Màn hình LED Outdoor (P3 - P5)",
    status: "Đang chạy",
    budget: 35000000,
    spent: 29400000,
    impressions: 56100,
    clicks: 3120,
    leads: 38,
    closedDeals: 4,
    revenue: 860000000,
    owner: "Minh Quân (Ads)",
    startDate: "2026-10-01",
  },
  {
    id: "camp-3",
    code: "FB-LEAD-01",
    name: "Facebook Lead Ads - Giải pháp LED Nhà hàng Tiệc cưới & Showroom",
    channel: "Facebook Ads",
    productLine: "Màn hình LED Indoor (P1.5 - P2.5)",
    status: "Đang chạy",
    budget: 28000000,
    spent: 24200000,
    impressions: 215000,
    clicks: 6840,
    leads: 72,
    closedDeals: 5,
    revenue: 645000000,
    owner: "Thu Hà (Social)",
    startDate: "2026-10-03",
  },
  {
    id: "camp-4",
    code: "SEO-CORE-10",
    name: "SEO Tổng thể HacoLED.com - Từ khóa Màn hình LED & Báo giá",
    channel: "SEO Website",
    productLine: "Màn hình LED Indoor (P1.5 - P2.5)",
    status: "Đang chạy",
    budget: 18000000,
    spent: 18000000,
    impressions: 192000,
    clicks: 11400,
    leads: 85,
    closedDeals: 9,
    revenue: 1380000000,
    owner: "Hoàng Nam (SEO)",
    startDate: "2026-10-01",
  },
  {
    id: "camp-5",
    code: "TT-VID-04",
    name: "TikTok Video Review Dự án Thực tế & Phòng họp LED P1.53",
    channel: "TikTok",
    productLine: "Màn hình LED Indoor (P1.5 - P2.5)",
    status: "Đang chạy",
    budget: 15000000,
    spent: 11800000,
    impressions: 340000,
    clicks: 5200,
    leads: 29,
    closedDeals: 2,
    revenue: 290000000,
    owner: "Thu Hà (Social)",
    startDate: "2026-10-05",
  },
  {
    id: "camp-6",
    code: "GG-LCD-03",
    name: "Google Search - Màn hình ghép LCD Videowall Phòng điều hành",
    channel: "Google Ads",
    productLine: "Màn hình ghép LCD Videowall",
    status: "Tạm dừng",
    budget: 20000000,
    spent: 14500000,
    impressions: 31200,
    clicks: 1750,
    leads: 21,
    closedDeals: 3,
    revenue: 420000000,
    owner: "Minh Quân (Ads)",
    startDate: "2026-10-02",
  },
];

export const INITIAL_LEADS: LeadItem[] = [
  {
    id: "lead-1",
    code: "HC-2610-089",
    customerName: "Anh Tuấn Anh",
    company: "Tập đoàn Xây dựng Hòa Bình - CN Hà Nội",
    phone: "0912.345.889",
    region: "Hà Nội",
    channel: "Google Ads",
    productLine: "Màn hình LED Hội trường / Sân khấu",
    estimatedValue: 245000000,
    stage: "Đã khảo sát & Báo giá",
    assignedTo: "KD01 - Đức Trọng",
    createdAt: "2026-10-24",
    note: "Cần lắp màn P2.0 kích thước 6m x 3m cho hội trường tầng 5, yêu cầu tiến độ tháng 11.",
  },
  {
    id: "lead-2",
    code: "HC-2610-088",
    customerName: "Chị Thanh Hương",
    company: "Trung tâm Hội nghị & Tiệc cưới Golden Palace",
    phone: "0988.712.405",
    region: "Miền Bắc",
    channel: "SEO Website",
    productLine: "Màn hình LED Indoor (P1.5 - P2.5)",
    estimatedValue: 380000000,
    stage: "Chốt hợp đồng",
    assignedTo: "KD02 - Việt Hoàng",
    createdAt: "2026-10-23",
    note: "Đã ký HĐ nâng cấp 2 sảnh tiệc màn hình LED P2.5 Cabrera cao cấp.",
  },
  {
    id: "lead-3",
    code: "HC-2610-087",
    customerName: "Anh Minh Khôi",
    company: "Công ty CP Đầu tư BĐS Đông Á",
    phone: "0903.654.112",
    region: "TP.HCM",
    channel: "Facebook Ads",
    productLine: "Màn hình LED Outdoor (P3 - P5)",
    estimatedValue: 520000000,
    stage: "Đang tư vấn",
    assignedTo: "KD03 - Quốc Bảo",
    createdAt: "2026-10-23",
    note: "Quan tâm màn LED P4 ngoài trời gắn mặt tiền tòa nhà showroom Quận 7.",
  },
  {
    id: "lead-4",
    code: "HC-2610-086",
    customerName: "Anh Hoàng Long",
    company: "Bệnh viện Đa khoa Quốc tế Bắc Hà",
    phone: "0977.231.900",
    region: "Hà Nội",
    channel: "Google Ads",
    productLine: "Màn hình ghép LCD Videowall",
    estimatedValue: 165000000,
    stage: "Chốt hợp đồng",
    assignedTo: "KD01 - Đức Trọng",
    createdAt: "2026-10-22",
    note: "Hệ thống 9 tấm màn hình ghép 55 inch viền mỏng 1.8mm cho phòng trực điều hành.",
  },
  {
    id: "lead-5",
    code: "HC-2610-085",
    customerName: "Chị Ngọc Diệp",
    company: "Chuỗi Thời trang Luxury Aura",
    phone: "0934.889.210",
    region: "Hà Nội",
    channel: "TikTok",
    productLine: "Standee LED / Quảng cáo",
    estimatedValue: 88000000,
    stage: "Mới tiếp nhận",
    assignedTo: "KD04 - Mai Phương",
    createdAt: "2026-10-24",
    note: "Hỏi báo giá 4 Standee LED P2.5 đặt tại sảnh các flagship store.",
  },
  {
    id: "lead-6",
    code: "HC-2610-084",
    customerName: "Anh Quốc Cường",
    company: "UBND Huyện Gia Lâm - Ban QLDA",
    phone: "0915.402.778",
    region: "Hà Nội",
    channel: "SEO Website",
    productLine: "Màn hình LED Hội trường / Sân khấu",
    estimatedValue: 310000000,
    stage: "Đã khảo sát & Báo giá",
    assignedTo: "KD02 - Việt Hoàng",
    createdAt: "2026-10-21",
    note: "Đã gửi hồ sơ năng lực HacoLED và báo giá 2 phương án P2.0 & P2.5.",
  },
];

export const MONTHLY_METRICS: MonthlyMetric[] = [
  {
    month: "T05/2026",
    spend: 105000000,
    leads: 215,
    qualifiedLeads: 128,
    deals: 19,
    revenue: 3150000000,
  },
  {
    month: "T06/2026",
    spend: 118000000,
    leads: 248,
    qualifiedLeads: 152,
    deals: 23,
    revenue: 3680000000,
  },
  {
    month: "T07/2026",
    spend: 112000000,
    leads: 236,
    qualifiedLeads: 144,
    deals: 21,
    revenue: 3420000000,
  },
  {
    month: "T08/2026",
    spend: 125000000,
    leads: 272,
    qualifiedLeads: 169,
    deals: 26,
    revenue: 4190000000,
  },
  {
    month: "T09/2026",
    spend: 132000000,
    leads: 294,
    qualifiedLeads: 185,
    deals: 28,
    revenue: 4480000000,
  },
  {
    month: "T10/2026",
    spend: 136400000,
    leads: 309,
    qualifiedLeads: 198,
    deals: 30,
    revenue: 4715000000,
  },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr`;
  }
  return formatVND(amount);
}
