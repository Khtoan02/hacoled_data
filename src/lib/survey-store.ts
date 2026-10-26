/**
 * HacoLED Team Survey Store
 * Lưu trữ câu hỏi khảo sát & kết quả trả lời của team (localStorage-based)
 * Phiên bản 2.0 — 26 câu hỏi theo khung 5W1H
 */

export type QuestionType =
  | "text_short" // input ngắn
  | "text_long" // textarea
  | "select_single" // radio/select 1 lựa chọn
  | "select_multi" // checkbox nhiều lựa chọn (có maxSelect)
  | "matrix"; // bảng đánh giá (rows x columns)

export interface SurveyQuestion {
  id: string;
  section: string; // "A. WHO", "B. WHAT", etc.
  sectionLabel: string; // "Bạn là ai và đang phối hợp với ai?"
  number: number; // 1-26
  label: string; // tiêu đề câu hỏi
  description: string; // hướng dẫn chi tiết
  type: QuestionType;
  required: boolean;
  options?: string[]; // cho select_single, select_multi
  maxSelect?: number; // cho select_multi
  matrixRows?: string[]; // cho matrix
  matrixCols?: { key: string; label: string }[]; // cho matrix
  placeholder?: string;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // ─── A. WHO ───────────────────────────────────────────────────────────────
  {
    id: "q01_name_join",
    section: "A. WHO",
    sectionLabel: "Bạn là ai và đang phối hợp với ai?",
    number: 1,
    label: "Tên và thời điểm tham gia",
    description: "Bạn tên gì? Bạn bắt đầu tham gia HacoLED từ tháng/năm nào?",
    type: "text_short",
    required: true,
    placeholder: "Ví dụ: Nguyễn Văn A — tháng 8/2024",
  },
  {
    id: "q02_work_type",
    section: "A. WHO",
    sectionLabel: "Bạn là ai và đang phối hợp với ai?",
    number: 2,
    label: "Hình thức làm việc hiện tại",
    description: "Hình thức làm việc hiện tại của bạn là gì?",
    type: "select_single",
    required: true,
    options: [
      "Nhân sự toàn thời gian",
      "Thực tập sinh bán thời gian",
      "Hình thức khác",
      "Chưa thống nhất rõ",
    ],
  },
  {
    id: "q03_reporting",
    section: "A. WHO",
    sectionLabel: "Bạn là ai và đang phối hợp với ai?",
    number: 3,
    label: "Người giao việc và người xem lại",
    description:
      "Ai thường giao việc cho bạn? Ai xem lại hoặc duyệt sản phẩm? Khi vướng, bạn thường hỏi ai?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Anh/chị X giao việc, chị Y duyệt nội dung, khi vướng thì hỏi...",
  },

  // ─── B. WHAT ──────────────────────────────────────────────────────────────
  {
    id: "q04_recent_work",
    section: "B. WHAT",
    sectionLabel: "Bạn đang thực sự làm những việc gì?",
    number: 4,
    label: "Công việc trong 5 ca gần nhất",
    description:
      "Liệt kê tối đa 3-5 việc bạn đã làm trong 5 ca gần nhất. Mỗi việc ghi: làm gì, cho kênh/bộ phận nào, đã xong hay đang làm.",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ:\n1. Viết 3 bài Facebook về công trình trường học — Kênh FB — Đã đăng\n2. Thiết kế ảnh cho bài website — Web — Đang làm\n...",
  },
  {
    id: "q05_own_work",
    section: "B. WHAT",
    sectionLabel: "Bạn đang thực sự làm những việc gì?",
    number: 5,
    label: "Phần việc của riêng bạn",
    description:
      "Trong các việc trên, việc nào bạn làm từ đầu đến cuối? Việc nào bạn chỉ hỗ trợ một phần? Phần đó cụ thể là gì?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Bài Facebook mình tự viết từ đầu đến cuối. Ảnh cho website thì mình chỉ làm phần chỉnh sửa...",
  },
  {
    id: "q06_pending_work",
    section: "B. WHAT",
    sectionLabel: "Bạn đang thực sự làm những việc gì?",
    number: 6,
    label: "Việc đang dở và việc cần duy trì",
    description:
      "Hiện có việc nào bạn đang nhận, đang chờ duyệt hoặc phải làm định kỳ không? Ghi tên việc, hạn đã hứa hoặc tần suất, người giao và phần còn lại.",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Đang chờ duyệt bài website về màn hình LED trường học — do chị X giao — hạn thứ Sáu...",
  },
  {
    id: "q07_sample_work",
    section: "B. WHAT",
    sectionLabel: "Bạn đang thực sự làm những việc gì?",
    number: 7,
    label: "Một sản phẩm để cùng xem",
    description:
      "Gửi tối đa 1-2 link sản phẩm gần đây, kể cả bản nháp. Ghi rõ phần bạn làm, phần người khác hoặc AI hỗ trợ.",
    type: "text_long",
    required: false,
    placeholder:
      "Ví dụ: Link bài đăng Facebook: [link] — Mình viết caption, AI gợi ý hashtag, chị Y chỉnh giọng văn...",
  },

