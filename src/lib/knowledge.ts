export const KNOWLEDGE_CATEGORIES = [
  {
    id: "announcement",
    label: "Thông báo",
    shortLabel: "Thông báo",
    badgeTone: "announcement",
    description: "Thông báo nội bộ, lịch làm việc, thay đổi chính sách và tin tức quan trọng từ Leader Marketing.",
  },
  {
    id: "sop",
    label: "Quy trình (SOP)",
    shortLabel: "Quy trình",
    badgeTone: "sop",
    description: "Quy trình vận hành chuẩn (SOP), bước thực thi, checklist bàn giao và quy chuẩn phối hợp.",
  },
  {
    id: "knowledge",
    label: "Kiến thức & Tài liệu",
    shortLabel: "Kiến thức",
    badgeTone: "knowledge",
    description: "Kiến thức sản phẩm HacoLED, tài liệu đào tạo, guideline thương hiệu và biểu mẫu dùng chung.",
  },
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number]["id"];

export interface KnowledgeLink {
  label: string;
  url: string;
}

export interface KnowledgeReader {
  member_id: string;
  member_name: string;
  member_role: string;
  member_title: string;
  viewed: boolean;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  total_read_seconds: number;
  max_scroll_percent: number;
  comprehension_percent: number;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_version: number | null;
  is_current_version_ack: boolean;
}

export interface KnowledgePost {
  id: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  content: string;
  links: KnowledgeLink[];
  pinned: boolean;
  require_ack: boolean;
  author_id: string;
  author_name: string;
  author_role: string;
  version: number;
  created_at: string;
  updated_at: string;
  expected_read_seconds: number;
  // Team-wide metrics (only populated for lead_marketing)
  total_members?: number;
  viewed_count?: number;
  acknowledged_count?: number;
  avg_read_seconds?: number;
  avg_scroll_percent?: number;
  avg_comprehension_percent?: number;
  readers?: KnowledgeReader[];
  // Current user's own state
  my_viewed: boolean;
  my_first_viewed_at: string | null;
  my_last_viewed_at: string | null;
  my_view_count: number;
  my_total_read_seconds: number;
  my_max_scroll_percent: number;
  my_comprehension_percent: number;
  my_acknowledged: boolean;
  my_acknowledged_at: string | null;
  my_acknowledged_version: number | null;
}

export function isKnowledgeCategory(value: unknown): value is KnowledgeCategory {
  return value === "announcement" || value === "sop" || value === "knowledge";
}

export function getKnowledgeCategoryMeta(category: string) {
  return KNOWLEDGE_CATEGORIES.find((item) => item.id === category) ?? KNOWLEDGE_CATEGORIES[0];
}

export function normalizeKnowledgeLinks(raw: unknown): KnowledgeLink[] {
  if (!Array.isArray(raw)) return [];
  const result: KnowledgeLink[] = [];
  for (const item of raw.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const label = String((item as { label?: unknown }).label ?? "").trim().slice(0, 120);
    const url = String((item as { url?: unknown }).url ?? "").trim().slice(0, 1000);
    if (!url) continue;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) continue;
    result.push({
      label: label || url,
      url,
    });
  }
  return result;
}

export function estimateExpectedReadSeconds(
  content: string,
  summary = "",
  linksCount = 0,
): number {
  const words = `${summary} ${content}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const baseSeconds = Math.round((words / 190) * 60) + linksCount * 6;
  return Math.max(15, Math.min(240, baseSeconds));
}

export function computeComprehensionPercent(params: {
  viewed: boolean;
  viewCount: number;
  totalReadSeconds: number;
  maxScrollPercent: number;
  acknowledged: boolean;
  isCurrentVersionAck: boolean;
  expectedReadSeconds: number;
}): number {
  if (!params.viewed) return 0;
  const expected = Math.max(15, params.expectedReadSeconds);
  const timeRatio = Math.min(1, Math.max(0, params.totalReadSeconds) / expected);
  const timeScore = timeRatio * 40;

  const effectiveScroll = Math.max(
    25,
    Math.min(100, Math.max(0, params.maxScrollPercent)),
  );
  const scrollScore = (effectiveScroll / 100) * 30;

  const ackScore = params.isCurrentVersionAck
    ? 20
    : params.acknowledged
      ? 10
      : 0;

  const viewScore =
    params.viewCount >= 3
      ? 10
      : params.viewCount === 2
        ? 8
        : params.viewCount >= 1
          ? 6
          : 0;

  return Math.min(
    100,
    Math.max(5, Math.round(timeScore + scrollScore + ackScore + viewScore)),
  );
}
