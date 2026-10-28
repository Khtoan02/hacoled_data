"use client";

import { canViewWorkspaceItem } from "../../lib/workspace-access";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { OperationalOverview } from "../../components/dashboard/overview";
import { DashboardShell } from "../../components/dashboard/shell";
import { useMember } from "../../components/dashboard/session";
import { CalendarDays, Info } from "lucide-react";
import {
  INITIAL_HACOLED_DB,
  HacoledDatabase,
  InquiryEntity,
  FinancialEntryEntity,
} from "../../lib/store/database";
import {
  computeAllDecisionMetrics,
  computePeriodComparison,
  ComputedMetricResult,
  evaluateLifetimeSnapshots,
  ingestMetricSnapshots,
  processLeadIntake,
  publishAssetToChannels,
} from "../../lib/engine/analytics-engine";
import {
  buildSafePublicationUrl,
  decryptVaultData,
  encryptVaultData,
  sanitizeAnalyticsPayload,
} from "../../lib/security/crypto";
import {
  authorizeAction,
  maskContactName,
  maskEmail,
  maskPhone,
  ROLE_POLICIES,
  SystemRoleId,
} from "../../lib/security/rbac";
import {
  AutomatedTestResult,
  runFullAutomatedTestSuite,
} from "../../lib/tests/qa-suite";
import {
  Badge,
  CssMeterBar,
  InfoTooltip,
  StatusDot,
} from "../../components/ui/shadcn";

type WorkspaceTab =
  | "executive"
  | "crm_pipeline"
  | "strategy_lab"
  | "content_channels"
  | "team_cost"
  | "security_qa"
  | "team_survey";

