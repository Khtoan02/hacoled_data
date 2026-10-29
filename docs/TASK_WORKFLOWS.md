# Công việc: danh sách, Kanban, To-do và ảnh kết quả

Bốn chế độ dùng cùng dữ liệu và bộ lọc:

- **List** (mặc định): hàng gọn có tên việc, kênh/loại sản phẩm, checklist/minh chứng, hạn, người phụ trách và trạng thái. Luôn ưu tiên hạn gần nhất, chưa có hạn ở cuối. Hàng xếp lại theo chiều dọc trên điện thoại.
- **Table**: bảng cột Công việc, Kênh, Người thực hiện, Hạn, Sản lượng/KPI, Trạng thái và Thao tác. Bấm tiêu đề để sắp xếp tăng/giảm theo tên, người thực hiện, hạn hoặc trạng thái; mặc định theo hạn tăng dần, chưa có hạn luôn ở cuối. Thứ tự tùy chỉnh chỉ áp dụng Table, được giữ khi chuyển đi rồi quay lại. Trên điện thoại giữ cấu trúc cột và cuộn ngang, kèm hướng dẫn.
- **To-do**: checkbox hoàn thành nhanh, nhóm theo quá hạn / hôm nay / 7 ngày tới / sắp tới / chưa đặt hạn / hoàn thành; thu/mở từng nhóm. Trong nhóm giữ thứ tự hạn.
- **Kanban**: ba cột trạng thái, thẻ có yêu cầu tóm tắt, kênh, checklist, hạn, người phụ trách và mở nhanh trả kết quả. Quản trị viên kéo thả được; chi tiết vẫn là đường cập nhật bằng bàn phím/điện thoại.

List/Table phân trang 10 việc; chọn nhiều được giữ khi chuyển giữa cả bốn cách xem. To-do/Kanban dùng toàn bộ tập việc sau lọc. URL lần lượt `view=list`, `view=table`, `view=todo`, `view=board`; không có view hoặc không hợp lệ mặc định List. Link `view=list` cũ chuyển sang List thực sự, không còn là bí danh của bảng.

Tìm kiếm và nút Bộ lọc cùng hàng với chọn chế độ trên máy tính. Bộ lọc chi tiết mặc định đóng trên mọi kích thước; bộ lọc nhanh Việc của tôi, Quá hạn, Hôm nay, 7 ngày tới luôn có sẵn. Lọc đang áp dụng có số kết quả và nút Bỏ lọc; thu bộ lọc không xóa điều kiện. Mốc ngày dùng múi giờ Việt Nam. Thống kê là một hàng tóm tắt thay vì bốn ô lớn để dành không gian cho công việc.

Tham khảo bố cục bảng, avatar, badge và divider từ `src/components/tables/BasicTableOne.tsx` trong ZIP TailAdmin người dùng cung cấp. ZIP Free 2.4.0 không chứa mã trang Task/Kanban hoàn chỉnh; các chế độ công việc được xây dựng trên dữ liệu và phân quyền hiện có, không thêm dữ liệu mẫu vào production.

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

## Chẩn đoán import CSV

Xem trước phân biệt tổng số dòng trong file, số dòng hợp lệ, số dòng cần sửa và dòng mẫu/trống bỏ qua. Chỉ hiển thị tối đa 100 thông báo lỗi nhưng báo rõ tổng số lỗi nếu vượt giới hạn; một dòng có thể có nhiều lỗi. Không nhập phần hợp lệ khi còn dòng lỗi.

Kênh được khớp chính xác theo ID, URL, tên hoặc @định danh đang hoạt động. Nếu @định danh/tên dùng chung cho nhiều kênh, báo các kênh ứng viên và yêu cầu dùng URL/ID chính xác; không tự đoán theo tiêu đề công việc hoặc KPI. Không tìm thấy kênh không còn bị báo nhầm là lặp kênh. Các giá trị chung như Facebook Reels, TikTok hay YouTube Shorts chỉ dùng được nếu trùng đúng tên kênh đã khai báo.

