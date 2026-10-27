"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "../../../components/dashboard/shell";
import {
  exportResponsesAsJson,
  exportResponsesAsCsv,
  SurveyResponse,
  SURVEY_QUESTIONS,
  getAnswerText,
} from "../../../lib/survey-store";

type AdminView = "overview" | "detail";

export default function AdminSurveyPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<AdminView>("overview");
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [filterName, setFilterName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [loading, setLoading] = useState(false);

  const fetchResponses = () => {
    setLoading(true);
    fetch(`/api/survey?t=${Date.now()}`, { cache: "no-store" })
      .then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Không tải được dữ liệu"); return data; })
      .then((data) => {
        setResponses(data.responses || []);
        setIsLoaded(true);
        setLoading(false);
      })
      .catch((error) => {
        setNotice({ type: "error", text: error.message || "Không tải được dữ liệu khảo sát." });
        setIsLoaded(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchResponses();
  }, [router]);

  const notify = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  };

  const filtered = useMemo(
    () =>
      filterName.trim()
        ? responses.filter((r) =>
            r.respondent_name.toLowerCase().includes(filterName.toLowerCase())
          )
        : responses,
    [responses, filterName]
  );

  const handleDelete = (responseId: string, name: string) => {
    if (!window.confirm(`Xóa câu trả lời của "${name}"? Không thể khôi phục.`)) return;
    setDeletingId(responseId);
    fetch(`/api/survey?id=${responseId}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((data) => {
        setDeletingId(null);
        if (data.ok) {
          setResponses((prev) => prev.filter((r) => r.response_id !== responseId));
          if (selectedResponse?.response_id === responseId) {
            setSelectedResponse(null);
            setView("overview");
          }
          notify("success", `Đã xóa câu trả lời của "${name}".`);
        } else {
          notify("error", "Xóa thất bại, vui lòng thử lại.");
        }
      })
      .catch(() => {
        setDeletingId(null);
        notify("error", "Lỗi kết nối server.");
      });
  };

  const handleViewDetail = (r: SurveyResponse) => {
    setSelectedResponse(r);
    setView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tính thống kê tổng quan
  const stats = useMemo(() => {
    const total = responses.length;
    const avgAnswerLength =
      total === 0
        ? 0
        : Math.round(
            responses.reduce((sum, r) => {
              const totalLen = Object.values(r.answers).reduce(
                (s, a) => s + (getAnswerText(a)?.length || 0),
                0
              );
              return sum + totalLen / Math.max(1, Object.keys(r.answers).length);
            }, 0) / total
          );
    const latestDate =
      total > 0
        ? new Date(
            Math.max(...responses.map((r) => new Date(r.submitted_at).getTime()))
          ).toLocaleDateString("vi-VN")
        : "—";
    return { total, avgAnswerLength, latestDate };
  }, [responses]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-400 text-sm">Đang tải...</div>
      </div>
    );
  }

  return (
    <DashboardShell title="Khảo sát đội ngũ" description="Lắng nghe đội ngũ, hiểu nguồn lực và định hướng phát triển.">
    <div className="legacy-workspace text-zinc-900">
      {/* Toast */}
      {notice && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            notice.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Header */}
      <header className="bg-white rounded-xl border border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-14 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
              HL
            </div>
            <div>
              <span className="font-semibold text-sm text-zinc-950">Kết quả Khảo sát Team</span>
              <span className="ml-2 text-xs text-zinc-400 font-normal hidden sm:inline">
                · Chỉ Lead xem
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-mono font-semibold text-zinc-700">
              {stats.total} phản hồi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchResponses}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all"
              title="Làm mới dữ liệu"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              ← Admin
            </button>
            <a
              href="/survey"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              🔗 Link khảo sát
            </a>
            {responses.length > 0 && (
              <>
                <button
                  onClick={() => exportResponsesAsCsv(responses)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  ↓ CSV
                </button>
                <button
                  onClick={() => exportResponsesAsJson(responses)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  ↓ JSON
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="py-6">
        {/* ── DETAIL VIEW ── */}
        {view === "detail" && selectedResponse && (
          <div>
            <button
              onClick={() => { setView("overview"); setSelectedResponse(null); }}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
            >
              ← Quay lại danh sách
            </button>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              {/* Respondent header */}
              <div className="px-6 py-5 border-b border-zinc-100 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                      {selectedResponse.respondent_name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-lg font-bold text-zinc-950">
                      {selectedResponse.respondent_name}
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono ml-11">
                    {selectedResponse.response_id} ·{" "}
                    {new Date(selectedResponse.submitted_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(selectedResponse.response_id, selectedResponse.respondent_name)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-50 transition-colors"
                >
                  Xóa
                </button>
              </div>

              {/* Q&A */}
              <div className="divide-y divide-zinc-100">
                {SURVEY_QUESTIONS.map((q, idx) => {
                  const ans = selectedResponse.answers[q.id];
                  const ansText = getAnswerText(ans);
                  return (
                    <div key={q.id} className="px-6 py-5">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                          {q.required ? "Bắt buộc" : "Tùy chọn"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-800 mb-2 leading-snug">
                        {q.label}
                      </p>
                      {ansText?.trim() ? (
                        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4">
                          <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
                            {ansText}
                          </p>
                          <p className="text-right text-[11px] text-zinc-400 mt-2">
                            {ansText.length} ký tự
                          </p>
                        </div>
                      ) : (
                        <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 px-4 py-3">
                          <p className="text-sm text-zinc-400 italic">Không trả lời</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── OVERVIEW VIEW ── */}
        {view === "overview" && (
          <div>
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Tổng phản hồi", value: stats.total, icon: "👥" },
                { label: "Câu trả lời gần nhất", value: stats.latestDate, icon: "🕐" },
                { label: "Độ dài TB / câu", value: stats.avgAnswerLength > 0 ? `~${stats.avgAnswerLength} ký tự` : "—", icon: "✍️" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm"
                >
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-xl font-bold text-zinc-950">{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick-view: mỗi câu hỏi - tổng hợp tất cả câu trả lời */}
            {responses.length > 0 && (
              <div className="mb-10">
                <h2 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <span className="inline-block w-1 h-4 rounded bg-zinc-900" />
                  Tổng hợp theo câu hỏi
                </h2>
                <div className="space-y-4">
                  {SURVEY_QUESTIONS.map((q, idx) => {
                    const answersList = responses
                      .map((r) => ({ name: r.respondent_name, ans: getAnswerText(r.answers[q.id]) }))
                      .filter((a) => a.ans?.trim());
                    return (
                      <div
                        key={q.id}
                        className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
                      >
                        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-baseline gap-2">
                          <span className="text-xs font-bold text-zinc-400 font-mono">
                            #{idx + 1}
                          </span>
                          <p className="text-sm font-semibold text-zinc-800 leading-snug">{q.label}</p>
                        </div>
                        {answersList.length === 0 ? (
                          <div className="px-5 py-4 text-sm text-zinc-400 italic">
                            Chưa có ai trả lời câu này.
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-50">
                            {answersList.map((a, i) => (
                              <div key={i} className="px-5 py-3.5 flex gap-3 items-start">
                                <div className="shrink-0 h-6 w-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                                  {a.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-zinc-500 mb-0.5">{a.name}</p>
                                  <p className="text-sm text-zinc-800 leading-relaxed break-words line-clamp-3">
                                    {getAnswerText(a.ans)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Responses list */}
            <div>
              <div className="flex items-center justify-between mb-4 gap-4">
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span className="inline-block w-1 h-4 rounded bg-zinc-900" />
                  Xem theo người ({filtered.length})
                </h2>
                <input
                  type="search"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Tìm tên..."
                  className="w-40 sm:w-52 px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              {filtered.length === 0 && responses.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-zinc-500 font-medium mb-2">Chưa có câu trả lời nào</p>
                  <p className="text-sm text-zinc-400 mb-6">
                    Hãy chia sẻ link khảo sát với team để bắt đầu thu thập.
                  </p>
                  <a
                    href="/survey"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    🔗 Mở trang khảo sát
                  </a>
                </div>
              )}

              {filtered.length === 0 && responses.length > 0 && (
                <div className="text-center py-10 text-zinc-400 text-sm">
                  Không tìm thấy kết quả cho &ldquo;{filterName}&rdquo;
                </div>
              )}

              <div className="space-y-3">
                {filtered
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.submitted_at).getTime() -
                      new Date(a.submitted_at).getTime()
                  )
                  .map((r) => {
                    const answeredCount = SURVEY_QUESTIONS.filter(
                      (q) => getAnswerText(r.answers[q.id])?.trim()
                    ).length;
                    const completePct = Math.round(
                      (answeredCount / SURVEY_QUESTIONS.length) * 100
                    );
                    const isDeleting = deletingId === r.response_id;
                    return (
                      <div
                        key={r.response_id}
                        className={`bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex items-center gap-4 transition-all ${
                          isDeleting ? "opacity-40 scale-[0.98]" : ""
                        }`}
                      >
                        {/* Avatar */}
                        <div className="shrink-0 h-10 w-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                          {r.respondent_name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm text-zinc-950 truncate">
                              {r.respondent_name}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                completePct === 100
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {completePct}%
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            {new Date(r.submitted_at).toLocaleString("vi-VN")} ·{" "}
                            {answeredCount}/{SURVEY_QUESTIONS.length} câu
                          </p>
                          {/* Preview first answer */}
                          {getAnswerText(r.answers[SURVEY_QUESTIONS[0].id]) && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-1 italic">
                              &ldquo;{getAnswerText(r.answers[SURVEY_QUESTIONS[0].id])}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(r)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => handleDelete(r.response_id, r.respondent_name)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 text-xs font-medium hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Survey link CTA */}
            <div className="mt-10 bg-zinc-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold mb-1">Chia sẻ link khảo sát cho team</p>
                <p className="text-sm text-zinc-400">
                  Gửi link này để mọi người điền:&nbsp;
                  <code className="text-cyan-300 font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">
                    {typeof window !== "undefined" ? window.location.origin : ""}/survey
                  </code>
                </p>
              </div>
              <a
                href="/survey"
                target="_blank"
                className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100 transition-colors"
              >
                Mở trang khảo sát →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardShell>
  );
}
