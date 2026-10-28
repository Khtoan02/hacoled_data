# HacoLED Data

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
HacoLED's marketing manager and internal team manage marketing data, team surveys, content, leads and reporting. Administrators add members, set/reset passwords and assign roles.

## Product Purpose
An independent internal marketing workspace, separate from HacoLED's public website.

## Capabilities and Constraints
Existing Next.js 15.5 / React 18 application deployed on Vercel. Preserve operational modules, survey submissions, metric definitions and existing data. Neon PostgreSQL is connected to the Vercel project; local credentials have not been supplied. Existing operational data is a browser-local demonstration, not a shared production database. Account permissions must be enforced on the server.

## Brand Commitments
HacoLED red as the primary color, yellow accents, supplied Đông Sơn drum artwork rendered yellow, and Chakra Petch with Vietnamese support. The user explicitly chose a light TailAdmin-inspired workspace with a white sidebar.

## Evidence on Hand
Existing business definitions in README.md and src/lib/store/database.ts. TailAdmin free-nextjs-admin-dashboard is the user's layout reference. Supplied drum asset is preserved in public/brand/dongson-original.webp.

## Product Principles
- Preserve existing workflows and clearly distinguish sample data from live records.
- Use named accounts and server-side permissions.
- Keep standard PostgreSQL schemas portable.
- Make frequent internal tasks easy to scan and complete.

## Member Roles and Task Access
Six member roles: Kinh doanh (pending business permissions), Giám đốc and Leader Marketing (full administration), Trưởng phòng Marketing (own tasks plus Marketing staff/intern tasks), Nhân viên Marketing and Thực tập Marketing (identical own-task visibility and reporting). Account and task permissions are enforced on the server. Task approval configuration is a separate future workflow, not a fixed role-matrix column.

## Current Operational UI
Database-backed task table, Kanban and to-do views share priority, due dates, checklist and scoped permissions. Assignees can submit result text, inline image links and progress for their own work; members may create their own work; editing existing assignment definitions remains administrator-only. Overview charts use actual task records; team card/table views use real members and task counts. Personal profile editing changes only the signed-in member name/email. An administrator-only UI library documents reusable components. Legacy marketing modules remain explicitly marked browser-local demonstrations.

Task result snapshots preserve reporter, assignee, deadline and completion timestamps for future KPI reconciliation. Completed status is not content approval or KPI achievement. Monthly quantity targets are now assigned and reconciled through the operational KPI module. Quality scoring remains undefined.

## Social channel management
Marketing members share a channel catalog and link their own assigned work to a channel. Leader/Director/Marketing Manager manage channels and grant credential viewing per member/channel. Username/password are encrypted server-side and revealed separately, with access audit and transient UI display; selecting a channel on a task never grants credential access. Kinh doanh stays pending. Archiving preserves historical task links; report snapshots retain channel name and ID for later KPI work. Production credential storage requires the independent `SOCIAL_CREDENTIALS_KEY` environment secret.

## Monthly quantity KPIs
Leader/Director assign positive integer targets by person, channel, output type and calendar month. Staff/interns see their own plans; managers see their own plus staff/intern plans. Members can create work for themselves and link it to their own KPI, or record extra work outside KPI. They cannot assign tasks or change targets for others.

One task has one optional KPI, planned quantity, reported delivered quantity and production date. KPI progress sums current completed-task quantities with matching person/channel/type into the assigned KPI month, including early/late deliveries. Repeated reports do not accumulate; reopening/deleting a task removes its current contribution. Above-target quantities show uncapped percentages and excess units. Work completed outside the KPI month is disclosed separately and still credited to its assigned target. Extra work remains separate by unit, with a task count instead of summing unlike quantities. This is self-reported quantity attainment, not quality approval or a weighted overall performance score.

## Bulk production planning and monthly operations review

Current delivery is content production quantity; leads, revenue and social API measurement are deferred. Full administrators import KPI CSV/TSV/JSON or pasted tables through row-level validation and preview, then an atomic create/update commit. A downloadable directory helps external AI use exact member/channel references. Task-plan CSV imports require preview and optionally link to a matching monthly KPI through `thang_kpi`; blank means extra work. Import retries do not duplicate data. Pausing targets preserves work/history.

Overview and the monthly review page compare due-work completion, punctuality, overdue work, goal attainment/exceedance and extra work. Output types are compared separately against the prior month. Employee details drill into tasks and brief dimensions with a six-month count trend. Rates without denominators are unknown. These are mutable current-state operational reports, not locked payroll periods or automatic quality/competency scores. Detailed flows and acceptance cases are in `docs/OPERATIONS_USE_CASES.md`.

Trưởng phòng Marketing được quản lý danh mục kênh, thêm/sửa/lưu trữ kênh, cập nhật thông tin đăng nhập và cấp/thu hồi quyền xem đăng nhập cho thành viên. Giám đốc, Leader và Trưởng phòng có quyền xem đăng nhập kênh đang hoạt động; quyền tài khoản hệ thống và giao/import KPI vẫn theo phân quyền riêng. Danh sách cấp quyền kênh dùng API danh mục tối thiểu, không mở quyền quản trị thành viên.

KPI sản lượng ghi nhận theo **tháng chỉ tiêu đã giao** (tự liên kết từ hạn hoàn thành), kể cả làm sớm/trễ; ngày sản lượng thực tế vẫn giữ để phân tích hoạt động theo thời gian. Hoàn thành nhanh mặc định ghi nhận khối lượng đã giao nếu chưa nhập sản lượng; số thực tế nhập rõ, kể cả 0, được ưu tiên. Không cộng dồn các lần gửi lại. Việc cũ đã hoàn thành nhưng sản lượng 0 có cảnh báo và nút bổ sung từ khối lượng giao, không tự sửa hàng loạt.

Leader/Giám đốc có nút xóa KPI và công việc tạo lỗi, kèm xác nhận. Xóa KPI giữ công việc và chuyển thành ngoài KPI; xóa việc loại sản lượng khỏi KPI. Snapshot và lịch sử được giữ để đối chiếu; chưa có khôi phục từ giao diện. Migration `011-deletion-audit.sql` cần có trước khi dùng (Vercel Production tự chạy khi build). Tạm dừng KPI vẫn dùng phần chỉnh sửa trạng thái.
