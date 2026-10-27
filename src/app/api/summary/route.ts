import { NextResponse } from "next/server";
import { getMember, apiError, RequestError } from "../../../lib/auth/server";
import { INITIAL_HACOLED_DB } from "../../../lib/store/database";
import { computeAllDecisionMetrics } from "../../../lib/engine/analytics-engine";
import { ROLE_POLICIES } from "../../../lib/security/rbac";
import {
  MODULES_12,
  TASKS_58,
  LOGICAL_TABLES_37,
  METRICS_83,
  EVENTS_20,
  LEAD_RULES_18,
  DASHBOARDS_8,
  QA_TESTS_24,
  DECISIONS_12,
  SOURCES_22,
} from "../../../lib/spec-data";
import { FIELD_DICTIONARY } from "../../../lib/spec-fields";

export async function GET() {
  try {
    if (!await getMember()) throw new RequestError("Vui lòng đăng nhập.", 401);
  } catch (error) { return apiError(error); }
  const computedMetrics = computeAllDecisionMetrics(INITIAL_HACOLED_DB);
  const roleCount = Object.keys(ROLE_POLICIES).length;

  return NextResponse.json({
    system: "HACOLED | MARKETING OS & DECISION INTELLIGENCE",
    version: "1.0",
    specDate: "2026-10-24",
    security: {
      cipher: "AES-256-GCM (PBKDF2-SHA256 100,000 iterations)",
      piiFirewall: "QA17 Active (Zero PII in URL/Analytics)",
      rbacRoles: roleCount,
    },
    operationalMetrics: computedMetrics.map((m) => ({
      code: m.code,
      label: m.label,
      formatted: m.formattedValue,
      status: m.statusBadge ?? "healthy",
      drillDownRowCount: m.drillDownRows.length,
    })),
    counts: {
      modules: MODULES_12.length,
      tasks: TASKS_58.length,
      logicalTables: LOGICAL_TABLES_37.length,
      dataFields: FIELD_DICTIONARY.length,
      metrics: METRICS_83.length,
      events: EVENTS_20.length,
      leadRules: LEAD_RULES_18.length,
      dashboards: DASHBOARDS_8.length,
      roles: roleCount,
      qaTests: QA_TESTS_24.length,
      decisions: DECISIONS_12.length,
      sources: SOURCES_22.length,
    },
  });
}