  // ─── C. WHY ───────────────────────────────────────────────────────────────
  {
    id: "q08_company_understanding",
    section: "C. WHY",
    sectionLabel: "Bạn hiểu mục đích công việc như thế nào?",
    number: 8,
    label: "HacoLED làm gì?",
    description:
      "Nếu một người quen hỏi \"HacoLED làm gì, thường phục vụ ai?\", bạn sẽ giải thích thế nào? Có điều gì về công ty hoặc giải pháp bạn còn chưa rõ?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: HacoLED chuyên về màn hình LED, phục vụ trường học, doanh nghiệp... Mình còn chưa rõ phần...",
  },
  {
    id: "q09_audience",
    section: "C. WHY",
    sectionLabel: "Bạn hiểu mục đích công việc như thế nào?",
    number: 9,
    label: "Sản phẩm đó được làm cho ai?",
    description:
      "Chọn một nội dung đã làm: bạn nghĩ ai sẽ xem, họ cần hiểu điều gì và mình mong họ làm gì tiếp theo?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Bài Facebook về màn hình LED — dành cho hiệu trưởng/ban giám hiệu — cần hiểu lợi ích ứng dụng — mong họ inbox hỏi giá...",
  },
  {
    id: "q10_done_criteria",
    section: "C. WHY",
    sectionLabel: "Bạn hiểu mục đích công việc như thế nào?",
    number: 10,
    label: "Khi nào bạn biết một việc đã đạt?",
    description:
      "Với việc gần nhất, bạn dựa vào đâu để biết đã hoàn thành đúng yêu cầu? Nêu một tiêu chí, phản hồi hoặc số liệu đã thực sự sử dụng.",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Khi chị X duyệt và không có sửa thêm, hoặc khi bài đạt X lượt tiếp cận...",
  },

  // ─── D. WHERE ─────────────────────────────────────────────────────────────
  {
    id: "q11_channels",
    section: "D. WHERE",
    sectionLabel: "Bạn làm trên kênh nào, với tài liệu và công cụ gì?",
    number: 11,
    label: "Kênh và phần việc đang tham gia",
    description:
      "Với từng kênh (Website, Facebook, TikTok, YouTube...), ghi những việc bạn đang thực sự làm. Nếu được giao nhưng chưa có quyền thực hiện, ghi rõ.",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ:\n- Facebook: viết bài, thiết kế ảnh — đang làm\n- Website: cập nhật bài viết — đã có quyền\n- TikTok: được giao nhưng chưa có tài khoản...",
  },
  {
    id: "q12_storage",
    section: "D. WHERE",
    sectionLabel: "Bạn làm trên kênh nào, với tài liệu và công cụ gì?",
    number: 12,
    label: "Nơi lưu và tìm tài liệu",
    description:
      "Bạn đang tìm ảnh/video dự án, thông tin sản phẩm và bài mẫu ở đâu? Bản nháp, bản đã duyệt và bản cần sửa đang ở đâu?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Ảnh dự án ở Google Drive thư mục X, bài mẫu ở Notion, bản nháp của mình ở Google Docs riêng...",
  },
  {
    id: "q13_tools",
    section: "D. WHERE",
    sectionLabel: "Bạn làm trên kênh nào, với tài liệu và công cụ gì?",
    number: 13,
    label: "Công cụ đang dùng",
    description:
      "Liệt kê các công cụ bạn đang dùng: Canva, CapCut, Google Docs, Sheets, Drive... Chưa dùng thì ghi chưa dùng.",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Canva (thiết kế), Google Docs (viết bài), CapCut (chưa dùng), ...",
  },

