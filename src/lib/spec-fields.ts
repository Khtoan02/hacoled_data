import { PhaseType } from "./spec-data";

export interface FieldDictItem {
  table: string;
  fieldName: string;
  dataType: string;
  required: string;
  definitionRule: string;
  owner: string;
  phase: PhaseType;
  classification: string;
  source: string;
}

export const RAW_FIELDS_TSV = `solutions|solution_id|UUID|Có|Khóa giải pháp|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|name|text|Có|Tên dùng trong nội dung|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|use_case|text|Có|Bối cảnh công trình|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|included_scope|text|Có|Thiết bị và dịch vụ bao gồm|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|excluded_scope|text|Có|Những gì không cung cấp|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|verified_claims|text|Có|Thông số/chính sách được phép công bố|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|proof_ids|relation|Có|Tài sản chứng minh|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|version|text|Có|Phiên bản|Lead + kỹ thuật|P0|Nội bộ|S22
solutions|approved_by|user_id|Có|Người xác nhận kỹ thuật|Lead + kỹ thuật|P0|Nội bộ|S22
evidence|evidence_id|UUID|Có|Khóa bằng chứng|Người thu thập + Lead|P0|Nội bộ|S22
evidence|source_type|enum|Có|Phỏng vấn / Sales / công khai / đo lường / AI gợi ý|Người thu thập + Lead|P0|Nội bộ|S22
evidence|source_ref|text|Có|URL hoặc file và vị trí có thể kiểm tra|Người thu thập + Lead|P0|Nội bộ|S22
evidence|observed_at|datetime|Có|Ngày thực sự quan sát|Người thu thập + Lead|P0|Nội bộ|S22
evidence|context|text|Có|Bối cảnh đối tượng và câu hỏi|Người thu thập + Lead|P0|Nội bộ|S22
evidence|observation|text|Có|Điều quan sát, tách khỏi diễn giải|Người thu thập + Lead|P0|Nội bộ|S22
evidence|permission|enum|Có|Được dùng nội bộ / công khai / cần xin phép|Người thu thập + Lead|P0|Nội bộ|S22
evidence|independence_group|text|Có|Gom các nguồn sao chép cùng xuất xứ|Người thu thập + Lead|P0|Nội bộ|S22
evidence|review_status|enum|Có|Chưa kiểm / đã đối chiếu / mâu thuẫn|Người thu thập + Lead|P0|Nội bộ|S22
evidence|owner_id|user_id|Có|Người lưu|Người thu thập + Lead|P0|Nội bộ|S22
segments|segment_id|UUID|Có|Khóa phân khúc|Lead|P0|Nội bộ|S22
segments|name|text|Có|Tên theo nhu cầu|Lead|P0|Nội bộ|S22
segments|inclusion|text|Có|Điều kiện thuộc nhóm|Lead|P0|Nội bộ|S22
segments|exclusion|text|Có|Điều kiện loại|Lead|P0|Nội bộ|S22
segments|buyer_type|enum|Có|Chủ đầu tư / nhà thầu / người dùng|Lead|P0|Nội bộ|S22
segments|application|text|Có|Không gian ứng dụng|Lead|P0|Nội bộ|S22
segments|geography|text|Có|Phạm vi được định nghĩa|Lead|P0|Nội bộ|S22
segments|priority_reason|text|Có|Lý do chọn/không chọn|Lead|P0|Nội bộ|S22
segments|evidence_ids|relation|Có|Bằng chứng|Lead|P0|Nội bộ|S22
segments|status|enum|Có|Giả thuyết / thử nghiệm / ưu tiên / dừng|Lead|P0|Nội bộ|S22
market_scenarios|scenario_id|UUID|Có|Khóa|Lead|P1|Nội bộ|S22
market_scenarios|segment_id|relation|Có|Phân khúc|Lead|P1|Nội bộ|S22
market_scenarios|year|integer|Có|Năm của cơ hội mua|Lead|P1|Nội bộ|S22
market_scenarios|scenario|enum|Có|Thấp / cơ sở / cao|Lead|P1|Nội bộ|S22
market_scenarios|eligible_org_count|number|Có|Số tổ chức đúng phạm vi|Lead|P1|Nội bộ|S22
market_scenarios|projects_per_org_year|number|Có|Số cơ hội mua bình quân trong năm|Lead|P1|Nội bộ|S22
market_scenarios|value_per_project_vnd|currency|Có|Giá trị dự án cùng phạm vi chưa VAT hoặc có VAT phải ghi rõ|Lead|P1|Nội bộ|S22
market_scenarios|sam_project_count|number|Có|Cơ hội sau bộ lọc phục vụ, không chọn % tùy ý|Lead|P1|Nội bộ|S22
market_scenarios|reachable_qualified_projects|number|Có|Cơ hội đủ điều kiện có thể tiếp cận kỳ này|Lead|P1|Nội bộ|S22
market_scenarios|win_rate_assumption|decimal|Có|Giả định tỷ lệ thắng có nguồn|Lead|P1|Nội bộ|S22
market_scenarios|delivery_capacity|number|Có|Năng lực triển khai dự án cùng kỳ|Lead|P1|Nội bộ|S22
market_scenarios|source_ids|relation|Có|Nguồn cho từng giả định|Lead|P1|Nội bộ|S22
market_scenarios|confidence|enum|Có|Giả định / ước lượng có nguồn / đã kiểm chứng|Lead|P1|Nội bộ|S22
personas|persona_id|UUID|Có|Khóa|Lead|P0|Nội bộ|S22
personas|segment_id|relation|Có|Phân khúc|Lead|P0|Nội bộ|S22
personas|buying_role|text|Có|Tìm kiếm / sử dụng / kỹ thuật / phê duyệt / mua sắm|Lead|P0|Nội bộ|S22
personas|job_to_be_done|text|Có|Kết quả người này muốn đạt|Lead|P0|Nội bộ|S22
personas|pains|text|Có|Vấn đề có bối cảnh|Lead|P0|Nội bộ|S22
personas|triggers|text|Có|Sự kiện phát sinh nhu cầu|Lead|P0|Nội bộ|S22
personas|barriers|text|Có|Rào cản|Lead|P0|Nội bộ|S22
personas|decision_criteria|text|Có|Tiêu chí chọn|Lead|P0|Nội bộ|S22
personas|information_sources|text|Có|Nơi tìm hiểu có bằng chứng|Lead|P0|Nội bộ|S22
personas|evidence_ids|relation|Có|Nguồn|Lead|P0|Nội bộ|S22
personas|confidence|enum|Có|Giả thuyết / một phần / đối chiếu|Lead|P0|Nội bộ|S22
competitor_observations|observation_id|UUID|Có|Khóa|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|competitor_name|text|Có|Tên hoặc loại thay thế|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|competitor_type|enum|Có|Đơn vị LED / máy chiếu / TV ghép / không đầu tư|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|target_segment|text|Có|Nhóm họ đang phục vụ|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|offer_message|text|Có|Lời đề nghị và thông điệp quan sát|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|price_scope|text|Có|Giá công khai kèm phạm vi và ngày nếu có|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|proof|text|Có|Bằng chứng họ công bố|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|channel_content|text|Có|Kênh và nội dung|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|source_url|URL|Có|Nguồn công khai|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|observed_at|datetime|Có|Ngày|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|fact_vs_inference|enum|Có|Quan sát / suy luận|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
competitor_observations|next_action|text|Có|Điều cần kiểm tra, không sao chép|Lead + hỗ trợ thu thập|P1|Nội bộ|S22
insights|insight_id|UUID|Có|Khóa|Lead|P0|Nội bộ|S22
insights|segment_id|relation|Có|Phân khúc|Lead|P0|Nội bộ|S22
insights|persona_id|relation|Có|Vai trò|Lead|P0|Nội bộ|S22
insights|context|text|Có|Khi nào xảy ra|Lead|P0|Nội bộ|S22
insights|observation|text|Có|Khách nói/làm gì|Lead|P0|Nội bộ|S22
insights|interpretation|text|Có|Giải thích dự kiến|Lead|P0|Nội bộ|S22
insights|supporting_evidence|relation|Theo trạng thái|Có thể trống khi giả thuyết; bắt buộc nguồn trước khi đánh dấu được hỗ trợ.|Lead|P0|Nội bộ|S22
insights|counter_evidence|relation|Theo trạng thái|Lưu nguồn trái chiều nếu tìm thấy; phân biệt chưa kiểm với đã kiểm chưa thấy. Không bịa để điền đủ.|Lead|P0|Nội bộ|S22
insights|content_implication|text|Có|Ý nghĩa đối với nội dung|Lead|P0|Nội bộ|S22
insights|status|enum|Có|Giả thuyết / được hỗ trợ / bác bỏ / cần thêm dữ liệu|Lead|P0|Nội bộ|S22
insights|validated_by|user_id|Theo trạng thái|Người duyệt khi chuyển trạng thái xác thực; AI không tự xác nhận.|Lead|P0|Nội bộ|S22
campaigns|campaign_id|UUID|Có|Khóa|Lead|P0|Nội bộ|S22
campaigns|name|text|Có|Tên chiến dịch|Lead|P0|Nội bộ|S22
campaigns|segment_id|relation|Có|Phân khúc|Lead|P0|Nội bộ|S22
campaigns|objective|text|Có|Thay đổi cần đạt|Lead|P0|Nội bộ|S22
campaigns|primary_metric_id|relation|Có|Chỉ số chính|Lead|P0|Nội bộ|S22
campaigns|start_date|date|Có|Ngày bắt đầu thực tế|Lead|P0|Nội bộ|S22
campaigns|end_date|date|Có|Ngày rà soát|Lead|P0|Nội bộ|S22
campaigns|budget_new_vnd|currency|Có|Chi phí mới được duyệt, hiện 0|Lead|P0|Nội bộ|S22
campaigns|owner_id|user_id|Có|Người quyết định|Lead|P0|Nội bộ|S22
campaigns|status|enum|Có|Đề xuất / đã duyệt / chạy / rà soát / kết thúc|Lead|P0|Nội bộ|S22
content_briefs|brief_id|UUID|Có|Khóa|Lead|P0|Nội bộ|S22
content_briefs|campaign_id|relation|Có|Chiến dịch|Lead|P0|Nội bộ|S22
content_briefs|segment_id|relation|Có|Target|Lead|P0|Nội bộ|S22
content_briefs|persona_id|relation|Có|Người cần tác động|Lead|P0|Nội bộ|S22
content_briefs|insight_id|relation|Có|Insight|Lead|P0|Nội bộ|S22
content_briefs|need_stage|enum|Có|Nấc 1–5 / chưa rõ|Lead|P0|Nội bộ|S22
content_briefs|message|text|Có|Thông điệp chính|Lead|P0|Nội bộ|S22
content_briefs|angle|text|Có|Góc khai thác|Lead|P0|Nội bộ|S22
content_briefs|proof_ids|relation|Có|Dữ kiện được phép dùng|Lead|P0|Nội bộ|S22
content_briefs|desired_action|text|Có|Muốn khách làm gì|Lead|P0|Nội bộ|S22
content_briefs|cta|text|Có|Hành động cụ thể|Lead|P0|Nội bộ|S22
content_briefs|primary_metric_id|relation|Có|Cách kiểm chứng|Lead|P0|Nội bộ|S22
content_briefs|acceptance|text|Có|Tiêu chuẩn nghiệm thu|Lead|P0|Nội bộ|S22
content_briefs|version|text|Có|Phiên bản brief|Lead|P0|Nội bộ|S22
content_assets|asset_id|UUID|Có|Khóa|Người sản xuất|P0|Nội bộ|S22
content_assets|brief_id|relation|Có|Đầu bài gốc|Người sản xuất|P0|Nội bộ|S22
content_assets|format|enum|Có|SEO / Facebook chữ / video dọc / video ngang / carousel|Người sản xuất|P0|Nội bộ|S22
content_assets|parent_asset_id|relation|Không|Bản gốc nếu tái sử dụng|Người sản xuất|P0|Nội bộ|S22
content_assets|creator_id|user_id|Có|Người làm|Người sản xuất|P0|Nội bộ|S22
content_assets|drive_ref|URL|Có|File được lưu|Người sản xuất|P0|Nội bộ|S22
content_assets|version|text|Có|Phiên bản|Người sản xuất|P0|Nội bộ|S22
content_assets|rights_status|enum|Có|Được dùng / chờ phép / hết hạn|Người sản xuất|P0|Nội bộ|S22
content_assets|technical_approval|enum|Có|Chờ duyệt / đạt / cần sửa|Người sản xuất|P0|Nội bộ|S22
content_assets|approved_at|datetime|Không|Thời điểm nghiệm thu|Người sản xuất|P0|Nội bộ|S22
content_assets|hours_spent|number|Không|Giờ làm thực tế nếu ghi nhận|Người sản xuất|P0|Nội bộ|S22
publications|publication_id|UUID|Có|Khóa|Người được giao đăng|P0|Nội bộ|S22
publications|asset_id|relation|Có|Sản phẩm|Người được giao đăng|P0|Nội bộ|S22
publications|channel_id|relation|Có|Kênh|Người được giao đăng|P0|Nội bộ|S22
publications|native_post_id|text|Khi đã đăng|ID bài của nền tảng|Người được giao đăng|P0|Nội bộ|S22
publications|public_url|URL|Khi đã đăng|Link bài đã đăng|Người được giao đăng|P0|Nội bộ|S22
publications|published_at|datetime|Khi đã đăng|Thời gian thực|Người được giao đăng|P0|Nội bộ|S22
publications|campaign_id|relation|Có|Chiến dịch|Người được giao đăng|P0|Nội bộ|S22
publications|utm_content|text|Khi có link ngoài|Mã lần đăng khi dẫn website; không gắn UTM vào link nội bộ website để tránh sai nguồn.|Người được giao đăng|P0|Nội bộ|S22
publications|status|enum|Có|Lịch / đã đăng / lỗi / gỡ|Người được giao đăng|P0|Nội bộ|S22
publications|metrics_owner_id|user_id|Có|Người lấy số liệu|Người được giao đăng|P0|Nội bộ|S22
publications|publisher_id|user_id|Có|Người đăng|Người được giao đăng|P0|Nội bộ|S22
channels|channel_id|UUID|Có|Khóa|Lead|P0|Nội bộ|S22
channels|platform|enum|Có|Web / Facebook / TikTok / YouTube / Zalo / hotline|Lead|P0|Nội bộ|S22
channels|public_name|text|Có|Tên|Lead|P0|Nội bộ|S22
channels|native_account_id|text|Có|ID nền tảng|Lead|P0|Nội bộ|S22
channels|owner_id|user_id|Có|Chủ sở hữu nội bộ|Lead|P0|Nội bộ|S22
channels|metrics_owner_id|user_id|Có|Đầu mối nhập số|Lead|P0|Nội bộ|S22
channels|access_method|text|Có|Phân quyền, không lưu mật khẩu|Lead|P0|Nội bộ|S22
channels|source_timezone|text|Có|Múi giờ gốc|Lead|P0|Nội bộ|S22
channels|health_status|enum|Có|Bình thường / cần kiểm tra / không truy cập|Lead|P0|Nội bộ|S22
channels|last_checked_at|datetime|Có|Lần kiểm tra|Lead|P0|Nội bộ|S22
metric_snapshots|snapshot_id|UUID|Có|Khóa|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|entity_type|enum|Có|Kênh / bài / trang / video|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|entity_id|relation|Có|ID đối tượng|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|metric_id|relation|Có|Metric dictionary|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|native_metric_name|text|Có|Tên gốc trong báo cáo|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|metric_value|number|Không|Giá trị gốc, null nếu thiếu|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|period_start|datetime|Có|Bắt đầu bao gồm|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|period_end|datetime|Có|Kết thúc không bao gồm|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|aggregation|enum|Có|Ngày / kỳ / tích lũy trọn đời|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|source_timezone|text|Có|Giữ múi giờ báo cáo|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|retrieved_at|datetime|Có|Ngày lấy số|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|data_status|enum|Có|Tạm / đầy đủ theo nguồn / thiếu / lỗi / hiệu chỉnh|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|import_batch_id|relation|Có|Lô nhập|Người phụ trách số liệu|P0|Nội bộ|S22
metric_snapshots|definition_version|text|Có|Phiên bản định nghĩa|Người phụ trách số liệu|P0|Nội bộ|S22
search_performance|row_id|UUID|Có|Khóa|SEO + Lead|P0|Nội bộ|S22
search_performance|date|date|Có|Ngày nguồn GSC|SEO + Lead|P0|Nội bộ|S22
search_performance|grain|enum|Có|Property / page / query / page-query|SEO + Lead|P0|Nội bộ|S22
search_performance|page_url|URL|Không|Trang khi có|SEO + Lead|P0|Nội bộ|S22
search_performance|query|text|Không|Truy vấn khi có, phần ẩn không đoán|SEO + Lead|P0|Nội bộ|S22
search_performance|country_device|text|Có|Bộ lọc|SEO + Lead|P0|Nội bộ|S22
search_performance|brand_flag|enum|Có|Brand / nonbrand / unknown|SEO + Lead|P0|Nội bộ|S22
search_performance|intent_tag|enum|Có|Thông tin / so sánh / tìm nhà cung cấp / unknown|SEO + Lead|P0|Nội bộ|S22
search_performance|clicks|integer|Có|Nhấp theo nguồn|SEO + Lead|P0|Nội bộ|S22
search_performance|impressions|integer|Có|Hiển thị theo nguồn|SEO + Lead|P0|Nội bộ|S22
search_performance|position|number|Có|Vị trí trung bình do GSC báo cáo|SEO + Lead|P0|Nội bộ|S22
search_performance|import_batch_id|relation|Có|Nguồn nhập|SEO + Lead|P0|Nội bộ|S22
web_events|event_id|UUID|Có|Khóa chống gửi trùng|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|event_name|text|Có|Tên trong event dictionary|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|occurred_at|datetime|Có|Thời điểm|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|anonymous_id|text|Không|ID giả danh nếu được phép|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|session_id|text|Không|Phiên nếu có|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|contact_token|text|Không|Mã nội bộ không chứa PII khi có cơ sở liên kết|Lead + kỹ thuật|P0|Hạn chế|S22
web_events|page_id|text|Có|Trang|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|content_id|relation|Không|Nội dung nếu có|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|source_medium|text|Có|Nguồn quan sát|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|campaign_id|relation|Không|Chiến dịch nếu có|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|consent_state|text|Có|Trạng thái được phép xử lý|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|is_test|boolean|Có|Loại dữ liệu test/bot nội bộ|Lead + kỹ thuật|P0|Nội bộ|S22
web_events|schema_version|text|Có|Phiên bản cấu trúc|Lead + kỹ thuật|P0|Nội bộ|S22
organizations|organization_id|UUID|Có|Khóa|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|name|text|Có|Tên xác nhận|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|organization_type|text|Có|Trường / doanh nghiệp / nhà thầu|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|segment_id|relation|Không|Nhóm mục tiêu|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|region|text|Có|Địa bàn cần phục vụ|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|relationship_status|enum|Có|Mới xác nhận / đã liên hệ / đã mua / chưa rõ|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|relationship_verified_by|user_id|Không|Người xác nhận|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|relationship_verified_at|datetime|Không|Ngày xác nhận|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
organizations|minimal_legacy_flag|text|Không|Cờ khách cũ, không bắt nhập lịch sử Sales|Đầu mối tiếp nhận + Sales|P0|Nội bộ|S22
contacts|contact_id|UUID|Có|Khóa|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|display_name|text|Không|Tên khi được cung cấp|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|phone_normalized|text|Không|Số khi có; cần ít nhất một định danh hợp lệ: số/email/ID kênh|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|email_normalized|text|Không|Email khi có|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|first_recorded_at|datetime|Có|Lần đầu ghi trong Base, không đồng nghĩa mới với công ty|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|new_to_company_status|enum|Có|Mới xác nhận / đã biết / chưa rõ|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|verification_source|text|Không|Ai/căn cứ xác nhận|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|consent_id|relation|Không|Căn cứ xử lý/liên hệ lại|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|merge_review_status|enum|Có|Không nghi trùng / cần kiểm / đã gộp|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|owner_id|user_id|Có|Người quản lý|Đầu mối tiếp nhận|P0|Hạn chế|S22
contacts|platform_contact_ref|text|Không|Định danh liên hệ theo kênh và tài khoản sở hữu|Đầu mối nhận khách|P0|Hạn chế|S22
contacts|first_valid_inquiry_at|datetime|Dẫn xuất|Ngày yêu cầu hợp lệ đầu tiên trong hệ thống|Base + Lead|P0|Hạn chế|S22
contact_organization_roles|role_link_id|UUID|Có|Khóa|Sales hoặc đầu mối|P1|Nội bộ|S22
contact_organization_roles|contact_id|relation|Có|Người|Sales hoặc đầu mối|P1|Nội bộ|S22
contact_organization_roles|organization_id|relation|Có|Tổ chức|Sales hoặc đầu mối|P1|Nội bộ|S22
contact_organization_roles|role|text|Có|Người dùng / tìm thông tin / kỹ thuật / duyệt / mua|Sales hoặc đầu mối|P1|Nội bộ|S22
contact_organization_roles|start_date|date|Có|Hiệu lực|Sales hoặc đầu mối|P1|Nội bộ|S22
contact_organization_roles|end_date|date|Không|Kết thúc nếu đổi vai trò|Sales hoặc đầu mối|P1|Nội bộ|S22
contact_organization_roles|verified|enum|Có|Xác nhận / giả định|Sales hoặc đầu mối|P1|Nội bộ|S22
inquiries|inquiry_id|UUID|Có|Khóa|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|contact_id|relation|Có|Người liên hệ|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|received_at|datetime|Có|Thời điểm nhận|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|capture_channel|enum|Có|Form / hotline / Messenger / Zalo / khác|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|need_summary|text|Có|Nhu cầu ngắn|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|acquisition_source|text|Có|Nguồn thu hút hoặc unknown|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|source_evidence|enum|Có|UTM / nền tảng / khách nói / Sales xác nhận / unknown|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|first_touch_ref|relation|Không|Điểm chạm đầu quan sát được|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|last_touch_ref|relation|Không|Điểm chạm cuối quan sát được|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|validity|enum|Có|Chờ kiểm / hợp lệ / spam / test / trùng|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|fit|enum|Có|Phù hợp / không phù hợp / chưa rõ|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|readiness|enum|Có|Lạnh / ấm / nóng / chưa rõ|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|new_relationship_status|enum|Có|Mới xác nhận / cũ / chưa rõ|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|handoff_at|datetime|Không|Lúc chuyển Sales|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|feedback_status|enum|Có|Chờ / nhận / không phù hợp / không liên hệ được / chưa sẵn sàng|Đầu mối tiếp nhận|P0|Nội bộ|S22
inquiries|first_meaningful_response_at|datetime|Không|Lúc có phản hồi thực sự cho nhu cầu; không tính auto-reply chung|Đầu mối nhận khách|P0|Hạn chế|S22
inquiries|sales_accepted_at|datetime|Không|Thời điểm Sales xác nhận nhận xử lý, khác lúc Marketing gửi bàn giao|Sales|P0|Hạn chế|S22
opportunities|opportunity_id|UUID|Có|Khóa|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|project_name|text|Có|Tên nhu cầu/công trình|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|end_user_org_id|relation|Có|Trường/chủ đầu tư hưởng lợi|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|buyer_org_id|relation|Không|Đơn vị ký mua, có thể nhà thầu|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|opened_at|datetime|Có|Bắt đầu|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|current_stage|enum|Có|Đánh giá / báo giá / chờ / thắng / thua|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|expected_amount_vnd|currency|Không|Ước tính, không phải doanh thu|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|contract_value_vnd|currency|Không|Giá trị ký, nêu VAT|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|recognized_revenue_vnd|currency|Không|Tổng dẫn xuất từ financial_entries của cơ hội|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|cash_collected_vnd|currency|Không|Tổng dẫn xuất từ financial_entries của cơ hội|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|closed_at|datetime|Không|Ngày thắng/thua|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|loss_reason|text|Không|Lý do được xác nhận, không suy đoán|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
opportunities|source_ref|text|Có|Căn cứ feedback, không đòi quản lý toàn Sales|Sales xác nhận; Base chỉ nhận phản hồi|P1|Nội bộ|S22
inquiry_opportunity_links|link_id|UUID|Có|Khóa|Đầu mối + Sales|P1|Nội bộ|S22
inquiry_opportunity_links|inquiry_id|relation|Có|Yêu cầu|Đầu mối + Sales|P1|Nội bộ|S22
inquiry_opportunity_links|opportunity_id|relation|Có|Dự án|Đầu mối + Sales|P1|Nội bộ|S22
inquiry_opportunity_links|relationship_role|text|Có|Người hỏi cho trường / nhà thầu / mua sắm|Đầu mối + Sales|P1|Nội bộ|S22
inquiry_opportunity_links|verified_at|datetime|Có|Ngày xác nhận|Đầu mối + Sales|P1|Nội bộ|S22
stage_history|history_id|UUID|Có|Khóa|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|entity_type|enum|Có|Contact / inquiry / opportunity|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|entity_id|relation|Có|Đối tượng|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|from_stage|text|Có|Trạng thái trước|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|to_stage|text|Có|Trạng thái sau|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|changed_at|datetime|Có|Thời điểm sự kiện|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|reason|text|Có|Căn cứ thay đổi|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|changed_by|user_id|Có|Người/hệ thống|Hệ thống + người phụ trách|P0|Nội bộ|S22
stage_history|rule_version|text|Có|Quy tắc dùng|Hệ thống + người phụ trách|P0|Nội bộ|S22
touchpoints|touchpoint_id|UUID|Có|Khóa|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|contact_id|relation|Không|Chỉ liên kết khi có căn cứ|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|anonymous_id|text|Không|ID giả danh khi được phép|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|occurred_at|datetime|Có|Thời điểm|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|source_medium|text|Có|Nguồn theo quan sát|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|campaign_id|relation|Không|Chiến dịch|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|publication_id|relation|Không|Bài cụ thể|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|capture_channel|text|Có|Nơi phát sinh liên hệ|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|self_reported_source|text|Không|Khách tự nói, giữ riêng|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|evidence_basis|enum|Có|Observed / self-reported / imported / unknown|Hệ thống / đầu mối|P0|Nội bộ|S22
touchpoints|identity_confidence|enum|Có|Xác nhận / cần duyệt / chưa gắn|Hệ thống / đầu mối|P0|Nội bộ|S22
lead_reviews|review_id|UUID|Có|Khóa|Lead / Sales|P0|Nội bộ|S22
lead_reviews|inquiry_id|relation|Có|Yêu cầu|Lead / Sales|P0|Nội bộ|S22
lead_reviews|fit_result|enum|Có|Phù hợp / không / chưa rõ|Lead / Sales|P0|Nội bộ|S22
lead_reviews|intent_result|enum|Có|Lạnh / ấm / nóng / chưa rõ|Lead / Sales|P0|Nội bộ|S22
lead_reviews|need_stage|enum|Có|Nấc 1–5 / chưa rõ|Lead / Sales|P0|Nội bộ|S22
lead_reviews|explicit_signal|text|Có|Lời hỏi/nhu cầu thật|Lead / Sales|P0|Nội bộ|S22
lead_reviews|last_meaningful_at|datetime|Không|Tương tác có ý nghĩa gần nhất|Lead / Sales|P0|Nội bộ|S22
lead_reviews|evidence_id|relation|Có|Căn cứ|Lead / Sales|P0|Nội bộ|S22
lead_reviews|reviewed_at|datetime|Có|Ngày|Lead / Sales|P0|Nội bộ|S22
lead_reviews|rule_version|text|Có|Phiên bản|Lead / Sales|P0|Nội bộ|S22
lead_reviews|manual_override_reason|text|Không|Lý do sửa kết quả tự động|Lead / Sales|P0|Nội bộ|S22
costs|cost_id|UUID|Có|Khóa|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|period|text|Có|Kỳ ghi nhận|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|campaign_id|relation|Không|Chiến dịch hoặc shared|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|cost_type|enum|Có|Ads / công cụ / thuê ngoài / giờ công / phân bổ|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|incremental_cash|currency|Có|Chi tiền mới|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|economic_cost|currency|Không|Chi phí đầy đủ nếu biết|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|currency|text|Có|VND hoặc mã tiền nguồn|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|allocation_rule|text|Có|Cách phân bổ có phiên bản|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|approval_ref|text|Không|Duyệt chi nếu có|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
costs|completeness|enum|Có|Đầy đủ / chỉ tiền mặt / chưa đủ|Lead; lương giới hạn truy cập|P1|Nội bộ|S22
experiments|experiment_id|UUID|Có|Khóa|Lead|P1|Nội bộ|S22
experiments|hypothesis|text|Có|Nếu...thì...vì...|Lead|P1|Nội bộ|S22
experiments|segment_id|relation|Có|Nhóm|Lead|P1|Nội bộ|S22
experiments|variable|text|Có|Biến thử chính|Lead|P1|Nội bộ|S22
experiments|comparison_design|text|Có|Đối chứng / so sánh quan sát có hạn chế|Lead|P1|Nội bộ|S22
experiments|primary_metric_id|relation|Có|Chỉ số quyết định|Lead|P1|Nội bộ|S22
experiments|guardrails|text|Có|Chất lượng, chi phí, dữ liệu|Lead|P1|Nội bộ|S22
experiments|start_at|datetime|Có|Bắt đầu|Lead|P1|Nội bộ|S22
experiments|review_at|datetime|Có|Ngày xem xét|Lead|P1|Nội bộ|S22
experiments|result|text|Có|Kết quả và cỡ mẫu|Lead|P1|Nội bộ|S22
experiments|decision|enum|Có|Giữ / sửa / dừng / chưa đủ dữ liệu|Lead|P1|Nội bộ|S22
experiments|evidence_refs|relation|Có|Báo cáo liên quan|Lead|P1|Nội bộ|S22
decisions|decision_id|UUID|Có|Khóa|Lead|P0|Nội bộ|S22
decisions|question|text|Có|Vấn đề cần quyết định|Lead|P0|Nội bộ|S22
decisions|decision|text|Có|Nội dung chốt|Lead|P0|Nội bộ|S22
decisions|basis_refs|relation|Có|Bằng chứng hoặc giả định|Lead|P0|Nội bộ|S22
decisions|owner_id|user_id|Có|Người quyết|Lead|P0|Nội bộ|S22
decisions|effective_at|datetime|Có|Ngày hiệu lực|Lead|P0|Nội bộ|S22
decisions|review_at|datetime|Có|Lần xem lại|Lead|P0|Nội bộ|S22
decisions|supersedes_id|relation|Không|Quyết định bị thay thế|Lead|P0|Nội bộ|S22
decisions|status|enum|Có|Đề xuất / đã duyệt / hết hiệu lực|Lead|P0|Nội bộ|S22
employees|employee_id|UUID|Có|Khóa|Lead|P0|Hạn chế|S22
employees|name|text|Có|Họ tên|Lead|P0|Hạn chế|S22
employees|role|text|Có|Vai trò|Lead|P0|Hạn chế|S22
employees|weekly_available_hours|number|Có|Giờ thực có cho công việc|Lead|P0|Hạn chế|S22
employees|work_schedule|text|Có|Lịch part-time/full-time|Lead|P0|Hạn chế|S22
employees|manager_id|relation|Có|Quản lý trực tiếp|Lead|P0|Hạn chế|S22
employees|active|boolean|Có|Còn tham gia|Lead|P0|Hạn chế|S22
employees|permissions_ref|text|Có|Vai trò truy cập|Lead|P0|Hạn chế|S22
tasks|task_id|UUID|Có|Khóa|Người làm + full-time|P0|Nội bộ|S22
tasks|brief_id|relation|Không|Brief hoặc nhiệm vụ hệ thống|Người làm + full-time|P0|Nội bộ|S22
tasks|assignee_id|user_id|Có|Một người chịu trách nhiệm|Người làm + full-time|P0|Nội bộ|S22
tasks|reviewer_id|user_id|Có|Người duyệt|Người làm + full-time|P0|Nội bộ|S22
tasks|deliverable|text|Có|Sản phẩm cần nộp|Người làm + full-time|P0|Nội bộ|S22
tasks|acceptance|text|Có|Tiêu chí đạt|Người làm + full-time|P0|Nội bộ|S22
tasks|due_at|datetime|Có|Hạn|Người làm + full-time|P0|Nội bộ|S22
tasks|estimated_hours|number|Không|Ước tính theo loại việc|Người làm + full-time|P0|Nội bộ|S22
tasks|actual_hours|number|Không|Thời gian thực|Người làm + full-time|P0|Nội bộ|S22
tasks|status|enum|Có|Chờ / làm / bị chặn / chờ duyệt / sửa / đạt|Người làm + full-time|P0|Nội bộ|S22
tasks|blocker|text|Không|Điểm nghẽn|Người làm + full-time|P0|Nội bộ|S22
tasks|completed_at|datetime|Không|Đạt nghiệm thu|Người làm + full-time|P0|Nội bộ|S22
skills_assessments|assessment_id|UUID|Có|Khóa|Lead|P0|Hạn chế|S22
skills_assessments|employee_id|relation|Có|Người|Lead|P0|Hạn chế|S22
skills_assessments|skill|text|Có|Kỹ năng|Lead|P0|Hạn chế|S22
skills_assessments|scenario_response|text|Có|Cách xử lý tình huống|Lead|P0|Hạn chế|S22
skills_assessments|work_sample_ref|URL|Có|Minh chứng|Lead|P0|Hạn chế|S22
skills_assessments|level|enum|Có|Chưa quan sát / cần hướng dẫn / tự làm / cải tiến|Lead|P0|Hạn chế|S22
skills_assessments|reviewer_note|text|Có|Nhận xét hành vi quan sát|Lead|P0|Hạn chế|S22
skills_assessments|learning_need|text|Có|Khoảng trống|Lead|P0|Hạn chế|S22
skills_assessments|reviewed_at|datetime|Có|Ngày|Lead|P0|Hạn chế|S22
skills_assessments|access_level|text|Có|Chỉ cá nhân và người đánh giá|Lead|P0|Hạn chế|S22
learning_resources|resource_id|UUID|Có|Khóa|Lead + full-time|P0|Nội bộ|S22
learning_resources|skill|text|Có|Kỹ năng|Lead + full-time|P0|Nội bộ|S22
learning_resources|learning_objective|text|Có|Học xong làm được gì|Lead + full-time|P0|Nội bộ|S22
learning_resources|content_ref|URL|Có|Tài liệu/video|Lead + full-time|P0|Nội bộ|S22
learning_resources|exercise|text|Có|Bài thực hành|Lead + full-time|P0|Nội bộ|S22
learning_resources|acceptance|text|Có|Bằng chứng đạt|Lead + full-time|P0|Nội bộ|S22
learning_resources|version|text|Có|Phiên bản|Lead + full-time|P0|Nội bộ|S22
learning_resources|reviewed_by|user_id|Có|Người xác nhận|Lead + full-time|P0|Nội bộ|S22
learning_resources|review_due|date|Có|Hạn cập nhật|Lead + full-time|P0|Nội bộ|S22
learning_progress|progress_id|UUID|Có|Khóa|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|employee_id|relation|Có|Người học|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|resource_id|relation|Có|Học liệu|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|assigned_at|datetime|Có|Ngày giao|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|opened_at|datetime|Không|Lần mở, không phải đạt năng lực|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|submission_ref|URL|Không|Sản phẩm thực hành|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|feedback|text|Không|Phản hồi|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|result|enum|Có|Chưa làm / nộp / sửa / đạt|Người học + người duyệt|P0|Nội bộ|S22
learning_progress|validated_at|datetime|Không|Ngày nghiệm thu|Người học + người duyệt|P0|Nội bộ|S22
metric_definitions|metric_id|text|Có|Mã bền vững|Lead|P0|Nội bộ|S22
metric_definitions|name|text|Có|Tên tiếng Việt|Lead|P0|Nội bộ|S22
metric_definitions|grain|text|Có|Đơn vị phân tích|Lead|P0|Nội bộ|S22
metric_definitions|formula|text|Có|Công thức tử/mẫu|Lead|P0|Nội bộ|S22
metric_definitions|source_of_truth|text|Có|Nguồn ưu tiên|Lead|P0|Nội bộ|S22
metric_definitions|aggregation_rule|text|Có|Sum / unique / weighted / snapshot|Lead|P0|Nội bộ|S22
metric_definitions|filters|text|Có|Loại test/spam...|Lead|P0|Nội bộ|S22
metric_definitions|null_policy|text|Có|Thiếu/không áp dụng/0|Lead|P0|Nội bộ|S22
metric_definitions|timezone|text|Có|Múi giờ|Lead|P0|Nội bộ|S22
metric_definitions|owner_id|user_id|Có|Người chịu trách nhiệm|Lead|P0|Nội bộ|S22
metric_definitions|version|text|Có|Phiên bản|Lead|P0|Nội bộ|S22
metric_definitions|effective_at|datetime|Có|Ngày áp dụng|Lead|P0|Nội bộ|S22
metric_definitions|limitations|text|Có|Không được suy diễn gì|Lead|P0|Nội bộ|S22
imports|batch_id|UUID|Có|Khóa|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|source|text|Có|Nền tảng/file|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|period_start|datetime|Có|Kỳ nguồn|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|period_end|datetime|Có|Kỳ nguồn|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|retrieved_at|datetime|Có|Lấy lúc nào|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|source_ref|URL|Có|File export giữ gốc|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|row_count|integer|Có|Số dòng|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|coverage|text|Có|Toàn bộ / phân trang / bộ lọc / thiếu|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|dedupe_key|text|Có|Khóa idempotent|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|status|enum|Có|Thành công / một phần / lỗi|Người phụ trách dữ liệu|P0|Nội bộ|S22
imports|error|text|Không|Lý do|Người phụ trách dữ liệu|P0|Nội bộ|S22
consents_permissions|permission_id|UUID|Có|Khóa|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|subject_or_asset_id|text|Có|Người hoặc ảnh/video|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|purpose|text|Có|Mục đích được phép|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|legal_basis_review|text|Có|Căn cứ được xác nhận, không tự suy đoán|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|granted_at|datetime|Không|Ngày có hiệu lực|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|withdrawn_at|datetime|Không|Ngày rút lại|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|expiry_at|datetime|Không|Ngày hết hạn|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|proof_ref|URL|Không|Bằng chứng|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
consents_permissions|restricted_scope|text|Có|Giới hạn nội bộ/công khai|Lead/người được phân quyền|P0|Hạn chế|S07; S15; S16
audit_log|audit_id|UUID|Có|Khóa|Hệ thống|P0|Nội bộ|S22
audit_log|actor_id|user_id|Có|Ai|Hệ thống|P0|Nội bộ|S22
audit_log|entity_type|text|Có|Bảng|Hệ thống|P0|Nội bộ|S22
audit_log|entity_id|relation|Có|Bản ghi|Hệ thống|P0|Nội bộ|S22
audit_log|action|enum|Có|Tạo / sửa / gộp / xóa / xuất / cấp quyền|Hệ thống|P0|Nội bộ|S22
audit_log|changed_at|datetime|Có|Thời điểm|Hệ thống|P0|Nội bộ|S22
audit_log|changed_fields|text|Có|Tên trường thay đổi|Hệ thống|P0|Nội bộ|S22
audit_log|reason|text|Có|Lý do khi bắt buộc|Hệ thống|P0|Nội bộ|S22
audit_log|before_after_redacted|text|Có|Bản thay đổi che PII theo quyền|Hệ thống|P0|Nội bộ|S22
financial_entries|entry_id|UUID|Có|Khóa phát sinh, nạp lại cùng chứng từ không đếm thêm|Kế toán/Sales được ủy quyền|P1|Hạn chế|S22
financial_entries|opportunity_id|relation|Có|Cơ hội liên quan|Kế toán/Sales được ủy quyền|P1|Hạn chế|S22
financial_entries|entry_type|enum|Có|Giá trị ký / doanh thu ghi nhận / tiền thu / điều chỉnh|Kế toán|P1|Hạn chế|S22
financial_entries|effective_date|date|Có|Ngày phát sinh hoặc kỳ ghi nhận được kế toán xác nhận|Kế toán|P1|Hạn chế|S22
financial_entries|amount_vnd|currency|Có|Số tiền có dấu; điều chỉnh âm giữ nguyên|Kế toán|P1|Hạn chế|S22
financial_entries|vat_basis|enum|Có|Có VAT / chưa VAT / chưa rõ; chỉ cộng số cùng cơ sở|Kế toán|P1|Hạn chế|S22
financial_entries|document_ref|text|Có|Mã chứng từ hoặc bản xác nhận để đối soát|Kế toán/Sales|P1|Hạn chế|S22
financial_entries|confirmed_by|user_id|Có|Người xác nhận số, không do AI tự điền|Kế toán/Sales|P1|Hạn chế|S22
financial_entries|adjusts_entry_id|relation|Không|Tham chiếu dòng điều chỉnh khi có; giữ lịch sử|Kế toán|P1|Hạn chế|S22
_common|created_at|datetime|Theo bảng|Ngày tạo bản ghi|Lead + kỹ thuật|P0|Nội bộ|S22
_common|updated_at|datetime|Theo bảng|Ngày cập nhật gần nhất|Lead + kỹ thuật|P0|Nội bộ|S22
_common|created_by|user_id|Theo bảng|Người/hệ thống tạo|Lead + kỹ thuật|P0|Nội bộ|S22
_common|schema_version|text|Theo bảng|Phiên bản dữ liệu|Lead + kỹ thuật|P0|Nội bộ|S22
_common|record_status|enum|Theo bảng|Đang dùng / lưu trữ / cần kiểm|Lead + kỹ thuật|P0|Nội bộ|S22
_common|evidence_status|enum|Theo bảng|Quan sát / xác nhận / giả thuyết / thiếu|Lead + kỹ thuật|P0|Nội bộ|S22
_common|deleted_at|datetime|Theo bảng|Đánh dấu xóa theo chính sách, không thay yêu cầu xóa thật|Lead + kỹ thuật|P0|Nội bộ|S22`;

export const FIELD_DICTIONARY: FieldDictItem[] = RAW_FIELDS_TSV.split("\n")
  .filter(Boolean)
  .map((line) => {
    const [
      table,
      fieldName,
      dataType,
      required,
      definitionRule,
      owner,
      phase,
      classification,
      source,
    ] = line.split("|");
    return {
      table,
      fieldName,
      dataType,
      required,
      definitionRule,
      owner,
      phase: (phase as PhaseType) || "P0",
      classification,
      source,
    };
  });
