# Công việc: danh sách, Kanban, To-do và ảnh kết quả

Ba chế độ dùng cùng dữ liệu và bộ lọc. Danh sách theo hạn tăng dần (chưa có hạn ở cuối), hiển thị dạng từng mục trên điện thoại. Kanban chia theo trạng thái, vẫn xếp hạn gần trước. To-do chia quá hạn / hôm nay / 7 ngày tới / sắp tới / chưa đặt hạn / hoàn thành; trong mỗi nhóm giữ thứ tự hạn. Mốc ngày dùng múi giờ Việt Nam.

Bộ lọc nhanh có Việc của tôi, Quá hạn, Hôm nay, 7 ngày tới. Bộ lọc chi tiết kênh/KPI/trạng thái/người thực hiện có thể thu gọn, mặc định thu gọn trên điện thoại. Các bộ lọc dùng chung giữa ba chế độ xem. Thẻ Kanban và To-do có lối mở nhanh phần trả kết quả.

Trong chi tiết luôn hiển thị tên việc, người thực hiện, hạn và khối lượng. Phần kết quả ưu tiên mô tả kết quả, trạng thái, checklist và hình ảnh trước thông tin sản lượng/KPI. Nhân viên/thực tập chỉ cập nhật việc của mình. Trưởng phòng có thể xem việc của đội theo quyền hiện hành, không tự sửa kết quả việc người khác. To-do cho người thực hiện tích hoàn thành nhanh; ghi lịch sử và đối chiếu phiên bản giống phần trả kết quả.

## Xóa nhiều công việc

Leader Marketing và Giám đốc (hai vai trò toàn quyền hiện tại) có nút Chọn nhiều. Chọn từng việc trong bảng, thẻ Kanban hoặc To-do, hoặc chọn trang đang xem. Có thể giữ lựa chọn khi chuyển trang/chế độ; đổi bộ lọc sẽ xóa lựa chọn để tránh xóa nhầm việc bị ẩn. Tối đa 100 việc/lần. Xác nhận hiển thị danh sách, người thực hiện, hạn và trạng thái. Bấm Giữ lại để hủy.

API `POST /api/tasks/bulk-delete` nhận `{items:[{id,version}]}`. Kiểm tra Origin, phiên đăng nhập và quyền toàn hệ thống ở server. Khóa hàng theo ID và chỉ xóa khi tất cả ID tồn tại và phiên bản khớp. Một việc đã thay đổi/biến mất làm toàn bộ lệnh dừng với 409; không xóa dở dang. Cùng giao dịch ghi snapshot vào `app_deletion_audit` và xóa công việc; lịch sử báo cáo giữ lại theo quy tắc cũ. KPI và đánh giá tổng hợp dùng các công việc còn lại, không cộng lại dữ liệu đã xóa. Snapshot không cung cấp chức năng hoàn tác qua giao diện.

## Ảnh từ clipboard / máy tính

- Dán ảnh bằng Ctrl+V / ⌘V trong phần trả kết quả, kéo thả vào vùng ảnh hoặc Chọn ảnh từ máy. Vẫn có thể dán link như trước.
- Chấp nhận PNG, JPEG, WebP. Ảnh gốc tối đa 10 MB, tối đa 40 triệu pixel; trình duyệt thu cạnh dài về tối đa 1920 px, xuất WebP chất lượng 85%. Nếu sau tối ưu vượt 2 MB, yêu cầu chọn ảnh nhỏ hơn.
- Xem trước và bỏ ảnh chờ lưu trước khi gửi. Đóng/chuyển mục khi chưa lưu sẽ nhắc xác nhận. Tối đa 10 ảnh/link trong kết quả hiện tại.
- Khi lưu, ảnh được tải trước rồi báo cáo kết quả được lưu. Nếu lưu báo cáo lỗi, giữ các link ảnh đã tải để thử lại, không nhân đôi file. UUID cho từng ảnh chống tải trùng khi thử lại. Ảnh đã tải trong lần lưu lỗi hoặc ảnh của lịch sử vẫn chiếm dung lượng của công việc.
- Ảnh đính kèm lưu trong PostgreSQL (`app_task_attachments`, bytea) và trả qua `/api/tasks/attachments?id=...` có xác thực. Không đưa vào Blob public. Không cần tạo thêm dịch vụ hoặc biến môi trường; dung lượng ảnh tính vào hạn mức database hiện có. Tổng ảnh (kể cả lịch sử) tối đa 20 MB/công việc. Khi sử dụng nhiều ảnh, có thể chuyển lớp lưu trữ sang object storage riêng tư mà giữ nguyên URL ứng dụng.
- Server kiểm tra kích thước, chữ ký định dạng, quyền sửa công việc và giới hạn tổng dung lượng. Ảnh không thuộc đúng công việc không thể được lưu làm minh chứng nội bộ cho việc khác.
- Người có quyền xem công việc mới xem được ảnh; kiểm tra lại ở mỗi lượt tải, Cache-Control private/no-store. Đổi người thực hiện/thu hồi vai trò cũng đổi quyền xem ảnh. Ảnh/link bên ngoài vẫn tuân theo quyền của dịch vụ bên ngoài, không được tải qua proxy của hệ thống.
- Xóa công việc xóa các byte ảnh đính kèm theo FK cascade. Gỡ một ảnh khỏi kết quả hiện tại không xóa byte để giữ minh chứng trong lịch sử.

Migration: `db/014-task-attachments.sql`. Kiểm thử: `tests/task-bulk-images.spec.ts`, `tests/task-reports.spec.ts`, `tests/completion-kpi.spec.ts`.
