# Thông báo nội bộ

Chuông trong thanh đầu trang hiển thị tối đa 100 thông báo gần nhất của tài khoản. Trạng thái đã đọc lưu trong PostgreSQL, dùng chung giữa các thiết bị. Kiểm tra mỗi 30 giây khi tab đang hiển thị; đây là thông báo trong ứng dụng, không phải email hoặc push khi đóng trình duyệt.

## Người nhận

- Công việc mới hoặc đổi người thực hiện: người được giao, Leader Marketing và Giám đốc. Trưởng phòng Marketing nhận thông báo cho nhân viên/thực tập sinh trong phạm vi quản lý.
- Công việc chuyển sang hoàn thành: Leader Marketing, Giám đốc và Trưởng phòng Marketing được phép xem công việc đó. Lưu lại kết quả đang hoàn thành không phát sinh thông báo lần nữa. Mở lại rồi hoàn thành là một sự kiện mới.
- Kinh doanh chưa có quyền nghiệp vụ nên chưa nhận các thông báo này.
- Không báo ngược các công việc đã tồn tại trước migration. Xóa công việc/KPI sẽ xóa các thông báo liên quan.

Trigger PostgreSQL phát sự kiện cùng giao dịch ghi công việc, bao gồm nhập hàng loạt. API chỉ đọc thông báo của chính tài khoản và kiểm tra lại phạm vi hiện tại. Đổi vai trò hoặc người thực hiện thu hồi quyền xem các thông báo không còn thuộc phạm vi. Không đưa mật khẩu hoặc thông tin đăng nhập kênh vào nội dung.

## Nhắc KPI

Khi mở ứng dụng, mỗi ngày tạo tối đa một lời nhắc cho mỗi KPI đang hoạt động trong tháng hiện tại (múi giờ Việt Nam), thuộc phạm vi người xem. Nhắc nếu từ ngày 7 trở đi sản lượng thực tế thấp hơn tiến độ tuyến tính `ngày hiện tại / số ngày của tháng`, hoặc còn tối đa 3 ngày đến cuối tháng và chưa đạt chỉ tiêu. Không nhắc KPI đã đạt, vượt hoặc tạm dừng. Chỉ tiêu được tính theo sản lượng hoàn thành đã liên kết, cùng quy tắc trang KPI.

Khóa duy nhất `(member_id,event_key)` chống trùng khi mở nhiều tab/thiết bị. Lời nhắc là ảnh chụp tiến độ tại thời điểm phát; bấm vào để xem số liệu hiện tại. Sự kiện công việc sử dụng phiên bản báo cáo để phân biệt các lần giao lại/hoàn thành lại. Không có tác vụ nền khi tất cả người dùng đóng ứng dụng.

Migration: `db/013-notifications.sql`, chạy theo quy trình migration hiện tại trước triển khai production. Kiểm thử: `tests/notifications.spec.ts`.

Giao diện hộp thông báo dùng nút chuẩn của dashboard, có bộ lọc Chỉ hiện chưa đọc và loại sự kiện (việc mới/hoàn thành/KPI). Danh sách nhóm theo ngày Việt Nam, hiển thị Hôm nay/Hôm qua hoặc ngày cụ thể, icon phân loại và chấm chưa đọc. Thời gian gọn giờ/phút, tooltip giữ đầy đủ ngày giờ. Lọc chỉ áp dụng trên 100 thông báo đã được server cho phép xem; đánh dấu tất cả vẫn đánh dấu toàn bộ tập thông báo được phép trong hộp thư, không chỉ nhóm đang lọc. Có trạng thái tải/lỗi/rỗng và khóa nút khi đang cập nhật, không đổi quy tắc phát thông báo hoặc quyền truy cập.
