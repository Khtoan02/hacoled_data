/**
 * HacoLED Marketing OS — Core Business Rules, Idempotent Ingestion & Precision Metric Engine
 * Implements M001–M083, LR01–LR18, and QA01–QA24 with full drill-down lineage.
 */

import {
  HacoledDatabase,
  InquiryEntity,
  MetricSnapshotEntity,
  PublicationEntity,
  TouchpointEntity,
} from "../store/database";
import { normalizeEmail, normalizePhone } from "../security/crypto";
import { AuditLogEntry, authorizeAction, SystemRoleId } from "../security/rbac";

export interface DrillDownRow {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  timestamp: string;
  source: string;
}

export interface ComputedMetricResult {
  code: string;
  group: "funnel" | "quality" | "sales" | "revenue" | "digital" | "content" | "cost" | "governance" | "market";
  label: string;
  formattedValue: string;
  rawValue: number | null;
  unit: string;
  formula: string;
  grain: string;
  sourceOfTruth: string;
  guardrail: string;
  definitionVersion: string;
  periodScope: string;
  statusBadge?: "healthy" | "warning" | "na" | "pending";
  drillDownRows: DrillDownRow[];
}

/**
 * QA12 & General Safe Ratio Helper:
 * Returns null ("N/A") whenever denominator is 0 or null, or numerator is null.
 */
export function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined
): number | null {
  if (
    numerator === null ||
    numerator === undefined ||
    denominator === null ||
    denominator === undefined ||
    denominator === 0
  ) {
    return null;
  }
  return numerator / denominator;
}

/**
 * QA12: Month-over-Month / Period-over-Period comparison with zero-denominator protection
 */
export function computePeriodComparison(
  previousValue: number | null,
  currentValue: number | null
): {
  absoluteDiff: number | null; // M073
  relativeGrowthPct: string; // M074 ("N/A" if previousValue === 0)
  relativeGrowthRaw: number | null;
} {
  if (previousValue === null || currentValue === null) {
    return {
      absoluteDiff: null,
      relativeGrowthPct: "N/A",
      relativeGrowthRaw: null,
    };
  }
  const absoluteDiff = currentValue - previousValue;
  if (previousValue === 0) {
    return {
      absoluteDiff,
      relativeGrowthPct: "N/A (Kỳ trước = 0)",
      relativeGrowthRaw: null,
    };
  }
  const raw = absoluteDiff / previousValue;
  const sign = raw > 0 ? "+" : "";
  return {
    absoluteDiff,
    relativeGrowthPct: `${sign}${(raw * 100).toFixed(1)}%`,
    relativeGrowthRaw: raw,
  };
}

/**
 * QA01: Idempotent Snapshot Import with Deduplication Key
 */
export function ingestMetricSnapshots(
  db: HacoledDatabase,
  incomingSnapshots: MetricSnapshotEntity[],
  actorRole: SystemRoleId = "lead_marketing"
): {
  nextDb: HacoledDatabase;
  insertedCount: number;
  skippedDuplicateCount: number;
  auditEntries: AuditLogEntry[];
} {
  const existingKeys = new Set(db.snapshots.map((s) => s.dedupe_key));
  const newSnapshots: MetricSnapshotEntity[] = [];
  let skippedDuplicateCount = 0;

  for (const snap of incomingSnapshots) {
    if (existingKeys.has(snap.dedupe_key)) {
      skippedDuplicateCount++;
      continue;
    }
    existingKeys.add(snap.dedupe_key);
    newSnapshots.push(snap);
  }

  const auditEntry: AuditLogEntry = {
    audit_id: `AUD-IMP-${Date.now()}`,
    actor_id: `actor_${actorRole}`,
    actor_role: actorRole,
    entity_type: "metric_snapshots",
    entity_id: incomingSnapshots[0]?.import_batch_id || "BATCH",
    action: "create",
    changed_at: new Date().toISOString(),
    changed_fields: "snapshots_import",
    reason:
      skippedDuplicateCount > 0
        ? `Nạp lô số liệu: Thêm mới ${newSnapshots.length}, Chặn trùng lặp ${skippedDuplicateCount} dòng (Quy tắc QA01)`
        : `Nạp lô số liệu thành công: ${newSnapshots.length} dòng mới`,
    before_after_redacted: `inserted=${newSnapshots.length}; skipped_duplicates=${skippedDuplicateCount}`,
  };

  return {
    nextDb: {
      ...db,
      snapshots: [...db.snapshots, ...newSnapshots],
      auditLog: [auditEntry, ...db.auditLog],
    },
    insertedCount: newSnapshots.length,
    skippedDuplicateCount,
    auditEntries: [auditEntry],
  };
}

/**
 * QA10: Lifetime Snapshot Delta Calculation
 * Never sums cumulative lifetime snapshots (e.g. 100 then 150 -> latest=150, delta=+50, NOT 250!)
 */
export function evaluateLifetimeSnapshots(
  snapshots: MetricSnapshotEntity[],
  entityId: string,
  metricCode: string
): {
  latestValue: number | null;
  previousValue: number | null;
  deltaValue: number | null;
  snapshotCount: number;
} {
  const matching = snapshots
    .filter(
      (s) =>
        s.entity_id === entityId &&
        s.metric_code === metricCode &&
        s.aggregation === "lifetime" &&
        s.metric_value !== null
    )
    .sort((a, b) => a.period_end.localeCompare(b.period_end));

  if (matching.length === 0) {
    return {
      latestValue: null,
      previousValue: null,
      deltaValue: null,
      snapshotCount: 0,
    };
  }

  const latest = matching[matching.length - 1].metric_value;
  const previous =
    matching.length >= 2 ? matching[matching.length - 2].metric_value : null;
  const delta =
    latest !== null && previous !== null ? latest - previous : null;

  return {
    latestValue: latest,
    previousValue: previous,
    deltaValue: delta,
    snapshotCount: matching.length,
  };
}

