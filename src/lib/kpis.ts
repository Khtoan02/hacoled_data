export const OUTPUT_TYPES = {
  post: { label: "Bài viết", unit: "bài" },
  video: { label: "Video dài", unit: "video" },
  short_video: {
    label: "Video dọc ngắn (Short Video / Story)",
    unit: "video",
  },
  story: { label: "Video dọc ngắn (dữ liệu cũ)", unit: "video" },
  image: { label: "Thiết kế / ảnh", unit: "sản phẩm" },
  livestream: { label: "Livestream", unit: "buổi" },
  other: { label: "Công việc khác", unit: "đơn vị" },
} as const;
export type OutputType = keyof typeof OUTPUT_TYPES;
export const SELECTABLE_OUTPUT_TYPES = Object.entries(OUTPUT_TYPES).filter(
  ([id]) => id !== "story",
) as [Exclude<OutputType, "story">, (typeof OUTPUT_TYPES)[OutputType]][];
export interface Kpi {
  id: string;
  assignee_id: string;
  assignee_name: string;
  channel_id: string;
  channel_name: string;
  month: string;
  output_type: OutputType;
  target: number;
  notes: string;
  active: boolean;
  version: number;
  delivered: number;
  planned: number;
  task_count: number;
  completed_tasks: number;
  zero_quantity_tasks?: number;
  outside_month: number;
}
export function currentMonth() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}
export const validMonth = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-(0[1-9]|1[0-2])$/.test(v) &&
  v >= "2000-01" &&
  v <= "2100-12";
export function monthLabel(value: string) {
  return `${value.slice(5, 7)}/${value.slice(0, 4)}`;
}
export function kpiProgress(k: Pick<Kpi, "delivered" | "target">) {
  return {
    percent: Math.floor((k.delivered / k.target) * 1000) / 10,
    remaining: Math.max(0, k.target - k.delivered),
    excess: Math.max(0, k.delivered - k.target),
  };
}