export default function HacoledMarketingOS() {
  const member = useMember();
  // Core Database State
  const [db, setDb] = useState<HacoledDatabase>(INITIAL_HACOLED_DB);
  const [isHydrated, setIsHydrated] = useState(false);

  // Active Workspace & Active Role (RBAC)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("executive");
  const activeRole = member.role;

  // System Notification Toast (Minimalist banner)
  const [notice, setNotice] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const notify = useCallback(
    (type: "success" | "warning" | "error", text: string) => {
      setNotice({ type, text });
    },
    []
  );

  // Drill-down Inspector State (QA24)
  const [selectedMetric, setSelectedMetric] =
    useState<ComputedMetricResult | null>(null);

  // CRM Filters & Intake Form State
  const [crmFilterFit, setCrmFilterFit] = useState<string>("ALL");
  const [crmFilterSource, setCrmFilterSource] = useState<string>("ALL");
  const [intakeForm, setIntakeForm] = useState({
    submissionId: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
    backendStatus: "success" as "success" | "error",
    displayName: "",
    phone: "",
    email: "",
    organizationId: "",
    captureChannel: "hotline" as InquiryEntity["capture_channel"],
    observedUtmSource: "" as "" | "Facebook" | "SEO" | "YouTube" | "TikTok" | "Referral",
    publicationId: "",
    needSummary: "",
    isSameNeedAsPrevious: false,
    fit: "unknown" as InquiryEntity["fit"],
    readiness: "unknown" as InquiryEntity["readiness"],
    verifiedCustomerRelationship: "" as "" | "new_confirmed" | "known" | "unknown",
  });

  // Financial Entry Form State (QA16)
  const [finForm, setFinForm] = useState({
    documentRef: `CT-${Math.floor(100 + Math.random() * 899)}`,
    opportunityId: "OPP-01",
    entryType: "contract_signed" as FinancialEntryEntity["entry_type"],
    amountVnd: 245000000,
    vatBasis: "Chưa VAT" as FinancialEntryEntity["vat_basis"],
  });

  // UTM & PII Firewall Sandbox State (B08-02 & QA17)
  const [utmBuilder, setUtmBuilder] = useState({
    targetUrl: "https://hacoled.com/man-hinh-led-hoi-truong-truong-hoc",
    isInternalNavigation: false,
    utmSource: "facebook",
    utmMedium: "social",
    utmCampaign: "CAMP-PILOT-SCHOOL-10",
    utmContent: "pub_02_fb_checklist",
  });

  // MoM Calculator State (QA12 & M073-M075)
  const [momPrev, setMomPrev] = useState<string>("0");
  const [momCurr, setMomCurr] = useState<string>("3");

  // AES-256-GCM Security Vault State (QA21 & INT02)
  const [vaultPassphrase, setVaultPassphrase] = useState<string>("HacoLED#2026!Gold");
  const [encryptedEnvelope, setEncryptedEnvelope] = useState<string>("");
  const [vaultChecksum, setVaultChecksum] = useState<string>("");
  const [vaultEncryptedAt, setVaultEncryptedAt] = useState<string>("");

  // Automated QA Suite State
  const [qaReport, setQaReport] = useState<{
    totalTests: number;
    passedCount: number;
    failedCount: number;
    executedAt: string;
    results: AutomatedTestResult[];
  } | null>(null);
  const [isRunningQa, setIsRunningQa] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hacoled_os_db_v1");
      if (saved) {
        setDb(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load DB from localStorage", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("hacoled_os_db_v1", JSON.stringify(db));
    } catch (e) {
      console.error("Failed to persist DB", e);
    }
  }, [db, isHydrated]);

  // Run QA suite automatically on initial load so status badge is live
  useEffect(() => {
    runFullAutomatedTestSuite().then(setQaReport);
  }, []);

  // Computed Executive & Operational Metrics
  const decisionMetrics = useMemo(() => computeAllDecisionMetrics(db), [db]);

  // Observed Funnel Stages for Executive View
  const funnelStages = useMemo(() => {
    const gscImpr =
      db.snapshots.find((s) => s.metric_code === "M026")?.metric_value || 0;
    const ga4Sessions =
      db.snapshots.find((s) => s.metric_code === "M032")?.metric_value || 0;
    const validInq = db.inquiries.filter((i) => i.validity === "valid").length;
    const uniqueCon = new Set(
      db.inquiries.filter((i) => i.validity === "valid").map((i) => i.contact_id)
    ).size;
    const fitYesCon = new Set(
      db.inquiries
        .filter((i) => i.validity === "valid" && i.fit === "yes")
        .map((i) => i.contact_id)
    ).size;
    const salesAcc = db.inquiries.filter(
      (i) => i.validity === "valid" && Boolean(i.sales_accepted_at)
    ).length;
    const wonOpps = db.opportunities.filter(
      (o) => o.current_stage === "won"
    ).length;

    return [
      {
        code: "M026",
        stage: "1. Hiển thị Tìm kiếm (GSC Impressions)",
        count: gscImpr,
        unit: "lượt",
        note: "Nấc 1–2: Tiếp cận nhu cầu",
      },
      {
        code: "M032",
        stage: "2. Phiên truy cập Website (GA4 Sessions)",
        count: ga4Sessions,
        unit: "phiên",
        note: "Đo theo scope phiên",
      },
      {
        code: "M002",
        stage: "3. Yêu cầu hợp lệ (Valid Inquiries)",
        count: validInq,
        unit: "yêu cầu",
        note: "Đã lọc bỏ bản ghi test/spam",
      },
      {
        code: "M003",
        stage: "4. Người liên hệ duy nhất (Unique Contacts)",
        count: uniqueCon,
        unit: "người",
        note: "Chống đếm trùng đa kênh (QA04)",
      },
      {
        code: "M009",
        stage: "5. Đúng tệp giải pháp (Qualified Fit=Yes)",
        count: fitYesCon,
        unit: "người",
        note: "Loại hỏi mua lẻ module (LR07)",
      },
      {
        code: "M013",
        stage: "6. Sales xác nhận tiếp nhận xử lý",
        count: salesAcc,
        unit: "yêu cầu",
        note: "Đã phản hồi & nhận bàn giao",
      },
      {
        code: "M017",
        stage: "7. Dự án thắng (Closed Won)",
        count: wonOpps,
        unit: "dự án",
        note: "Hợp đồng đã xác nhận",
      },
    ];
  }, [db]);

  // Channel Attribution Matrix
  const channelMatrix = useMemo(() => {
    const sources: InquiryEntity["acquisition_source"][] = [
      "Facebook",
      "SEO",
      "YouTube",
      "TikTok",
      "unknown",
    ];
    const validInq = db.inquiries.filter((i) => i.validity === "valid");

    return sources.map((src) => {
      const inqs = validInq.filter((i) => i.acquisition_source === src);
      const uniqueContacts = new Set(inqs.map((i) => i.contact_id)).size;
      const fitYes = inqs.filter((i) => i.fit === "yes").length;
      const hotCount = inqs.filter((i) => i.readiness === "hot").length;
      const linkedOpps = db.opportunities.filter((o) =>
        o.linked_inquiry_ids.some((id) =>
          inqs.some((inq) => inq.inquiry_id === id)
        )
      );
      const pipelineVnd = linkedOpps.reduce(
        (s, o) => s + (o.expected_amount_vnd || 0),
        0
      );

      return {
        source: src === "unknown" ? "unknown (Hotline chưa rõ nguồn)" : src,
        rawSource: src,
        inquiriesCount: inqs.length,
        uniqueContacts,
        fitYes,
        hotCount,
        pipelineVnd,
      };
    });
  }, [db]);

  // Handlers
  const handleLeadIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = processLeadIntake(db, {
      submissionOrEventId: intakeForm.submissionId.trim(),
      backendStatus: intakeForm.backendStatus,
      displayName: intakeForm.displayName,
      phone: intakeForm.phone,
      email: intakeForm.email,
      organizationId: intakeForm.organizationId || null,
      captureChannel: intakeForm.captureChannel,
      observedUtmSource: intakeForm.observedUtmSource || null,
      publicationId: intakeForm.publicationId || null,
      needSummary: intakeForm.needSummary,
      isSameNeedAsPrevious: intakeForm.isSameNeedAsPrevious,
      fit: intakeForm.fit,
      readiness: intakeForm.readiness,
      verifiedCustomerRelationship:
        intakeForm.verifiedCustomerRelationship || undefined,
    });

    setDb(res.nextDb);
    if (
      res.status === "blocked_backend_error" ||
      res.status === "blocked_duplicate_submission"
    ) {
      notify("error", res.message);
    } else {
      notify("success", res.message);
      setIntakeForm({
        ...intakeForm,
        submissionId: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        displayName: "",
        phone: "",
        email: "",
        needSummary: "",
      });
    }
  };

  const handleUpdateInquiryQualification = (
    inquiryId: string,
    field: "fit" | "readiness" | "new_relationship_status" | "sales_accepted",
    value: string
  ) => {
    if (field === "new_relationship_status") {
      const auth = authorizeAction({
        roleId: activeRole,
        actionType: "CONFIRM_CUSTOMER_STATUS",
        entityType: "inquiries",
        entityId: inquiryId,
      });
      if (!auth.allowed) {
        if (auth.auditEntry) {
          setDb((prev) => ({
            ...prev,
            auditLog: [auth.auditEntry!, ...prev.auditLog],
          }));
        }
        notify("error", auth.denialReason || "Không đủ quyền.");
        return;
      }
    }

    setDb((prev) => ({
      ...prev,
      inquiries: prev.inquiries.map((inq) => {
        if (inq.inquiry_id !== inquiryId) return inq;
        if (field === "fit") {
          return { ...inq, fit: value as InquiryEntity["fit"] };
        }
        if (field === "readiness") {
          return { ...inq, readiness: value as InquiryEntity["readiness"] };
        }
        if (field === "new_relationship_status") {
          return {
            ...inq,
            new_relationship_status:
              value as InquiryEntity["new_relationship_status"],
          };
        }
        if (field === "sales_accepted") {
          const now = new Date().toISOString();
          return {
            ...inq,
            handoff_at: inq.handoff_at || now,
            sales_accepted_at: value === "accepted" ? now : null,
            feedback_status: value === "accepted" ? "accepted" : "pending",
          };
        }
        return inq;
      }),
    }));
    notify("success", `Đã cập nhật [${field}] cho yêu cầu ${inquiryId}.`);
  };

  const handleAddFinancialEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const exists = db.financialEntries.some(
      (f) => f.document_ref === finForm.documentRef.trim()
    );
    if (exists) {
      notify(
        "error",
        `Mã chứng từ [${finForm.documentRef}] đã tồn tại — Chặn nạp trùng chứng từ kế toán (B12-03).`
      );
      return;
    }
    const newEntry: FinancialEntryEntity = {
      entry_id: `FIN-${Date.now().toString().slice(-4)}`,
      document_ref: finForm.documentRef.trim(),
      opportunity_id: finForm.opportunityId,
      entry_type: finForm.entryType,
      effective_date: new Date().toISOString().slice(0, 10),
      amount_vnd: Number(finForm.amountVnd) || 0,
      vat_basis: finForm.vatBasis,
      confirmed_by: ROLE_POLICIES[activeRole].label,
    };
    setDb((prev) => ({
      ...prev,
      financialEntries: [newEntry, ...prev.financialEntries],
    }));
    notify(
      "success",
      `Đã ghi nhận chứng từ [${newEntry.document_ref}] vào nhóm độc lập [${newEntry.entry_type}] (QA16).`
    );
    setFinForm({
      ...finForm,
      documentRef: `CT-${Math.floor(100 + Math.random() * 899)}`,
    });
  };

  const handleValidateInsight = (insightId: string) => {
    const auth = authorizeAction({
      roleId: activeRole,
      actionType: "VALIDATE_INSIGHT",
      entityType: "insights",
      entityId: insightId,
    });
    if (!auth.allowed) {
      if (auth.auditEntry) {
        setDb((prev) => ({
          ...prev,
          auditLog: [auth.auditEntry!, ...prev.auditLog],
        }));
      }
      notify("error", auth.denialReason || "Bị chặn bởi quy tắc QA20.");
      return;
    }

    setDb((prev) => ({
      ...prev,
      insights: prev.insights.map((ins) =>
        ins.insight_id === insightId
          ? {
              ...ins,
              status: "Được hỗ trợ",
              validated_by: ROLE_POLICIES[activeRole].label,
            }
          : ins
      ),
    }));
    notify(
      "success",
      `Insight [${insightId}] đã được duyệt xác thực bởi ${ROLE_POLICIES[activeRole].label}.`
    );
  };

  const handlePublishAsset = (
    assetId: string,
    platforms: ("Website" | "Facebook" | "YouTube" | "TikTok" | "Zalo")[]
  ) => {
    const res = publishAssetToChannels(db, {
      assetId,
      platforms,
      actorRole: activeRole,
    });
    setDb(res.nextDb);
    if (!res.allowed) {
      notify("error", res.blockReason || "Chặn xuất bản.");
    } else {
      notify(
        "success",
        `Đã xuất bản Asset [${assetId}] ra ${res.createdPublications.length} nền tảng (${platforms.join(", ")}) — Đếm 1 Asset, ${res.createdPublications.length} Publications (QA09).`
      );
    }
  };

  const handleTestDuplicateSnapshotImport = () => {
    const duplicateBatch = [db.snapshots[0], db.snapshots[1]];
    const res = ingestMetricSnapshots(db, duplicateBatch, activeRole);
    setDb(res.nextDb);
    notify(
      "warning",
      `Kiểm thử QA01: Nạp lại lô cũ -> Thêm mới ${res.insertedCount} dòng, Chặn trùng ${res.skippedDuplicateCount} dòng. Tổng số liệu không bị nhân đôi!`
    );
  };

  const handleToggleEmployeeActive = (empId: string) => {
    setDb((prev) => {
      const target = prev.employees.find((e) => e.employee_id === empId);
      const nextActive = !target?.active;
      const audit = {
        audit_id: `AUD-EMP-${Date.now()}`,
        actor_id: `actor_${activeRole}`,
        actor_role: activeRole,
        entity_type: "employees",
        entity_id: empId,
        action: "revoke_access" as const,
        changed_at: new Date().toISOString(),
        changed_fields: "active",
        reason: nextActive
          ? `Khôi phục quyền truy cập cho nhân sự ${empId}`
          : `Thu hồi quyền nhân sự rời nhóm ${empId} (QA22): Khóa quyền truy cập, giữ nguyên toàn bộ Asset công ty.`,
        before_after_redacted: `active=${!nextActive} -> ${nextActive}`,
      };
      return {
        ...prev,
        employees: prev.employees.map((e) =>
          e.employee_id === empId ? { ...e, active: nextActive } : e
        ),
        auditLog: [audit, ...prev.auditLog],
      };
    });
    notify(
      "warning",
      `Đã cập nhật trạng thái quyền truy cập của nhân sự [${empId}] (Quy tắc QA22).`
    );
  };

  const handleEncryptDatabaseVault = async () => {
    try {
      const json = JSON.stringify(db);
      const enc = await encryptVaultData(json, vaultPassphrase);
      setEncryptedEnvelope(enc.envelope);
      setVaultChecksum(enc.checksumSha256);
      setVaultEncryptedAt(enc.encryptedAt);
      notify(
        "success",
        `Đã mã hóa toàn bộ cơ sở dữ liệu bằng ${enc.algorithm}. Checksum SHA-256: ${enc.checksumSha256.slice(0, 16)}...`
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Lỗi mã hóa dữ liệu."
      );
    }
  };

  const handleDecryptAndRestoreVault = async () => {
    if (!encryptedEnvelope.trim()) {
      notify("error", "Chưa có gói dữ liệu mã hóa để khôi phục.");
      return;
    }
    try {
      const dec = await decryptVaultData(encryptedEnvelope, vaultPassphrase);
      const restored: HacoledDatabase = JSON.parse(dec.plaintext);
      setDb({
        ...restored,
        auditLog: [
          {
            audit_id: `AUD-RESTORE-${Date.now()}`,
            actor_id: `actor_${activeRole}`,
            actor_role: activeRole,
            entity_type: "database_vault",
            entity_id: "FULL_RESTORE",
            action: "restore_backup",
            changed_at: new Date().toISOString(),
            changed_fields: "all_tables",
            reason: "Khôi phục thành công từ bản sao lưu mã hóa AES-256-GCM (QA21)",
            before_after_redacted: `verifiedChecksum=${dec.verifiedChecksum}`,
          },
          ...restored.auditLog,
        ],
      });
      notify(
        "success",
        "Giải mã & Khôi phục dữ liệu thành công! Toàn bộ quan hệ và ID được bảo toàn 100% (QA21)."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Giải mã thất bại."
      );
    }
  };

  const handleRunLiveQaSuite = async () => {
    setIsRunningQa(true);
    try {
      const report = await runFullAutomatedTestSuite();
      setQaReport(report);
      notify(
        "success",
        `Đã chạy kiểm thử tự động: ${report.passedCount}/${report.totalTests} ca kiểm thử ĐẠT 100%.`
      );
    } finally {
      setIsRunningQa(false);
    }
  };

  // Filtered Inquiries for CRM Table
  const filteredInquiries = useMemo(() => {
    return db.inquiries.filter((i) => {
      if (crmFilterFit !== "ALL" && i.fit !== crmFilterFit) return false;
      if (crmFilterSource !== "ALL" && i.acquisition_source !== crmFilterSource)
        return false;
      return true;
    });
  }, [db.inquiries, crmFilterFit, crmFilterSource]);

  // UTM Preview Result
  const utmPreview = useMemo(
    () => buildSafePublicationUrl(utmBuilder),
    [utmBuilder]
  );

  // MoM Preview Result
  const momPreview = useMemo(() => {
    const p = momPrev.trim() === "" ? null : Number(momPrev);
    const c = momCurr.trim() === "" ? null : Number(momCurr);
    return computePeriodComparison(p, c);
  }, [momPrev, momCurr]);

  // Lifetime Snapshot Evaluation for PUB-04A-TT
  const lifetimePreview = useMemo(
    () => evaluateLifetimeSnapshots(db.snapshots, "PUB-04A-TT", "M041"),
    [db.snapshots]
  );

  const currentRolePolicy = ROLE_POLICIES[activeRole];

  const PAGE_META: Record<WorkspaceTab, { title: string; desc: string }> = {
    executive: {
      title: "Tổng quan vận hành",
      desc: "Công việc, KPI và trạng thái đội ngũ trong một màn hình.",
    },
    crm_pipeline: {
      title: "Khách hàng & cơ hội",
      desc: "Theo dõi liên hệ, tổ chức, cơ hội và giá trị kinh doanh.",
    },
    strategy_lab: {
      title: "Thị trường & insight",
      desc: "Phân khúc, khách hàng mục tiêu, bằng chứng và insight đã kiểm chứng.",
    },
    content_channels: {
      title: "Nội dung & xuất bản",
      desc: "Quản lý brief, sản phẩm nội dung, lần đăng và kết quả theo kênh.",
    },
    team_cost: {
      title: "Nguồn lực & chi phí",
      desc: "Theo dõi năng lực đội ngũ, thời gian và chi phí vận hành.",
    },
    security_qa: {
      title: "Chất lượng dữ liệu & kiểm thử",
      desc: "Rà soát quyền truy cập, chất lượng dữ liệu và các ca kiểm thử hệ thống.",
    },
    team_survey: { title: "Khảo sát Team", desc: "" },
  };

  const currentPageMeta = PAGE_META[activeTab];

  const canAccessTab = (tab: string) =>
    Object.prototype.hasOwnProperty.call(PAGE_META, tab) && canViewWorkspaceItem(member.role, tab);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && canAccessTab(tab)) setActiveTab(tab as WorkspaceTab);
  // Role is fixed by the authenticated server session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  return (
    <DashboardShell title={currentPageMeta.title}
      description={currentPageMeta.desc}
      activeTab={activeTab} onTabChange={tab => { if (canAccessTab(tab)) { setActiveTab(tab as WorkspaceTab); window.history.replaceState(null, "", `/admin?tab=${tab}`); } }}>
      {notice && <div role="status" className={`form-message ${notice.type === "error" ? "error" : notice.type === "success" ? "success" : ""}`}><span className="flex-1">{notice.text}</span><button onClick={() => setNotice(null)} className="underline">Đóng</button></div>}
      {activeTab === "executive" && <OperationalOverview />}
      {activeTab !== "executive" && <div className="demo-notice"><Info size={16} /><span>Dữ liệu marketing minh họa · Thay đổi trong phân hệ này lưu trên trình duyệt.</span></div>}
      <div className="legacy-workspace space-y-5">
        {/* =================================================================
            WORKSPACE 1: EXECUTIVE DECISION HUB & FUNNEL INTELLIGENCE (D01-D08)
           ================================================================= */}
        {activeRole === "lead_marketing" && activeTab === "executive" && (
          <details className="legacy-details"><summary>Báo cáo marketing minh họa <span>Chỉ số, phễu chuyển đổi và mô hình tài chính mẫu</span></summary>
          <div className="demo-notice"><Info size={16} /><span>Dữ liệu bên dưới là dữ liệu minh họa, lưu tại trình duyệt; chưa kết nối dữ liệu marketing thực tế.</span></div>
          <div className="space-y-5">
            {/* Top Bar: Period Controls & MoM Safe Calculator */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Trung tâm Chỉ số Quyết định & Truy nguyên Dữ liệu (D01–D08)
                    </h2>
                    <InfoTooltip
                      title="Nguyên tắc Đọc Dashboard (08_BAO_CAO & QA24)"
                      formula="Bấm vào bất kỳ ô chỉ số nào để mở bảng truy ngược (Drill-down) về từng dòng bản ghi gốc"
                      source="Base / Platform / Kế toán"
                      guardrail="Mỗi chỉ số đều hiển thị rõ kỳ đo, phiên bản định nghĩa, và xử lý N/A khi mẫu số bằng 0."
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Nhấp vào từng thẻ chỉ số bên dưới để kiểm tra các dòng dữ
                    liệu cấu thành (Drill-down QA24).
                  </p>
                </div>
              </div>

              {/* Compact MoM Safe Comparison Widget (QA12) */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs">
                <span className="font-medium text-zinc-700 flex items-center">
                  So sánh kỳ (QA12)
                  <InfoTooltip
                    title="Kiểm thử So sánh Kỳ & Mẫu số 0 (M073, M074, QA12)"
                    formula="MoM % = (Kỳ này - Kỳ trước) / Kỳ trước"
                    source="Base / B09-05"
                    guardrail="Nếu Kỳ trước = 0, Tăng trưởng % tự động trả về N/A (không chia cho 0), nhưng vẫn báo Chênh lệch tuyệt đối."
                    align="right"
                  />
                  :
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Kỳ trước:</span>
                  <input
                    type="number"
                    aria-label="Kỳ trước"
                    value={momPrev}
                    onChange={(e) => setMomPrev(e.target.value)}
                    className="w-14 h-6 px-1.5 rounded border border-blue-300 bg-blue-50/50 text-blue-800 font-mono font-semibold text-right"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Kỳ này:</span>
                  <input
                    type="number"
                    aria-label="Kỳ này"
                    value={momCurr}
                    onChange={(e) => setMomCurr(e.target.value)}
                    className="w-14 h-6 px-1.5 rounded border border-blue-300 bg-blue-50/50 text-blue-800 font-mono font-semibold text-right"
                  />
                </div>
                <span className="text-zinc-300">|</span>
                <span className="font-mono">
                  Δ Tuyệt đối:{" "}
                  <strong>
                    {momPreview.absoluteDiff !== null
                      ? momPreview.absoluteDiff >= 0
                        ? `+${momPreview.absoluteDiff}`
                        : momPreview.absoluteDiff
                      : "N/A"}
                  </strong>
                </span>
                <span className="font-mono">
                  MoM %:{" "}
                  <strong className="text-zinc-950 bg-zinc-200/80 px-1.5 py-0.5 rounded">
                    {momPreview.relativeGrowthPct}
                  </strong>
                </span>
              </div>
            </div>

            {/* 12 Core Decision Metric Cards (Clickable for Drill-Down QA24) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {decisionMetrics.map((m) => {
                const isSelected = selectedMetric?.code === m.code;
                return (
                  <div
                    key={m.code}
                    onClick={() => setSelectedMetric(m)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMetric(m); } }}
                    className={`metric-card group cursor-pointer rounded-xl border p-4 transition-all bg-white ${
                      isSelected
                        ? "border-zinc-950 ring-2 ring-zinc-950/10 shadow-sm"
                        : "border-zinc-200/90 hover:border-zinc-400 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="metric-code font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {m.code}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {m.definitionVersion}
                        </span>
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center"
                      >
                        <StatusDot
                          variant={
                            m.statusBadge === "warning"
                              ? "warning"
                              : m.statusBadge === "na"
                              ? "neutral"
                              : "success"
                          }
                        />
                        <InfoTooltip
                          title={`${m.code} • ${m.label}`}
                          formula={m.formula}
                          source={`${m.sourceOfTruth} (${m.grain})`}
                          guardrail={m.guardrail}
                          align="right"
                        />
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <div className="text-xs font-medium text-zinc-500 line-clamp-1">
                        {m.label}
                      </div>
                      <div className="metric-value text-zinc-950 tabular-nums mt-0.5">
                        {m.formattedValue}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="truncate max-w-[170px]">
                        Nguồn: {m.sourceOfTruth}
                      </span>
                      <span className="font-medium text-zinc-900 group-hover:underline">
                        Truy vết ({m.drillDownRows.length}) →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drill-Down Lineage Drawer / Panel (QA24) */}
            {selectedMetric && (
              <div className="bg-zinc-950 text-zinc-50 rounded-xl border border-zinc-800 p-4 sm:p-5 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-3.5 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="font-mono">
                        DRILL-DOWN QA24 • {selectedMetric.code}
                      </Badge>
                      <span className="text-xs text-zinc-400 font-mono">
                        Kỳ: {selectedMetric.periodScope} | Phiên bản:{" "}
                        {selectedMetric.definitionVersion}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {selectedMetric.label}: {selectedMetric.formattedValue}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      Công thức: {selectedMetric.formula}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMetric(null)}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    Đóng bảng truy vết
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {selectedMetric.drillDownRows.map((row) => (
                    <div
                      key={row.id}
                      className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-cyan-400">
                          {row.id}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                          {row.badge}
                        </span>
                      </div>
                      <div className="font-medium text-zinc-100 mt-1">
                        {selectedMetric.code === "M003" ||
                        selectedMetric.code === "M004" ||
                        selectedMetric.code === "M006" ||
                        selectedMetric.code === "M009"
                          ? maskContactName(row.title, activeRole)
                          : row.title}
                      </div>
                      <div className="text-zinc-400 text-[11px] mt-0.5">
                        {row.subtitle}
                      </div>
                      <div className="text-zinc-500 text-[10px] mt-1 flex items-center justify-between">
                        <span>{row.source}</span>
                        <span className="font-mono">{row.timestamp.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two-Column Marketing Intelligence: Observed Funnel + Channel Attribution & Financial 3-Tier Separation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 cols: Observed Marketing Funnel & Bottleneck Diagnosis */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-zinc-950">
                      Phễu Quan sát Đa tầng & Điểm nghẽn Chuyển đổi (B08)
                    </h3>
                    <InfoTooltip
                      title="Phễu Quan sát (Observed Funnel - B08)"
                      formula="Impressions → Sessions → Valid Inquiries → Unique Contacts → Qualified (Fit=Yes) → Sales Accepted → Won"
                      source="GSC + GA4 + Base + Sales Feedback"
                      guardrail="Phễu quan sát giúp tìm điểm rò rỉ (bottleneck), không ép mọi khách hàng phải đi tuần tự qua từng bước."
                    />
                  </div>
                  <Badge variant="secondary">Pilot: Trường học</Badge>
                </div>

                <div className="space-y-3">
                  {funnelStages.map((st, idx) => {
                    const maxRef = idx <= 1 ? 15000 : 10;
                    return (
                      <div
                        key={st.code}
                        className="p-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-zinc-500 w-10">
                              {st.code}
                            </span>
                            <span className="font-semibold text-zinc-900">
                              {st.stage}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-zinc-500 hidden sm:inline">
                              {st.note}
                            </span>
                            <span className="font-mono font-bold text-zinc-950 tabular-nums">
                              {st.count.toLocaleString("vi-VN")} {st.unit}
                            </span>
                          </div>
                        </div>
                        <CssMeterBar
                          value={st.count}
                          max={maxRef}
                          colorClass={
                            idx >= 4 ? "bg-emerald-600" : "bg-zinc-900"
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 5 cols: Channel Attribution & QA16 Financial Isolation */}
              <div className="lg:col-span-5 space-y-5">
                {/* Channel Matrix */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                    <div className="flex items-center">
                      <h3 className="text-sm font-semibold text-zinc-950">
                        Hiệu quả Nguồn Thu hút (Attribution Matrix)
                      </h3>
                      <InfoTooltip
                        title="Quy tắc Ghi nhận Nguồn (LR14–LR17)"
                        formula="Tách riêng capture_channel (nơi tiếp nhận) và acquisition_source (nguồn thu hút)"
                        source="Base / inquiries & touchpoints"
                        guardrail="Cuộc gọi Hotline không rõ nguồn bắt buộc giữ ở nhóm 'unknown', tuyệt đối không tự chia lại cho SEO hay Facebook."
                        align="right"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500">
                          <th className="py-2 font-medium">Nguồn (Source)</th>
                          <th className="py-2 font-medium text-right">
                            Yêu cầu
                          </th>
                          <th className="py-2 font-medium text-right">
                            Fit=Yes
                          </th>
                          <th className="py-2 font-medium text-right">
                            Pipeline
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {channelMatrix.map((ch) => (
                          <tr key={ch.rawSource}>
                            <td className="py-2.5 font-medium text-zinc-900">
                              <div className="flex items-center gap-1.5">
                                <StatusDot
                                  variant={
                                    ch.rawSource === "unknown"
                                      ? "warning"
                                      : ch.fitYes > 0
                                      ? "success"
                                      : "neutral"
                                  }
                                />
                                <span>{ch.source}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums">
                              {ch.inquiriesCount}
                            </td>
                            <td className="py-2.5 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                              {ch.fitYes} ({ch.hotCount} hot)
                            </td>
                            <td className="py-2.5 text-right font-mono font-semibold text-zinc-900 tabular-nums">
                              {ch.pipelineVnd > 0
                                ? `${(ch.pipelineVnd / 1e6).toFixed(0)}tr`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* QA16: Financial 3-Tier Separation Card */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                    <div className="flex items-center">
                      <h3 className="text-sm font-semibold text-zinc-950">
                        Đối soát Kết quả Kinh doanh 3 Tầng Độc lập (QA16)
                      </h3>
                      <InfoTooltip
                        title="Chống Cộng Gộp Số Tài Chính (QA16)"
                        formula="Hợp đồng ký (M019) ≠ Doanh thu ghi nhận (M020) ≠ Tiền thực thu (M021)"
                        source="financial_entries (Kế toán xác nhận)"
                        guardrail="Ví dụ dự án 200tr, đã nghiệm thu 100tr, đã thu 50tr: Báo cáo riêng từng dòng, cấm cộng thành 350tr."
                        align="right"
                      />
                    </div>
                    <Badge variant="outline">Chưa VAT</Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    {db.financialEntries.map((fe) => (
                      <div
                        key={fe.entry_id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70"
                      >
                        <div>
                          <div className="font-semibold text-zinc-900">
                            {fe.entry_type === "contract_signed"
                              ? "1. Giá trị Hợp đồng ký (M019)"
                              : fe.entry_type === "revenue_recognized"
                              ? "2. Doanh thu Nghiệm thu (M020)"
                              : "3. Tiền Thực thu về TK (M021)"}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            Chứng từ: {fe.document_ref} • Dự án:{" "}
                            {fe.opportunity_id}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-sm text-zinc-950 tabular-nums">
                          {(fe.amount_vnd / 1_000_000).toFixed(0)} triệu ₫
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </details>
        )}

        {/* =================================================================
            WORKSPACE 2: LEAD INTAKE, CRM, DEDUPLICATION & FINANCIALS (B07/B08)
           ================================================================= */}
        {activeTab === "crm_pipeline" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 5 cols: Fast Intake Form with QA02/QA03/QA04/QA05/QA06/QA07 Rules */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Tiếp nhận Liên hệ & Đối soát Trùng Tự động (B07/B08)
                    </h2>
                    <InfoTooltip
                      title="Cơ chế Chống Đếm Trùng & Bảo toàn Nguồn (LR01–LR15)"
                      formula="Chuẩn hóa SĐT/Email -> Gộp về 1 contact_id duy nhất"
                      source="processLeadIntake()"
                      guardrail="1. Nếu trùng submission_id (QA03) hoặc lỗi backend (QA02): Chặn tạo lead.\n2. Nếu khách cũ gọi lại hoặc thuộc trường cũ (QA05): Gán 'known'.\n3. Nếu gọi hotline không rõ nguồn (QA07): Giữ 'unknown'."
                    />
                  </div>
                  <Badge variant="default">Intake Engine</Badge>
                </div>

                <form onSubmit={handleLeadIntakeSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Mã sự kiện / Submission ID
                        <InfoTooltip
                          title="Khóa chống trùng (LR01 & QA03)"
                          guardrail="Thử nhập 'SUB-FORM-1001' (đã tồn tại) để kiểm tra cơ chế chặn refresh trang Thank-you (QA03)."
                        />
                      </label>
                      <input
                        type="text"
                        required
                        value={intakeForm.submissionId}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            submissionId: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Trạng thái Backend (QA02)
                      </label>
                      <select
                        value={intakeForm.backendStatus}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            backendStatus: e.target.value as "success" | "error",
                          })
                        }
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-xs"
                      >
                        <option value="success">200 OK (Lưu thành công)</option>
                        <option value="error">
                          500 Error (Giả lập lỗi mạng QA02)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Tên người liên hệ
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Thầy Nam / Chưa rõ"
                        value={intakeForm.displayName}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            displayName: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Số điện thoại (Chuẩn hóa LR02) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: 0912345101"
                        value={intakeForm.phone}
                        onChange={(e) =>
                          setIntakeForm({ ...intakeForm, phone: e.target.value })
                        }
                        className="w-full h-8 px-2.5 rounded-md border border-zinc-300 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Tổ chức / Trường học (QA05)
                      </label>
                      <select
                        value={intakeForm.organizationId}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            organizationId: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-xs"
                      >
                        <option value="">-- Chưa xác định tổ chức --</option>
                        {db.organizations.map((o) => (
                          <option key={o.organization_id} value={o.organization_id}>
                            {o.name} ({o.relationship_status})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Kênh tiếp nhận (Capture)
                      </label>
                      <select
                        value={intakeForm.captureChannel}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            captureChannel:
                              e.target.value as InquiryEntity["capture_channel"],
                          })
                        }
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-xs"
                      >
                        <option value="hotline">Hotline chung (C06)</option>
                        <option value="form">Website Form</option>
                        <option value="zalo">Zalo OA</option>
                        <option value="messenger">Facebook Messenger</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Nguồn UTM quan sát được (QA07/QA08)
                      </label>
                      <select
                        value={intakeForm.observedUtmSource}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            observedUtmSource:
                              e.target.value as typeof intakeForm.observedUtmSource,
                          })
                        }
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-xs"
                      >
                        <option value="">
                          Không có / Chưa rõ (Giữ unknown)
                        </option>
                        <option value="Facebook">Facebook (Có UTM/Link)</option>
                        <option value="SEO">SEO Google Search</option>
                        <option value="YouTube">YouTube Video</option>
                        <option value="TikTok">TikTok Video</option>
                        <option value="Referral">Đối tác giới thiệu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Đánh giá Fit sơ bộ (LR07)
                      </label>
                      <select
                        value={intakeForm.fit}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            fit: e.target.value as InquiryEntity["fit"],
                          })
                        }
                        className="w-full h-8 px-2 rounded-md border border-zinc-300 bg-white text-xs"
                      >
                        <option value="unknown">unknown (Chưa đủ thông tin)</option>
                        <option value="yes">yes (Đúng giải pháp trọn gói)</option>
                        <option value="no">no (Mua lẻ module / Ngoài PV)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">
                      Tóm tắt nhu cầu thực tế *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Xin dự toán màn hình LED P2.5 hội trường 300 chỗ..."
                      value={intakeForm.needSummary}
                      onChange={(e) =>
                        setIntakeForm({
                          ...intakeForm,
                          needSummary: e.target.value,
                        })
                      }
                      className="w-full h-8 px-2.5 rounded-md border border-zinc-300 text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-zinc-600 pt-1">
                    <input
                      type="checkbox"
                      checked={intakeForm.isSameNeedAsPrevious}
                      onChange={(e) =>
                        setIntakeForm({
                          ...intakeForm,
                          isSameNeedAsPrevious: e.target.checked,
                        })
                      }
                      className="rounded border-zinc-300"
                    />
                    <span>
                      Cùng nhu cầu đang mở của SĐT này (Chỉ ghi thêm Touchpoint,
                      không tạo Inquiry mới - QA04)
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full h-9 rounded-lg bg-zinc-950 text-white font-semibold text-xs hover:bg-zinc-800 transition-colors"
                  >
                    Ghi nhận vào Hệ thống Base
                  </button>
                </form>
              </div>

              {/* Right 7 cols: CRM Inquiries & Qualification Pipeline */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100">
                    <div className="flex items-center">
                      <h2 className="text-sm font-semibold text-zinc-950">
                        Danh sách Yêu cầu Liên hệ & Phễu Sàng lọc (Inquiries)
                      </h2>
                      <InfoTooltip
                        title="Tách biệt Contact, Organization & Inquiry (B07-01)"
                        formula="M003 = COUNT DISTINCT contact_id | M009 = Fit='yes'"
                        source="Base / inquiries & contacts"
                        guardrail="Nếu đổi sang vai trò Thực tập sinh trên thanh tiêu đề, toàn bộ Tên & SĐT khách hàng tại bảng này sẽ tự động bị che (QA18)."
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <select
                        aria-label="Lọc theo Fit"
                        value={crmFilterFit}
                        onChange={(e) => setCrmFilterFit(e.target.value)}
                        className="h-7 rounded border border-zinc-300 px-2 bg-white text-xs"
                      >
                        <option value="ALL">Mọi trạng thái Fit</option>
                        <option value="yes">Fit = yes (Đủ ĐK)</option>
                        <option value="unknown">Fit = unknown</option>
                        <option value="no">Fit = no (Loại)</option>
                      </select>

                      <select
                        aria-label="Lọc theo Nguồn"
                        value={crmFilterSource}
                        onChange={(e) => setCrmFilterSource(e.target.value)}
                        className="h-7 rounded border border-zinc-300 px-2 bg-white text-xs"
                      >
                        <option value="ALL">Mọi nguồn thu hút</option>
                        <option value="Facebook">Facebook</option>
                        <option value="SEO">SEO</option>
                        <option value="YouTube">YouTube</option>
                        <option value="unknown">unknown</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500">
                          <th className="py-2 pr-2 font-medium">Mã / Khách</th>
                          <th className="py-2 px-2 font-medium">
                            Capture → Source
                          </th>
                          <th className="py-2 px-2 font-medium">Nhu cầu</th>
                          <th className="py-2 px-2 font-medium">Mới / Cũ</th>
                          <th className="py-2 px-2 font-medium">Fit / Nhiệt</th>
                          <th className="py-2 pl-2 font-medium">Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredInquiries.map((inq) => {
                          const contact = db.contacts.find(
                            (c) => c.contact_id === inq.contact_id
                          );
                          const tpCount = db.touchpoints.filter(
                            (t) => t.contact_id === inq.contact_id
                          ).length;
                          return (
                            <tr
                              key={inq.inquiry_id}
                              className={
                                inq.validity === "test"
                                  ? "bg-zinc-100/60 opacity-60"
                                  : "hover:bg-zinc-50/80"
                              }
                            >
                              <td className="py-2.5 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-zinc-900">
                                    {inq.inquiry_id}
                                  </span>
                                  {inq.validity === "test" && (
                                    <Badge variant="destructive">TEST</Badge>
                                  )}
                                </div>
                                <div className="font-medium text-zinc-800 mt-0.5">
                                  {maskContactName(
                                    contact?.display_name,
                                    activeRole
                                  )}
                                </div>
                                <div className="font-mono text-[11px] text-zinc-500">
                                  {maskPhone(
                                    contact?.phone_normalized,
                                    activeRole
                                  )}{" "}
                                  • {tpCount} TP
                                </div>
                              </td>

                              <td className="py-2.5 px-2 whitespace-nowrap">
                                <div className="font-mono text-[11px]">
                                  Nhận: <strong>{inq.capture_channel}</strong>
                                </div>
                                <div className="mt-0.5">
                                  Nguồn:{" "}
                                  <Badge
                                    variant={
                                      inq.acquisition_source === "unknown"
                                        ? "warning"
                                        : "info"
                                    }
                                  >
                                    {inq.acquisition_source}
                                  </Badge>
                                </div>
                              </td>

                              <td className="py-2.5 px-2 max-w-[200px]">
                                <p className="line-clamp-2 text-zinc-700">
                                  {inq.need_summary}
                                </p>
                              </td>

                              <td className="py-2.5 px-2">
                                <select
                                  aria-label="Trạng thái quan hệ khách hàng"
                                  value={inq.new_relationship_status}
                                  onChange={(e) =>
                                    handleUpdateInquiryQualification(
                                      inq.inquiry_id,
                                      "new_relationship_status",
                                      e.target.value
                                    )
                                  }
                                  className="h-7 rounded border border-zinc-300 bg-white px-1.5 text-[11px] font-mono"
                                >
                                  <option value="new_confirmed">
                                    new_confirmed
                                  </option>
                                  <option value="known">known (Cũ)</option>
                                  <option value="unknown">unknown</option>
                                </select>
                              </td>

                              <td className="py-2.5 px-2 space-y-1">
                                <select
                                  aria-label="Đánh giá Fit"
                                  value={inq.fit}
                                  onChange={(e) =>
                                    handleUpdateInquiryQualification(
                                      inq.inquiry_id,
                                      "fit",
                                      e.target.value
                                    )
                                  }
                                  className="block w-full h-6 rounded border border-zinc-300 bg-white px-1 text-[11px] font-semibold"
                                >
                                  <option value="yes">Fit: YES</option>
                                  <option value="unknown">Fit: UNK</option>
                                  <option value="no">Fit: NO</option>
                                </select>
                                <select
                                  aria-label="Đánh giá Độ nóng"
                                  value={inq.readiness}
                                  onChange={(e) =>
                                    handleUpdateInquiryQualification(
                                      inq.inquiry_id,
                                      "readiness",
                                      e.target.value
                                    )
                                  }
                                  className="block w-full h-6 rounded border border-zinc-300 bg-white px-1 text-[11px]"
                                >
                                  <option value="hot">Intent: HOT</option>
                                  <option value="warm">Intent: WARM</option>
                                  <option value="cold">Intent: COLD</option>
                                  <option value="unknown">Intent: UNK</option>
                                </select>
                              </td>

                              <td className="py-2.5 pl-2">
                                <button
                                  onClick={() =>
                                    handleUpdateInquiryQualification(
                                      inq.inquiry_id,
                                      "sales_accepted",
                                      inq.sales_accepted_at
                                        ? "pending"
                                        : "accepted"
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                                    inq.sales_accepted_at
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                      : "bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200"
                                  }`}
                                >
                                  {inq.sales_accepted_at
                                    ? "Sales đã nhận"
                                    : "Chờ nhận"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom of Right Card: Financial Voucher Recording (QA16) */}
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-900 flex items-center">
                      Ghi nhận Chứng từ Tài chính Dự án (Tách 3 tầng QA16)
                      <InfoTooltip
                        title="Đối soát Kế toán & Sales (financial_entries)"
                        formula="Chặn nạp trùng document_ref; tách riêng Hợp đồng ký / Doanh thu / Tiền thu"
                        guardrail="Không bao giờ cộng gộp 3 loại phát sinh này làm một."
                      />
                    </span>
                  </div>
                  <form
                    onSubmit={handleAddFinancialEntry}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Mã chứng từ"
                      value={finForm.documentRef}
                      onChange={(e) =>
                        setFinForm({ ...finForm, documentRef: e.target.value })
                      }
                      className="h-8 px-2 rounded border border-zinc-300 font-mono"
                    />
                    <select
                      value={finForm.opportunityId}
                      onChange={(e) =>
                        setFinForm({
                          ...finForm,
                          opportunityId: e.target.value,
                        })
                      }
                      className="h-8 px-2 rounded border border-zinc-300 bg-white"
                    >
                      {db.opportunities.map((o) => (
                        <option key={o.opportunity_id} value={o.opportunity_id}>
                          {o.opportunity_id}
                        </option>
                      ))}
                    </select>
                    <select
                      value={finForm.entryType}
                      onChange={(e) =>
                        setFinForm({
                          ...finForm,
                          entryType:
                            e.target.value as FinancialEntryEntity["entry_type"],
                        })
                      }
                      className="h-8 px-2 rounded border border-zinc-300 bg-white"
                    >
                      <option value="contract_signed">
                        1. Giá trị HĐ ký (M019)
                      </option>
                      <option value="revenue_recognized">
                        2. Doanh thu ghi nhận (M020)
                      </option>
                      <option value="cash_collected">
                        3. Tiền đã thu (M021)
                      </option>
                    </select>
                    <input
                      type="number"
                      required
                      value={finForm.amountVnd}
                      onChange={(e) =>
                        setFinForm({
                          ...finForm,
                          amountVnd: Number(e.target.value),
                        })
                      }
                      className="h-8 px-2 rounded border border-zinc-300 font-mono"
                    />
                    <button
                      type="submit"
                      className="h-8 rounded bg-zinc-900 text-white font-semibold hover:bg-zinc-800"
                    >
                      + Lưu chứng từ
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            WORKSPACE 3: STRATEGY, MARKET TAM-SAM-SOM & INSIGHT LAB (B01-B03, B10)
           ================================================================= */}
        {activeTab === "strategy_lab" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* B01: Solutions & Approved Claims Registry */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      B01 • Danh mục Giải pháp & Cam kết Kỹ thuật Đã duyệt
                    </h2>
                    <InfoTooltip
                      title="Ranh giới Giải pháp & Cam kết (B01-01 & B01-02)"
                      source="Lead Marketing + Kỹ thuật xác nhận"
                      guardrail="Mỗi giải pháp phải ghi rõ phạm vi KHÔNG bao gồm (VD: Không bán lẻ tấm module rời) để làm căn cứ chấm Fit=No (LR07)."
                    />
                  </div>
                  <Badge variant="success">Verified Claims</Badge>
                </div>

                <div className="space-y-3 text-xs">
                  {db.solutions.map((sol) => (
                    <div
                      key={sol.solution_id}
                      className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-zinc-900">
                          {sol.solution_id} • {sol.name}
                        </span>
                        <Badge variant="outline">{sol.version}</Badge>
                      </div>
                      <p className="text-zinc-600">
                        <strong>Ứng dụng:</strong> {sol.use_case}
                      </p>
                      <p className="text-emerald-800">
                        <strong>Bao gồm:</strong> {sol.included_scope}
                      </p>
                      <p className="text-rose-800">
                        <strong>Giới hạn không phục vụ:</strong>{" "}
                        {sol.excluded_scope}
                      </p>
                      <p className="text-zinc-800 bg-white p-2 rounded border border-zinc-200">
                        <strong>Thông số được phép hứa:</strong>{" "}
                        {sol.verified_claims} (Duyệt bởi: {sol.approved_by})
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* B02: TAM - SAM - SOM Market Scenarios */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      B02 • Mô hình Thị trường TAM – SAM – SOM (Phân khúc Pilot)
                    </h2>
                    <InfoTooltip
                      title="Công thức TAM – SAM – SOM Không Gán % Tùy Ý (M079–M081)"
                      formula="SOM = MIN(SAM, Năng lực giao, Cơ hội tiếp cận × WinRate) × Giá trị/dự án"
                      source="market_scenarios (S02, S14)"
                      guardrail="Không tự gán SAM = 30% TAM. SOM bị chặn trần bởi năng lực thi công thực tế của HacoLED trong kỳ."
                      align="right"
                    />
                  </div>
                  <Badge variant="info">Pilot: Trường học</Badge>
                </div>

                <div className="space-y-3 text-xs">
                  {db.marketScenarios.map((sc) => {
                    const tam =
                      (sc.eligible_org_count || 0) *
                      (sc.projects_per_org_year || 0) *
                      (sc.value_per_project_vnd || 0);
                    const sam =
                      (sc.sam_project_count || 0) *
                      (sc.value_per_project_vnd || 0);
                    const somProj = Math.min(
                      sc.sam_project_count || 0,
                      sc.delivery_capacity || 0,
                      (sc.reachable_qualified_projects || 0) *
                        (sc.win_rate_assumption || 0)
                    );
                    const som = somProj * (sc.value_per_project_vnd || 0);

                    return (
                      <div
                        key={sc.scenario_id}
                        className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">
                            Kịch bản {sc.scenario} ({sc.year}) — {sc.vat_basis}
                          </span>
                          <Badge variant="secondary">{sc.confidence}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2 rounded bg-white border border-zinc-200">
                            <div className="text-[11px] text-zinc-500">
                              TAM (Toàn vùng)
                            </div>
                            <div className="font-mono font-bold text-sm text-zinc-900 mt-0.5">
                              {(tam / 1e9).toFixed(2)} tỷ
                            </div>
                          </div>
                          <div className="p-2 rounded bg-white border border-zinc-200">
                            <div className="text-[11px] text-zinc-500">
                              SAM ({sc.sam_project_count} cơ hội)
                            </div>
                            <div className="font-mono font-bold text-sm text-blue-700 mt-0.5">
                              {(sam / 1e9).toFixed(2)} tỷ
                            </div>
                          </div>
                          <div className="p-2 rounded bg-white border border-zinc-200">
                            <div className="text-[11px] text-zinc-500">
                              SOM ({somProj.toFixed(1)} dự án)
                            </div>
                            <div className="font-mono font-bold text-sm text-emerald-700 mt-0.5">
                              {(som / 1e9).toFixed(2)} tỷ
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* B03 Insights & QA20 Governance Gate + B10 Experiments */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      B03 • Sổ Đăng ký Insight & Kiểm chứng Bằng chứng (QA20)
                    </h2>
                    <InfoTooltip
                      title="Cổng Kiểm soát Insight & Chặn AI Tự Xác nhận (B03-04 & QA20)"
                      source="Evidence Log + Sales Feedback"
                      guardrail="AI suy luận từ 3 bình luận chỉ được lưu ở trạng thái 'Giả thuyết'. Thử chuyển Vai trò sang [AI Hỗ trợ] rồi bấm Duyệt để kiểm tra cơ chế chặn QA20."
                    />
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {db.insights.map((ins) => (
                    <div
                      key={ins.insight_id}
                      className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-zinc-900">
                          {ins.insight_id} • Persona: {ins.persona_id}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              ins.status === "Được hỗ trợ"
                                ? "success"
                                : "warning"
                            }
                          >
                            {ins.status}
                          </Badge>
                          {ins.status === "Giả thuyết" && (
                            <button
                              onClick={() =>
                                handleValidateInsight(ins.insight_id)
                              }
                              className="px-2.5 py-1 rounded bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
                            >
                              Duyệt xác thực (Test QA20)
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-zinc-800">
                        <strong>Quan sát thực tế:</strong> {ins.observation}
                      </p>
                      <p className="text-zinc-600">
                        <strong>Diễn giải:</strong> {ins.interpretation}
                      </p>
                      <p className="text-blue-800 font-medium">
                        <strong>Nhiệm vụ Content:</strong>{" "}
                        {ins.content_implication}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* B10: Hypothesis Experiments */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      B10 • Thẻ Thử nghiệm & Quyết định (Experiments)
                    </h2>
                    <InfoTooltip
                      title="Quy tắc Thử nghiệm Không Kết luận Sớm (B10-03)"
                      guardrail="Không kết luận thất bại chỉ vì vài ngày ít view; cho phép trạng thái 'Chưa đủ dữ liệu' khi cỡ mẫu còn nhỏ."
                      align="right"
                    />
                  </div>
                </div>

                {db.experiments.map((exp) => (
                  <div
                    key={exp.experiment_id}
                    className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-900">
                        {exp.experiment_id} • Chỉ số chính:{" "}
                        {exp.primary_metric_code}
                      </span>
                      <Badge variant="warning">{exp.decision}</Badge>
                    </div>
                    <p className="text-zinc-800 leading-relaxed">
                      <strong>Giả thuyết:</strong> {exp.hypothesis}
                    </p>
                    <p className="text-zinc-600">
                      <strong>Biến thử:</strong> {exp.variable}
                    </p>
                    <p className="text-rose-800">
                      <strong>Guardrails:</strong> {exp.guardrails}
                    </p>
                    <p className="text-zinc-500 font-mono text-[11px]">
                      Ghi chú cỡ mẫu: {exp.sample_size_note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            WORKSPACE 4: CONTENT PRODUCTION, UTM FIREWALL & SNAPSHOTS (B05/B06)
           ================================================================= */}
        {activeTab === "content_channels" && (
          <div className="space-y-5">
            {/* B05: Asset vs Publication Registry & QA23 Consent Firewall */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-100">
                <div className="flex items-center">
                  <h2 className="text-sm font-semibold text-zinc-950">
                    B05 • Quản lý Sản phẩm Sáng tạo (Assets) & Lần Xuất bản Đa
                    Kênh (Publications)
                  </h2>
                  <InfoTooltip
                    title="Chống Đếm Trùng Sản lượng (QA09) & Chặn Ảnh Chưa Xin Phép (QA23)"
                    formula="1 Video đăng 3 kênh = 1 Asset (M055) + 3 Publications (M056)"
                    source="Base / content_assets & publications"
                    guardrail="Bấm thử 'Xuất bản TikTok' ở dòng ASSET-05-BLOCKED bên dưới để kiểm tra cơ chế chặn tự động khi chứa hình ảnh học sinh chưa xin phép (QA23)."
                  />
                </div>
                <Badge variant="default">
                  {db.assets.filter((a) => a.technical_approval === "Đạt").length}{" "}
                  Assets đạt → {db.publications.length} Publications
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500">
                      <th className="py-2 pr-3 font-medium">Asset ID</th>
                      <th className="py-2 px-3 font-medium">
                        Tiêu đề & Định dạng
                      </th>
                      <th className="py-2 px-3 font-medium">
                        Quyền Hình ảnh / Tư liệu (QA23)
                      </th>
                      <th className="py-2 px-3 font-medium">Duyệt Kỹ thuật</th>
                      <th className="py-2 px-3 font-medium">
                        Các lần đăng (Publications - QA09)
                      </th>
                      <th className="py-2 pl-3 font-medium text-right">
                        Thao tác Xuất bản
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {db.assets.map((asset) => {
                      const pubs = db.publications.filter(
                        (p) => p.asset_id === asset.asset_id
                      );
                      const isBlockedRights =
                        asset.rights_status !== "Được dùng";
                      return (
                        <tr
                          key={asset.asset_id}
                          className={
                            isBlockedRights
                              ? "bg-rose-50/40"
                              : "hover:bg-zinc-50"
                          }
                        >
                          <td className="py-3 pr-3 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            {asset.asset_id}
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-semibold text-zinc-900">
                              {asset.title}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              Định dạng: <strong>{asset.format}</strong> • Giờ
                              làm: {asset.hours_spent ?? "N/A"}h
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                isBlockedRights ? "destructive" : "success"
                              }
                            >
                              {asset.rights_status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                asset.technical_approval === "Đạt"
                                  ? "secondary"
                                  : "warning"
                              }
                            >
                              {asset.technical_approval}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {pubs.length === 0 ? (
                                <span className="text-zinc-400">
                                  Chưa xuất bản
                                </span>
                              ) : (
                                pubs.map((p) => (
                                  <Badge key={p.publication_id} variant="outline">
                                    {p.platform} ({p.publication_id})
                                  </Badge>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <button
                              onClick={() =>
                                handlePublishAsset(asset.asset_id, ["TikTok"])
                              }
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                isBlockedRights
                                  ? "bg-rose-600 text-white hover:bg-rose-500"
                                  : "bg-zinc-900 text-white hover:bg-zinc-800"
                              }`}
                            >
                              {isBlockedRights
                                ? "Thử Đăng (Test Chặn QA23)"
                                : "+ Đăng thêm kênh"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Two-Column: Safe UTM Builder (B08-02 & QA17) + Snapshot Lifetime & Idempotent Import (B06, QA01, QA10, QA13) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: UTM & PII Firewall */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-zinc-950">
                      Trình Tạo Link UTM Chuẩn & Tường lửa Chặn PII (B08-02 &
                      QA17)
                    </h3>
                    <InfoTooltip
                      title="Quy tắc UTM & Cấm PII trên URL (S07, B08-02, QA17)"
                      guardrail="1. Tự động xóa SĐT/Email nếu lỡ gắn vào URL.\n2. Tự động tước bỏ UTM nếu tích chọn 'Liên kết nội bộ trên Website' để tránh ghi đè nguồn phiên GA4."
                    />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">
                      URL Đích (Thử gõ thêm ?phone=0912345101 để kiểm tra tường
                      lửa xóa PII)
                    </label>
                    <input
                      type="text"
                      value={utmBuilder.targetUrl}
                      onChange={(e) =>
                        setUtmBuilder({
                          ...utmBuilder,
                          targetUrl: e.target.value,
                        })
                      }
                      className="w-full h-8 px-2.5 rounded border border-zinc-300 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        utm_source
                      </label>
                      <input
                        type="text"
                        value={utmBuilder.utmSource}
                        onChange={(e) =>
                          setUtmBuilder({
                            ...utmBuilder,
                            utmSource: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 rounded border border-zinc-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        utm_medium
                      </label>
                      <input
                        type="text"
                        value={utmBuilder.utmMedium}
                        onChange={(e) =>
                          setUtmBuilder({
                            ...utmBuilder,
                            utmMedium: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 rounded border border-zinc-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        utm_content (publication_id)
                      </label>
                      <input
                        type="text"
                        value={utmBuilder.utmContent}
                        onChange={(e) =>
                          setUtmBuilder({
                            ...utmBuilder,
                            utmContent: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 rounded border border-zinc-300 font-mono"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-zinc-700">
                    <input
                      type="checkbox"
                      checked={utmBuilder.isInternalNavigation}
                      onChange={(e) =>
                        setUtmBuilder({
                          ...utmBuilder,
                          isInternalNavigation: e.target.checked,
                        })
                      }
                      className="rounded border-zinc-300"
                    />
                    <span>
                      Đây là liên kết nội bộ giữa các bài viết trên Website
                      HacoLED (Tự động gỡ UTM - Quy tắc B08-02)
                    </span>
                  </label>

                  <div className="p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-[11px] break-all space-y-1">
                    <div className="text-zinc-400">URL Đầu ra An toàn:</div>
                    <div className="text-cyan-300 font-bold">
                      {utmPreview.finalUrl}
                    </div>
                    {utmPreview.warning && (
                      <div className="text-amber-300 pt-1">
                        {utmPreview.warning}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Snapshot Lifetime (QA10), Null Preservation (QA13) & Idempotent Import (QA01) */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-zinc-950">
                      B06 • Sổ Snapshot Số liệu Kênh (QA01, QA10, QA13)
                    </h3>
                    <InfoTooltip
                      title="Chống Cộng Dồn Snapshot Lifetime (QA10) & Giữ Null (QA13)"
                      formula="Delta = Snapshot_Lifetime(t2) - Snapshot_Lifetime(t1)"
                      guardrail="Ví dụ Video TikTok lấy số ngày 23/10 được 100 views, ngày 24/10 được 150 views: Tổng hiện tại là 150 (tăng +50), cấm cộng 100 + 150 = 250."
                      align="right"
                    />
                  </div>
                  <button
                    onClick={handleTestDuplicateSnapshotImport}
                    className="px-2.5 py-1 rounded bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800"
                  >
                    Test Nạp Lại Cùng Lô (QA01)
                  </button>
                </div>

                {/* Lifetime Delta Box */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-900">
                      Đối soát Lifetime Views (PUB-04A-TT • TikTok)
                    </div>
                    <div className="text-zinc-500 text-[11px]">
                      Lần chụp 1: {lifetimePreview.previousValue} views → Lần
                      chụp 2: {lifetimePreview.latestValue} views
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-sm text-zinc-950">
                      Hiện tại: {lifetimePreview.latestValue} views
                    </div>
                    <div className="text-emerald-700 text-[11px] font-semibold">
                      Chênh lệch kỳ: +{lifetimePreview.deltaValue} (Không báo
                      250)
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500">
                        <th className="py-1.5">Đối tượng</th>
                        <th className="py-1.5">Chỉ số gốc</th>
                        <th className="py-1.5">Loại gộp</th>
                        <th className="py-1.5 text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {db.snapshots.map((s) => (
                        <tr key={s.snapshot_id}>
                          <td className="py-2 font-mono font-semibold">
                            {s.entity_id}
                          </td>
                          <td className="py-2">
                            {s.metric_code} ({s.native_metric_name})
                          </td>
                          <td className="py-2">
                            <Badge variant="outline">{s.aggregation}</Badge>
                          </td>
                          <td className="py-2 text-right font-mono font-bold">
                            {s.metric_value === null ? (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                null / Unavailable (QA13)
                              </span>
                            ) : (
                              s.metric_value.toLocaleString("vi-VN")
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            WORKSPACE 5: TEAM CAPACITY, ECONOMIC COST & HR COMPETENCY (B04/B11)
           ================================================================= */}
        {activeTab === "team_cost" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* B04: Economic Cost vs New Cash Budget */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      B04 • Chi phí Tiền mới (M061) vs Chi phí Kinh tế Đầy đủ
                      (M062)
                    </h2>
                    <InfoTooltip
                      title="Không Đồng Nhất 0 Chi Mới Với Miễn Phí Nhân Công (C02 & B04-03)"
                      formula="CPQL đầy đủ (M064) = Chi phí kinh tế phân bổ / Số Lead đủ điều kiện"
                      guardrail="Nếu thiếu dữ liệu phân bổ giờ công (completeness = incomplete), CPQL phải trả về N/A chứ không được ghi 0 ₫."
                    />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  {db.costs.map((c) => (
                    <div
                      key={c.cost_id}
                      className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/60"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-zinc-900">
                          {c.cost_id} ({c.cost_type})
                        </span>
                        <Badge
                          variant={
                            c.completeness === "full" ? "success" : "warning"
                          }
                        >
                          {c.completeness}
                        </Badge>
                      </div>
                      <p className="text-zinc-600 mt-1">{c.note}</p>
                      <div className="mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between font-mono">
                        <span>
                          Tiền mặt mới:{" "}
                          <strong>
                            {c.incremental_cash_vnd.toLocaleString("vi-VN")} ₫
                          </strong>
                        </span>
                        <span>
                          Chi phí kinh tế:{" "}
                          <strong>
                            {c.economic_cost_vnd !== null
                              ? `${c.economic_cost_vnd.toLocaleString("vi-VN")} ₫`
                              : "null (Chưa đủ)"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* B11: Team Roster, Autonomy Rubric (M077) & Access Revocation (QA22) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      B11 • Nhân sự, Mức tự chủ có Bằng chứng (M077) & Thu hồi
                      Quyền (QA22)
                    </h2>
                    <InfoTooltip
                      title="Đánh giá Năng lực Không Dựa Theo Lượt View (B11 & QA22)"
                      formula="M077 = Rubric + Sản phẩm thực tế; M078 = Bài thực hành đạt / Đến hạn"
                      guardrail="Khi 1 nhân sự rời nhóm, bấm 'Thu hồi quyền (QA22)' để khóa truy cập ngay lập tức mà vẫn giữ nguyên toàn bộ Asset công ty."
                      align="right"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500">
                        <th className="py-2 pr-2">Nhân sự & Vai trò</th>
                        <th className="py-2 px-2">Quỹ giờ/tuần</th>
                        <th className="py-2 px-2">Mức tự chủ (M077)</th>
                        <th className="py-2 px-2">Thực hành (M078)</th>
                        <th className="py-2 pl-2 text-right">
                          Trạng thái Quyền (QA22)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {db.employees.map((emp) => (
                        <tr
                          key={emp.employee_id}
                          className={
                            !emp.active ? "bg-rose-50/40 opacity-75" : ""
                          }
                        >
                          <td className="py-2.5 pr-2">
                            <div className="font-semibold text-zinc-900">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {emp.employee_id} • {emp.work_schedule}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-mono">
                            {emp.weekly_available_hours}h/tuần
                          </td>
                          <td className="py-2.5 px-2">
                            <Badge variant="secondary">
                              {emp.autonomy_level}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-2 font-mono">
                            {emp.practice_passed}/{emp.practice_due} bài đạt
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <button
                              onClick={() =>
                                handleToggleEmployeeActive(emp.employee_id)
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                                emp.active
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-800"
                                  : "bg-rose-600 border-rose-600 text-white"
                              }`}
                            >
                              {emp.active
                                ? "Đang hoạt động (Bấm để Thu hồi)"
                                : "Đã thu hồi quyền (QA22)"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            WORKSPACE 6: AES-256-GCM SECURITY VAULT, RBAC & LIVE QA SUITE (B12/QA24)
           ================================================================= */}
        {activeTab === "security_qa" && (
          <div className="space-y-5">
            {/* Top Row: AES-256-GCM Cryptographic Backup & Restore Vault (QA21 & INT02) */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-100">
                <div className="flex items-center">
                  <h2 className="text-sm font-semibold text-zinc-950">
                    B12 • Két sắt Mã hóa Dữ liệu AES-256-GCM & Khôi phục Toàn vẹn
                    (QA21 & INT02)
                  </h2>
                  <InfoTooltip
                    title="Cơ chế Mã hóa Chuẩn Quân sự AES-256-GCM + PBKDF2-SHA256"
                    formula="Key = PBKDF2(Passphrase, Salt_16B, 100000_iters, SHA-256) -> AES-256-GCM(IV_12B)"
                    source="Web Crypto API (src/lib/security/crypto.ts)"
                    guardrail="Bất kỳ sự thay đổi dù chỉ 1 bit trên gói bản mã hoặc nhập sai khóa đều bị từ chối giải mã tức thì."
                  />
                </div>
                <Badge variant="default" className="font-mono">
                  AES-256-GCM / PBKDF2-100K
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                <div className="lg:col-span-5 space-y-3">
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">
                      Khóa Bảo mật Két sắt (Passphrase / Master Key)
                    </label>
                    <input
                      type="text"
                      value={vaultPassphrase}
                      onChange={(e) => setVaultPassphrase(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-zinc-300 font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleEncryptDatabaseVault}
                      className="px-3.5 py-2 rounded-lg bg-zinc-950 text-white font-semibold hover:bg-zinc-800 transition-colors"
                    >
                      1. Mã hóa Toàn bộ Dữ liệu (AES-256-GCM)
                    </button>
                    <button
                      onClick={handleDecryptAndRestoreVault}
                      className="px-3.5 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-colors"
                    >
                      2. Giải mã & Khôi phục thử (QA21)
                    </button>
                  </div>

                  {vaultChecksum && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 font-mono text-[11px]">
                      <div>
                        <strong>SHA-256 Checksum:</strong>{" "}
                        {vaultChecksum.slice(0, 32)}...
                      </div>
                      <div>
                        <strong>Thời điểm mã hóa:</strong> {vaultEncryptedAt}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7">
                  <label className="block font-medium text-zinc-700 mb-1">
                    Gói Bản mã Đầu ra (HCENC_V1 Envelope — Thử sửa 1 ký tự bất kỳ
                    rồi bấm Giải mã để kiểm tra chống giả mạo INT02)
                  </label>
                  <textarea
                    rows={4}
                    value={encryptedEnvelope}
                    onChange={(e) => setEncryptedEnvelope(e.target.value)}
                    placeholder="Nhấn '1. Mã hóa Toàn bộ Dữ liệu' để sinh gói bản mã AES-256-GCM..."
                    className="w-full p-2.5 rounded-lg border border-zinc-300 bg-zinc-950 text-cyan-300 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Automated Test Suite Runner (28 Tests: QA01-QA24 + INT01-INT04) */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center">
                    <h2 className="text-sm font-semibold text-zinc-950">
                      10_KIEM_THU • Trung tâm Kiểm thử Nghiệm thu Tự động (24 Ca
                      QA Bắt buộc + 4 Ca Liên thông Đa phân hệ)
                    </h2>
                    <InfoTooltip
                      title="Kiểm thử Tự động Thực thi Trên Dữ liệu Cô lập (10_KIEM_THU)"
                      source="src/lib/tests/qa-suite.ts"
                      guardrail="Hoàn thành khi có bằng chứng kết quả thực tế (actualEvidence) và thời gian chạy, không chỉ là bảng tích ô thủ công."
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Kiểm tra toàn diện: Chống trùng lặp, Phễu & Attribution,
                    Công thức N/A, Tách tài chính 3 tầng, Tường lửa PII, RBAC &
                    Mã hóa AES-256-GCM.
                  </p>
                </div>

                <button
                  onClick={handleRunLiveQaSuite}
                  disabled={isRunningQa}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
                >
                  {isRunningQa
                    ? "Đang chạy 28 ca kiểm thử..."
                    : "Chạy Lại Toàn Bộ 28 Ca Kiểm Thử Tự Động"}
                </button>
              </div>

              {qaReport && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500">
                        <th className="py-2 pr-2">Mã</th>
                        <th className="py-2 px-2">Nhóm</th>
                        <th className="py-2 px-2">Tình huống & Tiêu chí</th>
                        <th className="py-2 px-2">
                          Bằng chứng Kết quả Thực thi (Actual Evidence)
                        </th>
                        <th className="py-2 pl-2 text-right">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {qaReport.results.map((r) => (
                        <tr key={r.code} className="hover:bg-zinc-50/80">
                          <td className="py-2.5 pr-2 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            {r.code}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            <Badge variant="outline">{r.category}</Badge>
                          </td>
                          <td className="py-2.5 px-2 max-w-xs">
                            <div className="font-semibold text-zinc-900">
                              {r.title}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {r.assertionSummary}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[11px] text-zinc-700 max-w-md">
                            {r.actualEvidence}
                          </td>
                          <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                            <Badge
                              variant={r.passed ? "success" : "destructive"}
                            >
                              <StatusDot
                                variant={r.passed ? "success" : "danger"}
                              />
                              <span>
                                {r.passed ? "PASS" : "FAIL"} ({r.durationMs}ms)
                              </span>
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tamper-Evident Audit Log */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                <div className="flex items-center">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Nhật ký Kiểm toán Bảo mật & Chặn Truy cập Trái phép (audit_log)
                  </h3>
                  <InfoTooltip
                    title="Audit Log Không Chứa PII (B12)"
                    guardrail="Ghi lại mọi thao tác nạp dữ liệu, chặn quyền thực tập sinh (QA18), chặn xuất bản ảnh chưa xin phép (QA23), và thu hồi quyền (QA22)."
                  />
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("hacoled_os_db_v1");
                    setDb(INITIAL_HACOLED_DB);
                    notify(
                      "success",
                      "Đã khôi phục trạng thái dữ liệu chuẩn mặc định."
                    );
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 underline"
                >
                  Reset DB về trạng thái ban đầu
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto text-xs font-mono">
                {db.auditLog.map((log) => (
                  <div
                    key={log.audit_id}
                    className={`p-2.5 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      log.action === "permission_denied" ||
                      log.action === "revoke_access"
                        ? "bg-rose-50/50 border-rose-200 text-rose-950"
                        : "bg-zinc-50 border-zinc-200 text-zinc-800"
                    }`}
                  >
                    <div>
                      <span className="font-bold">[{log.action.toUpperCase()}]</span>{" "}
                      <span>
                        Actor: {log.actor_role} | Bảng: {log.entity_type} (
                        {log.entity_id})
                      </span>
                      <div className="text-[11px] font-sans text-zinc-600 mt-0.5">
                        {log.reason} —{" "}
                        <code className="text-zinc-800">
                          {log.before_after_redacted}
                        </code>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {log.changed_at.slice(0, 19).replace("T", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