  // ─── E. WHEN ──────────────────────────────────────────────────────────────
  {
    id: "q14_schedule",
    section: "E. WHEN",
    sectionLabel: "Bạn có thể làm và bàn giao vào lúc nào?",
    number: 14,
    label: "Lịch làm thực tế",
    description:
      "Trong hai tuần tới, bạn có thể làm những ngày và khung giờ nào? Với mỗi ca, ghi làm tại văn phòng hay online. Lịch đã cố định hay còn chờ chốt?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Thứ 2-4-6: 8h-12h tại văn phòng. Thứ 3-5: online từ 19h-21h. Lịch này đã cố định.",
  },
  {
    id: "q15_time_split",
    section: "E. WHEN",
    sectionLabel: "Bạn có thể làm và bàn giao vào lúc nào?",
    number: 15,
    label: "Phần thời gian dành cho Marketing",
    description:
      "Trong lịch trên, bạn còn phải dành thời gian cho công việc nào khác? Ước lượng phần thời gian còn lại cho Marketing và thay đổi lịch đã biết trước.",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Sáng thứ 2 có lịch học, còn lại dành ~80% cho Marketing. Cuối tháng có thể bận hơn vì...",
  },
  {
    id: "q16_report_cycle",
    section: "E. WHEN",
    sectionLabel: "Bạn có thể làm và bàn giao vào lúc nào?",
    number: 16,
    label: "Nhịp báo cáo và nhận kế hoạch",
    description:
      "Nhóm dự kiến tổng hợp báo cáo vào thứ Sáu, gửi kế hoạch tuần mới vào thứ Bảy. Theo ca làm của bạn, khi nào phù hợp để cập nhật báo cáo, đọc và xác nhận kế hoạch?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Mình có thể cập nhật báo cáo chiều thứ Sáu và xác nhận kế hoạch tối thứ Bảy...",
  },

