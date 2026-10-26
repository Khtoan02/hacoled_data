/**
 * HacoLED Team Survey Store
 * Lưu trữ câu hỏi khảo sát & kết quả trả lời của team (localStorage-based)
 */

export interface SurveyQuestion {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  hint?: string;
}

/** Danh sách câu hỏi khảo sát — tất cả dạng open-text để nắm được tính cá nhân */
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q_role_feel",
    label: "Bạn đang làm công việc gì trong team? Hãy mô tả theo cách bạn hiểu nhất về vai trò của mình.",
    placeholder: "Ví dụ: Mình phụ trách viết nội dung cho Facebook và hỗ trợ quay video ngắn...",
    required: true,
    hint: "Không cần dùng title chính thức, cứ viết thật tự nhiên.",
  },
  {
    id: "q_strength",
    label: "Điều gì bạn cảm thấy mình đang làm tốt nhất trong công việc hiện tại?",
    placeholder: "Ví dụ: Mình nghĩ mình viết caption khá tốt, biết cách thu hút người đọc...",
    required: true,
    hint: "Hãy cụ thể, không cần khiêm tốn.",
  },
  {
    id: "q_struggle",
    label: "Điều gì bạn đang gặp khó khăn hoặc cảm thấy chưa tự tin? Lý do là gì?",
    placeholder: "Ví dụ: Mình vẫn chưa hiểu rõ cách đọc số liệu analytics, không biết bắt đầu từ đâu...",
    required: true,
    hint: "Đây là thông tin quan trọng để mình hỗ trợ bạn tốt hơn.",
  },
  {
    id: "q_need_support",
    label: "Bạn cần được hỗ trợ gì từ lead hoặc từ team để làm việc hiệu quả hơn?",
    placeholder: "Ví dụ: Mình cần được giải thích rõ hơn về mục tiêu của từng chiến dịch trước khi bắt tay vào làm...",
    required: true,
    hint: "Hỗ trợ về kỹ năng, công cụ, quy trình, thông tin... đều được.",
  },
  {
    id: "q_idea",
    label: "Nếu có thể thay đổi một điều trong cách team đang hoạt động, bạn muốn thay đổi gì?",
    placeholder: "Ví dụ: Mình nghĩ nên có buổi họp ngắn 15 phút mỗi sáng để align nhau...",
    required: false,
    hint: "Ý tưởng nhỏ cũng rất có giá trị.",
  },
  {
    id: "q_feel_team",
    label: "Nhìn lại thời gian vừa qua, bạn cảm thấy thế nào khi làm việc trong team này?",
    placeholder: "Ví dụ: Nhìn chung mình thấy vui và được học nhiều thứ mới, nhưng đôi khi hơi áp lực vì...",
    required: true,
    hint: "Không có câu trả lời đúng hay sai — hãy thành thật.",
  },
  {
    id: "q_goal_personal",
    label: "Mục tiêu cá nhân của bạn trong 3 tháng tới là gì (về kỹ năng hoặc kết quả công việc)?",
    placeholder: "Ví dụ: Mình muốn tự viết được brief nội dung mà không cần nhờ ai kiểm tra lại...",
    required: false,
    hint: "Mình muốn giúp bạn đạt được điều này.",
  },
];

export interface SurveyResponse {
  response_id: string;
  respondent_name: string;
  submitted_at: string;
  answers: Record<string, string>; // question_id -> answer text
}

export const SURVEY_STORAGE_KEY = "hacoled_team_survey_v1";

export function loadSurveyResponses(): SurveyResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SURVEY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SurveyResponse[];
  } catch {
    return [];
  }
}

export function saveSurveyResponse(response: SurveyResponse): void {
  if (typeof window === "undefined") return;
  const existing = loadSurveyResponses();
  const updated = [...existing, response];
  localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(updated));
}

export function deleteSurveyResponse(responseId: string): void {
  if (typeof window === "undefined") return;
  const existing = loadSurveyResponses();
  const updated = existing.filter((r) => r.response_id !== responseId);
  localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(updated));
}

export function exportResponsesAsJson(responses: SurveyResponse[]): void {
  const blob = new Blob([JSON.stringify(responses, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hacoled-survey-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResponsesAsCsv(responses: SurveyResponse[]): void {
  if (responses.length === 0) return;
  const headers = [
    "Tên",
    "Thời gian",
    ...SURVEY_QUESTIONS.map((q) => q.label),
  ];
  const rows = responses.map((r) => [
    r.respondent_name,
    new Date(r.submitted_at).toLocaleString("vi-VN"),
    ...SURVEY_QUESTIONS.map((q) => r.answers[q.id] || ""),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hacoled-survey-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
