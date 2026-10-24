export type PhaseType = "P0" | "P1" | "P2";

export interface SheetOverviewItem {
  code: string;
  content: string;
  rowCount: number;
  purpose: string;
}

export interface ModuleItem {
  code: string;
  name: string;
  managedData: string;
  decisionServed: string;
  owner: string;
  phase: PhaseType;
}

export interface TaskItem {
  code: string;
  moduleCode: string;
  title: string;
  howTo: string;
  output: string;
  acceptance: string;
  owner: string;
  dependencies: string;
  phase: PhaseType;
  status: "Chưa bắt đầu" | "Đang làm" | "Chờ duyệt" | "Hoàn thành";
}

export interface LogicalTableItem {
  tableName: string;
  domain: string;
  rowGrain: string;
  keyFields: string;
  owner: string;
  phase: PhaseType;
  note: string;
  source: string;
}

export interface MetricItem {
  code: string;
  group: string;
  name: string;
  formula: string;
  grain: string;
  sourceOfTruth: string;
  aggregationRule: string;
  guardrail: string;
  phase: PhaseType;
}

export interface EventPlanItem {
  code: string;
  eventName: string;
  type: string;
  trigger: string;
  keyFields: string;
  isLead: string;
  errorControl: string;
  owner: string;
  ref: string;
}

export interface LeadRuleItem {
  code: string;
  topic: string;
  input: string;
  ruleResult: string;
  automationLevel: string;
  limitation: string;
  phase: PhaseType;
}

export interface DashboardSpecItem {
  code: string;
  audiencePurpose: string;
  mainContent: string;
  cadence: string;
  filters: string;
  sourceModules: string;
  decisionToMake: string;
  phase: PhaseType;
}

export interface RolePermissionItem {
  role: string;
  mainWork: string;
  viewDataAccess: string;
  limitation: string;
}

export interface QATestCaseItem {
  code: string;
  scenario: string;
  testMethod: string;
  expectedResult: string;
  moduleCode: string;
  phase: PhaseType;
  testStatus?: "Chưa chạy" | "Đạt (Pass)" | "Cần sửa (Fail)";
  evidenceNote?: string;
}

export interface DecisionLogItem {
  code: string;
  topic: string;
  content: string;
  status: string;
  owner: string;
  note: string;
}

export interface SourceRefItem {
  code: string;
  name: string;
  urlOrRef: string;
  type: string;
  scopeAndLimit: string;
}

export interface DemoBriefRow {
  component: string;
  sampleContent: string;
  note: string;
}

export const CORE_PRINCIPLES: string[] = [
  "Đây là bộ thiết kế để xây và vận hành Base. Chưa phải ứng dụng đã nối API tự động hay đồng bộ Google Drive, và tách biệt rõ dữ liệu minh họa với dữ liệu vận hành thực tế của HacoLED.",
  "Phạm vi chuẩn v1.0 (24/10/2026): 12 phân hệ • 58 công việc • 37 bảng logic • 402 trường • 83 chỉ số • 24 ca kiểm thử.",
  "Thứ tự đọc & vận hành: 01_PHAN_HE → 02_VIEC_CAN_LAM → 03/04 Dữ liệu → 05 Chỉ số → 07 Quy tắc → 10 Nghiệm thu.",
  "P0: Cần để có vòng vận hành đúng. P1: Phát triển sau nền tảng. P2: Chỉ khi có dữ liệu/nguồn lực. Không cần triển khai hết trước khi đăng nội dung.",
  "Ngân sách mới bằng 0; dùng công cụ và quyền truy cập sẵn có. Chi phí nhân công, bảo trì và công cụ hiện hữu vẫn cần được nhìn nhận; không mặc định miễn phí.",
  "Baseline bắt đầu từ dữ liệu mới được kiểm tra. Dữ liệu lịch sử chỉ tham khảo; mới ghi vào Base (first_seen_in_base) không tự động là khách mới của công ty (new_confirmed).",
  "Giữ hotline chung; nguồn không xác định để unknown. Tách person (contact), organization, inquiry, project (opportunity); tách asset và publication.",
  "Các ô mẫu số 0 hoặc thiếu dữ liệu được xử lý N/A hoặc null/unavailable — tuyệt đối không tự thay bằng 0.",
];

export const SHEET_OVERVIEW: SheetOverviewItem[] = [
  { code: "01_PHAN_HE", content: "12 phân hệ của HacoLED Marketing Base", rowCount: 12, purpose: "Kiến trúc nghiệp vụ: giữ logic FT24, bổ sung dữ liệu, vận hành và an toàn. Không phải 12 phần mềm phải mua." },
  { code: "02_VIEC_CAN_LAM", content: "Danh sách việc có đầu ra và nghiệm thu", rowCount: 58, purpose: "P0 = tối thiểu để vận hành; P1 = nghiên cứu/phân tích sau nền tảng; P2 = nâng cao khi có đủ dữ liệu." },
  { code: "03_BANG_DU_LIEU", content: "Mô hình dữ liệu logic", rowCount: 37, purpose: "Đây là bảng/đối tượng cần thiết kế; một biểu mẫu gọn có thể ghi vào nhiều bảng." },
  { code: "04_TRUONG_DU_LIEU", content: "Từ điển trường dữ liệu", rowCount: 402, purpose: "UUID/ID là mã bền vững; relation là liên kết, không chép nhiều phiên bản cùng dữ liệu." },
  { code: "05_CHI_SO", content: "Từ điển chỉ số và công thức", rowCount: 83, purpose: "Danh mục thiết kế, không phải tất cả KPI bắt buộc. Chỉ bật chỉ số có dữ liệu đúng định nghĩa; không tự áp benchmark ngành." },
  { code: "06_SU_KIEN", content: "Kế hoạch sự kiện và bằng chứng", rowCount: 20, purpose: "Sự kiện GA4 recommended cần cấu hình; các sự kiện Base/custom do HacoLED định nghĩa. Không gửi PII vào analytics." },
  { code: "07_QUY_TAC_LEAD", content: "Quy tắc nhận diện, fit và độ nóng", rowCount: 18, purpose: "Các quy tắc đề xuất v1.0 cần người phụ trách duyệt. Không dùng view/like để suy ra xác suất chốt hay danh tính ẩn danh." },
  { code: "08_BAO_CAO", content: "Báo cáo phục vụ quyết định", rowCount: 8, purpose: "Mỗi dashboard phải thấy kỳ, nguồn, độ mới, phiên bản định nghĩa, độ bao phủ và truy ngược được về dòng dữ liệu." },
  { code: "09_PHAN_QUYEN", content: "Vai trò, trách nhiệm và ranh giới", rowCount: 8, purpose: "Tách người sản xuất, người xuất bản, người nhập chỉ số và người duyệt. Phân quyền nền tảng và Base phải thống nhất." },
  { code: "10_KIEM_THU", content: "Ca nghiệm thu bắt buộc trước khi tin báo cáo", rowCount: 24, purpose: "Chạy trên dữ liệu test tách biệt. Hoàn thành khi có bằng chứng kết quả, người kiểm và thời điểm; không chỉ tích ô." },
  { code: "11_QUYET_DINH", content: "Sổ quyết định và những gì chưa chốt", rowCount: 12, purpose: "Các trạng thái phản ánh trao đổi, không phải quyết định đã thực thi trên hệ thống. Thay đổi phải có người duyệt và ngày hiệu lực." },
  { code: "12_NGUON", content: "Nguồn và phạm vi sử dụng", rowCount: 22, purpose: "Tài liệu web đối chiếu ngày 24/10/2026. Nguồn phương pháp/định nghĩa, không phải bằng chứng hiệu suất HacoLED." },
  { code: "13_VI_DU_BRIEF", content: "Ví dụ nối nghiên cứu → nội dung → dữ liệu", rowCount: 16, purpose: "Mọi tình huống/insight trong trang này là minh họa (DEMO-BRIEF-01). Không được công bố như dự án thực của HacoLED." },
  { code: "14_VI_DU_CONG_THUC", content: "Ví dụ tính toán — dữ liệu hoàn toàn giả định", rowCount: 28, purpose: "Chỉ phục vụ học và kiểm thử công thức. Ô xanh dương có thể đổi thử; mẫu số 0 hoặc thiếu dữ liệu trả về N/A." },
];

export const MODULES_12: ModuleItem[] = [
  { code: "B01", name: "Doanh nghiệp, giải pháp & bằng chứng", managedData: "Giải pháp, giá trị, giới hạn phục vụ, thông số, giá/chính sách đã duyệt, dự án, thương hiệu", decisionServed: "Biết được phép hứa gì với khách và bằng chứng nào được dùng", owner: "Lead + kỹ thuật", phase: "P0" },
  { code: "B02", name: "Thị trường, phân khúc & đối thủ", managedData: "TAM–SAM–SOM theo kỳ; phân khúc nhu cầu; đối thủ trực tiếp, giải pháp thay thế, không đầu tư", decisionServed: "Chọn nhóm khách có cơ sở; không coi lượng follower là thị phần", owner: "Lead", phase: "P1" },
  { code: "B03", name: "Khách hàng mục tiêu & insight", managedData: "ICP, vai trò mua, vấn đề, nhu cầu, động cơ, trigger, barrier, tiêu chí chọn, nguồn bằng chứng", decisionServed: "Chọn thông điệp; ghi rõ giả thuyết và bằng chứng trái chiều", owner: "Lead + phản hồi Sales", phase: "P0" },
  { code: "B04", name: "Mục tiêu, chiến dịch & nguồn lực", managedData: "KPI/OKR, kế hoạch, ngân sách, giờ công, chi phí, thử nghiệm, cơ chế phê duyệt", decisionServed: "Phân bổ nguồn lực; không đồng nhất 0 chi thêm với miễn phí nhân công", owner: "Lead", phase: "P1" },
  { code: "B05", name: "Nội dung, tài sản & xuất bản", managedData: "Chủ đề gốc, brief, phiên bản, định dạng, người làm, duyệt, bài đăng, link, quyền sử dụng", decisionServed: "Theo dõi từ insight đến nhiều bản xuất bản mà không đếm trùng sản lượng", owner: "Full-time + từng người sản xuất", phase: "P0" },
  { code: "B06", name: "Website, SEO & social", managedData: "Sức khỏe kênh, GSC, GA4, hiệu suất từng bài, chỉ số native Facebook/TikTok/YouTube", decisionServed: "Biết nội dung nào tiếp cận và dẫn tới liên hệ; giữ đúng định nghĩa nền tảng", owner: "Người được giao nhập số liệu", phase: "P0" },
  { code: "B07", name: "Liên hệ, tổ chức & cơ hội", managedData: "Contact, organization, inquiry, project, opportunity, cũ/mới/chưa rõ, bàn giao Sales", decisionServed: "Một khách nhiều lần liên hệ không thành nhiều khách mới; không thay CRM Sales", owner: "Đầu mối nhận khách + Sales", phase: "P0" },
  { code: "B08", name: "Hành vi, nguồn & phễu", managedData: "Event, touchpoint, awareness, fit, intent, lịch sử trạng thái, quy tắc attribution", decisionServed: "Phân biệt click gọi và gọi thật; phễu quan sát không phải hành trình bắt buộc", owner: "Lead", phase: "P0" },
  { code: "B09", name: "Chỉ số, báo cáo & so sánh kỳ", managedData: "Metric dictionary, công thức, nguồn chuẩn, cohort, dashboard, chú thích thay đổi", decisionServed: "Đọc đúng tăng trưởng, chất lượng, mức đầy đủ dữ liệu và việc cần quyết định", owner: "Lead + full-time", phase: "P0" },
  { code: "B10", name: "Thử nghiệm & quyết định", managedData: "Giả thuyết, biến thử, tiêu chí, kỳ đánh giá, kết quả, quyết định, hạn chế", decisionServed: "Không kết luận fail do vài ngày ít view; không coi tương quan là nhân quả", owner: "Lead", phase: "P1" },
  { code: "B11", name: "Nhân sự, công việc & tự học", managedData: "Khảo sát tình huống, kỹ năng, giờ làm, sản phẩm, task, học liệu, bài thực hành, phản hồi", decisionServed: "Tăng mức tự chủ bằng bằng chứng công việc; không xếp hạng theo view", owner: "Lead + full-time", phase: "P0" },
  { code: "B12", name: "Quản trị dữ liệu & an toàn", managedData: "Từ điển, phiên bản, import, audit, chất lượng, phân quyền, lưu trữ, xóa, backup", decisionServed: "Dữ liệu truy nguyên được, người phù hợp truy cập, sai số được phát hiện", owner: "Lead + người kỹ thuật được giao", phase: "P0" },
];