  // ─── F. HOW ───────────────────────────────────────────────────────────────
  {
    id: "q17_skill_matrix",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 17,
    label: "Mức hỗ trợ phù hợp cho từng việc",
    description:
      "Với mỗi công việc bên dưới, chọn mức phù hợp nhất:\n• A: Chưa từng làm\n• B: Làm được khi có người hướng dẫn từng bước\n• C: Làm được theo mẫu/checklist và đầu bài rõ\n• D: Tự triển khai, tự kiểm tra và giải thích lựa chọn",
    type: "matrix",
    required: true,
    matrixRows: [
      "Tìm và kiểm tra nguồn thông tin sản phẩm/dự án",
      "Viết bài Facebook",
      "Thiết kế ảnh/bộ ảnh đơn giản",
      "Viết hoặc cập nhật bài website",
      "Đăng/chỉnh sửa nội dung trên kênh",
      "Dựng video ngắn",
      "Dựng video ngang/dài",
      "Lấy số liệu của bài đã đăng",
      "Sắp xếp việc và cập nhật báo cáo",
    ],
    matrixCols: [
      { key: "A", label: "A — Chưa từng làm" },
      { key: "B", label: "B — Cần hướng dẫn" },
      { key: "C", label: "C — Theo mẫu" },
      { key: "D", label: "D — Tự chủ" },
    ],
  },
  {
    id: "q18_workflow",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 18,
    label: "Cách làm một việc gần đây",
    description:
      "Chọn một việc đã nêu: bạn đã làm theo 3-5 bước nào? Khoảng bao lâu là thời gian trực tiếp làm, bao lâu là chờ thông tin/duyệt? Bước nào cần người khác hỗ trợ?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Viết bài Facebook —\n1. Đọc brief (15 phút)\n2. Viết nháp (30 phút)\n3. Chờ duyệt (2 ngày)\n4. Sửa theo feedback (15 phút)\n5. Đăng bài...",
  },
  {
    id: "q19_ai_usage",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 19,
    label: "Cách sử dụng AI",
    description:
      "Lần gần nhất bạn dùng AI trong công việc, bạn nhờ làm phần nào? Bạn giữ lại, sửa hoặc kiểm tra điều gì trước khi gửi sản phẩm?",
    type: "text_long",
    required: false,
    placeholder:
      "Ví dụ: Dùng ChatGPT để gợi ý ý tưởng caption, sau đó mình sửa lại cho phù hợp giọng thương hiệu, kiểm tra thông tin sản phẩm...",
  },
  {
    id: "q20_obstacle",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 20,
    label: "Một lần gặp vướng mắc",
    description:
      "Kể một lần gần đây bạn thiếu thông tin, chưa biết làm hoặc có nguy cơ trễ hạn: chuyện gì xảy ra, bạn đã xử lý thế nào và kết quả ra sao?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Lần đó mình thiếu ảnh dự án để làm bài, mình đã hỏi anh X nhưng mất 2 ngày mới có, bài bị trễ hạn 1 ngày...",
  },
  {
    id: "q21_quick_task",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 21,
    label: "Thử trao đổi một đầu việc",
    description:
      "Bạn nhận yêu cầu: \"Chiều nay cần một bài Facebook về công trình này\", kèm 5 ảnh và tên công trình, chưa có thông tin khác. Còn khoảng 90 phút. Bạn sẽ làm gì trước? Phần nào có thể bắt đầu, phần nào bạn cần hỏi thêm?",
    type: "text_long",
    required: true,
    placeholder:
      "Ví dụ: Mình sẽ tìm thêm thông tin công trình trước (loại sản phẩm, khách hàng...), trong lúc chờ thì bắt đầu viết nháp caption với thông tin có sẵn, cần hỏi thêm về...",
  },
  {
    id: "q22_blockers",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 22,
    label: "Những điều đang cản trở bạn",
    description: "Chọn tối đa 3 điều đang cản trở bạn nhất (hoặc chọn \"Chưa có vướng mắc\").",
    type: "select_multi",
    required: true,
    maxSelect: 3,
    options: [
      "Chưa rõ mục tiêu/tiêu chuẩn",
      "Chưa hiểu sản phẩm",
      "Thiếu tư liệu",
      "Chưa biết thao tác",
      "Thiếu công cụ/thiết bị/quyền truy cập",
      "Chờ phản hồi",
      "Chưa biết lấy số liệu",
      "Nhiều việc cùng lúc",
      "Khác (ghi rõ ở ô bên dưới)",
      "Chưa có vướng mắc",
    ],
    placeholder: "Nếu có vướng mắc khác, ghi thêm ở đây...",
  },
  {
    id: "q23_goals",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 23,
    label: "Việc muốn nhận và việc muốn học",
    description:
      "Trong hai tuần tới, bạn muốn thử phụ trách chính việc gì và học thêm việc gì? Lý do dựa trên trải nghiệm hoặc sở thích nào?",
    type: "text_long",
    required: false,
    placeholder:
      "Ví dụ: Muốn thử phụ trách viết bài website vì mình thích viết dài và có thời gian tra cứu. Muốn học thêm cách đọc số liệu Facebook Insights...",
  },
  {
    id: "q24_support_style",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 24,
    label: "Cách hỗ trợ online phù hợp",
    description: "Chọn tối đa 2 hình thức hỗ trợ online phù hợp với bạn nhất.",
    type: "select_multi",
    required: true,
    maxSelect: 2,
    options: [
      "Video quay màn hình từng bước",
      "Hướng dẫn ngắn kèm ảnh",
      "Bài mẫu đã duyệt kèm giải thích",
      "Checklist tự kiểm tra",
      "Góp ý trực tiếp trên bản nháp",
      "Trao đổi online theo lịch khi bị vướng",
      "Khác",
    ],
  },
  {
    id: "q25_coordination",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 25,
    label: "Kinh nghiệm phối hợp và tổng hợp",
    description:
      "Bạn đã từng theo dõi tiến độ, nhắc hạn hoặc tổng hợp công việc cho một nhóm chưa? Nếu có, kể một ví dụ.",
    type: "text_long",
    required: false,
    placeholder:
      "Ví dụ: Mình từng làm trưởng nhóm dự án ở trường, phụ trách nhắc deadline và tổng hợp file của 5 người...",
  },
  {
    id: "q26_other",
    section: "F. HOW",
    sectionLabel: "Bạn đang làm như thế nào và cần hỗ trợ gì?",
    number: 26,
    label: "Điều khác bạn muốn trao đổi",
    description:
      "Có điều gì người phụ trách nên biết để giao việc và hỗ trợ bạn phù hợp hơn?",
    type: "text_long",
    required: false,
    placeholder:
      "Ví dụ: Mình học tốt hơn khi có ví dụ cụ thể. Mình đang học thêm khóa Photoshop ngoài giờ...",
  },
];

export interface SurveyResponse {
  response_id: string;
  respondent_name: string;
  submitted_at: string;
  answers: Record<string, string | string[] | Record<string, string>>; // text | multi-select | matrix
}

export const SURVEY_STORAGE_KEY = "hacoled_team_survey_v2";

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

/** Lấy giá trị text từ answer (hỗ trợ mọi loại) */
export function getAnswerText(
  answer: string | string[] | Record<string, string> | undefined
): string {
  if (!answer) return "";
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(", ");
  // matrix: hiển thị dạng "Hàng: Cột"
  return Object.entries(answer)
    .map(([row, col]) => `${row}: ${col}`)
    .join(" | ");
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
    ...SURVEY_QUESTIONS.map((q) => `[${q.number}] ${q.label}`),
  ];
  const rows = responses.map((r) => [
    r.respondent_name,
    new Date(r.submitted_at).toLocaleString("vi-VN"),
    ...SURVEY_QUESTIONS.map((q) => getAnswerText(r.answers[q.id])),
  ]);
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hacoled-survey-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