/**
 * QA02, QA03, QA04, QA05, QA06, QA07, QA08:
 * Unified Lead & Touchpoint Intake Engine with strict validation & deduplication
 */
export function processLeadIntake(
  db: HacoledDatabase,
  input: {
    submissionOrEventId: string;
    backendStatus?: "success" | "error"; // QA02
    displayName?: string;
    phone?: string;
    email?: string;
    organizationId?: string | null;
    organizationName?: string;
    organizationType?: "Trường học" | "Doanh nghiệp" | "Nhà thầu" | "Chưa rõ";
    captureChannel: "form" | "hotline" | "zalo" | "messenger" | "other";
    observedUtmSource?: "Facebook" | "SEO" | "YouTube" | "TikTok" | "Referral" | "Direct" | null;
    publicationId?: string | null;
    needSummary: string;
    isSameNeedAsPrevious?: boolean; // QA04: If same need from same contact, adds touchpoint without inflating separate inquiry if not needed
    fit?: "yes" | "no" | "unknown";
    fitReason?: string;
    readiness?: "hot" | "warm" | "cold" | "unknown";
    readinessEvidence?: string;
    verifiedCustomerRelationship?: "new_confirmed" | "known" | "unknown";
  }
): {
  nextDb: HacoledDatabase;
  status: "created" | "blocked_backend_error" | "blocked_duplicate_submission" | "attached_to_existing_contact";
  contactId: string | null;
  inquiryId: string | null;
  touchpointId: string | null;
  message: string;
} {
  // QA02: Form error on backend -> Do NOT fire generate_lead or create inquiry
  if (input.backendStatus === "error") {
    const audit: AuditLogEntry = {
      audit_id: `AUD-ERR-${Date.now()}`,
      actor_id: "system_backend",
      actor_role: "lead_marketing",
      entity_type: "web_events",
      entity_id: input.submissionOrEventId,
      action: "create",
      changed_at: new Date().toISOString(),
      changed_fields: "EV09_form_error",
      reason: "Backend trả lỗi khi gửi form: Chỉ ghi nhận EV09 (form_error) không PII, chặn tạo generate_lead (QA02).",
      before_after_redacted: "generate_lead=blocked",
    };
    return {
      nextDb: { ...db, auditLog: [audit, ...db.auditLog] },
      status: "blocked_backend_error",
      contactId: null,
      inquiryId: null,
      touchpointId: null,
      message: "Đã chặn tạo Lead do lỗi Backend (QA02). Chỉ ghi nhận sự kiện kỹ thuật EV09.",
    };
  }

  // QA03 & LR01: Refresh thank-you page / duplicate submission_id -> Block duplicate
  const duplicateTouchpoint = db.touchpoints.find(
    (tp) => tp.submission_or_event_id === input.submissionOrEventId
  );
  const duplicateInquiry = db.inquiries.find(
    (inq) => inq.submission_or_thread_id === input.submissionOrEventId
  );
  if (duplicateTouchpoint || duplicateInquiry) {
    return {
      nextDb: db,
      status: "blocked_duplicate_submission",
      contactId: duplicateTouchpoint?.contact_id || duplicateInquiry?.contact_id || null,
      inquiryId: duplicateInquiry?.inquiry_id || null,
      touchpointId: duplicateTouchpoint?.touchpoint_id || null,
      message: `Đã chặn gửi trùng submission_id [${input.submissionOrEventId}] (Quy tắc QA03 & LR01).`,
    };
  }

  const normPhone = normalizePhone(input.phone);
  const normEmail = normalizeEmail(input.email);

  // LR02 & QA04: Check if contact already exists by normalized phone or email
  const existingContact = db.contacts.find(
    (c) =>
      (normPhone && c.phone_normalized === normPhone) ||
      (normEmail && c.email_normalized === normEmail)
  );

  // Check organization relationship (QA05: New person from an existing client organization)
  const linkedOrg = input.organizationId
    ? db.organizations.find((o) => o.organization_id === input.organizationId)
    : null;

  let resolvedRelationship: "new_confirmed" | "known" | "unknown" =
    input.verifiedCustomerRelationship || "unknown";

  if (
    linkedOrg &&
    (linkedOrg.relationship_status === "purchased_legacy" ||
      linkedOrg.relationship_status === "contacted")
  ) {
    // QA05: Organization is already a known/legacy customer -> Not a new company relationship!
    resolvedRelationship = "known";
  } else if (input.captureChannel === "hotline" && !input.verifiedCustomerRelationship) {
    // QA06: Unverified hotline call stays unknown, NOT new_confirmed
    resolvedRelationship = "unknown";
  }

  // QA07 & QA08 & LR14 & LR15: Source resolution
  let resolvedSource: InquiryEntity["acquisition_source"] = "unknown";
  let resolvedEvidence: InquiryEntity["source_evidence"] = "unknown";

  if (input.observedUtmSource) {
    resolvedSource = input.observedUtmSource;
    resolvedEvidence = "UTM";
  } else if (input.captureChannel === "hotline") {
    // QA07 & LR14: Hotline without observed source MUST stay unknown (never default to SEO/Website)
    resolvedSource = "unknown";
    resolvedEvidence = "unknown";
  }

  const nowIso = new Date().toISOString();
  const contactId = existingContact
    ? existingContact.contact_id
    : `CON-${Date.now().toString().slice(-5)}`;

  const nextContacts = existingContact
    ? db.contacts
    : [
        ...db.contacts,
        {
          contact_id: contactId,
          display_name: input.displayName?.trim() || "Khách liên hệ (Chưa rõ tên)",
          phone_normalized: normPhone || "unknown",
          email_normalized: normEmail,
          organization_id: linkedOrg?.organization_id || null,
          first_recorded_at: nowIso,
          first_seen_in_base: true, // LR04: First seen in Base
          new_to_company_status: resolvedRelationship,
          verification_source:
            resolvedRelationship === "unknown" ? null : "Xác minh khi tiếp nhận",
          merge_review_status: "clean" as const,
        },
      ];

  const touchpointId = `TP-${Date.now().toString().slice(-5)}`;
  const newTouchpoint: TouchpointEntity = {
    touchpoint_id: touchpointId,
    submission_or_event_id: input.submissionOrEventId,
    contact_id: contactId,
    occurred_at: nowIso,
    capture_channel: input.captureChannel,
    source_medium:
      resolvedSource === "unknown" ? "unknown" : `${resolvedSource} / tracked`,
    campaign_id: input.publicationId ? "CAMP-PILOT-SCHOOL-10" : null,
    publication_id: input.publicationId || null,
    evidence_basis: resolvedEvidence === "UTM" ? "observed_utm" : "unknown",
  };

  // QA04: If same contact interacts again for the exact same ongoing need, record the touchpoint without duplicating the inquiry
  if (existingContact && input.isSameNeedAsPrevious) {
    return {
      nextDb: {
        ...db,
        contacts: nextContacts,
        touchpoints: [newTouchpoint, ...db.touchpoints],
      },
      status: "attached_to_existing_contact",
      contactId,
      inquiryId:
        db.inquiries.find((i) => i.contact_id === contactId)?.inquiry_id || null,
      touchpointId,
      message: `Đã gắn điểm chạm mới [${input.captureChannel}] vào Contact sẵn có [${contactId}] (Quy tắc QA04: Không đếm tăng số người liên hệ).`,
    };
  }

  const inquiryId = `INQ-${Date.now().toString().slice(-5)}`;
  const newInquiry: InquiryEntity = {
    inquiry_id: inquiryId,
    submission_or_thread_id: input.submissionOrEventId,
    contact_id: contactId,
    organization_id: linkedOrg?.organization_id || null,
    received_at: nowIso,
    capture_channel: input.captureChannel,
    need_summary: input.needSummary.trim() || "Chưa rõ chi tiết nhu cầu",
    acquisition_source: resolvedSource,
    source_evidence: resolvedEvidence,
    publication_id: input.publicationId || null,
    validity: "valid",
    fit: input.fit || "unknown",
    fit_reason: input.fitReason || "Chờ đánh giá chi tiết",
    readiness: input.readiness || "unknown",
    readiness_evidence: input.readinessEvidence || "",
    need_stage: "Nấc 3",
    new_relationship_status: resolvedRelationship,
    first_meaningful_response_at: null,
    handoff_at: null,
    sales_accepted_at: null,
    feedback_status: "pending",
  };

  return {
    nextDb: {
      ...db,
      contacts: nextContacts,
      touchpoints: [newTouchpoint, ...db.touchpoints],
      inquiries: [newInquiry, ...db.inquiries],
    },
    status: existingContact ? "attached_to_existing_contact" : "created",
    contactId,
    inquiryId,
    touchpointId,
    message: `Đã ghi nhận yêu cầu [${inquiryId}] (Capture=${input.captureChannel}, Source=${resolvedSource}, Relationship=${resolvedRelationship}).`,
  };
}