export const TASKS_58: TaskItem[] = [
  { code: "B01-01", moduleCode: "B01", title: "Lập danh mục giải pháp", howTo: "Liệt kê giải pháp trọn gói, ứng dụng, phạm vi bao gồm/không bao gồm", output: "Danh mục solutions", acceptance: "Mỗi giải pháp có giới hạn; không ghi bán module lẻ", owner: "Lead + kỹ thuật", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B01-02", moduleCode: "B01", title: "Kiểm chứng cam kết", howTo: "Đối chiếu thông số, bảo hành, thời gian, giá với người có quyền xác nhận", output: "Danh mục claim đã duyệt", acceptance: "Claim có nguồn, ngày và người duyệt", owner: "Lead", dependencies: "B01-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B01-03", moduleCode: "B01", title: "Tập hợp bằng chứng dự án", howTo: "Gắn ảnh, video, biên bản được phép dùng với giải pháp", output: "Asset/proof register", acceptance: "Phân biệt ảnh thực và minh họa AI; có quyền dùng", owner: "Full-time", dependencies: "B01-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B01-04", moduleCode: "B01", title: "Chuẩn hóa giọng điệu và phản hồi", howTo: "Soạn cách nói về giá trị, từ cấm, xử lý hỏi kỹ thuật/giá/tiêu cực", output: "SOP nội dung và phản hồi", acceptance: "Không hứa ngoài chính sách; có tuyến hỏi Lead", owner: "Lead", dependencies: "B01-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B02-01", moduleCode: "B02", title: "Khoanh phạm vi thị trường", howTo: "Chọn đơn vị trường/dự án, địa lý, năm, ứng dụng để nghiên cứu", output: "Research scope", acceptance: "Không gộp trường và số người xem", owner: "Lead", dependencies: "B01-01", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B02-02", moduleCode: "B02", title: "Phân khúc theo nhu cầu", howTo: "Tách lắp mới, nâng cấp, giảng đường, nhà thầu và tiêu chí thuộc nhóm", output: "Segment register", acceptance: "Nhóm có điều kiện vào/ra, không chỉ độ tuổi", owner: "Lead", dependencies: "B02-01", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B02-03", moduleCode: "B02", title: "Quan sát đối thủ và thay thế", howTo: "Ghi nguồn công khai, thông điệp, offer, bằng chứng, ngày", output: "Competitor register", acceptance: "Quan sát tách suy luận; không đoán doanh thu đối thủ", owner: "Lead + hỗ trợ", dependencies: "B02-02", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B02-04", moduleCode: "B02", title: "Lập TAM SAM SOM kịch bản", howTo: "Thu thập số tổ chức, xác suất dự án/kỳ, giá trị và năng lực", output: "Ba kịch bản có nguồn", acceptance: "Thiếu số để unknown; cùng kỳ, đơn vị, không trùng nhóm", owner: "Lead", dependencies: "B02-01; B02-02", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B02-05", moduleCode: "B02", title: "Chọn target thử đầu", howTo: "Đánh giá nhu cầu, khả năng phục vụ, tiếp cận organic, bằng chứng, cạnh tranh", output: "Quyết định ưu tiên", acceptance: "Tiêu chí và lý do có bằng chứng; trường học là phạm vi pilot", owner: "Lead", dependencies: "B02-03; B03-02", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B03-01", moduleCode: "B03", title: "Lập câu hỏi nghiên cứu", howTo: "Cụ thể câu hỏi về tác nhân mua, vai trò, rào cản và bằng chứng cần tìm", output: "Research brief", acceptance: "Mỗi câu trả lời sẽ đổi một quyết định Marketing", owner: "Lead", dependencies: "B01-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B03-02", moduleCode: "B03", title: "Thu lời khách hàng", howTo: "Lấy tình huống ẩn danh từ Sales; đọc phản hồi công khai; khi phù hợp trao đổi trực tiếp", output: "Evidence log", acceptance: "Ghi bối cảnh và nguồn, không ép nhập lịch sử Sales", owner: "Lead + Sales", dependencies: "B03-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B03-03", moduleCode: "B03", title: "Xây persona theo vai trò", howTo: "Map người dùng, người tìm hiểu, kỹ thuật, phê duyệt, người mua/nhà thầu", output: "Persona/buying-role map", acceptance: "Không mặc định hiệu trưởng là người mua duy nhất", owner: "Lead", dependencies: "B03-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B03-04", moduleCode: "B03", title: "Viết insight có kiểm chứng", howTo: "Tách lời nói, quan sát, suy luận, bằng chứng ngược và nhiệm vụ content", output: "Insight register", acceptance: "AI chỉ gợi ý; người duyệt chốt trạng thái tin cậy", owner: "Lead", dependencies: "B03-02; B03-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B03-05", moduleCode: "B03", title: "Xây nấc nhu cầu và journey", howTo: "Gắn câu hỏi, rào cản, hành động tiếp theo cho nấc 1–5", output: "Need/journey matrix", acceptance: "Nấc nhận thức, fit và intent là các trường riêng", owner: "Lead", dependencies: "B03-04", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B04-01", moduleCode: "B04", title: "Chốt mục tiêu giai đoạn", howTo: "Giữ tăng khách mới + hệ thống hóa, tách mục tiêu và cách đo", output: "Objective register", acceptance: "Chưa gán tăng trưởng khi chưa baseline đủ", owner: "Lead", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B04-02", moduleCode: "B04", title: "Tạo chiến dịch pilot", howTo: "Gắn target, insight, CTA, metric, ngày review và chi phí mới=0", output: "Campaign pilot", acceptance: "Không coi là triển khai toàn ngành cùng lúc", owner: "Lead", dependencies: "B02-05; B03-04", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B04-03", moduleCode: "B04", title: "Ghi nguồn lực thực", howTo: "Nhập giờ làm khả dụng, công cụ có sẵn, chi phí hiện hữu nếu biết", output: "Capacity/cost register", acceptance: "Nhân công không tự coi miễn phí", owner: "Lead + full-time", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B04-04", moduleCode: "B04", title: "Lập KPI dựa baseline và năng lực", howTo: "Dùng phạm vi phiên phù hợp, tỷ lệ thực, độ bao phủ và giờ làm tạo kịch bản", output: "KPI đề xuất theo tháng", acceptance: "Có baseline, giả định, owner; chưa đủ dữ liệu thì đặt mục tiêu đo lường", owner: "Lead", dependencies: "B09-04; B04-03", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B05-01", moduleCode: "B05", title: "Chuẩn hóa content brief", howTo: "Target, nấc, insight, thông điệp, angle, proof, CTA, nghiệm thu", output: "Mẫu brief dùng chung", acceptance: "Người nhận giải thích lại được làm cho ai và để làm gì", owner: "Lead", dependencies: "B03-05", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B05-02", moduleCode: "B05", title: "Tạo registry sản phẩm/lần đăng", howTo: "Cấp brief_id, asset_id, publication_id; gắn người làm và người lấy số", output: "Content register", acceptance: "Một video ba kênh: một asset, ba publication", owner: "Full-time", dependencies: "B05-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B05-03", moduleCode: "B05", title: "Thiết lập duyệt và quyền sử dụng", howTo: "Checklist kỹ thuật, AI, ảnh, nhạc, dữ liệu cá nhân, lời hứa", output: "Checklist QA", acceptance: "Không đăng sai thông số hoặc minh họa thành dự án thật", owner: "Lead + full-time", dependencies: "B01-02; B12-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B05-04", moduleCode: "B05", title: "Giao đầu bài theo định dạng", howTo: "SEO, Facebook, video ngang, video dọc theo một chủ đề gốc", output: "Task cụ thể cho bốn người", acceptance: "Không yêu cầu thực tập sinh tự quyết target/insight", owner: "Lead + full-time", dependencies: "B05-01; B04-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B05-05", moduleCode: "B05", title: "Xuất bản và theo dõi", howTo: "Gắn URL/UTM, ngày đăng, phiên bản; sửa bài giữ lịch sử", output: "Publication register", acceptance: "Link hoạt động; nội dung đăng có người chịu số liệu", owner: "Người được giao", dependencies: "B05-02; B05-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B06-01", moduleCode: "B06", title: "Kiểm kê quyền truy cập kênh", howTo: "Xác định tài khoản công ty, owner, người lấy analytics", output: "Channel registry", acceptance: "Không ghi mật khẩu/token trong Sheet", owner: "Lead + full-time", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B06-02", moduleCode: "B06", title: "Kiểm tra website tối thiểu", howTo: "Thử form thành công/lỗi, hotline, Zalo, mobile, trang đích", output: "Checklist lỗi có mức ưu tiên", acceptance: "Không gọi click hotline là cuộc gọi thật", owner: "Lead", dependencies: "B06-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B06-03", moduleCode: "B06", title: "Chốt nguồn số mỗi kênh", howTo: "Map GA4/GSC/native export với tên chỉ số và khả năng truy cập", output: "Source mapping", acceptance: "Metric không có để unavailable, không điền 0", owner: "Lead + người nhập", dependencies: "B06-01; B09-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B06-04", moduleCode: "B06", title: "Lấy snapshot có kỳ rõ", howTo: "Nhập số ngày/kỳ/lifetime, timezone, retrieved_at và source file", output: "Snapshots mới", acceptance: "Không cộng nhiều snapshot lifetime", owner: "Từng người phụ trách", dependencies: "B06-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B06-05", moduleCode: "B06", title: "Theo dõi sức khỏe kênh", howTo: "Lỗi index/link, form hỏng, quyền mất, bài bị gỡ, phản hồi chờ", output: "Channel health log", acceptance: "Lỗi có owner và hành động", owner: "Full-time + Lead", dependencies: "B06-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B07-01", moduleCode: "B07", title: "Thống nhất đơn vị khách", howTo: "Phân biệt contact, tổ chức, yêu cầu, cơ hội; tách buyer/end user", output: "Customer dictionary", acceptance: "Các số đếm không trộn", owner: "Lead + đầu mối Sales", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B07-02", moduleCode: "B07", title: "Chốt mới/cũ/chưa rõ", howTo: "Định nghĩa mới với Base khác mới với công ty; chỉ thêm cờ xác nhận", output: "Quy tắc customer status", acceptance: "Không nhập lịch sử cũ; unknown không bị gán mới", owner: "Lead + người nhận khách", dependencies: "B07-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B07-03", moduleCode: "B07", title: "Thiết lập ghi hotline nhẹ", howTo: "Ghi ngày, contact, mới/cũ/chưa rõ, nhu cầu nếu có, người nhận", output: "Biểu mẫu tiếp nhận", acceptance: "Giữ hotline chung; nguồn không hỏi được để unknown", owner: "Đầu mối hotline", dependencies: "B07-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B07-04", moduleCode: "B07", title: "Đối soát trùng", howTo: "Chuẩn số/email; gợi ý trùng; trường hợp chung số cần người duyệt", output: "Merge log", acceptance: "Gộp không mất lịch sử; không tự merge trường theo tên giống", owner: "Lead + full-time", dependencies: "B07-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B07-05", moduleCode: "B07", title: "Gắn feedback Sales tối thiểu", howTo: "Nhận trạng thái phù hợp, đã nhận, chờ, mất, thắng nếu có", output: "Feedback log", acceptance: "Chưa có kết quả để pending; không ép Sales đổi hệ thống", owner: "Đầu mối Sales", dependencies: "B07-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B08-01", moduleCode: "B08", title: "Chốt event plan", howTo: "Định nghĩa trigger thành công form, click gọi, Zalo, file, qualify", output: "Event dictionary", acceptance: "Phân biệt đo ý định và kết quả thật", owner: "Lead + kỹ thuật", dependencies: "B07-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B08-02", moduleCode: "B08", title: "Gắn campaign/publication vào link", howTo: "Chuẩn UTM, ghi source đầu/cuối quan sát được", output: "Quy tắc UTM", acceptance: "Không PII trong URL; không UTM vào link nội bộ", owner: "Người đăng + Lead", dependencies: "B05-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B08-03", moduleCode: "B08", title: "Test tracking trước dùng", howTo: "Kiểm thử gửi hai lần, lỗi mạng, spam, consent, mobile", output: "QA log", acceptance: "Một submission chỉ một event hợp lệ; lỗi không thành lead", owner: "Lead", dependencies: "B08-01; B12-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B08-04", moduleCode: "B08", title: "Ghi lịch sử phễu", howTo: "Lưu timestamp entered/changed ở từng trạng thái", output: "Stage history", acceptance: "Không ép khách đi mọi tầng; không ghi đè lịch sử", owner: "Lead", dependencies: "B07-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B08-05", moduleCode: "B08", title: "Cài fit/intent minh bạch", howTo: "Dùng quy tắc có bằng chứng; thêm recency và unknown", output: "Lead rule v1", acceptance: "Không cộng like thành nóng; không tự cho xác suất chốt", owner: "Lead", dependencies: "B03-05; B07-05", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B09-01", moduleCode: "B09", title: "Duyệt từ điển chỉ số", howTo: "Mỗi metric có công thức, grain, nguồn, filter, owner, null, version", output: "Metric dictionary", acceptance: "Một tên không dùng nhiều mẫu số", owner: "Lead", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B09-02", moduleCode: "B09", title: "Xác nhận ngày đo chuẩn", howTo: "Chọn ngày thực tracking hoạt động và ngày hoàn tất kiểm tra", output: "Baseline control", acceptance: "Không giả định đã đo từ 19/10 nếu chưa có dữ liệu", owner: "Lead", dependencies: "B08-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B09-03", moduleCode: "B09", title: "Lập dashboard tối thiểu", howTo: "Liên hệ mới/cũ/unknown, phù hợp, nguồn, nội dung, DQ", output: "Báo cáo tuần", acceptance: "Truy từ tổng đến dòng và nguồn; không lẫn số minh họa", owner: "Full-time + Lead", dependencies: "B09-01; B07-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B09-04", moduleCode: "B09", title: "Chốt kỳ baseline", howTo: "Lấy kỳ đủ dữ liệu, chú thích ngày thiếu và thay đổi tracking", output: "Baseline đầu tiên", acceptance: "Không lấy số cũ làm áp lực; chưa chứng minh tăng thêm do Marketing", owner: "Lead", dependencies: "B09-02", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B09-05", moduleCode: "B09", title: "So sánh tháng có kiểm soát", howTo: "Chênh tuyệt đối, %, điểm %, tuổi nội dung, cohort", output: "Báo cáo MoM", acceptance: "Kỳ trước 0 => N/A; kỳ chưa đủ so MTD tương ứng", owner: "Lead + full-time", dependencies: "B09-04", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B10-01", moduleCode: "B10", title: "Lập thẻ thử nghiệm", howTo: "Giả thuyết, biến, nhóm khách, cách so, metric chính, guardrail", output: "Experiment card", acceptance: "Có câu hỏi quyết định, không chỉ danh sách bài", owner: "Lead", dependencies: "B04-02", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B10-02", moduleCode: "B10", title: "Theo dõi phản hồi theo brief", howTo: "Phản hồi khách đúng/sai tệp, chất lượng liên hệ, tuổi bài", output: "Evidence + metric links", acceptance: "Không đo insight bằng lượt thích đơn thuần", owner: "Người làm + Lead", dependencies: "B10-01; B06-04", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B10-03", moduleCode: "B10", title: "Rà soát kết quả", howTo: "Kiểm tra cỡ mẫu, thời gian, tracking, mix kênh trước kết luận", output: "Decision log", acceptance: "Cho phép chưa đủ dữ liệu; không hứa ý nghĩa thống kê", owner: "Lead", dependencies: "B10-02", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B10-04", moduleCode: "B10", title: "Cập nhật target/nội dung", howTo: "Giữ/sửa/dừng có lý do, phiên bản, lần review tiếp", output: "Brief/insight mới", acceptance: "Có liên kết quyết định nguồn; không ghi đè lịch sử", owner: "Lead", dependencies: "B10-03", phase: "P1", status: "Chưa bắt đầu" },
  { code: "B11-01", moduleCode: "B11", title: "Khảo sát online theo hành vi", howTo: "Hỏi tình huống, việc gần nhất, cách kiểm chứng, thời gian, công cụ", output: "Câu trả lời độc lập", acceptance: "Không giả bài thi; nói rõ ai xem, dùng để làm gì", owner: "Lead", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B11-02", moduleCode: "B11", title: "Đối chiếu sản phẩm thực", howTo: "Một mẫu công việc theo định dạng, ghi có/không dùng AI", output: "Assessment từng kỹ năng", acceptance: "Đánh giá có minh chứng; chưa quan sát không chấm yếu", owner: "Lead", dependencies: "B11-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B11-03", moduleCode: "B11", title: "Giao vai trò và quyền chủ động", howTo: "Full-time điều phối/Facebook; ba bạn SEO/video dài/video ngắn; chốt người lấy số", output: "Role sheet", acceptance: "Mỗi task một owner; trưởng nhóm không nhập thay tất cả", owner: "Lead", dependencies: "B11-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B11-04", moduleCode: "B11", title: "Xây học liệu số theo lỗ hổng", howTo: "Hướng dẫn ngắn, ví dụ đúng/sai, checklist, bài thực hành", output: "Thư viện học liệu online", acceptance: "Mỗi học liệu gắn kỹ năng và đầu ra công việc", owner: "Lead + full-time", dependencies: "B11-02", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B11-05", moduleCode: "B11", title: "Tự học và đánh giá lại", howTo: "Nhân sự nộp bài thực hành, nhận feedback, cập nhật mức tự chủ", output: "Learning progress", acceptance: "Không lấy mở video hoặc thời gian online làm năng lực", owner: "Người học + Lead", dependencies: "B11-04", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B12-01", moduleCode: "B12", title: "Chốt nguồn chuẩn và schema", howTo: "Phân lớp raw/chuẩn hóa/chỉ số/quyết định; cấp ID bền vững", output: "Data contract v1", acceptance: "Một trường có nguồn và người chịu trách nhiệm", owner: "Lead + kỹ thuật", dependencies: "", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B12-02", moduleCode: "B12", title: "Chốt phân quyền và privacy", howTo: "Tách PII, quyền ảnh trường học, purpose, lưu trữ/xóa; rà soát pháp lý", output: "Access/privacy matrix", acceptance: "Không mở lead PII cho toàn thực tập sinh; không PII trong GA4", owner: "Lead", dependencies: "B12-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B12-03", moduleCode: "B12", title: "Tạo import chống trùng", howTo: "Khóa source+entity+metric+scope; lưu file gốc và coverage", output: "Import log + kiểm thử", acceptance: "Nạp lại cùng lô không tăng số; giữ phiên bản chỉnh sửa", owner: "Người kỹ thuật", dependencies: "B12-01", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B12-04", moduleCode: "B12", title: "Kiểm tra chất lượng dữ liệu", howTo: "Null vs 0, thời gian, trùng, link ID, thiếu source, đơn vị tiền", output: "DQ checklist", acceptance: "Lỗi được đánh dấu trước khi báo cáo", owner: "Full-time + Lead", dependencies: "B12-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B12-05", moduleCode: "B12", title: "Kiểm thử backup và khôi phục", howTo: "Định kỳ theo rủi ro, thử lấy lại dữ liệu và thu hồi quyền nhân sự rời", output: "Biên bản restore", acceptance: "Không chỉ có backup mà phải phục hồi thử thành công", owner: "Lead + kỹ thuật", dependencies: "B12-02; B12-03", phase: "P0", status: "Chưa bắt đầu" },
  { code: "B12-06", moduleCode: "B12", title: "Nghiệm thu phiên bản đầu", howTo: "Chạy toàn bộ test 10_KIEM_THU; duyệt thuật ngữ và giới hạn", output: "Biên bản go-live", acceptance: "Phần chưa có không được giả lập dữ liệu; bảo vệ nguyên bản", owner: "Lead", dependencies: "B09-03; B12-04; B12-05", phase: "P0", status: "Chưa bắt đầu" },
];

export const LOGICAL_TABLES_37: LogicalTableItem[] = [
  { tableName: "solutions", domain: "Giải pháp HacoLED", rowGrain: "1 giải pháp có phiên bản", keyFields: "solution_id, name, use_case, included_scope", owner: "Lead + kỹ thuật", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "evidence", domain: "Nguồn bằng chứng", rowGrain: "1 ghi nhận từ một nguồn", keyFields: "evidence_id, source_type, source_ref, observed_at", owner: "Người thu thập + Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "segments", domain: "Phân khúc", rowGrain: "1 phân khúc có tiêu chí vào/ra", keyFields: "segment_id, name, inclusion, exclusion", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "market_scenarios", domain: "TAM SAM SOM", rowGrain: "1 phân khúc × năm × kịch bản", keyFields: "scenario_id, segment_id, year, scenario", owner: "Lead", phase: "P1", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "personas", domain: "Vai trò người mua", rowGrain: "1 vai trò trong phân khúc", keyFields: "persona_id, segment_id, buying_role, job_to_be_done", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "competitor_observations", domain: "Đối thủ và phương án thay thế", rowGrain: "1 quan sát × đối tượng × ngày", keyFields: "observation_id, competitor_name, competitor_type, target_segment", owner: "Lead + hỗ trợ thu thập", phase: "P1", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "insights", domain: "Insight có bằng chứng", rowGrain: "1 giả thuyết insight có phiên bản", keyFields: "insight_id, segment_id, persona_id, context", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "campaigns", domain: "Chiến dịch / chủ đề thử", rowGrain: "1 chiến dịch hữu hạn", keyFields: "campaign_id, name, segment_id, objective", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "content_briefs", domain: "Đầu bài nội dung", rowGrain: "1 chủ đề/góc có phiên bản", keyFields: "brief_id, campaign_id, segment_id, persona_id", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "content_assets", domain: "Sản phẩm nội dung", rowGrain: "1 sản phẩm/phiên bản sáng tạo", keyFields: "asset_id, brief_id, format, parent_asset_id", owner: "Người sản xuất", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "publications", domain: "Lần xuất bản", rowGrain: "1 asset × kênh × lần đăng", keyFields: "publication_id, asset_id, channel_id, native_post_id", owner: "Người được giao đăng", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "channels", domain: "Tài khoản và kênh", rowGrain: "1 tài khoản/kênh sở hữu", keyFields: "channel_id, platform, public_name, native_account_id", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "metric_snapshots", domain: "Số liệu kênh/bài", rowGrain: "1 chỉ số × đối tượng × phạm vi thời gian × nguồn", keyFields: "snapshot_id, entity_type, entity_id, metric_id", owner: "Người phụ trách số liệu", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "search_performance", domain: "Dữ liệu tìm kiếm", rowGrain: "1 site/page/query × ngày × filter được chọn", keyFields: "row_id, date, grain, page_url", owner: "SEO + Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "web_events", domain: "Hành vi website", rowGrain: "1 sự kiện quan sát", keyFields: "event_id, event_name, occurred_at, anonymous_id", owner: "Lead + kỹ thuật", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "organizations", domain: "Tổ chức", rowGrain: "1 tổ chức thực", keyFields: "organization_id, name, organization_type, segment_id", owner: "Đầu mối tiếp nhận + Sales", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "contacts", domain: "Người liên hệ", rowGrain: "1 người, không phải 1 lượt gọi", keyFields: "contact_id, display_name, phone_normalized, email_normalized", owner: "Đầu mối tiếp nhận", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "contact_organization_roles", domain: "Vai trò trong tổ chức", rowGrain: "1 contact × tổ chức × thời gian", keyFields: "role_link_id, contact_id, organization_id, role", owner: "Sales hoặc đầu mối", phase: "P1", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "inquiries", domain: "Yêu cầu liên hệ", rowGrain: "1 yêu cầu có thật theo nhu cầu", keyFields: "inquiry_id, contact_id, received_at, capture_channel", owner: "Đầu mối tiếp nhận", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "opportunities", domain: "Cơ hội/dự án", rowGrain: "1 dự án mua riêng, không phải 1 contact", keyFields: "opportunity_id, project_name, end_user_org_id, buyer_org_id", owner: "Sales xác nhận; Base chỉ nhận phản hồi", phase: "P1", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "inquiry_opportunity_links", domain: "Liên kết yêu cầu với dự án", rowGrain: "1 inquiry × opportunity", keyFields: "link_id, inquiry_id, opportunity_id, relationship_role", owner: "Đầu mối + Sales", phase: "P1", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "stage_history", domain: "Lịch sử trạng thái", rowGrain: "1 lần đổi trạng thái của một đối tượng", keyFields: "history_id, entity_type, entity_id, from_stage", owner: "Hệ thống + người phụ trách", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "touchpoints", domain: "Điểm chạm có thể quan sát", rowGrain: "1 tương tác có bằng chứng", keyFields: "touchpoint_id, contact_id, anonymous_id, occurred_at", owner: "Hệ thống / đầu mối", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "lead_reviews", domain: "Đánh giá fit và intent", rowGrain: "1 đánh giá tại thời điểm", keyFields: "review_id, inquiry_id, fit_result, intent_result", owner: "Lead / Sales", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "costs", domain: "Chi phí và giờ công", rowGrain: "1 khoản chi hoặc phân bổ", keyFields: "cost_id, period, campaign_id, cost_type", owner: "Lead; lương giới hạn truy cập", phase: "P1", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "experiments", domain: "Thử nghiệm", rowGrain: "1 giả thuyết có phạm vi", keyFields: "experiment_id, hypothesis, segment_id, variable", owner: "Lead", phase: "P1", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "decisions", domain: "Nhật ký quyết định", rowGrain: "1 quyết định có hiệu lực", keyFields: "decision_id, question, decision, basis_refs", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "employees", domain: "Nhân sự", rowGrain: "1 người", keyFields: "employee_id, name, role, weekly_available_hours", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "tasks", domain: "Công việc", rowGrain: "1 nhiệm vụ có đầu ra", keyFields: "task_id, brief_id, assignee_id, reviewer_id", owner: "Người làm + full-time", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "skills_assessments", domain: "Khảo sát và năng lực", rowGrain: "1 người × kỹ năng × lần đánh giá", keyFields: "assessment_id, employee_id, skill, scenario_response", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "learning_resources", domain: "Học liệu số", rowGrain: "1 bài học/SOP có phiên bản", keyFields: "resource_id, skill, learning_objective, content_ref", owner: "Lead + full-time", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "learning_progress", domain: "Tiến độ tự học", rowGrain: "1 người × học liệu × phiên bản", keyFields: "progress_id, employee_id, resource_id, assigned_at", owner: "Người học + người duyệt", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "metric_definitions", domain: "Từ điển chỉ số", rowGrain: "1 metric × phiên bản hiệu lực", keyFields: "metric_id, name, grain, formula", owner: "Lead", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "imports", domain: "Nhật ký nạp dữ liệu", rowGrain: "1 lần nhập/API/export", keyFields: "batch_id, source, period_start, period_end", owner: "Người phụ trách dữ liệu", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "consents_permissions", domain: "Quyền xử lý và sử dụng", rowGrain: "1 quyền × chủ thể/tài sản × mục đích", keyFields: "permission_id, subject_or_asset_id, purpose, legal_basis_review", owner: "Lead/người được phân quyền", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S07; S15; S16" },
  { tableName: "audit_log", domain: "Lịch sử chỉnh sửa", rowGrain: "1 thao tác", keyFields: "audit_id, actor_id, entity_type, entity_id", owner: "Hệ thống", phase: "P0", note: "Không tự động thu thập mọi trường; unknown/null khi chưa có", source: "S22" },
  { tableName: "financial_entries", domain: "Kết quả kinh doanh theo kỳ", rowGrain: "1 phát sinh có loại, ngày và chứng từ", keyFields: "entry_id, opportunity_id, entry_type, effective_date, amount_vnd", owner: "Kế toán/Sales", phase: "P1", note: "Đối soát kết quả tối thiểu, không thay phần mềm kế toán. Không cộng doanh thu và tiền thu.", source: "S22" },
];

export const METRICS_83: MetricItem[] = [
  { code: "M001", group: "Liên hệ", name: "Yêu cầu nhận được", formula: "COUNT(inquiry_id trước sàng lọc)", grain: "Yêu cầu × kỳ", sourceOfTruth: "Base/inquiries", aggregationRule: "Lưu lượt tiếp nhận; không gọi là khách duy nhất", guardrail: "Loại test khỏi báo cáo sản xuất; báo riêng spam/trùng.", phase: "P0" },
  { code: "M002", group: "Liên hệ", name: "Yêu cầu hợp lệ", formula: "COUNT DISTINCT inquiry_id WHERE validity=valid", grain: "Yêu cầu × kỳ nhận", sourceOfTruth: "Base/inquiries", aggregationRule: "Không cộng các bản ghi đã đánh dấu trùng", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M003", group: "Liên hệ", name: "Người liên hệ duy nhất", formula: "COUNT DISTINCT contact_id có yêu cầu hợp lệ trong kỳ", grain: "Người × kỳ", sourceOfTruth: "Base/contacts + inquiries", aggregationRule: "Distinct toàn kỳ, không cộng distinct ngày", guardrail: "Không đồng nghĩa khách hàng mới hoặc số tổ chức.", phase: "P0" },
  { code: "M004", group: "Liên hệ", name: "Liên hệ mới xác nhận với công ty", formula: "COUNT DISTINCT contact_id có first_valid_inquiry_at trong kỳ và new_to_company_status=new_confirmed", grain: "Người × kỳ đầu", sourceOfTruth: "Base + xác nhận người nhận/Sales", aggregationRule: "Một người không được tính mới lại mỗi tháng", guardrail: "Không có trong Base chưa chứng minh chưa từng liên hệ HacoLED.", phase: "P0" },
  { code: "M005", group: "Liên hệ", name: "Liên hệ đã biết", formula: "COUNT DISTINCT contact_id có inquiry hợp lệ và relationship=known", grain: "Người × kỳ", sourceOfTruth: "Base + xác nhận", aggregationRule: "Theo trạng thái xác nhận tại kỳ", guardrail: "Đã biết khác đã mua.", phase: "P0" },
  { code: "M006", group: "Liên hệ", name: "Chưa rõ mới/cũ", formula: "COUNT DISTINCT contact_id có relationship=unknown", grain: "Người × kỳ", sourceOfTruth: "Base", aggregationRule: "Giữ bucket unknown; không phân bổ theo tỷ lệ 70/30", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M007", group: "Liên hệ", name: "Tổ chức liên hệ duy nhất", formula: "COUNT DISTINCT organization_id liên quan yêu cầu hợp lệ", grain: "Tổ chức × kỳ", sourceOfTruth: "Base/organizations", aggregationRule: "Gộp trường có nhiều người liên hệ có bằng chứng", guardrail: "Không tự gộp theo tên giống; buyer và end user có thể khác.", phase: "P0" },
  { code: "M008", group: "Liên hệ", name: "Khách mới từ Digital xác nhận", formula: "M004 lọc nguồn/tiếp nhận Digital có bằng chứng", grain: "Người × kỳ đầu", sourceOfTruth: "Base/touchpoints", aggregationRule: "Hotline unknown không mặc định website", guardrail: "Không đại diện tác động tăng thêm do Marketing mới.", phase: "P0" },
  { code: "M009", group: "Chất lượng", name: "Liên hệ đủ điều kiện trong cohort", formula: "COUNT DISTINCT contact_id của cohort có nhu cầu thật, fit=yes, có thể liên hệ; tính đến cutoff", grain: "Cohort first_valid_contact × thời gian theo dõi", sourceOfTruth: "Base/lead_reviews", aggregationRule: "Gắn version tiêu chí và cutoff", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M010", group: "Chất lượng", name: "Tỷ lệ lead phù hợp của cohort", formula: "M009 / số contact hợp lệ thuộc cùng cohort", grain: "Cùng nhóm đầu vào và cutoff", sourceOfTruth: "Base", aggregationRule: "Không lấy số đủ điều kiện tháng này / toàn lead tháng này nếu khác cohort", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M011", group: "Chất lượng", name: "Phân bố nóng/ấm/lạnh/chưa rõ", formula: "COUNT DISTINCT inquiry_id theo review mới nhất tại cutoff; tổng hợp contact phải có quy tắc ưu tiên riêng", grain: "Yêu cầu/cơ hội", sourceOfTruth: "Base/lead_reviews", aggregationRule: "Giữ unknown; phân theo ưu tiên dự án khi một người có nhiều nhu cầu", guardrail: "Một người có thể có nhiều dự án khác độ nóng. Không cộng người từ các nhóm trùng nhau.", phase: "P0" },
  { code: "M012", group: "Sales feedback", name: "Yêu cầu chuyển Sales", formula: "COUNT DISTINCT inquiry_id có handoff_at trong kỳ", grain: "Yêu cầu × kỳ bàn giao", sourceOfTruth: "Base", aggregationRule: "Không phải số hợp đồng", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M013", group: "Sales feedback", name: "Tỷ lệ Sales nhận", formula: "Yêu cầu được Sales xác nhận nhận / yêu cầu cùng cohort đã chuyển", grain: "Cohort bàn giao", sourceOfTruth: "Base + Sales", aggregationRule: "Báo riêng pending và thời gian chờ", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M014", group: "Sales feedback", name: "Thời gian phản hồi đầu tiên", formula: "MEDIAN(first_meaningful_response_at - received_at)", grain: "Yêu cầu đã được trả lời × giờ làm việc thống nhất", sourceOfTruth: "Base/hotline/inbox", aggregationRule: "Tách phản hồi người thật và tự động", guardrail: "Nêu lịch làm việc; yêu cầu chưa trả lời không được bỏ khỏi backlog.", phase: "P0" },
  { code: "M015", group: "Sales feedback", name: "Yêu cầu chưa được phản hồi", formula: "COUNT inquiry hợp lệ chưa có first_meaningful_response", grain: "Yêu cầu mở tại cutoff", sourceOfTruth: "Base", aggregationRule: "Chỉ cảnh báo, không giả định Sales bỏ khách", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M016", group: "Cơ hội", name: "Dự án/cơ hội mới xác nhận", formula: "COUNT DISTINCT opportunity_id được Sales xác nhận và opened_at trong kỳ", grain: "Dự án × kỳ", sourceOfTruth: "Sales feedback", aggregationRule: "Không đếm nhiều người tham gia thành nhiều dự án", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M017", group: "Cơ hội", name: "Tỷ lệ thắng đã kết thúc", formula: "Won / (Won + Lost) của cùng scope, đóng trong kỳ", grain: "Cơ hội đã đóng × kỳ", sourceOfTruth: "Sales feedback", aggregationRule: "Không tính pending là thua", guardrail: "Đây là tỷ lệ trên deal đã đóng, không phải tỷ lệ chốt cohort lead mới.", phase: "P1" },
  { code: "M018", group: "Cơ hội", name: "Chuyển đổi lead sau W ngày", formula: "Contact cohort chuyển thành cơ hội thắng trong W ngày / contact cohort đủ W ngày quan sát", grain: "Cohort người liên hệ × W ngày", sourceOfTruth: "Base + Sales", aggregationRule: "W do Lead chọn theo chu kỳ thực tế", guardrail: "Chưa đủ tuổi quan sát để pending, không gán 0.", phase: "P1" },
  { code: "M019", group: "Kinh doanh", name: "Giá trị hợp đồng ký", formula: "SUM financial_entries.amount_vnd loại giá trị ký theo effective_date, cùng VAT basis", grain: "Hợp đồng × kỳ ký", sourceOfTruth: "Sales/kế toán", aggregationRule: "Ghi rõ VAT; không phải doanh thu ghi nhận", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M020", group: "Kinh doanh", name: "Doanh thu ghi nhận", formula: "SUM financial_entries.amount_vnd loại doanh thu ghi nhận theo kỳ kế toán", grain: "Kỳ ghi nhận", sourceOfTruth: "Kế toán", aggregationRule: "Nguồn kế toán; không suy ra từ form hoặc hợp đồng", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P2" },
  { code: "M021", group: "Kinh doanh", name: "Tiền đã thu", formula: "SUM financial_entries.amount_vnd loại tiền thu theo effective_date", grain: "Kỳ thu tiền", sourceOfTruth: "Kế toán", aggregationRule: "Không trộn với doanh thu", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P2" },
  { code: "M022", group: "Kinh doanh", name: "Giá trị pipeline", formula: "SUM expected_amount_vnd của cơ hội mở, có ngày chốt dự kiến", grain: "Snapshot cơ hội mở", sourceOfTruth: "Sales feedback", aggregationRule: "Không gọi là doanh thu dự báo chắc chắn", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P2" },
  { code: "M023", group: "Kinh doanh", name: "Khách mua lần đầu xác nhận", formula: "COUNT DISTINCT buyer_org_id với lần mua đầu được xác nhận", grain: "Tổ chức mua × kỳ", sourceOfTruth: "Sales", aggregationRule: "Base mới không có lịch sử: unknown nếu chưa xác nhận", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M024", group: "Kinh doanh", name: "Tỷ lệ mua lại", formula: "Tổ chức trong cohort đã mua và có mua lại trong cửa sổ / tổ chức cohort đủ thời gian quan sát", grain: "Cohort khách mua", sourceOfTruth: "Sales", aggregationRule: "Không gán churn tháng chỉ vì LED không mua thường xuyên", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P2" },
  { code: "M025", group: "Kinh doanh", name: "Liên hệ được giới thiệu", formula: "COUNT DISTINCT contact_id có nguồn referral xác nhận", grain: "Người × kỳ", sourceOfTruth: "Nguồn tự khai/Sales", aggregationRule: "Tách khách được giới thiệu và người giới thiệu", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M026", group: "SEO", name: "GSC impressions", formula: "SUM impressions cùng grain và filters", grain: "Property hoặc page/query × kỳ", sourceOfTruth: "GSC / S08; S09", aggregationRule: "Không cộng các bảng grain khác nhau", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M027", group: "SEO", name: "GSC clicks", formula: "SUM clicks cùng scope", grain: "Property hoặc page/query × kỳ", sourceOfTruth: "GSC / S08", aggregationRule: "Không đồng nghĩa GA4 sessions", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M028", group: "SEO", name: "GSC CTR", formula: "SUM clicks / SUM impressions cùng scope", grain: "Scope tìm kiếm × kỳ", sourceOfTruth: "GSC / S08", aggregationRule: "Không lấy trung bình cộng CTR từng dòng", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M029", group: "SEO", name: "Vị trí trung bình", formula: "Giữ average_position nguồn; chỉ trọng số impressions với grain tương thích", grain: "Query/page/property theo định nghĩa nguồn", sourceOfTruth: "GSC / S08; S09", aggregationRule: "Không so thứ hạng tự tìm cá nhân với bình quân", guardrail: "Không coi vị trí trung bình chung là thị phần.", phase: "P0" },
  { code: "M030", group: "SEO", name: "Clicks brand/nonbrand/chưa rõ", formula: "Clicks theo bộ quy tắc truy vấn version hóa", grain: "Những query quan sát được × kỳ", sourceOfTruth: "GSC", aggregationRule: "Báo độ bao phủ truy vấn; phần ẩn không đoán", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M031", group: "SEO", name: "Trang ưu tiên được index", formula: "Số URL ưu tiên xác nhận index / số URL ưu tiên kiểm tra", grain: "Danh sách URL kiểm tra", sourceOfTruth: "GSC/kiểm tra được phép", aggregationRule: "Không khẳng định toàn site nếu chỉ kiểm mẫu", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M032", group: "Website", name: "Sessions", formula: "Giữ sessions báo cáo cùng filter", grain: "Phiên × kỳ nguồn", sourceOfTruth: "GA4 / S05", aggregationRule: "Nêu scope session và timezone", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M033", group: "Website", name: "Users quan sát", formula: "Giữ total/active users theo tên nguồn", grain: "User ID đo lường × kỳ", sourceOfTruth: "GA4 / S05", aggregationRule: "Không cộng users ngày thành users tháng", guardrail: "Không phải số người thực duy nhất tuyệt đối; không phải khách mới công ty.", phase: "P0" },
  { code: "M034", group: "Website", name: "Engagement rate", formula: "Engaged sessions / sessions theo GA4", grain: "Phiên × kỳ", sourceOfTruth: "GA4", aggregationRule: "Không thay bằng thời gian ở trang hoặc ý định mua", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M035", group: "Website", name: "Lượt nhấn gọi", formula: "COUNT click_phone hợp lệ", grain: "Sự kiện × kỳ", sourceOfTruth: "Event nội bộ", aggregationRule: "Chỉ thể hiện nhấn nút", guardrail: "Không phải cuộc gọi kết nối hoặc lead thật.", phase: "P0" },
  { code: "M036", group: "Website", name: "Lượt mở Zalo", formula: "COUNT click_zalo hợp lệ", grain: "Sự kiện × kỳ", sourceOfTruth: "Event nội bộ", aggregationRule: "Chỉ thể hiện mở liên kết", guardrail: "Không xác nhận khách đã nhắn hoặc mua.", phase: "P0" },
  { code: "M037", group: "Website", name: "Form được máy chủ nhận", formula: "COUNT DISTINCT submission_id thành công, loại test/spam", grain: "Submission × kỳ", sourceOfTruth: "Backend form", aggregationRule: "Nguồn backend là số form; GA4 để đối chiếu", guardrail: "Thành công form chưa bằng lead đủ điều kiện.", phase: "P0" },
  { code: "M038", group: "Website", name: "Tỷ lệ phiên có form thành công", formula: "Phiên quan sát có >=1 form thành công / phiên đủ điều kiện cùng phạm vi", grain: "Phiên × kỳ", sourceOfTruth: "GA4/đối soát backend", aggregationRule: "Giữ numerator là phiên, không là số form", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M039", group: "Website", name: "Tỷ lệ bỏ form quan sát", formula: "1 - phiên có form thành công / phiên có form_start", grain: "Phiên có đo đủ hành trình", sourceOfTruth: "GA4/event", aggregationRule: "Có thể thiếu do consent, đổi thiết bị, đóng tab", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M040", group: "Website", name: "Tỷ lệ trang lỗi trong mẫu", formula: "Trang lỗi / trang đã kiểm tra cùng mẫu", grain: "URL × lần kiểm", sourceOfTruth: "Kiểm tra website", aggregationRule: "Không lấy mẫu nhỏ suy toàn site", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M041", group: "Social", name: "Impressions / views native", formula: "Giữ đúng metric gốc và format", grain: "Publication × kỳ hoặc lifetime", sourceOfTruth: "Báo cáo native / S10; S12", aggregationRule: "Không gọi tổng views các nền tảng là người duy nhất", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M042", group: "Social", name: "Reach native", formula: "Giữ reach unique theo scope nền tảng", grain: "Kênh hoặc publication × kỳ", sourceOfTruth: "Báo cáo native", aggregationRule: "Không cộng reach bài thành reach kênh", guardrail: "Chỉ nhập khi nền tảng/tài khoản có dữ liệu.", phase: "P0" },
  { code: "M043", group: "Social", name: "Tương tác chọn lọc", formula: "SUM reactions + comments + shares + saves với thành phần công bố", grain: "Publication × kỳ", sourceOfTruth: "Native", aggregationRule: "Giữ từng thành phần; không trộn định nghĩa engagement nền tảng", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M044", group: "Social", name: "ER theo reach", formula: "Tổng tương tác đã định nghĩa / reach cùng scope", grain: "Publication × kỳ", sourceOfTruth: "Native + Base", aggregationRule: "Gắn hậu tố _by_reach; không đổi mẫu số ngầm", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M045", group: "Social", name: "ER theo views", formula: "Tổng tương tác đã định nghĩa / views cùng scope", grain: "Publication × kỳ", sourceOfTruth: "Native + Base", aggregationRule: "Không đem so trực tiếp với ER theo reach", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M046", group: "Social", name: "Outbound clicks", formula: "Lượt nhấp ra ngoài theo nguồn", grain: "Publication × kỳ", sourceOfTruth: "Native/UTM", aggregationRule: "Không lấy tất cả clicks làm clicks website", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M047", group: "Social", name: "Referral sessions từ bài", formula: "Sessions với UTM publication_id đúng", grain: "Phiên × kỳ", sourceOfTruth: "GA4 + UTM / S05", aggregationRule: "Không cộng với native clicks như cùng một chỉ số", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M048", group: "Social", name: "Followers tăng ròng", formula: "Followers cuối kỳ - đầu kỳ; hoặc gained-lost theo native", grain: "Kênh × kỳ", sourceOfTruth: "Native", aggregationRule: "Số stock không cộng mỗi ngày", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M049", group: "Video", name: "Watch time", formula: "SUM watch_time cùng định nghĩa", grain: "Video × kỳ", sourceOfTruth: "Native / S10", aggregationRule: "Đơn vị giây/phút phải chuẩn hóa rõ", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M050", group: "Video", name: "Average view duration", formula: "Giữ số native hoặc tổng watch_time / lượt phát đủ điều kiện tương thích", grain: "Video × kỳ", sourceOfTruth: "Native / S10", aggregationRule: "Không chia cho loại views khác chuẩn của metric", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M051", group: "Video", name: "Engaged views", formula: "Giữ engagedViews theo định nghĩa nguồn", grain: "Video × kỳ", sourceOfTruth: "YouTube / S10; S12", aggregationRule: "Giữ riêng với views, không tự ánh xạ TikTok/Facebook", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M052", group: "Video", name: "YouTube thumbnail CTR", formula: "Clicks trên thumbnail đủ điều kiện / eligible thumbnail impressions", grain: "Thumbnail × kỳ", sourceOfTruth: "YouTube / S11", aggregationRule: "Không lấy toàn bộ video views chia thumbnail impressions", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M053", group: "Video", name: "Tỷ lệ hoàn thành native", formula: "Giữ completion rate theo denominator do nguồn định nghĩa", grain: "Video × kỳ", sourceOfTruth: "Native", aggregationRule: "Không có dữ liệu để null, không giả lập từ thời lượng trung bình", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M054", group: "Video", name: "Hiệu suất cùng tuổi nội dung", formula: "Chỉ số của từng publication ở tuổi D+7 hoặc D+28", grain: "Publication × tuổi bài", sourceOfTruth: "Snapshots", aggregationRule: "D+7/D+28 là cửa sổ đề xuất, không phải benchmark thắng/thua", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M055", group: "Content", name: "Sản phẩm đã nghiệm thu", formula: "COUNT DISTINCT asset_id đạt nghiệm thu lần đầu", grain: "Sản phẩm × kỳ", sourceOfTruth: "Base/assets", aggregationRule: "1 video đăng 3 kênh vẫn 1 asset", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M056", group: "Content", name: "Lần xuất bản", formula: "COUNT DISTINCT publication_id published", grain: "Lần đăng × kỳ", sourceOfTruth: "Base/publications", aggregationRule: "1 video đăng 3 kênh = 3 publication", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M057", group: "Content", name: "Tỷ lệ đạt lần duyệt đầu", formula: "Sản phẩm đạt ngay lần đầu / sản phẩm được duyệt lần đầu cùng cohort", grain: "Cohort review sản phẩm", sourceOfTruth: "Base/review", aggregationRule: "Khác tỷ lệ cuối cùng được duyệt", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M058", group: "Content", name: "Tỷ lệ đúng hạn", formula: "Nhiệm vụ đạt nghiệm thu <=deadline / nhiệm vụ đến hạn trong kỳ", grain: "Task đến hạn × kỳ", sourceOfTruth: "Base/tasks", aggregationRule: "Task chưa xong quá hạn vẫn nằm mẫu; đổi deadline có log", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M059", group: "Content", name: "Giờ / sản phẩm đạt", formula: "Tổng giờ thực / asset được nghiệm thu cùng nhóm công việc", grain: "Format × độ phức tạp × kỳ", sourceOfTruth: "Time logs", aggregationRule: "Không so video dài với bài ngắn bằng số lượng thuần", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M060", group: "Content", name: "Tỷ lệ bao phủ nội dung theo nhu cầu", formula: "Ô target–need_stage ưu tiên có nội dung đạt / ô đã chọn ưu tiên", grain: "Ma trận chiến dịch", sourceOfTruth: "Base/briefs", aggregationRule: "Là coverage, không chứng minh khách đã xem hoặc hiểu", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M061", group: "Chi phí", name: "Chi phí tiền mới", formula: "SUM incremental_cash trong kỳ", grain: "VND × kỳ", sourceOfTruth: "Base/costs", aggregationRule: "Có thể bằng 0, khác chi phí kinh tế đầy đủ", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M062", group: "Chi phí", name: "Chi phí kinh tế Marketing", formula: "Tiền mới + nhân công phân bổ + công cụ phân bổ + thuê ngoài liên quan", grain: "VND × kỳ", sourceOfTruth: "Base/costs", aggregationRule: "Chỉ tính khi đầu vào đầy đủ, nêu phương pháp", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M063", group: "Chi phí", name: "CPL theo tiền mới", formula: "Chi phí tiền mới / liên hệ hợp lệ thuộc cùng scope ghi nhận", grain: "Campaign × kỳ", sourceOfTruth: "Base", aggregationRule: "Chỉ là tỷ số ghi nhận, không chứng minh incremental", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M064", group: "Chi phí", name: "CPQL đầy đủ", formula: "Chi phí kinh tế phân bổ / lead đủ điều kiện trong scope công bố", grain: "Campaign/cohort × kỳ", sourceOfTruth: "Base", aggregationRule: "Không đủ chi phí => chưa đủ dữ liệu, không ghi 0", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M065", group: "Chi phí", name: "CAC kết hợp Marketing + Sales", formula: "Chi phí thu hút Marketing+Sales phân bổ / tổ chức mua mới xác nhận", grain: "Cohort hoặc blended kỳ được ghi rõ", sourceOfTruth: "Kế toán/Sales/Base", aggregationRule: "Phải ghi mô hình thời gian và độ trễ", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P2" },
  { code: "M066", group: "Chi phí", name: "ROAS", formula: "Doanh thu được phân bổ quảng cáo / ad spend", grain: "Paid campaign × attribution window", sourceOfTruth: "Nền tảng + đối soát", aggregationRule: "Không có ad spend => N/A; không phải lợi nhuận", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P2" },
  { code: "M067", group: "Chi phí", name: "ROI Marketing có cơ sở", formula: "(Lợi nhuận đóng góp tăng thêm - chi phí Marketing) / chi phí Marketing", grain: "Thử nghiệm/kỳ có đo tác động", sourceOfTruth: "Tài chính + thí nghiệm", aggregationRule: "Không dùng toàn doanh thu được gán nguồn làm lợi nhuận tăng thêm", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P2" },
  { code: "M068", group: "Dữ liệu", name: "Độ đầy đủ trường bắt buộc", formula: "Số ô bắt buộc hợp lệ / số ô bắt buộc phải có", grain: "Bảng × kỳ", sourceOfTruth: "Base/DQ", aggregationRule: "Unknown hợp lệ về kỹ thuật nhưng chưa đủ thông tin kinh doanh", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M069", group: "Dữ liệu", name: "Tỷ lệ biết nguồn thu hút", formula: "Yêu cầu hợp lệ có nguồn có bằng chứng / yêu cầu hợp lệ cùng kỳ", grain: "Inquiry × kỳ", sourceOfTruth: "Base", aggregationRule: "Capture_channel=form không có nghĩa source=SEO", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M070", group: "Dữ liệu", name: "Tỷ lệ rõ mới/cũ", formula: "Contact có trạng thái mới/cũ xác nhận / contact được tính trong kỳ", grain: "Contact × kỳ", sourceOfTruth: "Base", aggregationRule: "Không tự ép unknown sang new", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M071", group: "Dữ liệu", name: "Độ trễ dữ liệu", formula: "Thời điểm hiện tại - latest_source_period_end sẵn có", grain: "Nguồn × lần kiểm", sourceOfTruth: "Import log / S18", aggregationRule: "Ngưỡng cảnh báo dựa lịch nguồn, không cố realtime", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M072", group: "Dữ liệu", name: "Lô nhập đúng hạn", formula: "Lô nhập đủ, đạt kiểm tra / lô dự kiến trong kỳ", grain: "Lịch nhập × kỳ", sourceOfTruth: "Base/imports", aggregationRule: "Phân biệt không có hoạt động với thiếu import", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M073", group: "Tăng trưởng", name: "Chênh lệch tuyệt đối", formula: "Giá trị kỳ này - giá trị kỳ trước cùng scope", grain: "Chỉ số × kỳ tương đương", sourceOfTruth: "Base", aggregationRule: "Cùng định nghĩa, source, filter, thời gian quan sát", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M074", group: "Tăng trưởng", name: "Tăng trưởng tương đối", formula: "(Kỳ này - kỳ trước) / kỳ trước", grain: "Chỉ số × hai kỳ", sourceOfTruth: "Base", aggregationRule: "Kỳ trước 0 => N/A, vẫn nêu chênh lệch tuyệt đối", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M075", group: "Tăng trưởng", name: "Chênh lệch điểm phần trăm", formula: "Tỷ lệ kỳ này - tỷ lệ kỳ trước", grain: "Hai tỷ lệ cùng định nghĩa", sourceOfTruth: "Base", aggregationRule: "Ví dụ 2% lên 3% = +1 điểm %, không +1% tương đối", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M076", group: "Tăng trưởng", name: "Lead theo ngày đo đủ", formula: "Lead hợp lệ / số ngày dữ liệu đầy đủ", grain: "Kỳ cùng điều kiện", sourceOfTruth: "Base", aggregationRule: "Không tự annualize tuyến tính thành cam kết doanh thu", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M077", group: "Nhân sự", name: "Mức tự chủ có bằng chứng", formula: "Cấp đánh giá theo rubric + sản phẩm, không tính từ view", grain: "Người × kỹ năng × lần review", sourceOfTruth: "Base/skills", aggregationRule: "Chưa quan sát khác yếu; không xếp hạng bằng AI", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M078", group: "Nhân sự", name: "Bài thực hành đạt", formula: "Số bài đã được nghiệm thu / số bài đến hạn", grain: "Người × học liệu × kỳ", sourceOfTruth: "Base/learning", aggregationRule: "Mở video hoặc hoàn thành quiz chưa chứng minh năng lực", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P0" },
  { code: "M079", group: "Thị trường", name: "TAM annual opportunity", formula: "SUM số tổ chức đúng phạm vi × cơ hội mua/tổ chức/năm × giá trị/cơ hội", grain: "Segment × năm × kịch bản", sourceOfTruth: "Market_scenarios / S02; S14", aggregationRule: "Các phân khúc phải không trùng khi cộng; nêu nguồn từng đầu vào", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M080", group: "Thị trường", name: "SAM annual opportunity", formula: "Cơ hội/năm đáp ứng điều kiện phục vụ × giá trị cùng phạm vi", grain: "Tập con TAM × năm", sourceOfTruth: "Market_scenarios", aggregationRule: "Không gán tùy ý SAM=30% TAM", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M081", group: "Thị trường", name: "SOM dự án và giá trị", formula: "MIN(cơ hội SAM, năng lực giao, cơ hội đủ điều kiện tiếp cận × tỷ lệ thắng giả định) × giá trị bình quân", grain: "Kỳ và đơn vị đồng nhất", sourceOfTruth: "Market_scenarios", aggregationRule: "Kịch bản, không dự báo chắc chắn; không thay SOM bằng toàn target", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M082", group: "Nghiên cứu", name: "Insight có nguồn độc lập", formula: "COUNT insight được đối chiếu và có provenance", grain: "Insight × kỳ review", sourceOfTruth: "Base/evidence", aggregationRule: "Số comment không đại diện tỷ lệ toàn thị trường", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
  { code: "M083", group: "Thử nghiệm", name: "Thử nghiệm có quyết định", formula: "COUNT experiment có kết quả, hạn chế và next action đã duyệt", grain: "Experiment × kỳ", sourceOfTruth: "Base/experiments", aggregationRule: "Không thưởng chỉ cho thử nghiệm thành công", guardrail: "Mẫu số 0 hoặc thiếu dữ liệu: N/A; không tự thay bằng 0.", phase: "P1" },
];

export const EVENTS_20: EventPlanItem[] = [
  { code: "EV01", eventName: "page_view", type: "Đo website", trigger: "Trang được xem theo điều kiện thu thập", keyFields: "page_id, session_id nếu có", isLead: "Không", errorControl: "Không phải nhận diện khách thật", owner: "GA4", ref: "S05" },
  { code: "EV02", eventName: "view_solution", type: "Đề xuất custom", trigger: "Trang giải pháp xác định được hiển thị", keyFields: "solution_id, page_id", isLead: "Không", errorControl: "Không suy ra trường/đơn vị của người xem", owner: "Lead + kỹ thuật", ref: "S22" },
  { code: "EV03", eventName: "view_case_study", type: "Đề xuất custom", trigger: "Trang dự án được xem", keyFields: "case_id, page_id", isLead: "Không", errorControl: "Xem bằng chứng không tự bằng ý định mua", owner: "Lead + kỹ thuật", ref: "S22" },
  { code: "EV04", eventName: "file_download", type: "Auto/custom tùy triển khai", trigger: "Nhấp tải file theo cách đo đã chốt", keyFields: "file_id, page_id", isLead: "Không", errorControl: "Nhấp không bảo đảm tải xong/đọc xong", owner: "GA4 + kiểm tra", ref: "S04" },
  { code: "EV05", eventName: "click_phone", type: "Đề xuất custom", trigger: "Nhấn link tel:", keyFields: "placement_id, page_id", isLead: "Không", errorControl: "Không biết cuộc gọi kết nối hay không", owner: "Lead + kỹ thuật", ref: "S22" },
  { code: "EV06", eventName: "click_zalo", type: "Đề xuất custom", trigger: "Nhấn link mở Zalo", keyFields: "placement_id, page_id", isLead: "Không", errorControl: "Không biết có cuộc trò chuyện thật", owner: "Lead + kỹ thuật", ref: "S22" },
  { code: "EV07", eventName: "click_messenger", type: "Đề xuất custom", trigger: "Nhấn mở Messenger", keyFields: "placement_id, page_id", isLead: "Không", errorControl: "Nhấn mở không phải tin nhắn được nhận", owner: "Lead + kỹ thuật", ref: "S22" },
  { code: "EV08", eventName: "form_start", type: "Đo form", trigger: "Bắt đầu tương tác form theo trigger đã thử", keyFields: "form_id, session_id", isLead: "Không", errorControl: "Không tạo khách; loại nội bộ/test", owner: "GA4/custom", ref: "S04" },
  { code: "EV09", eventName: "form_error", type: "Đề xuất custom", trigger: "Backend/validation trả lỗi", keyFields: "form_id, error_code không PII", isLead: "Không", errorControl: "Không đính kèm nội dung người nhập", owner: "Backend + kỹ thuật", ref: "S07" },
  { code: "EV10", eventName: "generate_lead", type: "GA4 recommended", trigger: "Backend xác nhận yêu cầu được lưu thành công; đối soát spam", keyFields: "event_id, form_id, campaign_id, publication_id khi có", isLead: "Ứng viên lead", errorControl: "Không phát khi chỉ click submit hoặc load thank-you lại", owner: "Backend/GA4", ref: "S04" },
  { code: "EV11", eventName: "inbound_call_recorded", type: "Base nội bộ", trigger: "Người phụ trách xác nhận nhận cuộc gọi và nhu cầu", keyFields: "contact_id, inquiry_id, new_old_unknown", isLead: "Theo xác minh", errorControl: "Nguồn unknown được giữ; không gửi PII sang GA4", owner: "Người nhận hotline", ref: "S22" },
  { code: "EV12", eventName: "inbound_message_recorded", type: "Base nội bộ", trigger: "Có hội thoại thật liên quan nhu cầu", keyFields: "contact_id, inquiry_id, capture_channel", isLead: "Theo xác minh", errorControl: "Không cộng nhiều tin nhắn thành nhiều lead", owner: "Người phụ trách inbox", ref: "S22" },
  { code: "EV13", eventName: "qualify_lead", type: "GA4 recommended / Base", trigger: "Lead được đánh giá đạt tiêu chí đã duyệt", keyFields: "inquiry_id nội bộ, rule_version, reason", isLead: "Có nếu đạt", errorControl: "Base là nguồn chuẩn; analytics không phải CRM", owner: "Lead/Sales", ref: "S04" },
  { code: "EV14", eventName: "disqualify_lead", type: "GA4 recommended / Base", trigger: "Được xác nhận không đạt cùng lý do", keyFields: "inquiry_id, reason, rule_version", isLead: "Không", errorControl: "Unknown không phải disqualified", owner: "Lead/Sales", ref: "S04" },
  { code: "EV15", eventName: "working_lead", type: "GA4 recommended / Base", trigger: "Sales xác nhận đang xử lý", keyFields: "inquiry_id, owner, timestamp", isLead: "Không tăng count lead", errorControl: "Sự kiện lặp phải có id chống trùng", owner: "Sales feedback", ref: "S04" },
  { code: "EV16", eventName: "proposal_sent", type: "Base nội bộ", trigger: "Sales xác nhận đã gửi phương án/báo giá", keyFields: "opportunity_id, proposal_ref", isLead: "Không", errorControl: "Chưa có doanh thu", owner: "Sales feedback", ref: "S22" },
  { code: "EV17", eventName: "close_convert_lead", type: "GA4 recommended / Base", trigger: "Cơ hội được xác nhận chuyển thành khách theo tiêu chí duyệt", keyFields: "opportunity_id, closed_at", isLead: "Kết quả kinh doanh", errorControl: "Giá trị ký khác doanh thu kế toán; không phát chỉ vì click", owner: "Sales feedback", ref: "S04" },
  { code: "EV18", eventName: "close_unconvert_lead", type: "GA4 recommended / Base", trigger: "Cơ hội kết thúc không chuyển đổi có lý do", keyFields: "opportunity_id, reason", isLead: "Không", errorControl: "Lead đang chờ không phải mất", owner: "Sales feedback", ref: "S04" },
  { code: "EV19", eventName: "feedback_received", type: "Base nội bộ", trigger: "Sales cung cấp thông tin chất lượng hoặc kết quả", keyFields: "inquiry_id, feedback, received_at", isLead: "Không", errorControl: "Phân biệt nhận xét với xác minh", owner: "Sales + Lead", ref: "S22" },
  { code: "EV20", eventName: "content_published", type: "Base nội bộ", trigger: "Bài có ID/URL thật và trạng thái đăng", keyFields: "asset_id, publication_id, channel_id", isLead: "Không", errorControl: "Không tính scheduled là published", owner: "Người đăng", ref: "S22" },
];

export const LEAD_RULES_18: LeadRuleItem[] = [
  { code: "LR01", topic: "Chống đếm trùng", input: "Cùng submission_id / native_message_thread / event_id", ruleResult: "Nạp lại không tạo thêm yêu cầu", automationLevel: "Có thể tự động", limitation: "Không dựa chỉ ngày/giờ", phase: "P0" },
  { code: "LR02", topic: "Nhận diện người", input: "Số/email đã chuẩn trùng", ruleResult: "Gợi ý liên kết contact; trường hợp số chung cần duyệt", automationLevel: "Bán tự động", limitation: "Không suy luận cùng công ty = cùng người", phase: "P0" },
  { code: "LR03", topic: "Nhận diện tổ chức", input: "Tên + địa chỉ/tên miền + xác nhận", ruleResult: "Gợi ý organization, có người duyệt", automationLevel: "Bán tự động", limitation: "Không mặc định trường cùng tên là một", phase: "P0" },
  { code: "LR04", topic: "Mới với Base", input: "first_recorded_at sau ngày đo mới", ruleResult: "first_seen_in_base=true", automationLevel: "Tự động", limitation: "Không tự suy ra mới với HacoLED", phase: "P0" },
  { code: "LR05", topic: "Mới với HacoLED", input: "Người nhận/Sales xác nhận chưa từng liên hệ theo định nghĩa đã chốt", ruleResult: "new_to_company=new_confirmed", automationLevel: "Con người xác nhận", limitation: "Không biết => unknown; không cần nhập lịch sử Sales", phase: "P0" },
  { code: "LR06", topic: "Khách cũ", input: "Người nhận/Sales xác nhận đã biết/đã mua", ruleResult: "known_relationship; lưu đã mua riêng nếu biết", automationLevel: "Con người xác nhận", limitation: "Mua lại và liên hệ lại khác nhau", phase: "P0" },
  { code: "LR07", topic: "Không phù hợp", input: "Chỉ tìm module rời hoặc dịch vụ ngoài phạm vi đã duyệt", ruleResult: "fit=no; lý do rõ", automationLevel: "Bán tự động có duyệt", limitation: "Xem lại ngữ cảnh; từ khóa đơn lẻ không đủ", phase: "P0" },
  { code: "LR08", topic: "Chưa đủ thông tin", input: "Chưa biết nhu cầu/đơn vị/thời điểm", ruleResult: "fit=unknown và/hoặc intent=unknown", automationLevel: "Có thể tự động", limitation: "Không chấm 0 hay gán lạnh vì dữ liệu thiếu", phase: "P0" },
  { code: "LR09", topic: "Ấm", input: "Có nhu cầu đúng giải pháp; đang hỏi/so sánh, chưa có tín hiệu hành động cụ thể", ruleResult: "intent=warm kèm evidence", automationLevel: "Có người xác nhận", limitation: "Nguồn public chỉ giả thuyết về nhóm, không xác nhận cá nhân", phase: "P0" },
  { code: "LR10", topic: "Nóng", input: "Nhu cầu phù hợp; chủ động xin phương án/báo giá/khảo sát cho công trình rõ và có bước tiếp theo cụ thể", ruleResult: "intent=hot + timestamp + evidence", automationLevel: "Có người xác nhận", limitation: "Chưa biết ngân sách không tự loại; không suy xác suất mua", phase: "P0" },
  { code: "LR11", topic: "Lạnh", input: "Có bằng chứng thuộc nhóm nhưng chưa ưu tiên giải quyết nhu cầu", ruleResult: "intent=cold", automationLevel: "Có người xác nhận", limitation: "Không coi tất cả người xem là lead lạnh có danh tính", phase: "P0" },
  { code: "LR12", topic: "Độ mới tín hiệu", input: "Đã lâu chưa có tương tác có nghĩa theo chu kỳ được duyệt", ruleResult: "Tạo nhắc kiểm tra; giữ trạng thái và lịch sử", automationLevel: "Tự động nhắc, người duyệt", limitation: "Không tự xóa lead/downgrade dự án chỉ vì ít click", phase: "P1" },
  { code: "LR13", topic: "Chấm điểm tùy chọn", input: "Đủ dữ liệu và bằng chứng cần ưu tiên thứ tự", ruleResult: "Tách fit_score và intent_score, cap/decay/version được duyệt", automationLevel: "Pha sau", limitation: "Điểm ưu tiên không phải xác suất chốt; chưa có trọng số chuẩn", phase: "P2" },
  { code: "LR14", topic: "Nguồn cuộc gọi chung", input: "Chỉ biết khách gọi hotline", ruleResult: "capture_channel=hotline; acquisition_source=unknown", automationLevel: "Tự động cho unknown", limitation: "Không phân bổ mặc định Website/SEO/Facebook", phase: "P0" },
  { code: "LR15", topic: "Nguồn web từ social", input: "Có UTM và form cùng hành trình quan sát được", ruleResult: "Source=Facebook/TikTok...; capture=form; linked publication", automationLevel: "Tự động trong phạm vi quan sát", limitation: "Không liên kết ngầm người xem ẩn danh trên nhiều nền tảng", phase: "P0" },
  { code: "LR16", topic: "Attribution", input: "Lưu first observed, last observed, self-reported riêng", ruleResult: "Báo cáo từng mô hình; gắn version và cửa sổ", automationLevel: "Tính được khi có đầu vào", limitation: "Không cộng các mô hình hoặc cộng assisted thành tổng lead", phase: "P1" },
  { code: "LR17", topic: "Nguồn thiếu", input: "UTM/referrer không có hoặc không tin cậy", ruleResult: "unknown hoặc direct theo đúng nguồn; giữ hạn chế", automationLevel: "Tự động", limitation: "Không hồi suy từ thời điểm đăng bài", phase: "P0" },
  { code: "LR18", topic: "Bất thường", input: "Dữ liệu thiếu/đứt trước khi hiệu suất giảm", ruleResult: "Cảnh báo kiểm tra tracking và import trước", automationLevel: "Tự động cảnh báo", limitation: "Không tự dừng Ads, đổi CTA hoặc đăng nội dung", phase: "P1" },
];

export const DASHBOARDS_8: DashboardSpecItem[] = [
  { code: "D01", audiencePurpose: "Lead từ xa", mainContent: "Khách mới xác nhận; khách cũ; unknown; phù hợp; lead chưa phản hồi; nguồn có bằng chứng", cadence: "Tuần/tháng", filters: "Tháng, segment, capture, source, status", sourceModules: "B07; B08; B09", decisionToMake: "Chọn ưu tiên và hỏi Sales điều gì", phase: "P0" },
  { code: "D02", audiencePurpose: "Nội dung và phễu", mainContent: "Asset đạt; publication; phân tầng nhu cầu; sessions; yêu cầu; chất lượng; D+7/D+28", cadence: "Tuần/tháng", filters: "Brief, insight, format, publication, age", sourceModules: "B03; B05; B06", decisionToMake: "Giữ/sửa chủ đề và CTA nào", phase: "P0" },
  { code: "D03", audiencePurpose: "Website và SEO", mainContent: "GSC clicks/impressions/CTR; landing sessions; form thành công; nhấn gọi; lỗi form", cadence: "Tuần/tháng", filters: "Page, query intent, brand, device", sourceModules: "B06; B08", decisionToMake: "Cải thiện trang hoặc vấn đề kỹ thuật nào", phase: "P0" },
  { code: "D04", audiencePurpose: "Social/video", mainContent: "Số gốc mỗi nền tảng; watch time; outbound clicks; tương tác; liên hệ xác nhận", cadence: "Tuần/tháng", filters: "Platform, format, same-age post", sourceModules: "B05; B06", decisionToMake: "Cải thiện format/distribution; không xếp hạng bằng views khác chuẩn", phase: "P0" },
  { code: "D05", audiencePurpose: "Khách hàng và thị trường", mainContent: "Target giả thuyết/đã hỗ trợ; insight bằng chứng; đối thủ; kịch bản thị trường", cadence: "Theo nghiên cứu", filters: "Segment, role, use case, evidence", sourceModules: "B02; B03", decisionToMake: "Chọn/điều chỉnh tệp thử", phase: "P1" },
  { code: "D06", audiencePurpose: "Nhân sự và học tập", mainContent: "Task đến hạn; đạt lần đầu; giờ khả dụng; blocker; bài học và thực hành đạt", cadence: "Tuần", filters: "Người, loại việc, mức phức tạp", sourceModules: "B11", decisionToMake: "Hỗ trợ/đào tạo/phân việc; không đánh giá theo raw views", phase: "P0" },
  { code: "D07", audiencePurpose: "Tài chính và kinh doanh", mainContent: "Chi phí tiền mới/đầy đủ; CPQL; cơ hội; giá trị ký; doanh thu; tiền thu tách riêng", cadence: "Tháng", filters: "Cohort, segment, campaign", sourceModules: "B04; B07", decisionToMake: "Cơ sở xin ngân sách sau, không phải cam kết", phase: "P1" },
  { code: "D08", audiencePurpose: "Chất lượng dữ liệu", mainContent: "Nguồn thiếu; mới/cũ chưa rõ; import trễ; event lỗi; quyền/backup", cadence: "Tuần và khi lỗi", filters: "Source, batch, metric version", sourceModules: "B12", decisionToMake: "Số nào chưa đủ tin trước khi quyết định", phase: "P0" },
];

export const ROLES_8: RolePermissionItem[] = [
  { role: "Lead Marketing", mainWork: "Duyệt target, định nghĩa, KPI, nội dung nhạy cảm, hợp nhất dữ liệu", viewDataAccess: "Xem dữ liệu công việc và lead cần thiết; quyền xuất có log", limitation: "Không tự gọi dữ liệu chưa xác minh là thật; chi phí phải xin duyệt" },
  { role: "Full-time / điều phối", mainWork: "Giao chi tiết, theo dõi, kiểm nội dung theo checklist, tổng hợp", viewDataAccess: "Xem tiến độ, số tổng hợp; lead chi tiết chỉ khi được giao tiếp nhận", limitation: "Không mặc định có quyền xem lương, hồ sơ khảo sát riêng tư, toàn PII" },
  { role: "Thực tập sinh SEO", mainWork: "SEO/content theo brief; nhập chỉ số được giao", viewDataAccess: "Tài liệu, tasks, analytics phù hợp; không cần danh bạ khách", limitation: "Không đổi thông số/giá/chính sách/target khi chưa duyệt" },
  { role: "Thực tập sinh video dài", mainWork: "Video ngang và số liệu được giao", viewDataAccess: "Tư liệu hợp lệ, brief, bảng số liệu", limitation: "Không giả ảnh AI thành dự án thật" },
  { role: "Thực tập sinh video ngắn", mainWork: "Video dọc và số liệu được giao", viewDataAccess: "Tư liệu hợp lệ, brief, bảng số liệu", limitation: "Không tự công bố hình ảnh trẻ em hoặc thông tin khách" },
  { role: "Đầu mối Sales/hotline", mainWork: "Xác nhận mới/cũ, nhu cầu, nhận lead, feedback tối thiểu", viewDataAccess: "Lead được giao và kết quả; không phải nhập lại toàn CRM", limitation: "Nguồn không biết để unknown; không bắt hỏi nguồn mọi cuộc gọi" },
  { role: "Lãnh đạo", mainWork: "Xem kết quả và phê duyệt ngân sách", viewDataAccess: "Dashboard phù hợp, quyết định, rủi ro, chi phí", limitation: "Không cần quyền sửa dữ liệu gốc cho mọi người" },
  { role: "AI hỗ trợ", mainWork: "Gợi ý tag, tóm tắt phản hồi, soạn nháp, tìm bất thường", viewDataAccess: "Chỉ dữ liệu được phép, ưu tiên ẩn danh", limitation: "Không tự xác nhận insight, quyết định nhân sự, xuất bản, cấp quyền hay chi tiền" },
];

export const QA_TESTS_24: QATestCaseItem[] = [
  { code: "QA01", scenario: "Nhập cùng file hai lần", testMethod: "Nạp lại lô cùng khóa", expectedResult: "Tổng không tăng; có log bỏ trùng", moduleCode: "B12", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA02", scenario: "Form lỗi", testMethod: "Nhấn gửi nhưng backend trả lỗi", expectedResult: "Không tạo generate_lead thành công", moduleCode: "B08", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA03", scenario: "Refresh thank-you", testMethod: "Gửi form hợp lệ rồi tải lại trang", expectedResult: "Không tạo thêm submission/lead", moduleCode: "B08", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA04", scenario: "Gọi + form + Zalo cùng người", testMethod: "Ba tương tác được xác nhận cùng contact", expectedResult: "3 touchpoint; số contact không tăng thành 3; inquiry phân nhu cầu", moduleCode: "B07", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA05", scenario: "Người mới thuộc khách cũ", testMethod: "Contact mới từ trường đã từng hợp tác", expectedResult: "Contact first seen mới; organization cũ; không new buyer", moduleCode: "B07", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA06", scenario: "Không biết mới/cũ", testMethod: "Hotline chưa xác minh quan hệ", expectedResult: "Unknown, không gán mới", moduleCode: "B07", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA07", scenario: "Hotline chưa rõ nguồn", testMethod: "Có cuộc gọi nhưng không nguồn", expectedResult: "Capture=hotline; source=unknown; không SEO", moduleCode: "B08", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA08", scenario: "UTM social đến form", testMethod: "Facebook link có publication_id sang form", expectedResult: "Source Facebook; capture website form; ghi cả hai", moduleCode: "B08", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA09", scenario: "Tái sử dụng video", testMethod: "Một file video đăng 3 nền tảng", expectedResult: "1 asset; 3 publication; số liệu tách", moduleCode: "B05", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA10", scenario: "Snapshot lifetime", testMethod: "Views lifetime 100 rồi 150", expectedResult: "Không báo tổng 250; chênh 50 nếu cùng điều kiện và không sửa nguồn", moduleCode: "B06", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA11", scenario: "Unique reach", testMethod: "Cùng người xem hai bài", expectedResult: "Không cộng reach bài thành reach duy nhất kênh", moduleCode: "B09", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA12", scenario: "Mẫu số 0", testMethod: "Tháng trước 0 lead; tháng sau 3", expectedResult: "MoM % N/A; tăng tuyệt đối 3", moduleCode: "B09", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA13", scenario: "Dữ liệu thiếu", testMethod: "Không export được chỉ số", expectedResult: "Null/unavailable; khác 0 hoạt động", moduleCode: "B12", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA14", scenario: "Tháng chưa kết thúc", testMethod: "So ngày 1–15 với tháng đầy đủ", expectedResult: "Mặc định cảnh báo; chọn cùng khoảng ngày", moduleCode: "B09", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA15", scenario: "Cohort chưa đủ tuổi", testMethod: "Lead mới hôm qua, đo chuyển đổi 30 ngày", expectedResult: "Pending/không đủ quan sát; không tính là thất bại", moduleCode: "B09", phase: "P1", testStatus: "Chưa chạy" },
  { code: "QA16", scenario: "Doanh thu / hợp đồng / tiền thu", testMethod: "Hợp đồng 200, ghi nhận 100, thu 50 (giả định)", expectedResult: "Ba trường/báo cáo riêng, không cộng thành 350", moduleCode: "B07", phase: "P1", testStatus: "Chưa chạy" },
  { code: "QA17", scenario: "PII vào analytics", testMethod: "Form có email/số điện thoại", expectedResult: "Payload và URL analytics không chứa PII", moduleCode: "B12", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA18", scenario: "Thực tập sinh truy cập lead", testMethod: "Tài khoản thực tập mở danh bạ riêng tư", expectedResult: "Từ chối/che theo quyền; có log", moduleCode: "B12", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA19", scenario: "Thay định nghĩa KPI", testMethod: "Đổi công thức đủ điều kiện", expectedResult: "Giữ version, hiệu lực, note báo cáo so kỳ", moduleCode: "B09", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA20", scenario: "AI kết luận insight", testMethod: "AI suy từ 3 comments", expectedResult: "Trạng thái giả thuyết; không tự xác nhận", moduleCode: "B03", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA21", scenario: "Khôi phục backup", testMethod: "Làm mất mẫu dữ liệu thử", expectedResult: "Khôi phục đúng quan hệ/ID; lưu kết quả test", moduleCode: "B12", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA22", scenario: "Thu hồi quyền", testMethod: "Một nhân sự rời nhóm", expectedResult: "Tắt quyền nền tảng/Base; không mất tài sản công ty", moduleCode: "B12", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA23", scenario: "Quyền hình ảnh", testMethod: "Ảnh học sinh hoặc khách chưa có quyền công bố", expectedResult: "Chặn xuất bản/đổi tư liệu; lưu căn cứ", moduleCode: "B05", phase: "P0", testStatus: "Chưa chạy" },
  { code: "QA24", scenario: "Chất lượng báo cáo", testMethod: "Tổng chỉ số trên dashboard", expectedResult: "Drill down được về dòng, kỳ, filter, nguồn", moduleCode: "B09", phase: "P0", testStatus: "Chưa chạy" },
];

export const DECISIONS_12: DecisionLogItem[] = [
  { code: "C01", topic: "Phạm vi", content: "Tăng khách mới và hệ thống hóa Marketing", status: "Đã xác nhận trong trao đổi", owner: "Lead Marketing", note: "Không tự thêm mục tiêu doanh thu bắt buộc" },
  { code: "C02", topic: "Ngân sách", content: "0 đồng chi mới giai đoạn đầu", status: "Đã xác nhận", owner: "Lead + lãnh đạo khi phát sinh", note: "Không có nghĩa nhân công, hạ tầng không có chi phí" },
  { code: "C03", topic: "Nhân sự", content: "1 full-time + 3 thực tập sinh; Lead remote", status: "Đã xác nhận", owner: "Lead", note: "Kỹ năng ban đầu hạn chế; không giao toàn chiến lược cho thực tập sinh" },
  { code: "C04", topic: "Phân vai nội dung", content: "Full-time Facebook/điều phối; 3 bạn SEO/video dài/video ngắn", status: "Định hướng đã trao đổi", owner: "Lead", note: "Mỗi kênh/bài cần chỉ rõ người lấy số; full-time không làm thay" },
  { code: "C05", topic: "Dữ liệu cũ", content: "Giữ tham khảo; không làm baseline ép KPI", status: "Đã xác nhận", owner: "Lead", note: "Không xóa tài sản SEO/nội dung/quyền khách; dùng flag quan hệ khi biết" },
  { code: "C06", topic: "Hotline", content: "Giữ số chung; ghi mới/cũ/chưa rõ; nguồn khi biết", status: "Đã xác nhận hướng", owner: "Đầu mối Sales", note: "Unknown là kết quả hợp lệ" },
  { code: "C07", topic: "Phân khúc pilot", content: "Trường học", status: "Đã thống nhất phạm vi thử", owner: "Lead", note: "Chưa chứng minh nhóm nhu cầu cụ thể tốt nhất" },
  { code: "C08", topic: "Đào tạo", content: "Khảo sát thực tế rồi tự học online gắn nhiệm vụ", status: "Định hướng đã xác nhận", owner: "Lead", note: "Không xếp hạng qua câu văn trau chuốt" },
  { code: "C09", topic: "Ngày baseline", content: "Dùng ngày tracking/nhập liệu thực sự chạy đúng", status: "Đề xuất cần chốt theo triển khai", owner: "Lead", note: "Không tự coi 19/10 là đã có dữ liệu" },
  { code: "C10", topic: "Base", content: "Thiết kế đầy đủ; triển khai P0 trước; automation sau", status: "Đề xuất v1.0", owner: "Lead", note: "Workbook là đặc tả, không phải ứng dụng đã chạy" },
  { code: "C11", topic: "Scoring", content: "Ưu tiên rule minh bạch; score chỉ sau khi có dữ liệu", status: "Đề xuất v1.0", owner: "Lead", note: "Không có hệ số thần kỳ hoặc % thành công" },
  { code: "C12", topic: "Nguồn chuẩn", content: "Base cho người/yêu cầu; platform cho native metrics; Sales/kế toán cho kết quả", status: "Đề xuất v1.0", owner: "Lead", note: "Đối chiếu sai khác, không ép các nguồn bằng nhau" },
];

export const SOURCES_22: SourceRefItem[] = [
  { code: "S01", name: "FT24: phân nhóm nhu cầu, content, kiểm chứng", urlOrRef: "Tài liệu người dùng: 1902.jpg", type: "Tài liệu được cung cấp", scopeAndLimit: "5 nấc nhu cầu; không phải chuẩn chấm điểm lead phổ quát" },
  { code: "S02", name: "FT24: năng lực lõi, TAM–SAM–SOM", urlOrRef: "Tài liệu người dùng: 1901.jpg", type: "Tài liệu được cung cấp", scopeAndLimit: "Phạm vi thị trường, chưa có số liệu ngành HacoLED" },
  { code: "S03", name: "FT24: các biến thể phễu", urlOrRef: "Tài liệu người dùng: 1900.jpg; 1899.jpg; 1883.jpg; 1904.jpg", type: "Tài liệu được cung cấp", scopeAndLimit: "Định nghĩa các tầng cần điều chỉnh cho B2B" },
  { code: "S04", name: "GA4: Recommended events", urlOrRef: "https://developers.google.com/analytics/devguides/collection/ga4/reference/events", type: "Tài liệu chính thức", scopeAndLimit: "Sự kiện lead; phải cấu hình, không tự có toàn bộ" },
  { code: "S05", name: "GA4: Scopes of traffic-source dimensions", urlOrRef: "https://support.google.com/analytics/answer/11080067?hl=en", type: "Tài liệu chính thức", scopeAndLimit: "Tách nguồn cấp người dùng, phiên, sự kiện" },
  { code: "S06", name: "GA4: Attribution settings", urlOrRef: "https://support.google.com/analytics/answer/10597962", type: "Tài liệu chính thức", scopeAndLimit: "Mô hình phân bổ; cửa sổ ghi nhận; không đồng nghĩa tác động nhân quả" },
  { code: "S07", name: "GA4: Không gửi PII", urlOrRef: "https://support.google.com/analytics/answer/6366371", type: "Tài liệu chính thức", scopeAndLimit: "Không gửi tên/số điện thoại/email qua event, URL, UTM thông thường" },
  { code: "S08", name: "GSC: clicks, impressions, position", urlOrRef: "https://support.google.com/webmasters/answer/7042828?hl=en", type: "Tài liệu chính thức", scopeAndLimit: "Định nghĩa số liệu tìm kiếm; khác traffic và lead" },
  { code: "S09", name: "GSC: about performance data", urlOrRef: "https://support.google.com/webmasters/answer/17011364?hl=en", type: "Tài liệu chính thức", scopeAndLimit: "Cấp tổng hợp khác nhau; dữ liệu gần đây có thể thay đổi" },
  { code: "S10", name: "YouTube Analytics metrics", urlOrRef: "https://developers.google.com/youtube/analytics/metrics", type: "Tài liệu chính thức", scopeAndLimit: "Giữ tên chỉ số nền tảng và thời điểm định nghĩa" },
  { code: "S11", name: "YouTube Reporting metrics", urlOrRef: "https://developers.google.com/youtube/reporting/v1/reports/metrics", type: "Tài liệu chính thức", scopeAndLimit: "Thumbnail CTR; watch time; không lấy toàn bộ views chia impressions" },
  { code: "S12", name: "YouTube revision history", urlOrRef: "https://developers.google.com/youtube/analytics/revision_history", type: "Tài liệu chính thức", scopeAndLimit: "Lịch sử thay đổi định nghĩa; version hóa metric" },
  { code: "S13", name: "HubSpot: fit / engagement scoring", urlOrRef: "https://knowledge.hubspot.com/scoring/understand-the-lead-scoring-tool", type: "Tài liệu sản phẩm chính thức", scopeAndLimit: "Tham khảo cách tách fit, engagement; không phải khuyến nghị mua phần mềm" },
  { code: "S14", name: "Stripe: market research", urlOrRef: "https://stripe.com/resources/more/market-research-for-startups", type: "Tài liệu doanh nghiệp", scopeAndLimit: "Nghiên cứu, TAM–SAM–SOM; không cung cấp số thị trường LED Việt Nam" },
  { code: "S15", name: "Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15", urlOrRef: "https://congbao.chinhphu.vn/van-ban/luat-so-91-2025-qh15-45578.htm", type: "Nguồn Chính phủ", scopeAndLimit: "Hiệu lực 01/01/2026; cần rà soát nghĩa vụ cụ thể trước triển khai" },
  { code: "S16", name: "Bộ Công an: dữ liệu trẻ em và nhân sự", urlOrRef: "https://mps.gov.vn/bai-viet/bao-ve-du-lieu-ca-nhan-trong-mot-so-hoat-dong-1754989261", type: "Nguồn Chính phủ", scopeAndLimit: "Hình ảnh trường học và hồ sơ nhân sự cần kiểm soát" },
  { code: "S17", name: "Google: chính sách nội dung spam", urlOrRef: "https://developers.google.com/search/docs/essentials/spam-policies", type: "Tài liệu chính thức", scopeAndLimit: "Nội dung AI cần giá trị, kiểm chứng; không chạy theo sản lượng" },
  { code: "S18", name: "GA4: data freshness", urlOrRef: "https://support.google.com/analytics/answer/11198161?hl=en", type: "Tài liệu chính thức", scopeAndLimit: "Dữ liệu mới có thể được xử lý và điều chỉnh thêm" },
  { code: "S19", name: "Google: Conversion Lift", urlOrRef: "https://support.google.com/google-ads/answer/14102450?hl=en", type: "Tài liệu chính thức", scopeAndLimit: "Phân biệt ghi nhận nguồn với tăng trưởng do can thiệp" },
  { code: "S20", name: "TikTok: comment insights", urlOrRef: "https://support.tiktok.com/vi/using-tiktok/growing-your-audience/comment-insights-on-tiktok", type: "Tài liệu chính thức", scopeAndLimit: "Bình luận là đầu vào nghiên cứu, không tự chứng minh insight" },
  { code: "S21", name: "HacoLED: quyết định đã xác nhận", urlOrRef: "Trao đổi trực tiếp với người dùng trong cuộc trò chuyện", type: "Bối cảnh nội bộ", scopeAndLimit: "Ngân sách mới 0; 1 full-time + 3 thực tập sinh; Lead remote; hotline chung; baseline mới" },
  { code: "S22", name: "Quy tắc nghiệp vụ HacoLED Base v1.0", urlOrRef: "Đề xuất thiết kế trong tài liệu này", type: "Đề xuất, cần duyệt", scopeAndLimit: "Các ngưỡng, lịch đánh giá, quy tắc nội bộ không phải benchmark ngành" },
];

export const DEMO_BRIEF_16: DemoBriefRow[] = [
  { component: "Mã minh họa", sampleContent: "DEMO-BRIEF-01", note: "Mẫu giả định, không phải nghiên cứu đã xác thực" },
  { component: "Phân khúc", sampleContent: "Trường học đang cân nhắc cải thiện hiển thị hội trường", note: "Pilot đã chọn; nhóm nhu cầu này vẫn cần kiểm chứng" },
  { component: "Vai trò", sampleContent: "Người được giao tìm phương án / phụ trách thiết bị", note: "Không mặc định là người duyệt tiền" },
  { component: "Nấc nhu cầu", sampleContent: "Nấc 3: đang tìm cách giải quyết", note: "Chưa thể gán tất cả người xem là lead ấm" },
  { component: "Insight giả thuyết", sampleContent: "Lo chọn giải pháp không phù hợp không gian và mục đích dùng", note: "Cần xác minh bằng lời khách/feedback Sales" },
  { component: "Thông điệp", sampleContent: "Chọn giải pháp theo nội dung, khoảng cách xem và điều kiện sử dụng", note: "Chỉ đưa thông số có tài liệu kỹ thuật" },
  { component: "Góc nội dung", sampleContent: "Checklist so sánh LED với phương án hiện có", note: "Không mặc định LED luôn tốt hơn" },
  { component: "Bằng chứng cần bổ sung", sampleContent: "Ảnh hội trường, cấu hình đã duyệt, ví dụ thiết bị, giới hạn", note: "Chưa có tài sản thì không bịa" },
  { component: "SEO", sampleContent: "Bài hướng dẫn theo checklist; liên kết trang giải pháp", note: "Một asset SEO" },
  { component: "Facebook", sampleContent: "Tóm lược một vấn đề và dẫn tới nội dung phù hợp", note: "Một asset Facebook; không mặc định link ở comment luôn tốt hơn" },
  { component: "Video dài", sampleContent: "Giải thích checklist với sơ đồ/tư liệu được phép", note: "Một asset video ngang, xuất YouTube/Facebook thành các publication riêng" },
  { component: "Video ngắn", sampleContent: "Một câu hỏi, một tiêu chí lựa chọn, một bước tiếp theo", note: "Một asset dọc; Reels/TikTok/Shorts là các publication" },
  { component: "CTA", sampleContent: "Gửi thông tin không gian để trao đổi phương án sơ bộ", note: "Chỉ dùng nếu HacoLED có thể đáp ứng; không hứa khảo sát miễn phí chưa duyệt" },
  { component: "Nghiệm thu", sampleContent: "Đúng target, một thông điệp, nguồn, hình ảnh hợp lệ, CTA hoạt động", note: "Lead duyệt kỹ thuật/chính sách; trưởng nhóm kiểm format" },
  { component: "Dữ liệu phải lưu", sampleContent: "brief_id → asset_id → publication_id → UTM/event → inquiry nếu quan sát được", note: "Không hứa gắn mọi viewer vào danh tính" },
  { component: "Chỉ số", sampleContent: "Sessions đúng trang, yêu cầu hợp lệ, nhu cầu phù hợp; native metrics hỗ trợ", note: "Không dùng view làm kết quả cuối cùng" },
];
