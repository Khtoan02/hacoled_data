import { NextResponse } from "next/server";
import {
  MODULES_12,
  TASKS_58,
  LOGICAL_TABLES_37,
  METRICS_83,
  EVENTS_20,
  LEAD_RULES_18,
  DASHBOARDS_8,
  ROLES_8,
  QA_TESTS_24,
  DECISIONS_12,
  SOURCES_22,
} from "../../../lib/spec-data";
import { FIELD_DICTIONARY } from "../../../lib/spec-fields";

export async function GET() {
  return NextResponse.json({
    system: "HACOLED | MARKETING BASE",
    version: "1.0",
    specDate: "2026-10-24",
    notice:
      "Bộ thiết kế & vận hành HacoLED Marketing Base v1.0. Tách biệt dữ liệu giả định/kiểm thử với dữ liệu vận hành thực tế.",
    counts: {
      modules: MODULES_12.length,
      tasks: TASKS_58.length,
      logicalTables: LOGICAL_TABLES_37.length,
      dataFields: FIELD_DICTIONARY.length,
      metrics: METRICS_83.length,
      events: EVENTS_20.length,
      leadRules: LEAD_RULES_18.length,
      dashboards: DASHBOARDS_8.length,
      roles: ROLES_8.length,
      qaTests: QA_TESTS_24.length,
      decisions: DECISIONS_12.length,
      sources: SOURCES_22.length,
    },
  });
}