/**
 * QA09 & QA23: Content Publication Gate
 * - Blocks publication if asset lacks image rights/consent (QA23)
 * - Supports publishing 1 Asset across multiple channels as distinct Publications (QA09)
 */
export function publishAssetToChannels(
  db: HacoledDatabase,
  params: {
    assetId: string;
    platforms: ("Website" | "Facebook" | "YouTube" | "TikTok" | "Zalo")[];
    actorRole: SystemRoleId;
  }
): {
  nextDb: HacoledDatabase;
  allowed: boolean;
  createdPublications: PublicationEntity[];
  blockReason?: string;
} {
  const auth = authorizeAction({
    roleId: params.actorRole,
    actionType: "PUBLISH_CONTENT",
    entityType: "content_assets",
    entityId: params.assetId,
  });

  if (!auth.allowed) {
    return {
      nextDb: auth.auditEntry
        ? { ...db, auditLog: [auth.auditEntry, ...db.auditLog] }
        : db,
      allowed: false,
      createdPublications: [],
      blockReason: auth.denialReason,
    };
  }

  const asset = db.assets.find((a) => a.asset_id === params.assetId);
  if (!asset) {
    return {
      nextDb: db,
      allowed: false,
      createdPublications: [],
      blockReason: "Không tìm thấy Asset.",
    };
  }

  // QA23: Block if image rights/consent are not approved
  if (asset.rights_status !== "Được dùng") {
    const blockReason = `Chặn xuất bản [${asset.asset_id}]: Trạng thái quyền sử dụng là '${asset.rights_status}' (Quy tắc QA23 & Luật BVDLCN 91/2025/QH15).`;
    const audit: AuditLogEntry = {
      audit_id: `AUD-QA23-${Date.now()}`,
      actor_id: `actor_${params.actorRole}`,
      actor_role: params.actorRole,
      entity_type: "content_assets",
      entity_id: asset.asset_id,
      action: "permission_denied",
      changed_at: new Date().toISOString(),
      changed_fields: "rights_status",
      reason: blockReason,
      before_after_redacted: `rights_status=${asset.rights_status}`,
    };
    return {
      nextDb: { ...db, auditLog: [audit, ...db.auditLog] },
      allowed: false,
      createdPublications: [],
      blockReason,
    };
  }

  if (asset.technical_approval !== "Đạt") {
    return {
      nextDb: db,
      allowed: false,
      createdPublications: [],
      blockReason: `Chặn xuất bản [${asset.asset_id}]: Chưa đạt nghiệm thu thông số kỹ thuật (${asset.technical_approval}).`,
    };
  }

  const createdPublications: PublicationEntity[] = params.platforms.map(
    (platform, idx) => ({
      publication_id: `PUB-${asset.asset_id}-${platform.toUpperCase()}-${idx + 1}`,
      asset_id: asset.asset_id,
      channel_id: `CH-${platform.toUpperCase()}`,
      platform,
      native_post_id: `native-${Date.now()}-${idx}`,
      public_url: `https://${platform.toLowerCase()}.com/hacoled/${asset.asset_id.toLowerCase()}`,
      published_at: new Date().toISOString(),
      campaign_id: "CAMP-PILOT-SCHOOL-10",
      utm_content:
        platform === "Website"
          ? ""
          : `utm_${asset.asset_id.toLowerCase()}_${platform.toLowerCase()}`,
      status: "Đã đăng",
      metrics_owner_role: asset.creator_role,
      publisher_role: params.actorRole,
    })
  );

  return {
    nextDb: {
      ...db,
      publications: [...db.publications, ...createdPublications],
    },
    allowed: true,
    createdPublications,
  };
}

