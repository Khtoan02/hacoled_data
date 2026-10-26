"use client";

import React, { useState, useRef } from "react";
import {
  SURVEY_QUESTIONS,
  SurveyResponse,
  SurveyQuestion,
} from "../../lib/survey-store";

type Step = "intro" | "form" | "done";

type AnswerValue = string | string[] | Record<string, string>;

// ─── Question Renderers ──────────────────────────────────────────────────────

function TextShortQuestion({
  q,
  value,
  onChange,
  hasError,
}: {
  q: SurveyQuestion;
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) {
  return (
    <input
      id={`input-${q.id}`}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={q.placeholder || ""}
      className={`w-full px-4 py-3 rounded-xl border text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all ${
        hasError
          ? "border-rose-300 bg-rose-50/30 focus:ring-rose-300"
          : value?.trim()
          ? "border-emerald-300 bg-emerald-50/20 focus:ring-emerald-400"
          : "border-zinc-200 bg-zinc-50/50 focus:ring-zinc-900 focus:border-zinc-900 focus:bg-white"
      }`}
    />
  );
}

function TextLongQuestion({
  q,
  value,
  onChange,
  hasError,
}: {
  q: SurveyQuestion;
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) {
  return (
    <>
      <textarea
        id={`input-${q.id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder || ""}
        rows={4}
        className={`w-full px-4 py-3 rounded-xl border text-sm text-zinc-900 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 transition-all leading-relaxed ${
          hasError
            ? "border-rose-300 bg-rose-50/30 focus:ring-rose-300"
            : value?.trim()
            ? "border-emerald-300 bg-emerald-50/20 focus:ring-emerald-400"
            : "border-zinc-200 bg-zinc-50/50 focus:ring-zinc-900 focus:border-zinc-900 focus:bg-white"
        }`}
      />
      {value?.trim() && (
        <p className="mt-1.5 text-right text-[11px] text-zinc-400">
          {value.length} ký tự
        </p>
      )}
    </>
  );
}

function SelectSingleQuestion({
  q,
  value,
  onChange,
}: {
  q: SurveyQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {(q.options || []).map((opt) => {
        const isSelected = value === opt;
        return (
          <label
            key={opt}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
              isSelected
                ? "border-zinc-900 bg-zinc-50 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50"
            }`}
          >
            <input
              type="radio"
              name={q.id}
              value={opt}
              checked={isSelected}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            <span
              className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "border-zinc-950 bg-zinc-950"
                  : "border-zinc-400 bg-white"
              }`}
            >
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </span>
            <span className="text-sm text-zinc-800 font-medium">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function SelectMultiQuestion({
  q,
  value,
  onChange,
}: {
  q: SurveyQuestion;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const maxSelect = q.maxSelect || 99;
  const hasOther = value.some((v) => v.startsWith("__other__:"));
  const otherText = hasOther
    ? value.find((v) => v.startsWith("__other__:"))?.replace("__other__:", "") || ""
    : "";

  const toggleOption = (opt: string) => {
    if (opt === "Khác (ghi rõ ở ô bên dưới)" || opt === "Khác") {
      // Toggle "other" mode
      if (hasOther) {
        onChange(value.filter((v) => !v.startsWith("__other__:")));
      } else {
        if (value.length >= maxSelect) return;
        onChange([...value, "__other__:"]);
      }
      return;
    }
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      if (value.length >= maxSelect) return;
      onChange([...value, opt]);
    }
  };

  const handleOtherText = (text: string) => {
    const withoutOther = value.filter((v) => !v.startsWith("__other__:"));
    onChange([...withoutOther, `__other__:${text}`]);
  };

  const selectedCount = value.filter((v) => v !== "").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">
          Chọn tối đa {maxSelect} lựa chọn
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            selectedCount > 0
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          Đã chọn {selectedCount}/{maxSelect}
        </span>
      </div>
      <div className="space-y-2">
        {(q.options || []).map((opt) => {
          const isOtherOpt = opt === "Khác (ghi rõ ở ô bên dưới)" || opt === "Khác";
          const isChecked = isOtherOpt ? hasOther : value.includes(opt);
          const isDisabled =
            !isChecked && selectedCount >= maxSelect;

          return (
            <label
              key={opt}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed border-zinc-200 bg-zinc-50"
                  : isChecked
                  ? "border-zinc-900 bg-zinc-50 shadow-sm"
                  : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => !isDisabled && toggleOption(opt)}
                className="sr-only"
              />
              <span
                className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  isChecked
                    ? "border-zinc-950 bg-zinc-950"
                    : "border-zinc-400 bg-white"
                }`}
              >
                {isChecked && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 10 8"
                  >
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm text-zinc-800 font-medium">{opt}</span>
            </label>
          );
        })}
      </div>
      {hasOther && (
        <div className="mt-3">
          <textarea
            value={otherText}
            onChange={(e) => handleOtherText(e.target.value)}
            placeholder={q.placeholder || "Ghi rõ vướng mắc khác của bạn..."}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 text-sm text-zinc-900 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white transition-all"
          />
        </div>
      )}
    </div>
  );
}

