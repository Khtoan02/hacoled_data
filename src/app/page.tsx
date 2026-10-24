"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  CheckSquare,
  Database,
  BarChart3,
  ShieldAlert,
  PlayCircle,
  Calculator,
  Search,
  Download,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FileSpreadsheet,
  Filter,
  Users,
  FileText,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  CORE_PRINCIPLES,
  SHEET_OVERVIEW,
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
  DEMO_BRIEF_16,
  TaskItem,
  QATestCaseItem,
  PhaseType,
} from "../lib/spec-data";
import { FIELD_DICTIONARY } from "../lib/spec-fields";
import {
  DEMO_INQUIRIES,
  DEMO_ASSETS,
  BaseInquiryRecord,
  BaseContentAsset,
  CaptureChannel,
  NewToCompanyStatus,
  ValidityStatus,
  FitStatus,
  ReadinessStatus,
} from "../lib/operational-base";

type MainSection =
  | "overview"
  | "modules_tasks"
  | "schema_fields"
  | "metrics_events"
  | "rules_roles"
  | "p0_workspace"
  | "qa_calculator";

export default function HacoledMarketingBaseApp() {
  const [activeSection, setActiveSection] = useState<MainSection>("overview");
  const [phaseFilter, setPhaseFilter] = useState<"ALL" | PhaseType>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Interactive states persisted in localStorage
  const [tasks, setTasks] = useState<TaskItem[]>(TASKS_58);
  const [qaTests, setQaTests] = useState<QATestCaseItem[]>(QA_TESTS_24);
  const [inquiries, setInquiries] = useState<BaseInquiryRecord[]>(DEMO_INQUIRIES);
  const [assets, setAssets] = useState<BaseContentAsset[]>(DEMO_ASSETS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sub-filters
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>("ALL");
  const [selectedMetricGroup, setSelectedMetricGroup] = useState<string>("ALL");

  // Formula sandbox state (14_VI_DU_CONG_THUC - Blue input cells)
  const [calcInputs, setCalcInputs] = useState({
    prevNewContacts: "11",
    currNewContacts: "14",
    prevSessions: "1000",
    currSessions: "1200",
    prevFormSessions: "11",
    currFormSessions: "14",
    impressionsScope: "10000",
    clicksScope: "250",
    formStartSessions: "40",
    formSubmitSessions: "25",
    adSpendVnd: "0",
    adAttributedRevVnd: "0",
    fullEconomicCostVnd: "", // Empty on purpose: Chưa có dữ liệu; không ghi 0
    qualifiedLeadsCount: "8",
    fullMeasuredDays: "30",
    knownSourceContacts: "9",
  });

  // New Inquiry Form State (B07/B08)
  const [showAddInquiry, setShowAddInquiry] = useState(false);
  const [newInq, setNewInq] = useState({
    contact_id: "",
    contact_name: "",
    phone_normalized: "",
    organization_name: "",
    organization_type: "Trường học" as BaseInquiryRecord["organization_type"],
    capture_channel: "hotline" as CaptureChannel,
    acquisition_source: "unknown",
    source_evidence: "unknown" as BaseInquiryRecord["source_evidence"],
    need_summary: "",
    validity: "valid" as ValidityStatus,
    new_to_company_status: "unknown" as NewToCompanyStatus,
    fit: "unknown" as FitStatus,
    readiness: "unknown" as ReadinessStatus,
  });

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem("hacoled_base_tasks_v1");
      const savedQa = localStorage.getItem("hacoled_base_qa_v1");
      const savedInq = localStorage.getItem("hacoled_base_inquiries_v1");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedQa) setQaTests(JSON.parse(savedQa));
      if (savedInq) setInquiries(JSON.parse(savedInq));
    } catch (e) {
      console.error("Load storage error", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("hacoled_base_tasks_v1", JSON.stringify(tasks));
      localStorage.setItem("hacoled_base_qa_v1", JSON.stringify(qaTests));
      localStorage.setItem("hacoled_base_inquiries_v1", JSON.stringify(inquiries));
    } catch (e) {
      console.error("Save storage error", e);
    }
  }, [tasks, qaTests, inquiries, isLoaded]);

  // Task status update
  const updateTaskStatus = (code: string, nextStatus: TaskItem["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.code === code ? { ...t, status: nextStatus } : t))
    );
  };

  // QA status update
  const updateQaStatus = (
    code: string,
    testStatus: QATestCaseItem["testStatus"],
    evidenceNote?: string
  ) => {
    setQaTests((prev) =>
      prev.map((q) =>
        q.code === code
          ? {
              ...q,
              testStatus,
              evidenceNote:
                evidenceNote !== undefined ? evidenceNote : q.evidenceNote,
            }
          : q
      )
    );
  };

  // Filtered Lists
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchPhase = phaseFilter === "ALL" || t.phase === phaseFilter;
      const matchMod =
        selectedModuleFilter === "ALL" || t.moduleCode === selectedModuleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.output.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q);
      return matchPhase && matchMod && matchSearch;
    });
  }, [tasks, phaseFilter, selectedModuleFilter, searchQuery]);

  const filteredFields = useMemo(() => {
    return FIELD_DICTIONARY.filter((f) => {
      const matchPhase = phaseFilter === "ALL" || f.phase === phaseFilter;
      const matchTable =
        selectedTableFilter === "ALL" || f.table === selectedTableFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.table.toLowerCase().includes(q) ||
        f.fieldName.toLowerCase().includes(q) ||
        f.definitionRule.toLowerCase().includes(q);
      return matchPhase && matchTable && matchSearch;
    });
  }, [phaseFilter, selectedTableFilter, searchQuery]);

  const metricGroups = useMemo(() => {
    return Array.from(new Set(METRICS_83.map((m) => m.group)));
  }, []);

  const filteredMetrics = useMemo(() => {
    return METRICS_83.filter((m) => {
      const matchPhase = phaseFilter === "ALL" || m.phase === phaseFilter;
      const matchGroup =
        selectedMetricGroup === "ALL" || m.group === selectedMetricGroup;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q);
      return matchPhase && matchGroup && matchSearch;
    });
  }, [phaseFilter, selectedMetricGroup, searchQuery]);

  // Live P0 Operational Metrics from Inquiries & Assets (Strict adherence to 05_CHI_SO)
  const liveP0Metrics = useMemo(() => {
    const m001_totalReceived = inquiries.filter(
      (i) => i.validity !== "test"
    ).length;
    const validInquiries = inquiries.filter((i) => i.validity === "valid");
    const m002_validInquiries = validInquiries.length;

    const uniqueContacts = new Set(validInquiries.map((i) => i.contact_id));
    const m003_uniqueContacts = uniqueContacts.size;

    const newConfirmedContacts = new Set(
      validInquiries
        .filter((i) => i.new_to_company_status === "new_confirmed")
        .map((i) => i.contact_id)
    );
    const m004_newConfirmed = newConfirmedContacts.size;

    const knownContacts = new Set(
      validInquiries
        .filter((i) => i.new_to_company_status === "known")
        .map((i) => i.contact_id)
    );
    const m005_known = knownContacts.size;

    const unknownRelContacts = new Set(
      validInquiries
        .filter((i) => i.new_to_company_status === "unknown")
        .map((i) => i.contact_id)
    );
    const m006_unknownRel = unknownRelContacts.size;

    const uniqueOrgs = new Set(
      validInquiries
        .filter((i) => !i.organization_id.startsWith("ORG-UNKNOWN"))
        .map((i) => i.organization_id)
    );
    const m007_uniqueOrgs = uniqueOrgs.size;

    const qualifiedContacts = new Set(
      validInquiries.filter((i) => i.fit === "yes").map((i) => i.contact_id)
    );
    const m009_qualifiedContacts = qualifiedContacts.size;

    const m010_fitRate =
      m003_uniqueContacts > 0
        ? `${((m009_qualifiedContacts / m003_uniqueContacts) * 100).toFixed(1)}%`
        : "N/A";

    const knownSourceInquiries = validInquiries.filter(
      (i) => i.acquisition_source !== "unknown" && i.source_evidence !== "unknown"
    ).length;

    const m069_sourceCoverage =
      m002_validInquiries > 0
        ? `${((knownSourceInquiries / m002_validInquiries) * 100).toFixed(1)}%`
        : "N/A";

    const m070_knownRelRate =
      m003_uniqueContacts > 0
        ? `${(
            ((m004_newConfirmed + m005_known) / m003_uniqueContacts) *
            100
          ).toFixed(1)}%`
        : "N/A";

    const m055_approvedAssets = assets.filter(
      (a) => a.technical_approval === "Đạt"
    ).length;
    const m056_publishedCount = assets.reduce(
      (sum, a) =>
        sum + a.publications.filter((p) => p.status === "Đã đăng").length,
      0
    );

    return {
      m001_totalReceived,
      m002_validInquiries,
      m003_uniqueContacts,
      m004_newConfirmed,
      m005_known,
      m006_unknownRel,
      m007_uniqueOrgs,
      m009_qualifiedContacts,
      m010_fitRate,
      m069_sourceCoverage,
      m070_knownRelRate,
      m055_approvedAssets,
      m056_publishedCount,
    };
  }, [inquiries, assets]);

  // Formula Sandbox Calculations (14_VI_DU_CONG_THUC)
  const formulaResults = useMemo(() => {
    const parseNum = (val: string): number | null => {
      if (val.trim() === "") return null;
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    };

    const prevNew = parseNum(calcInputs.prevNewContacts);
    const currNew = parseNum(calcInputs.currNewContacts);
    const absDiffNew =
      prevNew !== null && currNew !== null ? currNew - prevNew : null;
    const relGrowthNew =
      prevNew !== null && currNew !== null && prevNew > 0
        ? (currNew - prevNew) / prevNew
        : null;

    const prevSess = parseNum(calcInputs.prevSessions);
    const currSess = parseNum(calcInputs.currSessions);
    const prevFormSess = parseNum(calcInputs.prevFormSessions);
    const currFormSess = parseNum(calcInputs.currFormSessions);

    const prevCvr =
      prevSess !== null && prevFormSess !== null && prevSess > 0
        ? prevFormSess / prevSess
        : null;
    const currCvr =
      currSess !== null && currFormSess !== null && currSess > 0
        ? currFormSess / currSess
        : null;
    const cvrPercentagePointDiff =
      prevCvr !== null && currCvr !== null ? (currCvr - prevCvr) * 100 : null;

    const impr = parseNum(calcInputs.impressionsScope);
    const clicks = parseNum(calcInputs.clicksScope);
    const ctr =
      impr !== null && clicks !== null && impr > 0 ? clicks / impr : null;

    const fStart = parseNum(calcInputs.formStartSessions);
    const fSub = parseNum(calcInputs.formSubmitSessions);
    const formCompletionRate =
      fStart !== null && fSub !== null && fStart > 0 ? fSub / fStart : null;

    const adSpend = parseNum(calcInputs.adSpendVnd);
    const adRev = parseNum(calcInputs.adAttributedRevVnd);
    const roas =
      adSpend !== null && adRev !== null && adSpend > 0
        ? adRev / adSpend
        : null; // AdSpend = 0 => N/A

    const fullCost = parseNum(calcInputs.fullEconomicCostVnd);
    const qualLeads = parseNum(calcInputs.qualifiedLeadsCount);
    const cpqlFull =
      fullCost !== null && qualLeads !== null && qualLeads > 0
        ? fullCost / qualLeads
        : null; // Missing cost => N/A

    const days = parseNum(calcInputs.fullMeasuredDays);
    const avgLeadsPerDay =
      currNew !== null && days !== null && days > 0 ? currNew / days : null;

    const knownSrc = parseNum(calcInputs.knownSourceContacts);
    const srcCoverage =
      currNew !== null && knownSrc !== null && currNew > 0
        ? knownSrc / currNew
        : null;
    const unknownSrcCount =
      currNew !== null && knownSrc !== null
        ? Math.max(0, currNew - knownSrc)
        : null;

    return {
      absDiffNew,
      relGrowthNew,
      prevCvr,
      currCvr,
      cvrPercentagePointDiff,
      ctr,
      formCompletionRate,
      roas,
      cpqlFull,
      avgLeadsPerDay,
      srcCoverage,
      unknownSrcCount,
    };
  }, [calcInputs]);

  const handleAddInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newInq.phone_normalized.replace(/\D/g, "");
    // Check if phone already exists in contacts (LR02: Nhận diện người)
    const existingContact = inquiries.find(
      (i) => cleanPhone && i.phone_normalized === cleanPhone
    );

    const contactId = existingContact
      ? existingContact.contact_id
      : newInq.contact_id.trim() || `CON-${Date.now().toString().slice(-4)}`;

    const record: BaseInquiryRecord = {
      inquiry_id: `INQ-${Date.now().toString().slice(-5)}`,
      contact_id: contactId,
      contact_name: newInq.contact_name.trim() || "Chưa rõ tên",
      phone_normalized: cleanPhone || "unknown",
      organization_id: newInq.organization_name.trim()
        ? `ORG-${Date.now().toString().slice(-4)}`
        : "ORG-UNKNOWN",
      organization_name:
        newInq.organization_name.trim() || "Chưa xác định tổ chức",
      organization_type: newInq.organization_type,
      received_at: new Date().toISOString().slice(0, 16).replace("T", " "),
      capture_channel: newInq.capture_channel,
      acquisition_source:
        newInq.capture_channel === "hotline" &&
        newInq.source_evidence === "unknown"
          ? "unknown"
          : newInq.acquisition_source,
      source_evidence: newInq.source_evidence,
      need_summary: newInq.need_summary.trim() || "Chưa ghi chi tiết nhu cầu",
      validity: newInq.validity,
      new_to_company_status: newInq.new_to_company_status,
      fit: newInq.fit,
      readiness: newInq.readiness,
      handoff_to_sales: false,
      first_meaningful_response: true,
      is_demo_record: false,
    };

    setInquiries([record, ...inquiries]);
    setShowAddInquiry(false);
    setNewInq({
      contact_id: "",
      contact_name: "",
      phone_normalized: "",
      organization_name: "",
      organization_type: "Trường học",
      capture_channel: "hotline",
      acquisition_source: "unknown",
      source_evidence: "unknown",
      need_summary: "",
      validity: "valid",
      new_to_company_status: "unknown",
      fit: "unknown",
      readiness: "unknown",
    });
  };

  const exportCsvSpec = (type: "tasks" | "metrics" | "fields" | "inquiries") => {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    if (type === "tasks") {
      csv += "Mã việc,Phân hệ,Công việc,Đầu ra,Tiêu chí hoàn thành,Chủ trì,Phụ thuộc,Giai đoạn,Trạng thái\n";
      tasks.forEach((t) => {
        csv += `"${t.code}","${t.moduleCode}","${t.title}","${t.output}","${t.acceptance}","${t.owner}","${t.dependencies}","${t.phase}","${t.status}"\n`;
      });
    } else if (type === "metrics") {
      csv += "Mã,Nhóm,Chỉ số,Công thức/định nghĩa,Đơn vị phân tích,Nguồn chuẩn,Không được diễn giải sai,Giai đoạn\n";
      METRICS_83.forEach((m) => {
        csv += `"${m.code}","${m.group}","${m.name}","${m.formula}","${m.grain}","${m.sourceOfTruth}","${m.guardrail}","${m.phase}"\n`;
      });
    } else if (type === "fields") {
      csv += "Bảng,Tên trường,Kiểu,Bắt buộc,Định nghĩa/quy tắc,Người phụ trách,Giai đoạn,Phân loại,Nguồn\n";
      FIELD_DICTIONARY.forEach((f) => {
        csv += `"${f.table}","${f.fieldName}","${f.dataType}","${f.required}","${f.definitionRule}","${f.owner}","${f.phase}","${f.classification}","${f.source}"\n`;
      });
    } else {
      csv += "inquiry_id,contact_id,Tên liên hệ,SĐT,Tổ chức,Loại tổ chức,Kênh tiếp nhận,Nguồn thu hút,Bằng chứng nguồn,Hợp lệ,Mới/Cũ với HacoLED,Fit,Độ nóng,Ghi chú nhu cầu,Dữ liệu mẫu\n";
      inquiries.forEach((i) => {
        csv += `"${i.inquiry_id}","${i.contact_id}","${i.contact_name}","${i.phone_normalized}","${i.organization_name}","${i.organization_type}","${i.capture_channel}","${i.acquisition_source}","${i.source_evidence}","${i.validity}","${i.new_to_company_status}","${i.fit}","${i.readiness}","${i.need_summary}","${i.is_demo_record ? "DEMO" : "REAL"}"\n`;
      });
    }
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `HacoLED_Marketing_Base_${type}_v1.0.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const p0CompletedCount = tasks.filter(
    (t) => t.phase === "P0" && t.status === "Hoàn thành"
  ).length;
  const p0TotalCount = tasks.filter((t) => t.phase === "P0").length;
  const qaPassCount = qaTests.filter(
    (q) => q.testStatus === "Đạt (Pass)"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-sm shadow">
              HL
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight">
                  HACOLED | MARKETING BASE
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  ĐẶC TẢ NGHIỆP VỤ & DỮ LIỆU • V1.0 • 24/10/2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                12 phân hệ • 58 công việc • 37 bảng logic • 402 trường • 83 chỉ
                số • 24 ca kiểm thử
              </p>
            </div>
          </div>

          {/* Quick Status Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Tiến độ P0:{" "}
              <strong className="text-cyan-400">
                {p0CompletedCount}/{p0TotalCount}
              </strong>{" "}
              việc
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Nghiệm thu QA:{" "}
              <strong className="text-emerald-400">
                {qaPassCount}/{qaTests.length}
              </strong>{" "}
              ca đạt
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-300">
              Ngân sách mới: <strong>0 ₫</strong> (Pilot: Trường học)
            </div>
          </div>
        </div>

        {/* Navigation Bar (Ordered as specified: 01 -> 02 -> 03/04 -> 05/06 -> 07/09 -> Vận hành P0 -> 10/14) */}
        <div className="bg-slate-900 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 overflow-x-auto py-1.5">
            <nav className="flex items-center space-x-1">
              <button
                onClick={() => setActiveSection("overview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === "overview"
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>00. Tổng quan & Quyết định (14 Trang)</span>
              </button>

              <button
                onClick={() => setActiveSection("modules_tasks")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === "modules_tasks"
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>01–02. Phân hệ (12) & Việc cần làm (58)</span>
              </button>

              <button
                onClick={() => setActiveSection("schema_fields")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === "schema_fields"
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>03–04. Bảng (37) & Trường dữ liệu (402)</span>
              </button>

              <button
                onClick={() => setActiveSection("metrics_events")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === "metrics_events"
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>05–06–08. Chỉ số (83), Sự kiện (20) & Báo cáo</span>
              </button>

              <button
                onClick={() => setActiveSection("rules_roles")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === "rules_roles"
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>07 & 09. Quy tắc Lead (18) & Phân quyền (8)</span>
              </button>

              <button
                onClick={() => setActiveSection("p0_workspace")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === "p0_workspace"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-300 hover:bg-slate-800 hover:text-emerald-200"
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Vận hành Base P0 (Liên hệ & Content)</span>
              </button>

              <button
                onClick={() => setActiveSection("qa_calculator")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeSection === "qa_calculator"
                    ? "bg-purple-600 text-white"
                    : "text-purple-300 hover:bg-slate-800 hover:text-purple-200"
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>10 & 14. Nghiệm thu (24) & Máy tính Công thức</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Global Filter & Search Bar */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Giai đoạn (Pha):
            </span>
            {(["ALL", "P0", "P1", "P2"] as const).map((ph) => (
              <button
                key={ph}
                onClick={() => setPhaseFilter(ph)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  phaseFilter === ph
                    ? "bg-purple-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {ph === "ALL"
                  ? "Tất cả (P0 + P1 + P2)"
                  : ph === "P0"
                  ? "P0 (Nền tảng bắt buộc)"
                  : ph === "P1"
                  ? "P1 (Sau nền tảng)"
                  : "P2 (Khi đủ dữ liệu)"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã (B01, M004, QA12), tên trường, quy tắc..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* =========================================================
            SECTION 00: OVERVIEW, PRINCIPLES, 14 SHEETS, DECISIONS & SOURCES
           ========================================================= */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Guardrail Banner */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-950 space-y-1">
                <p className="font-bold">
                  Nguyên tắc Bảo toàn Sự thật & Ranh giới Hệ thống (HacoLED
                  Marketing Base v1.0)
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-900">
                  {CORE_PRINCIPLES.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 14 Sheets Directory */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Cấu trúc 14 Trang Đặc tả HacoLED Marketing Base v1.0
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bấm vào từng mục trên thanh điều hướng để tra cứu chi tiết
                    và vận hành
                  </p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                  24/10/2026 • V1.0
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-4 font-semibold">Mã Trang</th>
                      <th className="py-2.5 px-4 font-semibold">Nội dung</th>
                      <th className="py-2.5 px-4 font-semibold text-right">
                        Số dòng chuẩn
                      </th>
                      <th className="py-2.5 px-4 font-semibold">
                        Mục đích & Nguyên tắc sử dụng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {SHEET_OVERVIEW.map((s) => (
                      <tr key={s.code} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                          {s.code}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {s.content}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                          {s.rowCount}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {s.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 11_QUYET_DINH (12 Decisions) & 12_NGUON (22 Sources) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Decisions */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    11_QUYET_DINH • Sổ Quyết định & Những gì chưa chốt (12 mục)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thay đổi phải có người duyệt và ngày hiệu lực
                  </p>
                </div>
                <div className="divide-y divide-slate-200 max-h-[540px] overflow-y-auto">
                  {DECISIONS_12.map((d) => (
                    <div key={d.code} className="p-3.5 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {d.code} • {d.topic}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1.5">
                        {d.content}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phụ trách: <strong>{d.owner}</strong> — Lưu ý: {d.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    12_NGUON • Nguồn & Phạm vi Sử dụng (22 nguồn đối chiếu)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nguồn phương pháp/định nghĩa (24/10/2026), không phải bằng
                    chứng hiệu suất HacoLED
                  </p>
                </div>
                <div className="divide-y divide-slate-200 max-h-[540px] overflow-y-auto">
                  {SOURCES_22.map((src) => (
                    <div key={src.code} className="p-3.5 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {src.code}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {src.type}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                        {src.name}
                      </p>
                      <p className="text-xs text-blue-600 break-all mt-0.5">
                        {src.urlOrRef}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Giới hạn: {src.scopeAndLimit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 01 & 02: 12 MODULES & 58 TASKS
           ========================================================= */}
        {activeSection === "modules_tasks" && (
          <div className="space-y-6">
            {/* 01_PHAN_HE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    01_PHAN_HE • 12 Phân hệ của HacoLED Marketing Base
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kiến trúc nghiệp vụ: giữ logic FT24, bổ sung dữ liệu, vận
                    hành và an toàn. Bấm vào phân hệ để lọc danh sách việc bên
                    dưới.
                  </p>
                </div>
                {selectedModuleFilter !== "ALL" && (
                  <button
                    onClick={() => setSelectedModuleFilter("ALL")}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Hiển thị tất cả 12 phân hệ
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50/60">
                {MODULES_12.filter(
                  (m) => phaseFilter === "ALL" || m.phase === phaseFilter
                ).map((m) => {
                  const isSelected = selectedModuleFilter === m.code;
                  const modTasks = tasks.filter((t) => t.moduleCode === m.code);
                  const doneCount = modTasks.filter(
                    (t) => t.status === "Hoàn thành"
                  ).length;
                  return (
                    <button
                      key={m.code}
                      onClick={() =>
                        setSelectedModuleFilter(isSelected ? "ALL" : m.code)
                      }
                      className={`text-left p-3.5 rounded-xl border transition ${
                        isSelected
                          ? "bg-blue-50/90 border-blue-600 ring-1 ring-blue-600"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {m.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              m.phase === "P0"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {m.phase}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {doneCount}/{modTasks.length} việc
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-2">
                        {m.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        <strong>Dữ liệu:</strong> {m.managedData}
                      </p>
                      <p className="text-xs text-blue-800 mt-1 line-clamp-2">
                        <strong>Quyết định:</strong> {m.decisionServed}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Chủ trì: {m.owner}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 02_VIEC_CAN_LAM */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    02_VIEC_CAN_LAM • Danh sách 58 Công việc có Đầu ra & Nghiệm
                    thu ({filteredTasks.length} việc đang hiển thị)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cập nhật trạng thái thực hiện trực tiếp; tự động lưu trên
                    trình duyệt.
                  </p>
                </div>
                <button
                  onClick={() => exportCsvSpec("tasks")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất 58 Công việc (.CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-3 px-3 font-semibold">Mã việc</th>
                      <th className="py-3 px-3 font-semibold">
                        Công việc & Cách thực hiện
                      </th>
                      <th className="py-3 px-3 font-semibold">Đầu ra</th>
                      <th className="py-3 px-3 font-semibold">
                        Tiêu chí hoàn thành (Nghiệm thu)
                      </th>
                      <th className="py-3 px-3 font-semibold">
                        Chủ trì / Phụ thuộc
                      </th>
                      <th className="py-3 px-3 font-semibold">Pha</th>
                      <th className="py-3 px-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredTasks.map((t) => (
                      <tr key={t.code} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {t.code}
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-bold text-slate-900">
                            {t.title}
                          </div>
                          <div className="text-slate-600 mt-0.5">{t.howTo}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {t.output}
                        </td>
                        <td className="py-3 px-3 text-slate-700 max-w-xs">
                          {t.acceptance}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            {t.owner}
                          </div>
                          {t.dependencies && (
                            <div className="text-[11px] text-slate-500">
                              Phụ thuộc: {t.dependencies}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              t.phase === "P0"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.phase}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={t.status}
                            onChange={(e) =>
                              updateTaskStatus(
                                t.code,
                                e.target.value as TaskItem["status"]
                              )
                            }
                            className={`text-xs font-semibold rounded-lg px-2 py-1 border ${
                              t.status === "Hoàn thành"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                : t.status === "Đang làm"
                                ? "bg-blue-50 border-blue-300 text-blue-800"
                                : "bg-white border-slate-300 text-slate-700"
                            }`}
                          >
                            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                            <option value="Đang làm">Đang làm</option>
                            <option value="Chờ duyệt">Chờ duyệt</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 03 & 04: 37 LOGICAL TABLES & 402 DATA FIELDS
           ========================================================= */}
        {activeSection === "schema_fields" && (
          <div className="space-y-6">
            {/* 03_BANG_DU_LIEU */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    03_BANG_DU_LIEU • Mô hình 37 Bảng Dữ liệu Logic
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bấm vào tên bảng bất kỳ để lọc danh sách các trường của bảng
                    đó trong từ điển 402 trường bên dưới.
                  </p>
                </div>
                {selectedTableFilter !== "ALL" && (
                  <button
                    onClick={() => setSelectedTableFilter("ALL")}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Bỏ lọc bảng ({selectedTableFilter}) → Xem toàn bộ 402 trường
                  </button>
                )}
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Tên bảng</th>
                      <th className="py-2.5 px-3 font-semibold">Nghiệp vụ</th>
                      <th className="py-2.5 px-3 font-semibold">
                        Một dòng đại diện cho (Grain)
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Các khóa / trường đầu
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Chủ dữ liệu</th>
                      <th className="py-2.5 px-3 font-semibold">Pha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {LOGICAL_TABLES_37.filter(
                      (tb) => phaseFilter === "ALL" || tb.phase === phaseFilter
                    ).map((tb) => {
                      const isSel = selectedTableFilter === tb.tableName;
                      return (
                        <tr
                          key={tb.tableName}
                          onClick={() =>
                            setSelectedTableFilter(isSel ? "ALL" : tb.tableName)
                          }
                          className={`cursor-pointer transition ${
                            isSel ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            {tb.tableName}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {tb.domain}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {tb.rowGrain}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {tb.keyFields}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {tb.owner}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                tb.phase === "P0"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {tb.phase}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 04_TRUONG_DU_LIEU */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    04_TRUONG_DU_LIEU • Từ điển {FIELD_DICTIONARY.length} Trường
                    Dữ liệu Chuẩn ({filteredFields.length} trường đang hiển thị)
                  </h2>
                  <p className="text-xs text-slate-500">
                    UUID/ID là mã bền vững; relation là liên kết; unknown khác
                    0.
                  </p>
                </div>
                <button
                  onClick={() => exportCsvSpec("fields")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất 402 Trường (.CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Bảng</th>
                      <th className="py-2.5 px-3 font-semibold">Tên trường</th>
                      <th className="py-2.5 px-3 font-semibold">Kiểu</th>
                      <th className="py-2.5 px-3 font-semibold">Bắt buộc</th>
                      <th className="py-2.5 px-3 font-semibold">
                        Định nghĩa / Quy tắc nghiệp vụ
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Người phụ trách
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Pha</th>
                      <th className="py-2.5 px-3 font-semibold">Phân loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredFields.map((f, i) => (
                      <tr
                        key={`${f.table}-${f.fieldName}-${i}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {f.table}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">
                          {f.fieldName}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-purple-700">
                          {f.dataType}
                        </td>
                        <td className="py-2 px-3">{f.required}</td>
                        <td className="py-2 px-3 text-slate-800">
                          {f.definitionRule}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{f.owner}</td>
                        <td className="py-2 px-3 font-bold">{f.phase}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              f.classification === "Hạn chế"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {f.classification}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 05, 06, 08: 83 METRICS, 20 EVENTS & 8 DASHBOARDS
           ========================================================= */}
        {activeSection === "metrics_events" && (
          <div className="space-y-6">
            {/* 05_CHI_SO */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    05_CHI_SO • Từ điển 83 Chỉ số & Công thức Chuẩn (
                    {filteredMetrics.length} chỉ số)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chỉ bật chỉ số có dữ liệu đúng định nghĩa; mẫu số 0 hoặc
                    thiếu dữ liệu trả về N/A, không tự thay bằng 0.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedMetricGroup}
                    onChange={(e) => setSelectedMetricGroup(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <option value="ALL">Tất cả nhóm chỉ số (17 nhóm)</option>
                    {metricGroups.map((g) => (
                      <option key={g} value={g}>
                        Nhóm: {g}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => exportCsvSpec("metrics")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất 83 Chỉ số (.CSV)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[540px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Mã</th>
                      <th className="py-2.5 px-3 font-semibold">Nhóm</th>
                      <th className="py-2.5 px-3 font-semibold">Tên chỉ số</th>
                      <th className="py-2.5 px-3 font-semibold">
                        Công thức / Định nghĩa
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Đơn vị (Grain) & Nguồn
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Không được diễn giải sai (Guardrail)
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Pha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredMetrics.map((m) => (
                      <tr key={m.code} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                          {m.code}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {m.group}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {m.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-xs">
                          <div>{m.formula}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            ĐK: {m.aggregationRule}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">
                            {m.grain}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Nguồn: {m.sourceOfTruth}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-rose-800 bg-rose-50/40 max-w-xs">
                          {m.guardrail}
                        </td>
                        <td className="py-2.5 px-3 font-bold">{m.phase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 06_SU_KIEN (20 Events) & 08_BAO_CAO (8 Dashboards) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 06_SU_KIEN */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    06_SU_KIEN • Kế hoạch 20 Sự kiện & Bằng chứng (EV01–EV20)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Không gửi PII vào analytics; phân biệt click gọi với cuộc
                    gọi thật.
                  </p>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Mã / Sự kiện</th>
                        <th className="py-2 px-3">Khi kích hoạt</th>
                        <th className="py-2 px-3">Là Lead?</th>
                        <th className="py-2 px-3">Kiểm soát sai số</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {EVENTS_20.map((ev) => (
                        <tr key={ev.code} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <div className="font-mono font-bold text-blue-700">
                              {ev.code} • {ev.eventName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {ev.type}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            {ev.trigger}
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            {ev.isLead}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {ev.errorControl}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 08_BAO_CAO */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    08_BAO_CAO • 8 Báo cáo Phục vụ Quyết định (D01–D08)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mỗi dashboard phải thấy kỳ, nguồn, độ mới, phiên bản định
                    nghĩa và truy ngược được về dòng dữ liệu.
                  </p>
                </div>
                <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                  {DASHBOARDS_8.map((d) => (
                    <div key={d.code} className="p-3.5 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-blue-700">
                          {d.code} • {d.audiencePurpose} ({d.cadence})
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {d.phase}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 mt-1">
                        <strong>Nội dung:</strong> {d.mainContent}
                      </p>
                      <p className="text-xs text-emerald-800 font-medium mt-0.5">
                        <strong>Quyết định cần ra:</strong> {d.decisionToMake}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bộ lọc: {d.filters} | Nguồn: {d.sourceModules}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 07 & 09: 18 LEAD RULES & 8 ROLES PERMISSIONS
           ========================================================= */}
        {activeSection === "rules_roles" && (
          <div className="space-y-6">
            {/* 07_QUY_TAC_LEAD */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  07_QUY_TAC_LEAD • 18 Quy tắc Nhận diện, Fit và Độ nóng
                  (LR01–LR18)
                </h2>
                <p className="text-xs text-slate-500">
                  Không dùng view/like để suy ra xác suất chốt hay danh tính ẩn
                  danh.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <th className="py-2.5 px-3 font-semibold">Mã</th>
                      <th className="py-2.5 px-3 font-semibold">Chủ đề</th>
                      <th className="py-2.5 px-3 font-semibold">Đầu vào</th>
                      <th className="py-2.5 px-3 font-semibold">
                        Quy tắc / Kết quả
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Tự động đến đâu
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Giới hạn (Không suy diễn)
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Pha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {LEAD_RULES_18.map((lr) => (
                      <tr key={lr.code} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                          {lr.code}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {lr.topic}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {lr.input}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-800 bg-emerald-50/50">
                          {lr.ruleResult}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {lr.automationLevel}
                        </td>
                        <td className="py-2.5 px-3 text-rose-800">
                          {lr.limitation}
                        </td>
                        <td className="py-2.5 px-3 font-bold">{lr.phase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 09_PHAN_QUYEN */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  09_PHAN_QUYEN • 8 Vai trò, Trách nhiệm & Ranh giới Bảo mật
                </h2>
                <p className="text-xs text-slate-500">
                  Tách người sản xuất, người xuất bản, người nhập chỉ số và
                  người duyệt. Không mở lead PII cho toàn thực tập sinh.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {ROLES_8.map((r) => (
                  <div
                    key={r.role}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60"
                  >
                    <h3 className="font-bold text-sm text-slate-900">
                      {r.role}
                    </h3>
                    <p className="text-xs text-slate-700 mt-1.5">
                      <strong>Công việc chính:</strong> {r.mainWork}
                    </p>
                    <p className="text-xs text-emerald-800 mt-1">
                      <strong>Quyền xem / dữ liệu:</strong> {r.viewDataAccess}
                    </p>
                    <p className="text-xs text-rose-800 mt-1">
                      <strong>Giới hạn bắt buộc:</strong> {r.limitation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION P0 WORKSPACE: OPERATIONAL INQUIRIES (B07/B08) & CONTENT REGISTRY (B05 + 13_VI_DU_BRIEF)
           ========================================================= */}
        {activeSection === "p0_workspace" && (
          <div className="space-y-6">
            {/* Operational Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-blue-950 space-y-1">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>
                    Không gian Vận hành Thực tế P0 (Tuân thủ 05_CHI_SO &
                    07_QUY_TAC_LEAD)
                  </span>
                </div>
                <p>
                  Tách <code>contact_id</code> (người) và{" "}
                  <code>inquiry_id</code> (yêu cầu). Giữ{" "}
                  <code>acquisition_source = unknown</code> khi khách gọi
                  hotline không rõ nguồn. Các bản ghi gắn nhãn{" "}
                  <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-bold">
                    DEMO
                  </span>{" "}
                  chỉ dùng để kiểm thử ca QA04, QA06, QA07, QA09 — bạn có thể
                  xóa sạch về 0 bất kỳ lúc nào để bắt đầu nhập dữ liệu thật của
                  HacoLED.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setInquiries([])}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa về 0 (Bắt đầu Baseline Thật)</span>
                </button>
                <button
                  onClick={() => setInquiries(DEMO_INQUIRIES)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-300 bg-white text-blue-800 hover:bg-blue-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Nạp lại mẫu QA</span>
                </button>
              </div>
            </div>

            {/* Live Calculated P0 Metrics Bar (D01 & D08) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-mono font-bold text-blue-700">
                  M001 / M002
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Yêu cầu hợp lệ / Nhận
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {liveP0Metrics.m002_validInquiries}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    / {liveP0Metrics.m001_totalReceived}
                  </span>
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-mono font-bold text-blue-700">
                  M003 / M007
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Người duy nhất / Tổ chức
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {liveP0Metrics.m003_uniqueContacts} người{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({liveP0Metrics.m007_uniqueOrgs} TC)
                  </span>
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-mono font-bold text-emerald-700">
                  M004 / M005 / M006
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mới / Đã biết / Unknown
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1.5">
                  <span className="text-emerald-700">
                    {liveP0Metrics.m004_newConfirmed} mới
                  </span>{" "}
                  • {liveP0Metrics.m005_known} cũ •{" "}
                  <span className="text-amber-700">
                    {liveP0Metrics.m006_unknownRel} unk
                  </span>
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-mono font-bold text-purple-700">
                  M009 / M010
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đủ ĐK (Fit=yes) & Tỷ lệ
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {liveP0Metrics.m009_qualifiedContacts}{" "}
                  <span className="text-xs font-semibold text-purple-700">
                    ({liveP0Metrics.m010_fitRate})
                  </span>
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-mono font-bold text-amber-700">
                  M069 / M070 (DQ)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Biết nguồn / Rõ mới-cũ
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1.5">
                  Nguồn: {liveP0Metrics.m069_sourceCoverage} | Mới/cũ:{" "}
                  {liveP0Metrics.m070_knownRelRate}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-mono font-bold text-indigo-700">
                  M055 vs M056
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assets vs Publications
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1.5">
                  {liveP0Metrics.m055_approvedAssets} Asset →{" "}
                  {liveP0Metrics.m056_publishedCount} Lần đăng
                </p>
              </div>
            </div>

            {/* B07/B08 Inquiries & Hotline Log */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    B07 & B08 • Sổ Tiếp nhận Liên hệ (Inquiries / Contacts /
                    Hotline nhẹ)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ghi nhận đúng quy tắc: Không tự gán unknown thành khách mới;
                    không tự gán hotline unknown cho Website/SEO.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportCsvSpec("inquiries")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất CSV</span>
                  </button>
                  <button
                    onClick={() => setShowAddInquiry(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ghi nhận Liên hệ / Hotline mới</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3 font-semibold">
                        inquiry_id / contact_id
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Người liên hệ & Tổ chức
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Kênh nhận & Nguồn thu hút
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Tóm tắt nhu cầu
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Hợp lệ (Validity)
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Mới/Cũ với HacoLED
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        Fit & Độ nóng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inquiries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-slate-500"
                        >
                          Chưa có bản ghi nào (Baseline = 0). Nhấn &ldquo;Ghi
                          nhận Liên hệ / Hotline mới&rdquo; để nhập dữ liệu thực
                          tế đầu tiên.
                        </td>
                      </tr>
                    ) : (
                      inquiries.map((inq) => (
                        <tr key={inq.inquiry_id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-blue-700 flex items-center gap-1.5">
                              <span>{inq.inquiry_id}</span>
                              {inq.is_demo_record && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px]">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Contact: {inq.contact_id}
                            </div>
                            <div className="text-slate-400 text-[10px]">
                              {inq.received_at}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">
                              {inq.contact_name}
                            </div>
                            <div className="text-slate-600">
                              {inq.organization_name} ({inq.organization_type})
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              SĐT: {inq.phone_normalized}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div>
                              Capture:{" "}
                              <strong className="uppercase">
                                {inq.capture_channel}
                              </strong>
                            </div>
                            <div className="mt-0.5">
                              Source:{" "}
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono font-semibold ${
                                  inq.acquisition_source === "unknown"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-blue-50 text-blue-800"
                                }`}
                              >
                                {inq.acquisition_source}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Căn cứ: {inq.source_evidence}
                            </div>
                          </td>
                          <td className="py-3 px-3 max-w-xs text-slate-700">
                            {inq.need_summary}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                inq.validity === "valid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {inq.validity}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                inq.new_to_company_status === "new_confirmed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : inq.new_to_company_status === "known"
                                  ? "bg-slate-200 text-slate-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {inq.new_to_company_status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div>
                              Fit:{" "}
                              <strong
                                className={
                                  inq.fit === "yes"
                                    ? "text-emerald-700"
                                    : inq.fit === "no"
                                    ? "text-rose-700"
                                    : "text-amber-700"
                                }
                              >
                                {inq.fit}
                              </strong>
                            </div>
                            <div>
                              Intent:{" "}
                              <strong className="uppercase">
                                {inq.readiness}
                              </strong>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B05 & 13_VI_DU_BRIEF: Content Brief -> Asset -> Publication */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 13_VI_DU_BRIEF */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    13_VI_DU_BRIEF • Ví dụ Nối Nghiên cứu → Nội dung → Dữ liệu
                    (DEMO-BRIEF-01)
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Mọi tình huống/insight dưới đây là minh họa, không công bố
                    như kết quả nghiên cứu thực của HacoLED.
                  </p>
                </div>
                <div className="divide-y divide-slate-200 max-h-[460px] overflow-y-auto">
                  {DEMO_BRIEF_16.map((row) => (
                    <div
                      key={row.component}
                      className="p-3 hover:bg-slate-50 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {row.component}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {row.note}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-1">{row.sampleContent}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* B05 Asset vs Publication Registry */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    B05 • Sổ Đăng ký Sản phẩm (Assets) & Lần xuất bản
                    (Publications)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quy tắc QA09: 1 video đăng 3 nền tảng = 1{" "}
                    <code>asset_id</code> (M055) và 3{" "}
                    <code>publication_id</code> (M056).
                  </p>
                </div>
                <div className="divide-y divide-slate-200 max-h-[460px] overflow-y-auto p-3 space-y-3">
                  {assets.map((asset) => (
                    <div
                      key={asset.asset_id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-700">
                          {asset.asset_id} • {asset.format}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          Duyệt: {asset.technical_approval}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1">
                        {asset.title}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Người sản xuất: {asset.creator_role} • Giờ làm:{" "}
                        {asset.hours_spent ?? "null"}h
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                        <div className="font-semibold text-slate-700">
                          Các lần xuất bản ({asset.publications.length}{" "}
                          publications):
                        </div>
                        {asset.publications.map((pub) => (
                          <div
                            key={pub.publication_id}
                            className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-slate-200"
                          >
                            <span className="font-mono text-[11px] font-semibold text-purple-700">
                              {pub.publication_id} → {pub.platform}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              Lấy số: {pub.metrics_owner}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SECTION 10 & 14: 24 QA TESTS & FORMULA SANDBOX CALCULATOR
           ========================================================= */}
        {activeSection === "qa_calculator" && (
          <div className="space-y-6">
            {/* 14_VI_DU_CONG_THUC */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      14_VI_DU_CONG_THUC • Bảng Tính Kiểm Thử Công Thức (Dữ liệu
                      Hoàn Toàn Giả Định)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chữ{" "}
                      <span className="text-blue-600 font-bold">
                        xanh dương
                      </span>{" "}
                      là ô nhập/thử. Đen là công thức tự động. Mẫu số 0 hoặc
                      thiếu dữ liệu tự động trả về{" "}
                      <code className="px-1 py-0.5 bg-slate-100 rounded font-bold">
                        N/A
                      </code>
                      .
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setCalcInputs({
                        prevNewContacts: "11",
                        currNewContacts: "14",
                        prevSessions: "1000",
                        currSessions: "1200",
                        prevFormSessions: "11",
                        currFormSessions: "14",
                        impressionsScope: "10000",
                        clicksScope: "250",
                        formStartSessions: "40",
                        formSubmitSessions: "25",
                        adSpendVnd: "0",
                        adAttributedRevVnd: "0",
                        fullEconomicCostVnd: "",
                        qualifiedLeadsCount: "8",
                        fullMeasuredDays: "30",
                        knownSourceContacts: "9",
                      })
                    }
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Khôi phục giá trị gốc (14_VI_DU_CONG_THUC)
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Inputs (Blue cells) */}
                <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                    Ô Nhập Thử Nghiệm (Màu Xanh Dương - Có thể đổi thử về 0 hoặc
                    xóa trống)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Liên hệ mới kỳ trước (người)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.prevNewContacts}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            prevNewContacts: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Liên hệ mới kỳ này (người)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.currNewContacts}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            currNewContacts: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Phiên kỳ trước (phiên)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.prevSessions}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            prevSessions: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Phiên kỳ này (phiên)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.currSessions}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            currSessions: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Phiên có form thành công kỳ trước
                      </label>
                      <input
                        type="number"
                        value={calcInputs.prevFormSessions}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            prevFormSessions: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Phiên có form thành công kỳ này
                      </label>
                      <input
                        type="number"
                        value={calcInputs.currFormSessions}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            currFormSessions: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Hiển thị cùng scope (lượt)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.impressionsScope}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            impressionsScope: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Nhấp cùng scope (lượt)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.clicksScope}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            clicksScope: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Chi Ads (VND - mặc định 0)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.adSpendVnd}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            adSpendVnd: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Chi phí kinh tế đầy đủ (VND - để trống = thiếu)
                      </label>
                      <input
                        type="number"
                        placeholder="Trống = chưa có dữ liệu"
                        value={calcInputs.fullEconomicCostVnd}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            fullEconomicCostVnd: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Lead đủ điều kiện (người)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.qualifiedLeadsCount}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            qualifiedLeadsCount: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-blue-900 mb-1">
                        Liên hệ có nguồn xác định (người)
                      </label>
                      <input
                        type="number"
                        value={calcInputs.knownSourceContacts}
                        onChange={(e) =>
                          setCalcInputs({
                            ...calcInputs,
                            knownSourceContacts: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-blue-300 bg-white text-blue-700 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Formula Outputs (Black cells) */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="py-2 px-3">Chỉ tiêu công thức</th>
                        <th className="py-2 px-3 text-right">Kết quả</th>
                        <th className="py-2 px-3">Đơn vị</th>
                        <th className="py-2 px-3">Diễn giải chuẩn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2 px-3 font-semibold">
                          Chênh lệch tuyệt đối (M073)
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formulaResults.absDiffNew ?? "N/A"}
                        </td>
                        <td className="py-2 px-3">người</td>
                        <td className="py-2 px-3 text-slate-500">
                          Cùng định nghĩa
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">
                          Tăng trưởng tương đối (M074)
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formulaResults.relGrowthNew !== null
                            ? `${(formulaResults.relGrowthNew * 100).toFixed(2)}%`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">tỷ lệ</td>
                        <td className="py-2 px-3 text-slate-500">
                          Kỳ trước = 0 ⇒ N/A (QA12)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">
                          CVR kỳ trước / kỳ này (M038)
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formulaResults.prevCvr !== null
                            ? `${(formulaResults.prevCvr * 100).toFixed(2)}%`
                            : "N/A"}{" "}
                          →{" "}
                          {formulaResults.currCvr !== null
                            ? `${(formulaResults.currCvr * 100).toFixed(2)}%`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">tỷ lệ</td>
                        <td className="py-2 px-3 text-slate-500">
                          Phiên có form / phiên
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">
                          Thay đổi CVR, điểm phần trăm (M075)
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">
                          {formulaResults.cvrPercentagePointDiff !== null
                            ? `${formulaResults.cvrPercentagePointDiff.toFixed(4)} điểm %`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">điểm %</td>
                        <td className="py-2 px-3 text-slate-500">
                          Khác mức tăng tương đối
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">
                          CTR cùng scope (M028)
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formulaResults.ctr !== null
                            ? `${(formulaResults.ctr * 100).toFixed(2)}%`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">tỷ lệ</td>
                        <td className="py-2 px-3 text-slate-500">
                          Tổng click / tổng impression
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">ROAS (M066)</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                          {formulaResults.roas !== null
                            ? `${formulaResults.roas.toFixed(2)}x`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">lần</td>
                        <td className="py-2 px-3 text-slate-500">
                          Không có Ads (0 ₫) ⇒ N/A
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">
                          CPQL đầy đủ (M064)
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                          {formulaResults.cpqlFull !== null
                            ? `${Math.round(formulaResults.cpqlFull).toLocaleString("vi-VN")} ₫`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">VND/người</td>
                        <td className="py-2 px-3 text-slate-500">
                          Thiếu cost ⇒ N/A (không ghi 0)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">
                          Độ bao phủ nguồn (M069)
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formulaResults.srcCoverage !== null
                            ? `${(formulaResults.srcCoverage * 100).toFixed(1)}%`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">tỷ lệ</td>
                        <td className="py-2 px-3 text-slate-500">
                          Còn lại ({formulaResults.unknownSrcCount ?? "N/A"}{" "}
                          người) giữ unknown
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 10_KIEM_THU (24 QA Test Cases) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  10_KIEM_THU • 24 Ca Nghiệm thu Bắt buộc Trước Khi Tin Báo Cáo
                  (QA01–QA24)
                </h2>
                <p className="text-xs text-slate-500">
                  Chạy trên dữ liệu test tách biệt. Hoàn thành khi có bằng chứng
                  kết quả, người kiểm và thời điểm.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <th className="py-2.5 px-3 font-semibold">Mã</th>
                      <th className="py-2.5 px-3 font-semibold">Tình huống</th>
                      <th className="py-2.5 px-3 font-semibold">Cách thử</th>
                      <th className="py-2.5 px-3 font-semibold">
                        Kết quả phải có
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Phân hệ</th>
                      <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
                      <th className="py-2.5 px-3 font-semibold">
                        Bằng chứng / Người kiểm
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {qaTests.map((qa) => (
                      <tr key={qa.code} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                          {qa.code}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {qa.scenario}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {qa.testMethod}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-900 font-medium">
                          {qa.expectedResult}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {qa.moduleCode} ({qa.phase})
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={qa.testStatus || "Chưa chạy"}
                            onChange={(e) =>
                              updateQaStatus(
                                qa.code,
                                e.target.value as QATestCaseItem["testStatus"]
                              )
                            }
                            className={`text-xs font-semibold rounded px-2 py-1 border ${
                              qa.testStatus === "Đạt (Pass)"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                : qa.testStatus === "Cần sửa (Fail)"
                                ? "bg-rose-50 border-rose-300 text-rose-800"
                                : "bg-white border-slate-300 text-slate-700"
                            }`}
                          >
                            <option value="Chưa chạy">Chưa chạy</option>
                            <option value="Đạt (Pass)">Đạt (Pass)</option>
                            <option value="Cần sửa (Fail)">
                              Cần sửa (Fail)
                            </option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="Ghi link/người kiểm/giờ..."
                            value={qa.evidenceNote || ""}
                            onChange={(e) =>
                              updateQaStatus(
                                qa.code,
                                qa.testStatus || "Chưa chạy",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add Inquiry (B07/B08) */}
      {showAddInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Ghi nhận Liên hệ / Hotline Mới (Chuẩn B07-03 & LR01–LR17)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nếu cùng SĐT đã có trong Base, hệ thống tự động gắn vào{" "}
              <code>contact_id</code> cũ để không đếm trùng khách mới (QA04).
            </p>

            <form onSubmit={handleAddInquirySubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên người liên hệ (nếu biết)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Thầy Nam / Chưa rõ"
                    value={newInq.contact_name}
                    onChange={(e) =>
                      setNewInq({ ...newInq, contact_name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại / Định danh kênh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 0912000101"
                    value={newInq.phone_normalized}
                    onChange={(e) =>
                      setNewInq({ ...newInq, phone_normalized: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Tổ chức / Trường học (nếu biết)
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống nếu chưa xác định"
                    value={newInq.organization_name}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        organization_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại tổ chức
                  </label>
                  <select
                    value={newInq.organization_type}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        organization_type:
                          e.target.value as BaseInquiryRecord["organization_type"],
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Trường học">Trường học (Pilot)</option>
                    <option value="Doanh nghiệp">Doanh nghiệp</option>
                    <option value="Nhà thầu">Nhà thầu</option>
                    <option value="Chưa rõ">Chưa rõ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kênh tiếp nhận (Capture)
                  </label>
                  <select
                    value={newInq.capture_channel}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        capture_channel: e.target.value as CaptureChannel,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="hotline">hotline</option>
                    <option value="form">form</option>
                    <option value="zalo">zalo</option>
                    <option value="messenger">messenger</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nguồn thu hút (Source)
                  </label>
                  <select
                    value={newInq.acquisition_source}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        acquisition_source: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="unknown">unknown (Chưa rõ)</option>
                    <option value="SEO">SEO</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bằng chứng nguồn
                  </label>
                  <select
                    value={newInq.source_evidence}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        source_evidence:
                          e.target.value as BaseInquiryRecord["source_evidence"],
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="unknown">unknown</option>
                    <option value="UTM">UTM</option>
                    <option value="Nền tảng">Nền tảng</option>
                    <option value="Khách nói">Khách nói</option>
                    <option value="Sales xác nhận">Sales xác nhận</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mới/Cũ với HacoLED (LR05)
                  </label>
                  <select
                    value={newInq.new_to_company_status}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        new_to_company_status:
                          e.target.value as NewToCompanyStatus,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="unknown">unknown (Chưa xác minh)</option>
                    <option value="new_confirmed">
                      new_confirmed (Mới XN)
                    </option>
                    <option value="known">known (Khách cũ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đánh giá Fit (LR07/LR08)
                  </label>
                  <select
                    value={newInq.fit}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        fit: e.target.value as FitStatus,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="unknown">unknown</option>
                    <option value="yes">yes (Phù hợp giải pháp)</option>
                    <option value="no">no (Mua lẻ module/ngoài PV)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Độ nóng (LR09–LR11)
                  </label>
                  <select
                    value={newInq.readiness}
                    onChange={(e) =>
                      setNewInq({
                        ...newInq,
                        readiness: e.target.value as ReadinessStatus,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="unknown">unknown</option>
                    <option value="hot">hot (Nóng - có bước tiếp)</option>
                    <option value="warm">warm (Ấm - đang tìm hiểu)</option>
                    <option value="cold">cold (Lạnh)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tóm tắt nhu cầu thực tế
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi ngắn gọn lời khách hỏi..."
                  value={newInq.need_summary}
                  onChange={(e) =>
                    setNewInq({ ...newInq, need_summary: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddInquiry(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Lưu vào Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            <strong>HACOLED | MARKETING BASE • V1.0 • 24/10/2026</strong> — Bộ
            thiết kế & Vận hành Nghiệp vụ và Dữ liệu
          </span>
          <span>
            12 Phân hệ • 58 Việc • 37 Bảng • 402 Trường • 83 Chỉ số • 24 Ca
            Nghiệm thu
          </span>
        </div>
      </footer>
    </div>
  );
}