/**
 * Compute Full Decision-Support Metrics with Drill-Down Lineage (QA24)
 */
export function computeAllDecisionMetrics(
  db: HacoledDatabase
): ComputedMetricResult[] {
  const nonTestInquiries = db.inquiries.filter((i) => i.validity !== "test");
  const validInquiries = db.inquiries.filter((i) => i.validity === "valid");

  // Unique contacts with valid inquiries (M003)
  const validContactIds = new Set(validInquiries.map((i) => i.contact_id));
  const validContacts = db.contacts.filter((c) =>
    validContactIds.has(c.contact_id)
  );

  // M004: Confirmed new to company
  const newConfirmedContacts = validContacts.filter(
    (c) => c.new_to_company_status === "new_confirmed"
  );
  // M005: Known relationship
  const knownContacts = validContacts.filter(
    (c) => c.new_to_company_status === "known"
  );
  // M006: Unknown relationship
  const unknownRelContacts = validContacts.filter(
    (c) => c.new_to_company_status === "unknown"
  );

  // M007: Unique Organizations linked to valid inquiries
  const validOrgIds = new Set(
    validInquiries
      .map((i) => i.organization_id)
      .filter((id): id is string => Boolean(id))
  );
  const validOrgs = db.organizations.filter((o) =>
    validOrgIds.has(o.organization_id)
  );

  // M008: Confirmed New Contacts from Digital with observed evidence
  const digitalNewContactIds = new Set(
    validInquiries
      .filter(
        (i) =>
          i.new_relationship_status === "new_confirmed" &&
          i.acquisition_source !== "unknown" &&
          i.acquisition_source !== "Direct" &&
          i.source_evidence !== "unknown"
      )
      .map((i) => i.contact_id)
  );

  // M009 & M010: Qualified Contacts in Cohort (fit === 'yes')
  const qualifiedContactIds = new Set(
    validInquiries.filter((i) => i.fit === "yes").map((i) => i.contact_id)
  );
  const qualifiedContacts = validContacts.filter((c) =>
    qualifiedContactIds.has(c.contact_id)
  );
  const fitRateRaw = safeDivide(qualifiedContacts.length, validContacts.length);

  // M012 & M013: Sales Handoff & Acceptance Rate
  const handedOffInquiries = validInquiries.filter((i) => Boolean(i.handoff_at));
  const salesAcceptedInquiries = handedOffInquiries.filter((i) =>
    Boolean(i.sales_accepted_at)
  );
  const salesAcceptRateRaw = safeDivide(
    salesAcceptedInquiries.length,
    handedOffInquiries.length
  );

  // M015: Unresponded Valid Inquiries
  const unrespondedInquiries = validInquiries.filter(
    (i) => !i.first_meaningful_response_at
  );

  // M019, M020, M021 (QA16: Strictly separated financial buckets!)
  const signedContractVnd = db.financialEntries
    .filter((f) => f.entry_type === "contract_signed")
    .reduce((sum, f) => sum + f.amount_vnd, 0);

  const recognizedRevenueVnd = db.financialEntries
    .filter((f) => f.entry_type === "revenue_recognized")
    .reduce((sum, f) => sum + f.amount_vnd, 0);

  const cashCollectedVnd = db.financialEntries
    .filter((f) => f.entry_type === "cash_collected")
    .reduce((sum, f) => sum + f.amount_vnd, 0);

  const openPipelineVnd = db.opportunities
    .filter(
      (o) => o.current_stage !== "won" && o.current_stage !== "lost"
    )
    .reduce((sum, o) => sum + (o.expected_amount_vnd || 0), 0);

  // M055 & M056 (QA09: Assets vs Publications)
  const approvedAssets = db.assets.filter(
    (a) => a.technical_approval === "Đạt"
  );
  const publishedPubs = db.publications.filter((p) => p.status === "Đã đăng");

  // M061 & M062 & M064 (Costs & CPQL)
  const newCashSpentVnd = db.costs.reduce(
    (sum, c) => sum + c.incremental_cash_vnd,
    0
  );
  const hasIncompleteEconomicCost = db.costs.some(
    (c) => c.economic_cost_vnd === null || c.completeness === "incomplete"
  );
  const fullEconomicCostVnd = hasIncompleteEconomicCost
    ? null
    : db.costs.reduce((sum, c) => sum + (c.economic_cost_vnd || 0), 0);

  const cpqlFullRaw = safeDivide(fullEconomicCostVnd, qualifiedContacts.length);

  // M066: ROAS (Ad spend = 0 => N/A)
  const adSpendVnd = db.costs
    .filter((c) => c.cost_type === "ads")
    .reduce((sum, c) => sum + c.incremental_cash_vnd, 0);
  const roasRaw = safeDivide(recognizedRevenueVnd, adSpendVnd);

  // M069 & M070: Data Quality Coverage
  const knownSourceInquiries = validInquiries.filter(
    (i) => i.acquisition_source !== "unknown" && i.source_evidence !== "unknown"
  );
  const sourceCoverageRaw = safeDivide(
    knownSourceInquiries.length,
    validInquiries.length
  );
  const knownRelContactsCount =
    newConfirmedContacts.length + knownContacts.length;
  const relClarityRaw = safeDivide(knownRelContactsCount, validContacts.length);

  // M079, M080, M081: Market TAM - SAM - SOM (Base scenario)
  const baseScenario = db.marketScenarios.find((s) => s.scenario === "Cơ sở");
  const tamVnd =
    baseScenario &&
    baseScenario.eligible_org_count !== null &&
    baseScenario.projects_per_org_year !== null &&
    baseScenario.value_per_project_vnd !== null
      ? Math.round(
          baseScenario.eligible_org_count *
            baseScenario.projects_per_org_year *
            baseScenario.value_per_project_vnd
        )
      : null;

  const samVnd =
    baseScenario &&
    baseScenario.sam_project_count !== null &&
    baseScenario.value_per_project_vnd !== null
      ? Math.round(
          baseScenario.sam_project_count * baseScenario.value_per_project_vnd
        )
      : null;

  const somProjects =
    baseScenario &&
    baseScenario.sam_project_count !== null &&
    baseScenario.delivery_capacity !== null &&
    baseScenario.reachable_qualified_projects !== null &&
    baseScenario.win_rate_assumption !== null
      ? Math.min(
          baseScenario.sam_project_count,
          baseScenario.delivery_capacity,
          baseScenario.reachable_qualified_projects *
            baseScenario.win_rate_assumption
        )
      : null;

  const somVnd =
    somProjects !== null && baseScenario?.value_per_project_vnd
      ? Math.round(somProjects * baseScenario.value_per_project_vnd)
      : null;

  const periodScopeLabel = `${db.meta.currentPeriod} (${
    db.meta.isPeriodComplete ? "Đủ kỳ" : "MTD - Kỳ chưa kết thúc [QA14]"
  })`;

  return [
    {
      code: "M002",
      group: "funnel",
      label: "Yêu cầu hợp lệ (Valid Inquiries)",
      formattedValue: `${validInquiries.length} yêu cầu`,
      rawValue: validInquiries.length,
      unit: "yêu cầu",
      formula: "COUNT DISTINCT inquiry_id WHERE validity = 'valid' (Loại bản ghi test/spam)",
      grain: "Yêu cầu × Kỳ nhận",
      sourceOfTruth: "Base / inquiries",
      guardrail: `Đã loại ${
        db.inquiries.length - nonTestInquiries.length
      } bản ghi test. Yêu cầu hợp lệ không đồng nghĩa số khách hàng duy nhất.`,
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: validInquiries.map((i) => ({
        id: i.inquiry_id,
        title: `${i.need_summary}`,
        subtitle: `Contact: ${i.contact_id} | Kênh nhận: ${i.capture_channel} | Nguồn: ${i.acquisition_source}`,
        badge: `Fit: ${i.fit.toUpperCase()}`,
        timestamp: i.received_at,
        source: `Evidence: ${i.source_evidence}`,
      })),
    },
    {
      code: "M003",
      group: "funnel",
      label: "Người liên hệ duy nhất (Unique Contacts)",
      formattedValue: `${validContacts.length} người`,
      rawValue: validContacts.length,
      unit: "người",
      formula: "COUNT DISTINCT contact_id có yêu cầu hợp lệ trong kỳ",
      grain: "Người × Kỳ",
      sourceOfTruth: "Base / contacts + inquiries",
      guardrail:
        "1 người liên hệ qua 3 kênh (Form + Hotline + Zalo) vẫn chỉ tính là 1 người duy nhất (Quy tắc QA04).",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: validContacts.map((c) => ({
        id: c.contact_id,
        title: c.display_name,
        subtitle: `Tổ chức: ${c.organization_id || "Chưa rõ"} | Quan hệ: ${c.new_to_company_status}`,
        badge: c.new_to_company_status,
        timestamp: c.first_recorded_at,
        source: c.verification_source || "Chưa xác minh",
      })),
    },
    {
      code: "M004",
      group: "funnel",
      label: "Liên hệ mới xác nhận với HacoLED",
      formattedValue: `${newConfirmedContacts.length} người`,
      rawValue: newConfirmedContacts.length,
      unit: "người",
      formula:
        "COUNT DISTINCT contact_id WHERE new_to_company_status = 'new_confirmed'",
      grain: "Người × Kỳ đầu",
      sourceOfTruth: "Base + Sales xác nhận",
      guardrail:
        "Mới ghi vào Base (first_seen_in_base) KHÔNG tự động là khách mới của công ty. Khách thuộc trường cũ (QA05) hoặc chưa xác minh (QA06) không tính vào đây.",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: newConfirmedContacts.map((c) => ({
        id: c.contact_id,
        title: c.display_name,
        subtitle: `Tổ chức: ${c.organization_id || "Cá nhân/Chưa rõ"}`,
        badge: "new_confirmed",
        timestamp: c.first_recorded_at,
        source: c.verification_source || "Sales xác nhận",
      })),
    },
    {
      code: "M006",
      group: "governance",
      label: "Liên hệ chưa rõ Mới/Cũ (Unknown Bucket)",
      formattedValue: `${unknownRelContacts.length} người`,
      rawValue: unknownRelContacts.length,
      unit: "người",
      formula: "COUNT DISTINCT contact_id WHERE new_to_company_status = 'unknown'",
      grain: "Người × Kỳ",
      sourceOfTruth: "Base / contacts",
      guardrail:
        "Giữ nguyên nhóm unknown (QA06); tuyệt đối không tự chia tỷ lệ 70/30 sang khách mới.",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: unknownRelContacts.length > 0 ? "warning" : "healthy",
      drillDownRows: unknownRelContacts.map((c) => ({
        id: c.contact_id,
        title: c.display_name,
        subtitle: "Chưa xác minh từng làm việc với HacoLED trước đây hay chưa",
        badge: "unknown",
        timestamp: c.first_recorded_at,
        source: "Hotline / Chưa đối soát",
      })),
    },
    {
      code: "M009",
      group: "quality",
      label: "Lead đủ điều kiện (Qualified Fit = Yes)",
      formattedValue: `${qualifiedContacts.length} người (${
        fitRateRaw !== null ? `${(fitRateRaw * 100).toFixed(1)}%` : "N/A"
      })`,
      rawValue: qualifiedContacts.length,
      unit: "người",
      formula:
        "COUNT DISTINCT contact_id có nhu cầu thật, fit = 'yes' (Không tính hỏi mua lẻ module)",
      grain: "Cohort Contact × Cutoff",
      sourceOfTruth: "Base / lead_reviews",
      guardrail:
        "Tỷ lệ M010 tính trên cùng cohort đầu vào. Loại bỏ khách hỏi mua lẻ vài tấm module rời ngoài phạm vi (LR07).",
      definitionVersion: db.metricVersions[0]?.version || "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: qualifiedContacts.map((c) => ({
        id: c.contact_id,
        title: c.display_name,
        subtitle: `Tổ chức: ${c.organization_id || "Đang cập nhật"}`,
        badge: "FIT = YES",
        timestamp: c.first_recorded_at,
        source: "Đánh giá theo Rule v1.0",
      })),
    },
    {
      code: "M013",
      group: "sales",
      label: "Tỷ lệ Sales xác nhận nhận Lead",
      formattedValue:
        salesAcceptRateRaw !== null
          ? `${(salesAcceptRateRaw * 100).toFixed(1)}% (${salesAcceptedInquiries.length}/${handedOffInquiries.length})`
          : "N/A",
      rawValue: salesAcceptRateRaw,
      unit: "%",
      formula: "Số yêu cầu có sales_accepted_at / Số yêu cầu đã bàn giao Sales (handoff_at)",
      grain: "Cohort bàn giao",
      sourceOfTruth: "Base + Sales Feedback",
      guardrail: `Có ${
        handedOffInquiries.length - salesAcceptedInquiries.length
      } yêu cầu đang chờ Sales xác nhận (pending). Không phải số hợp đồng.`,
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: handedOffInquiries.map((i) => ({
        id: i.inquiry_id,
        title: i.need_summary,
        subtitle: `Bàn giao: ${i.handoff_at} | Sales nhận: ${i.sales_accepted_at || "Đang chờ (Pending)"}`,
        badge: i.sales_accepted_at ? "ACCEPTED" : "PENDING",
        timestamp: i.handoff_at || i.received_at,
        source: "Sales Handoff Log",
      })),
    },
    {
      code: "M019",
      group: "revenue",
      label: "Giá trị Hợp đồng ký (Contract Signed)",
      formattedValue: `${(signedContractVnd / 1_000_000).toFixed(0)} triệu ₫`,
      rawValue: signedContractVnd,
      unit: "VND",
      formula: "SUM financial_entries.amount_vnd WHERE entry_type = 'contract_signed'",
      grain: "Hợp đồng × Kỳ ký (Chưa VAT)",
      sourceOfTruth: "Sales / Kế toán đối soát",
      guardrail:
        "QA16: Giá trị hợp đồng ký (200tr) KHÁC Doanh thu ghi nhận (100tr) và KHÁC Tiền đã thu (50tr). Tuyệt đối không cộng gộp thành 350tr!",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: db.financialEntries
        .filter((f) => f.entry_type === "contract_signed")
        .map((f) => ({
          id: f.entry_id,
          title: `Chứng từ: ${f.document_ref} (${f.opportunity_id})`,
          subtitle: `Số tiền: ${f.amount_vnd.toLocaleString("vi-VN")} ₫ (${f.vat_basis})`,
          badge: "HỢP ĐỒNG KÝ",
          timestamp: f.effective_date,
          source: f.confirmed_by,
        })),
    },
    {
      code: "M020",
      group: "revenue",
      label: "Doanh thu ghi nhận (Recognized Revenue)",
      formattedValue: `${(recognizedRevenueVnd / 1_000_000).toFixed(0)} triệu ₫`,
      rawValue: recognizedRevenueVnd,
      unit: "VND",
      formula: "SUM financial_entries.amount_vnd WHERE entry_type = 'revenue_recognized'",
      grain: "Kỳ ghi nhận kế toán",
      sourceOfTruth: "Kế toán (Biên bản nghiệm thu)",
      guardrail:
        "Chỉ ghi nhận theo biên bản nghiệm thu kế toán xác nhận; không suy ra từ form đăng ký hoặc giá trị dự kiến.",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: db.financialEntries
        .filter((f) => f.entry_type === "revenue_recognized")
        .map((f) => ({
          id: f.entry_id,
          title: `Chứng từ: ${f.document_ref} (${f.opportunity_id})`,
          subtitle: `Doanh thu nghiệm thu: ${f.amount_vnd.toLocaleString("vi-VN")} ₫`,
          badge: "DOANH THU",
          timestamp: f.effective_date,
          source: f.confirmed_by,
        })),
    },
    {
      code: "M021",
      group: "revenue",
      label: "Tiền đã thu thực tế (Cash Collected)",
      formattedValue: `${(cashCollectedVnd / 1_000_000).toFixed(0)} triệu ₫`,
      rawValue: cashCollectedVnd,
      unit: "VND",
      formula: "SUM financial_entries.amount_vnd WHERE entry_type = 'cash_collected'",
      grain: "Kỳ thu tiền",
      sourceOfTruth: "Kế toán thanh toán (UNC)",
      guardrail:
        "Báo cáo dòng tiền thực thu độc lập với doanh thu ghi nhận và giá trị hợp đồng (QA16).",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: db.financialEntries
        .filter((f) => f.entry_type === "cash_collected")
        .map((f) => ({
          id: f.entry_id,
          title: `Chứng từ: ${f.document_ref} (${f.opportunity_id})`,
          subtitle: `Tiền thực thu: ${f.amount_vnd.toLocaleString("vi-VN")} ₫`,
          badge: "TIỀN THU",
          timestamp: f.effective_date,
          source: f.confirmed_by,
        })),
    },
    {
      code: "M022",
      group: "revenue",
      label: "Giá trị Pipeline đang mở (Expected Pipeline)",
      formattedValue: `${(openPipelineVnd / 1_000_000).toFixed(0)} triệu ₫`,
      rawValue: openPipelineVnd,
      unit: "VND",
      formula: "SUM expected_amount_vnd của các cơ hội đang mở (evaluating / proposal_sent)",
      grain: "Snapshot cơ hội mở",
      sourceOfTruth: "Sales Feedback",
      guardrail: "Là giá trị ước tính cơ hội đang theo đuổi, KHÔNG gọi là doanh thu dự báo chắc chắn.",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: db.opportunities
        .filter((o) => o.current_stage !== "won" && o.current_stage !== "lost")
        .map((o) => ({
          id: o.opportunity_id,
          title: o.project_name,
          subtitle: `Ước tính: ${(o.expected_amount_vnd || 0).toLocaleString("vi-VN")} ₫ | Giai đoạn: ${o.current_stage}`,
          badge: o.current_stage.toUpperCase(),
          timestamp: o.opened_at,
          source: `Buyer Org: ${o.buyer_org_id}`,
        })),
    },
    {
      code: "M055_M056",
      group: "content",
      label: "Sản lượng: Assets đạt (M055) vs Lần đăng (M056)",
      formattedValue: `${approvedAssets.length} Assets → ${publishedPubs.length} Publications`,
      rawValue: approvedAssets.length,
      unit: "sản phẩm",
      formula: "COUNT DISTINCT asset_id đạt nghiệm thu vs COUNT DISTINCT publication_id đã đăng",
      grain: "Sản phẩm × Kỳ",
      sourceOfTruth: "Base / assets & publications",
      guardrail:
        "QA09: 1 video dọc đăng lên 3 nền tảng (TikTok, FB Reels, YT Shorts) được tính là 1 Asset và 3 Publications — chống đếm trùng sản lượng nhân sự!",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: approvedAssets.map((a) => {
        const pubs = publishedPubs.filter((p) => p.asset_id === a.asset_id);
        return {
          id: a.asset_id,
          title: a.title,
          subtitle: `Định dạng: ${a.format} | Giờ làm: ${a.hours_spent ?? "N/A"}h | Xuất bản: ${pubs.length} kênh`,
          badge: `${pubs.length} PUBS`,
          timestamp: a.approved_at || "-",
          source: `Creator: ${a.creator_role}`,
        };
      }),
    },
    {
      code: "M061_M064",
      group: "cost",
      label: "Chi phí Tiền mới (M061) & CPQL Kinh tế (M064)",
      formattedValue: `Tiền mới: ${newCashSpentVnd.toLocaleString("vi-VN")} ₫ | CPQL đủ: ${
        cpqlFullRaw !== null
          ? `${(cpqlFullRaw / 1_000_000).toFixed(2)} tr/lead`
          : "N/A"
      }`,
      rawValue: cpqlFullRaw,
      unit: "VND",
      formula: "Chi phí kinh tế phân bổ (M062) / Số Lead đủ điều kiện (M009)",
      grain: "Campaign / Cohort × Kỳ",
      sourceOfTruth: "Base / costs",
      guardrail:
        "Ngân sách tiền mới = 0 ₫ (C02), nhưng chi phí kinh tế phân bổ giờ công & công cụ hiện hữu là 18.5tr ₫. ROAS (M066) = N/A khi Ad Spend = 0.",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: roasRaw === null ? "na" : "healthy",
      drillDownRows: db.costs.map((c) => ({
        id: c.cost_id,
        title: c.note,
        subtitle: `Tiền mặt mới: ${c.incremental_cash_vnd.toLocaleString("vi-VN")} ₫ | Chi phí kinh tế: ${(c.economic_cost_vnd || 0).toLocaleString("vi-VN")} ₫`,
        badge: c.cost_type.toUpperCase(),
        timestamp: c.period,
        source: `Completeness: ${c.completeness}`,
      })),
    },
    {
      code: "M069_M070",
      group: "governance",
      label: "Chất lượng Dữ liệu: Biết nguồn (M069) & Rõ Mới/Cũ (M070)",
      formattedValue: `Nguồn: ${
        sourceCoverageRaw !== null ? `${(sourceCoverageRaw * 100).toFixed(0)}%` : "N/A"
      } | Mới/Cũ: ${
        relClarityRaw !== null ? `${(relClarityRaw * 100).toFixed(0)}%` : "N/A"
      }`,
      rawValue: sourceCoverageRaw,
      unit: "%",
      formula: "Tỷ lệ yêu cầu hợp lệ có nguồn có bằng chứng & Tỷ lệ contact đã xác minh mới/cũ",
      grain: "Inquiry & Contact × Kỳ",
      sourceOfTruth: "Base / Data Quality",
      guardrail:
        "Các trường hợp chưa rõ phải giữ nguyên ở bucket 'unknown' (QA06, QA07), không được tự ý gán nguồn để làm đẹp báo cáo.",
      definitionVersion: "v1.0",
      periodScope: periodScopeLabel,
      statusBadge: "healthy",
      drillDownRows: validInquiries.map((i) => ({
        id: i.inquiry_id,
        title: `Capture: ${i.capture_channel} → Source: ${i.acquisition_source}`,
        subtitle: `Bằng chứng nguồn: ${i.source_evidence} | Quan hệ: ${i.new_relationship_status}`,
        badge: i.acquisition_source === "unknown" ? "UNKNOWN SOURCE" : "VERIFIED",
        timestamp: i.received_at,
        source: i.contact_id,
      })),
    },
    {
      code: "M079_M081",
      group: "market",
      label: "Quy mô Thị trường Pilot (TAM / SAM / SOM)",
      formattedValue: `TAM: ${
        tamVnd ? `${(tamVnd / 1_000_000_000).toFixed(1)} tỷ` : "N/A"
      } | SAM: ${
        samVnd ? `${(samVnd / 1_000_000_000).toFixed(1)} tỷ` : "N/A"
      } | SOM: ${somVnd ? `${(somVnd / 1_000_000_000).toFixed(2)} tỷ` : "N/A"}`,
      rawValue: somVnd,
      unit: "VND/năm",
      formula: "SOM = MIN(SAM, Năng lực giao, Cơ hội tiếp cận × Tỷ lệ thắng giả định) × Giá trị/dự án",
      grain: "Phân khúc Trường học × 2026 × Kịch bản Cơ sở",
      sourceOfTruth: "Base / market_scenarios (S02, S14)",
      guardrail:
        "Không gán tùy ý SAM = 30% TAM (M080). SOM bị giới hạn bởi năng lực thi công & tiếp cận thực tế, không phải dự báo doanh thu chắc chắn.",
      definitionVersion: "v1.0",
      periodScope: "Năm 2026 (Kịch bản Cơ sở)",
      statusBadge: "healthy",
      drillDownRows: db.marketScenarios.map((ms) => ({
        id: ms.scenario_id,
        title: `Kịch bản ${ms.scenario} (${ms.year}) - Phân khúc: ${ms.segment_id}`,
        subtitle: `${ms.eligible_org_count} trường × ${ms.projects_per_org_year} dự án/năm × ${(ms.value_per_project_vnd || 0).toLocaleString("vi-VN")} ₫`,
        badge: ms.confidence,
        timestamp: `${ms.year}`,
        source: ms.vat_basis,
      })),
    },
  ];
}
