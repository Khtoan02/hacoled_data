# Chat nội bộ HacoLED

## Phạm vi

`/admin/chat` cung cấp nhắn riêng và nhóm cho mọi tài khoản đang hoạt động, kể cả Kinh doanh. Quyền chat độc lập với quyền xem công việc, KPI, thông tin khách hàng hoặc mật khẩu kênh. Giao diện dùng cùng màu, font và thành phần của dashboard.

- Chat riêng: đúng hai người; mở lại từ một trong hai phía trả về cùng cuộc trò chuyện.
- Nhóm: từ hai người lúc tạo, tối đa 50 người. Người tạo là trưởng nhóm, có thể đổi tên, thêm/gỡ người và chuyển trưởng nhóm cho một thành viên đang hoạt động.
- Tin nhắn văn bản tối đa 4.000 ký tự, giữ xuống dòng và hỗ trợ mở link HTTP/HTTPS. Enter gửi, Shift+Enter xuống dòng; không gửi khi bộ gõ đang ghép ký tự.
- Chưa có upload ảnh/tệp, cuộc gọi hoặc xóa/sửa tin nhắn. Có thể bật Web Push riêng trên thiết bị để nhận nhắc tin mới khi không mở tab; xem docs/WEB_PUSH.md.

## Quyền và lịch sử

API kiểm tra tài khoản và tư cách thành viên ở từng lần đọc/gửi/đánh dấu đã đọc. Leader/Giám đốc không có quyền mặc định đọc tin riêng hoặc nhóm mà mình không tham gia. Danh bạ chat chỉ trả ID, tên, vai trò và trạng thái; không trả email, hash mật khẩu hay thông tin đăng nhập social.

Người được thêm mới chỉ đọc tin nhắn có số thứ tự lớn hơn mốc gia nhập của mình. Khi gỡ rồi thêm lại, mốc được tạo lại: không khôi phục quyền xem giai đoạn trước hoặc lúc vắng mặt. Thành viên còn lại giữ quyền xem lịch sử từ mốc gia nhập của chính họ. Thay đổi thành viên không xóa tin nhắn.

Chỉ trưởng nhóm hiện tại được cập nhật tên, danh sách thành viên và trưởng nhóm. Phiên bản nhóm chống ghi đè từ biểu mẫu cũ. Trưởng nhóm mới phải ở trong danh sách và có tài khoản hoạt động. Tài khoản bị ngừng hoạt động không được đọc/gửi, không xuất hiện trong danh bạ để thêm mới. Lịch sử có thể giữ tên và tin nhắn của người đã ngừng hoạt động.

Tin được lưu trong PostgreSQL và kiểm soát truy cập ở server; đây không phải cơ chế mã hóa đầu-cuối. Không tạo nhóm chung hoặc gửi tin thay người dùng khi triển khai migration.

## Cập nhật và chưa đọc

Danh sách chat và cuộc trò chuyện đang mở tự tải khoảng 5 giây/lần khi tài liệu hiển thị. Khi trang bị ẩn, không gửi yêu cầu polling mới; khi quay lại, tải lại dữ liệu. Tin mới dùng cursor tăng dần nên không bỏ khoảng lịch sử khi có hơn 50 tin mới. Mỗi yêu cầu trả tối đa 50 tin; nút tải cũ dùng cursor ngược. Hai hướng đều áp dụng mốc gia nhập và quyền thành viên.

Chỉ ghi đã đọc khi trang hiển thị, đang được focus và người dùng ở gần cuối cuộc trò chuyện. Cursor chỉ tăng, không lùi hoặc ghi vượt một tin nhắn thuộc phạm vi xem. Tin của chính người gửi không tính là chưa đọc. Không hiển thị trạng thái online/đang gõ hoặc biên nhận người khác đã đọc trong bản này.

Nội dung đang soạn giữ riêng theo cuộc trò chuyện trong bộ nhớ tab. Gửi lỗi giữ nội dung và mã yêu cầu; bấm gửi lại cùng nội dung dùng cùng UUID. Server không tạo thêm bản ghi nếu yêu cầu đã thành công trước đó. Cùng UUID nhưng khác tác giả/phòng/nội dung bị từ chối. Tạo nhóm cũng có mã yêu cầu chống tạo trùng khi thử lại; replay không thêm lại thành viên đã bị gỡ.

