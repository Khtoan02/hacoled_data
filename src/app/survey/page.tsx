"use client";

import React, { useState, useRef } from "react";
import {
  SURVEY_QUESTIONS,
  saveSurveyResponse,
  SurveyResponse,
} from "../../lib/survey-store";

type Step = "intro" | "form" | "done";

export default function SurveyPage() {
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const handleAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    SURVEY_QUESTIONS.forEach((q) => {
      if (q.required && !answers[q.id]?.trim()) {
        newErrors[q.id] = "Câu này cần thiết để mình hiểu bạn hơn, điền vào nhé!";
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrId = Object.keys(newErrors)[0];
      document.getElementById(`q-${firstErrId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    const response: SurveyResponse = {
      response_id: `RESP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      respondent_name: name.trim(),
      submitted_at: new Date().toISOString(),
      answers,
    };
    saveSurveyResponse(response);
    setTimeout(() => {
      setSubmitting(false);
      setStep("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 600);
  };

  const answeredCount = SURVEY_QUESTIONS.filter((q) => answers[q.id]?.trim()).length;
  const progress = Math.round((answeredCount / SURVEY_QUESTIONS.length) * 100);

  // ─── INTRO SCREEN ───────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-100 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-sm shadow">
              HL
            </div>
            <span className="font-semibold text-zinc-900 tracking-tight">HacoLED Team</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 sm:p-10">
            <div className="mb-6">
              <span className="inline-block text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-3">
                Khảo sát nội bộ
              </span>
              <h1 className="text-2xl font-bold text-zinc-950 leading-snug mb-3">
                Để mình hiểu bạn hơn 🙂
              </h1>
              <p className="text-zinc-600 leading-relaxed text-[15px]">
                Khảo sát này giúp mình — với tư cách lead — nắm bắt được tình hình
                thực tế của từng người trong team: bạn đang làm gì, cần gì, và muốn
                phát triển theo hướng nào.
              </p>
            </div>

            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 mb-7 space-y-2.5">
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">✍️</span>
                <span>Tất cả câu hỏi đều là <strong>tự viết</strong> — không có ô tick, không có đáp án đúng sai.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">🔒</span>
                <span>Câu trả lời của bạn chỉ mình (lead) xem — <strong>không chia sẻ với ai khác</strong> trong team.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">⏱️</span>
                <span>Mất khoảng <strong>10–15 phút</strong> để điền xong.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-700">
                <span className="text-base mt-0.5">💬</span>
                <span>Hãy viết thật như đang nói chuyện — <strong>càng cụ thể càng tốt</strong>.</span>
              </div>
            </div>

            {/* Name input */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-zinc-800 mb-2">
                Trước tiên, bạn tên là gì? <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
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
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{nameError}</p>
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

  // ─── DONE SCREEN ────────────────────────────────────────────────────────────
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
            Mình đã nhận được câu trả lời của bạn. Thông tin này rất có giá trị để
            mình hiểu và hỗ trợ bạn tốt hơn trong thời gian tới.
          </p>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-6 text-left space-y-3">
            <p className="text-sm font-semibold text-zinc-800">Bạn vừa chia sẻ:</p>
            {SURVEY_QUESTIONS.map((q) =>
              answers[q.id]?.trim() ? (
                <div key={q.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  <p className="text-xs text-zinc-400 mb-0.5">{q.label.slice(0, 60)}...</p>
                  <p className="text-sm text-zinc-700 leading-relaxed line-clamp-2">{answers[q.id]}</p>
                </div>
              ) : null
            )}
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

  // ─── FORM SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50/80" ref={topRef}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-zinc-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-xs">
              HL
            </div>
            <span className="text-sm font-semibold text-zinc-900">Khảo sát Team · {name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-28 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 font-mono">{answeredCount}/{SURVEY_QUESTIONS.length}</span>
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
            Không có câu trả lời đúng hay sai — mình muốn nghe suy nghĩ thật của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {SURVEY_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                errors[q.id] ? "border-rose-300 shadow-rose-100/50" : "border-zinc-200"
              }`}
            >
              {/* Question number + required badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                {q.required && (
                  <span className="text-[10px] font-semibold tracking-wider text-rose-500 uppercase">
                    Bắt buộc
                  </span>
                )}
                {!q.required && (
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

              {/* Hint */}
              {q.hint && (
                <p className="text-xs text-zinc-400 mb-3 italic">{q.hint}</p>
              )}

              {/* Textarea */}
              <textarea
                id={`input-${q.id}`}
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-zinc-900 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                  errors[q.id]
                    ? "border-rose-300 bg-rose-50/30 focus:ring-rose-300"
                    : answers[q.id]?.trim()
                    ? "border-emerald-300 bg-emerald-50/20 focus:ring-emerald-400"
                    : "border-zinc-200 bg-zinc-50/50 focus:ring-zinc-900 focus:border-zinc-900 focus:bg-white"
                }`}
              />

              {/* Error message */}
              {errors[q.id] && (
                <p className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <span>⚠️</span>
                  {errors[q.id]}
                </p>
              )}

              {/* Char count when typing */}
              {answers[q.id]?.trim() && (
                <p className="mt-1.5 text-right text-[11px] text-zinc-400">
                  {answers[q.id].length} ký tự
                </p>
              )}
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
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
