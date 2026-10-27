import { OUTPUT_TYPES } from "./kpis";
import { isUuid } from "./social";
import { RequestError } from "./auth/server";
export interface OutputFields {
  kpi_id?: string | null;
  output_type?: string;
  planned_quantity?: number;
  delivered_quantity?: number;
  delivered_on?: string | null;
}
export function outputFields(b: Record<string, unknown>): OutputFields {
  const result: OutputFields = {};
  if ("kpi_id" in b) {
    if (b.kpi_id !== null && !isUuid(b.kpi_id))
      throw new RequestError("KPI không hợp lệ.");
    result.kpi_id = b.kpi_id as string | null;
  }
  if ("output_type" in b) {
    if (
      typeof b.output_type !== "string" ||
      !Object.hasOwn(OUTPUT_TYPES, b.output_type)
    )
      throw new RequestError("Loại sản phẩm không hợp lệ.");
    result.output_type = b.output_type;
  }
  for (const field of ["planned_quantity", "delivered_quantity"] as const) {
    if (field in b) {
      const v = b[field];
      if (
        typeof v !== "number" ||
        !Number.isInteger(v) ||
        v < (field === "planned_quantity" ? 1 : 0) ||
        v > 100000
      )
        throw new RequestError(
          "Khối lượng phải là số nguyên hợp lệ, tối đa 100.000.",
        );
      result[field] = v;
    }
  }
  if ("delivered_on" in b) {
    if (b.delivered_on === null || b.delivered_on === "")
      result.delivered_on = null;
    else {
      const value = b.delivered_on,
        today = new Intl.DateTimeFormat("sv-SE", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value ||
        value > "2100-12-31" ||
        value < "2000-01-01" ||
        value > today
      )
        throw new RequestError(
          "Ngày sản lượng phải hợp lệ và không nằm trong tương lai.",
        );
      result.delivered_on = value;
    }
  }
  return result;
}