Email người thực hiện phải có và khớp tài khoản Marketing đang hoạt động. `video` vẫn tương thích dữ liệu cũ và được hiểu là video dài; video ngắn dùng `video_doc_ngan`. Audit chưa là loại sản phẩm riêng: công việc rà soát có thể dùng `khac` và ghi rõ mô tả/ghi chú, không tự đổi loại dữ liệu của người dùng.

## File mẫu lấy dữ liệu hiện tại

`GET /api/tasks/import?month=YYYY-MM` tải CSV kế hoạch dựa trên dữ liệu đang hoạt động lúc tải. Trong Import kế hoạch, chọn tháng trước khi tải. Không có tham số tháng thì dùng tháng hiện tại theo giờ Việt Nam.

- Nhân sự trong mẫu/danh mục: `marketing_manager`, `marketing_staff`, `marketing_intern` đang hoạt động. Không gồm Giám đốc, Kinh doanh và Leader Marketing; đây là phạm vi mẫu tham khảo, không đổi quyền tạo/giao việc hiện có.
- Kênh: chỉ metadata kênh đang hoạt động, dùng ID làm giá trị cột `kenh` để không nhập nhầm khi các nền tảng dùng chung tên/handle. Không xuất tài khoản đăng nhập, mật khẩu hoặc token kênh.
- Ưu tiên một dòng ví dụ cho mỗi KPI đang hoạt động của tháng và nhân sự/kênh phù hợp, sau đó bổ sung một dòng công việc khác chưa gắn kênh cho các nhân sự còn thiếu. Ví dụ có lượng 1 và hạn cuối tháng để dễ thay bằng lịch thực; không tự chia khối lượng hoặc giao việc thật.
- Tất cả tên ví dụ bắt đầu `MẪU -`; importer bỏ qua cho đến khi người dùng sửa nội dung và xóa tiền tố. Email là email thật, loại sản phẩm dùng mã chuẩn. Dòng không có KPI ghi rõ là ngoài chỉ tiêu. Không tự đoán kênh cho nhân sự chưa có KPI.
- Tối đa 500 dòng ví dụ trong CSV. Không có nhân sự phù hợp thì chỉ xuất dòng tiêu đề, giao diện yêu cầu bổ sung thành viên.

Cùng endpoint có `kind=members` tải danh mục nhân sự CSV, `kind=channels` tải danh mục kênh CSV, `kind=reference` tải bộ JSON dành cho AI gồm cột/quy tắc, nhân sự, kênh, KPI đã chọn tháng và mẫu. `kind=summary` chỉ trả số lượng để giao diện hiển thị. Tất cả yêu cầu phiên đăng nhập quyền quản trị hệ thống, trả private/no-store và không ghi dữ liệu nghiệp vụ. File sẽ phản ánh thay đổi nhân sự/kênh/KPI ở lần tải tiếp theo; không suy ra danh mục production từ fixture kiểm thử.

Table được trình bày như data grid: đường chia ô cả hai chiều, hàng xen màu và highlight khi hover/focus/chọn. Header bám trên vùng cuộn; cột tên việc và checkbox chọn được ghim trên desktop khi cuộn ngang. Trên điện thoại chỉ ghim checkbox để tên việc không che toàn bộ cột còn lại; bảng vẫn cuộn ngang trong vùng riêng. Giữ nguyên cách sắp xếp, phân trang, chi tiết/kết quả và kiểm tra quyền server, không thêm chỉnh sửa dữ liệu trực tiếp trong ô.

Bộ lọc Người thực hiện luôn hiển thị trong thanh lọc nhanh cho vai trò có phạm vi `all` hoặc `marketing_team`, không bị ẩn trong Bộ lọc nâng cao. Các lựa chọn lấy từ công việc đã được server cho phép xem, cộng chính người đang đăng nhập (kể cả chưa có việc), kèm tổng số việc của từng người. Leader/Giám đốc có toàn bộ phạm vi; Trưởng phòng chỉ có mình và nhân viên/thực tập; nhân viên không có bộ chọn đồng nghiệp. Giữ lựa chọn người và KPI khi chuyển giữa bốn chế độ; chỉ đồng bộ lại điều kiện từ URL khi chính tham số tương ứng đổi, tránh đổi view làm reset bộ lọc. Đổi người sẽ bỏ lựa chọn xóa hàng loạt như các bộ lọc khác.