Trên điện thoại, danh sách và nội dung là hai màn hình chuyển qua lại. Khi mở hội thoại, ưu tiên chiều cao cho tin nhắn và ô soạn. Đổi kích thước giữ cuối cuộc trò chuyện nếu người dùng đang ở cuối; tải lịch sử giữ vị trí đang đọc.

## Database và triển khai

Migration `012-team-chat.sql` tạo:

- `app_chat_rooms`: loại, tên, trưởng nhóm, khóa tạo chống trùng, phiên bản.
- `app_chat_members`: thành viên, mốc gia nhập và mốc đã đọc.
- `app_chat_messages`: UUID chống trùng, sequence tăng dần, người gửi, nội dung, thời gian server.

Các thao tác tạo, quản lý và gửi sử dụng transaction cùng advisory lock để việc gỡ người và gửi tin được kiểm tra theo thứ tự nhất quán. Tin được render như text, không thực thi HTML. Các API dùng `Cache-Control: no-store, private` và kiểm tra Origin cho thao tác ghi.

Dùng `DATABASE_URL` hiện tại; không cần thêm khóa của nhà cung cấp chat. Vercel Production prebuild chạy migration theo cơ chế hiện có. Local/Preview cần database riêng và `npm run db:migrate`. Không dùng dữ liệu production trong kiểm thử.

## Nghiệm thu

`tests/chat.spec.ts` kiểm tra:

1. Đăng nhập và danh bạ tối thiểu, bao gồm quyền chat của Kinh doanh.
2. Chat riêng duy nhất, outsider và quản trị ngoài cuộc trò chuyện không đọc được.
3. Gửi/retry, UUID xung đột, nội dung trống/quá dài, CSRF và chỉ số chưa đọc.
4. Tạo nhóm/retry, người không phải trưởng nhóm không sửa được, version cũ bị từ chối.
5. Thêm/gỡ người, mốc xem lịch sử, replay không khôi phục thành viên đã gỡ.
6. Phân trang cũ/mới vượt 50 tin không trùng hoặc bỏ khoảng.
7. Ngừng tài khoản chặn chat, không thêm người đã ngừng hoạt động.
8. Tạo nhóm, gửi text chứa HTML, đổi tên và giao diện desktop/mobile.
9. Chuyển trưởng nhóm và thu hồi quyền quản lý của trưởng nhóm cũ.

## Chat nhanh ở góc màn hình

Các trang nội bộ có nút Chat ở góc phải dưới. Nút hiện số tin chưa đọc và nháy viền đỏ nhẹ; tôn trọng cài đặt giảm chuyển động. Tin mới phát hiện trong lúc dùng ứng dụng hiện thông báo nổi trong 8 giây, bấm để mở đúng cuộc trò chuyện. Tin cũ chưa đọc chỉ hiện số đếm, không hiện lại thành thông báo mới mỗi lần tải trang. Không tự mở cửa sổ hay chiếm focus khi có tin.

Cửa sổ nhỏ dùng chung API, kiểm tra thành viên, gửi lại chống trùng và phân trang với trang chat đầy đủ. Có tạo nhóm/nhắn riêng, thu gọn giữ bản nháp, nút mở toàn màn hình và Escape để thu gọn. Thu gọn không đánh dấu đã đọc. Trên trang chat đầy đủ sẽ ẩn nút nổi để tránh trùng giao diện. Dữ liệu mới kiểm tra mỗi 5 giây khi tab hiện; Web Push vẫn phụ trách nhắc thiết bị khi tab đóng theo cấu hình riêng.

Thông báo nổi cũng hiển thị khi đang ở trang chat đầy đủ. Bộ phát hiện tin mới tiếp tục kiểm tra khi chuyển tab (tần suất có thể bị trình duyệt giới hạn). Nếu đã cấp quyền Notification nhưng chưa đăng ký Web Push, tab đang mở có thể gửi thông báo trình duyệt dự phòng; khi đã có đăng ký push, Web Push đảm nhiệm để tránh gửi trùng. Không nhắc cho tin do chính mình gửi.