function MatrixQuestion({
  q,
  value,
  onChange,
}: {
  q: SurveyQuestion;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const rows = q.matrixRows || [];
  const cols = q.matrixCols || [];

  const handleSelect = (row: string, col: string) => {
    onChange({ ...value, [row]: col });
  };

  const answeredCount = Object.keys(value).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500">Chọn một mức cho mỗi công việc</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          answeredCount === rows.length ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-500"
        }`}>
          {answeredCount}/{rows.length} đã chọn
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="text-left py-3 px-4 font-medium text-zinc-600 text-xs w-2/5">
                Công việc
              </th>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className="text-center py-3 px-2 font-medium text-zinc-600 text-xs"
                >
                  <span className="inline-flex flex-col items-center gap-0.5">
                    <span className="font-bold text-zinc-950">{col.key}</span>
                    <span className="text-[10px] font-normal text-zinc-500 whitespace-nowrap">
                      {col.label.split(" — ")[1]}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row} className={`transition-colors ${value[row] ? "bg-emerald-50/30" : "bg-white hover:bg-zinc-50/50"}`}>
                <td className="py-3 px-4 text-xs font-medium text-zinc-800 leading-snug">
                  {row}
                </td>
                {cols.map((col) => {
                  const isSelected = value[row] === col.key;
                  return (
                    <td key={col.key} className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleSelect(row, col.key)}
                        className={`w-8 h-8 rounded-lg border-2 font-bold text-xs transition-all ${
                          isSelected
                            ? "border-zinc-950 bg-zinc-950 text-white shadow"
                            : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {col.key}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {rows.map((row) => (
          <div key={row} className="bg-white rounded-xl border border-zinc-200 p-3">
            <p className="text-xs font-semibold text-zinc-800 mb-2 leading-snug">{row}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {cols.map((col) => {
                const isSelected = value[row] === col.key;
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => handleSelect(row, col.key)}
                    className={`py-2 rounded-lg border-2 font-bold text-xs transition-all flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-500"
                    }`}
                  >
                    <span>{col.key}</span>
                  </button>
                );
              })}
            </div>
            {value[row] && (
              <p className="text-[10px] text-emerald-700 font-medium mt-1.5">
                ✓ Đã chọn: {cols.find((c) => c.key === value[row])?.label}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SurveyPage() {
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const handleAnswer = (qId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const isAnswered = (q: SurveyQuestion): boolean => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (typeof ans === "string") return ans.trim().length > 0;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === "object") {
      // matrix: check all rows answered
      const rows = q.matrixRows || [];
      return rows.every((row) => !!(ans as Record<string, string>)[row]);
    }
    return false;
  };

  const handleStartSurvey = () => {
    if (!name.trim()) {
      setNameError("Bạn ơi, hãy điền tên trước nhé!");
      return;
    }
    setNameError("");
    setStep("form");
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    SURVEY_QUESTIONS.forEach((q) => {
      if (q.required && !isAnswered(q)) {
        newErrors[q.id] = "Câu này cần điền để mình hiểu bạn hơn nhé!";
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrId = Object.keys(newErrors)[0];
      document
        .getElementById(`q-${firstErrId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    const response: SurveyResponse = {
      response_id: `RESP-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,
      respondent_name: name.trim(),
      submitted_at: new Date().toISOString(),
      answers,
    };
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitting(false);
        setStep("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitting(false);
        alert("Có lỗi khi lưu câu trả lời: " + (data.error || "Vui lòng thử lại."));
      }
    } catch {
      setSubmitting(false);
      alert("Không thể kết nối server. Vui lòng thử lại.");
    }
  };

  const answeredCount = SURVEY_QUESTIONS.filter((q) => isAnswered(q)).length;
  const progress = Math.round((answeredCount / SURVEY_QUESTIONS.length) * 100);

  // Group questions by section for display
  const sections = SURVEY_QUESTIONS.reduce<Record<string, { label: string; questions: SurveyQuestion[] }>>(
    (acc, q) => {
      if (!acc[q.section]) {
        acc[q.section] = { label: q.sectionLabel, questions: [] };
      }
      acc[q.section].questions.push(q);
      return acc;
    },
    {}
  );

  // ─── INTRO ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-100 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-sm shadow">
              HL
            </div>
            <span className="font-semibold text-zinc-900 tracking-tight">
              HacoLED Team
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 sm:p-10">
            <div className="mb-6">
              <span className="inline-block text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-3">
                Khảo sát nội bộ · 5W1H
              </span>
              <h1 className="text-2xl font-bold text-zinc-950 leading-snug mb-3">
                Để mình hiểu bạn hơn 🙂
              </h1>
              <p className="text-zinc-600 leading-relaxed text-[15px]">
                Khảo sát này giúp mình — với tư cách lead — nắm bắt được tình
                hình thực tế của từng người trong team: bạn là ai, đang làm
                gì, vì sao, ở đâu, khi nào và như thế nào.
              </p>
            </div>

            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 mb-7 space-y-2.5">
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">📋</span>
                <span>
                  <strong>26 câu hỏi</strong> bao gồm câu viết tự do, lựa
                  chọn và bảng đánh giá kỹ năng.
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">🔒</span>
                <span>
                  Câu trả lời chỉ lead xem —{" "}
                  <strong>không chia sẻ với ai khác</strong>.
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">⏱️</span>
                <span>
                  Mất khoảng <strong>20–30 phút</strong> để điền đầy đủ.
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">💬</span>
                <span>
                  Hãy viết thật như đang nói chuyện —{" "}
                  <strong>càng cụ thể càng tốt</strong>.
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-zinc-800 mb-2">
                Trước tiên, bạn tên là gì?{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleStartSurvey()}
                placeholder="Điền tên của bạn vào đây..."
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                  nameError
                    ? "border-rose-400 bg-rose-50 focus:ring-rose-300"
                    : "border-zinc-300 bg-white focus:ring-zinc-900 focus:border-zinc-900"
                }`}
                autoFocus
              />
              {nameError && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {nameError}
                </p>
              )}
            </div>

            <button
              onClick={handleStartSurvey}
              className="w-full py-3.5 rounded-xl bg-zinc-950 text-white font-semibold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 shadow"
            >
              Bắt đầu khảo sát →
            </button>
          </div>

          <p className="text-center text-xs text-zinc-400 mt-5">
            HacoLED Marketing Team · {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>
    );
  }

  // ─── DONE ────────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-zinc-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-4xl mb-6 shadow-sm">
            🎉
          </div>
          <h1 className="text-2xl font-bold text-zinc-950 mb-3">
            Cảm ơn bạn, {name}!
          </h1>
          <p className="text-zinc-600 text-[15px] leading-relaxed mb-8">
            Mình đã nhận được câu trả lời của bạn. Thông tin này rất có giá
            trị để mình hiểu và hỗ trợ bạn tốt hơn trong thời gian tới.
          </p>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 mb-6 text-left">
            <p className="text-sm font-semibold text-zinc-800 mb-3">
              Bạn đã trả lời {answeredCount}/{SURVEY_QUESTIONS.length} câu hỏi
            </p>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => window.close()}
            className="text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors"
          >
            Đóng trang này
          </button>
        </div>
      </div>
    );
  }

  // ─── FORM ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50/80" ref={topRef}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-zinc-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-xs">
              HL
            </div>
            <span className="text-sm font-semibold text-zinc-900">
              Khảo sát Team · {name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-28 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {answeredCount}/{SURVEY_QUESTIONS.length}
            </span>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-zinc-950 mb-1.5">
            Hãy chia sẻ thật tự nhiên nhé, {name} 😊
          </h2>
          <p className="text-sm text-zinc-500">
            Không có câu trả lời đúng hay sai — mình muốn nghe suy nghĩ thật
            của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          {Object.entries(sections).map(([sectionKey, section]) => (
            <div key={sectionKey}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-bold font-mono">
                  {sectionKey}
                </div>
                <div>
                  <p className="text-base font-bold text-zinc-950">
                    {section.label}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {section.questions.map((q) => {
                  const rawAnswer = answers[q.id];
                  const hasError = !!errors[q.id];

                  return (
                    <div
                      key={q.id}
                      id={`q-${q.id}`}
                      className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                        hasError
                          ? "border-rose-300 shadow-rose-100/50"
                          : "border-zinc-200"
                      }`}
                    >
                      {/* Question number + required badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold shrink-0">
                          {q.number}
                        </span>
                        {q.required ? (
                          <span className="text-[10px] font-semibold tracking-wider text-rose-500 uppercase">
                            Bắt buộc
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                            Tùy chọn
                          </span>
                        )}
                      </div>

                      {/* Question label */}
                      <label
                        htmlFor={`input-${q.id}`}
                        className="block text-[15px] font-semibold text-zinc-900 leading-snug mb-2"
                      >
                        {q.label}
                      </label>

                      {/* Description */}
                      {q.description && (
                        <p className="text-xs text-zinc-500 mb-4 leading-relaxed whitespace-pre-line">
                          {q.description}
                        </p>
                      )}

                      {/* Input by type */}
                      {q.type === "text_short" && (
                        <TextShortQuestion
                          q={q}
                          value={(rawAnswer as string) || ""}
                          onChange={(v) => handleAnswer(q.id, v)}
                          hasError={hasError}
                        />
                      )}

                      {q.type === "text_long" && (
                        <TextLongQuestion
                          q={q}
                          value={(rawAnswer as string) || ""}
                          onChange={(v) => handleAnswer(q.id, v)}
                          hasError={hasError}
                        />
                      )}

                      {q.type === "select_single" && (
                        <SelectSingleQuestion
                          q={q}
                          value={(rawAnswer as string) || ""}
                          onChange={(v) => handleAnswer(q.id, v)}
                        />
                      )}

                      {q.type === "select_multi" && (
                        <SelectMultiQuestion
                          q={q}
                          value={(rawAnswer as string[]) || []}
                          onChange={(v) => handleAnswer(q.id, v)}
                        />
                      )}

                      {q.type === "matrix" && (
                        <MatrixQuestion
                          q={q}
                          value={(rawAnswer as Record<string, string>) || {}}
                          onChange={(v) => handleAnswer(q.id, v)}
                        />
                      )}

                      {/* Error message */}
                      {hasError && (
                        <p className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
                          <span>⚠️</span>
                          {errors[q.id]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div className="pt-4 pb-16">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-zinc-950 text-white font-semibold text-[15px] hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                "Gửi khảo sát 🚀"
              )}
            </button>
            <p className="text-center text-xs text-zinc-400 mt-3">
              Nhấn gửi là xong — câu trả lời được lưu ngay lập tức.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
