# HACOLED | MARKETING BASE • ĐẶC TẢ NGHIỆP VỤ & DỮ LIỆU • V1.0 • 24/10/2026

Hệ thống thiết kế và vận hành **HacoLED Marketing Base v1.0** phục vụ nội bộ mảng Marketing doanh nghiệp **HacoLED**.

---

## Phạm vi chuẩn v1.0 (14 Trang Đặc tả & Không gian Vận hành P0)

- **12 Phân hệ (`01_PHAN_HE`):** `B01` đến `B12` (giữ logic FT24, bổ sung dữ liệu, vận hành và an toàn).
- **58 Công việc (`02_VIEC_CAN_LAM`):** `B01-01` đến `B12-06` phân theo giai đoạn `P0` (nền tảng bắt buộc), `P1` (sau nền tảng), `P2` (khi đủ dữ liệu/nguồn lực).
- **37 Bảng dữ liệu logic (`03_BANG_DU_LIEU`) & 402 Trường dữ liệu (`04_TRUONG_DU_LIEU`):**
  - Tách biệt `contacts` (người liên hệ), `organizations` (tổ chức), `inquiries` (yêu cầu liên hệ), `opportunities` (dự án/cơ hội), `financial_entries` (giá trị ký / doanh thu ghi nhận / tiền thu tách riêng).
  - Tách biệt `content_briefs` → `content_assets` (1 sản phẩm sáng tạo) → `publications` (nhiều lần đăng trên các kênh, chống đếm trùng sản lượng `QA09`).
- **83 Chỉ số (`05_CHI_SO`):** `M001` đến `M083` kèm công thức, đơn vị phân tích (grain), nguồn chuẩn và quy tắc chống diễn giải sai (mẫu số `0` hoặc thiếu dữ liệu xử lý là `N/A`, không tự điền `0`).
- **20 Sự kiện (`06_SU_KIEN`):** `EV01` đến `EV20` (GA4 recommended + Base nội bộ; không gửi PII vào analytics).
- **18 Quy tắc Lead (`07_QUY_TAC_LEAD`):** `LR01` đến `LR18` (tách mới với Base và mới với HacoLED; giữ `unknown` cho cuộc gọi hotline không rõ nguồn).
- **8 Báo cáo quyết định (`08_BAO_CAO`) & 6 vai trò vận hành (Kinh doanh, Giám đốc, Leader Marketing, Trưởng phòng Marketing, Nhân viên Marketing, Thực tập Marketing).**
- **24 Ca kiểm thử nghiệm thu bắt buộc (`10_KIEM_THU`):** `QA01` đến `QA24`.
- **12 Quyết định (`11_QUYET_DINH`), 22 Nguồn đối chiếu (`12_NGUON`), Ví dụ Brief (`13_VI_DU_BRIEF` - `DEMO-BRIEF-01`) & Bảng tính kiểm thử công thức (`14_VI_DU_CONG_THUC`).**

---

## Chạy tại máy cá nhân (Local) & Deploy lên Vercel

```bash
npm install
npm run dev
```

Dự án được xây dựng bằng **Next.js 15.5 (App Router) + TypeScript + Tailwind CSS**, tương thích trực tiếp khi kết nối từ GitHub `https://github.com/Khtoan02/hacoled_data.git` sang **Vercel**.

## Dashboard HacoLED & tài khoản thành viên

Dashboard sử dụng bố cục lấy cảm hứng từ [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard), được triển khai riêng cho HacoLED với nền sáng, đỏ–vàng, Chakra Petch tự lưu trữ và họa tiết trống đồng được tô vàng bằng CSS mask. Không thay thế ứng dụng bằng template demo.

Phiên bản hiện tại dùng Next.js 15.5 và React 18. Trang `/admin/members` quản lý thành viên, mật khẩu và vai trò bằng PostgreSQL/Neon. Xem [hướng dẫn thiết lập](db/README.md) trước khi triển khai; không còn mật khẩu mặc định hoặc đăng nhập qua sessionStorage.

```bash
npm run db:migrate
npm run build
npm run test:e2e
```

Thiết lập `DATABASE_URL` và `ADMIN_SETUP_TOKEN` theo `.env.example`. Dữ liệu nghiệp vụ trình duyệt và khảo sát Blob cũ chưa được chuyển sang PostgreSQL trong thay đổi này.

Danh sách công việc tại `/admin/tasks` lưu trên PostgreSQL và lọc quyền tại server. Leader/Giám đốc toàn quyền; Trưởng phòng xem việc của mình cùng nhân viên/thực tập; nhân viên và thực tập chỉ xem việc được giao. Quyền Kinh doanh chờ thiết lập.

Giao diện gồm tổng quan biểu đồ công việc thật, bảng/Kanban/to-do dùng chung dữ liệu, độ ưu tiên, checklist, hạn hoàn thành, quản lý đội ngũ dạng bảng/thẻ, hồ sơ cá nhân và thư viện UI tại `/admin/components`. Trang hồ sơ chỉ cho sửa tên/email của chính người đăng nhập. Phần nghiệp vụ marketing mẫu vẫn được ghi rõ và giữ riêng trong mục thu gọn. Attribution MIT của TailAdmin được lưu tại `public/licenses/tailadmin.txt`.

Người được giao việc có thể mở **Kết quả & tiến độ**, nhập kết quả, cập nhật checklist/trạng thái và dán link ảnh để preview/phóng to ngay trong công việc. Mỗi lần cập nhật lưu lịch sử, người báo cáo và thời điểm hoàn thành để đối chiếu KPI về sau. Trạng thái hoàn thành chưa thay thế bước duyệt chất lượng hoặc chấm KPI.

Quản lý kênh tại `/admin/channels`: nền tảng, tên kênh, link, định danh và ghi chú; Leader/Giám đốc/Trưởng phòng Marketing lưu tài khoản đăng nhập được mã hóa, cấp quyền xem theo từng kênh và lưu trữ kênh cũ. Người được giao việc có thể chọn kênh khi báo cáo; danh sách công việc lọc được theo kênh. Xem phần Social channel trong `db/README.md` để cấu hình `SOCIAL_CREDENTIALS_KEY` trên Vercel trước khi dùng tính năng lưu mật khẩu.

Trang `/admin/kpis` quản lý **KPI sản lượng theo người × kênh × loại sản phẩm × tháng**. Leader/Giám đốc giao chỉ tiêu; thành viên lập việc cho mình, chọn KPI và báo cáo số lượng/ngày sản lượng thực tế. Tiến độ cộng từ việc đã hoàn thành, không cộng trùng khi gửi lại báo cáo; hiển thị số còn thiếu, đạt/vượt và sản lượng ngoài tháng. Công việc ngoài KPI được theo dõi riêng. Đây là đánh giá số lượng tự báo cáo; chưa thay thế duyệt chất lượng hoặc chấm hiệu suất có trọng số.

## Import kế hoạch và đánh giá vận hành theo tháng

Giai đoạn hiện tại tập trung **sản lượng nội dung**; lead, doanh thu và số liệu API social để giai đoạn sau. Xem [20 use-case, mô hình dữ liệu và công thức đánh giá](docs/OPERATIONS_USE_CASES.md).

- `/admin/kpis` → **Import KPI**: tải mẫu CSV và danh mục nhân sự/kênh để đưa cho AI; tải CSV/TSV/JSON hoặc dán bảng, xem trước từng dòng rồi xác nhận. Tối đa 500 dòng/lần, đối chiếu email, kênh, tháng và loại sản phẩm. Chế độ cập nhật chỉ tiêu hiện có là lựa chọn riêng; dòng lỗi không được lưu một phần. Excel cần xuất CSV hoặc sao chép bảng TSV, chưa nhận trực tiếp XLSX.
- `/admin/tasks` → import kế hoạch: tháng của hạn hoàn thành tự nối chỉ tiêu theo người/kênh chính/loại sản phẩm. Không có chỉ tiêu phù hợp thì ghi việc ngoài KPI. Xem trước trước khi lưu; gửi lại cùng mã import không tạo thêm việc. Nhiều kênh vẫn chỉ ghi sản lượng một lần vào KPI của kênh chính.
- Tổng quan và `/admin/performance`: chọn tháng, theo dõi việc đến hạn/hoàn thành/đúng hạn/quá hạn, KPI đạt/vượt, việc phát sinh, so sánh sản lượng từng loại với tháng trước, xu hướng 6 tháng và chi tiết theo người/tuyến nội dung/định dạng/từ khóa. Thiếu mẫu số hiển thị chưa đủ dữ liệu.

Chạy migration `010-kpi-imports.sql` bằng `npm run db:migrate` trước khi dùng import (Vercel Production prebuild tự chạy các migration). Tạm dừng KPI giữ liên kết công việc và lịch sử. Báo cáo tháng tính từ trạng thái hiện tại, còn thay đổi nếu sửa/mở lại/xóa việc; chưa phải kỳ đã khóa hay chấm năng lực/chất lượng.

Trưởng phòng Marketing được quản lý danh mục kênh, thêm/sửa/lưu trữ kênh, cập nhật thông tin đăng nhập và cấp/thu hồi quyền xem đăng nhập cho thành viên. Giám đốc, Leader và Trưởng phòng có quyền xem đăng nhập kênh đang hoạt động; quyền tài khoản hệ thống và giao/import KPI vẫn theo phân quyền riêng. Danh sách cấp quyền kênh dùng API danh mục tối thiểu, không mở quyền quản trị thành viên.

KPI và đánh giá tháng dùng chung mục **KPI & hiệu suất** tại `/admin/kpis`: hai phần **Chỉ tiêu tháng** và **Đánh giá hiệu suất** giữ tháng đang chọn khi chuyển qua lại. Đường dẫn cũ `/admin/performance` chuyển đến phần đánh giá trong trang này. Giao/import KPI vẫn theo quyền hiện có.


Cập nhật luồng công việc: KPI được tự đối chiếu theo người × kênh chính (kênh đầu tiên) × loại sản phẩm × tháng của hạn hoàn thành, theo múi giờ Việt Nam. Biểu mẫu hiển thị chỉ tiêu chỉ đọc, không cần tích hoặc chọn tháng. Tạo/sửa công việc có hạn được server đối chiếu lại; không tự cập nhật hàng loạt việc cũ nếu chưa lưu sửa. Nếu chưa có hạn hoặc chỉ tiêu phù hợp, biểu mẫu ghi rõ ngoài KPI. Mẫu CSV mới bỏ `thang_kpi` và `do_uu_tien`; file cũ vẫn nhận, nhưng tháng KPI cũ khác hạn hoàn thành sẽ báo lỗi. Độ ưu tiên được bỏ khỏi giao diện công việc; dữ liệu cũ vẫn giữ. Bảng, Kanban và to-do đều xếp hạn tăng dần, việc chưa có hạn xuống cuối trong từng nhóm trạng thái.

KPI sản lượng ghi nhận theo **tháng chỉ tiêu đã giao** (tự liên kết từ hạn hoàn thành), kể cả làm sớm/trễ; ngày sản lượng thực tế vẫn giữ để phân tích hoạt động theo thời gian. Hoàn thành nhanh mặc định ghi nhận khối lượng đã giao nếu chưa nhập sản lượng; số thực tế nhập rõ, kể cả 0, được ưu tiên. Không cộng dồn các lần gửi lại. Việc cũ đã hoàn thành nhưng sản lượng 0 có cảnh báo và nút bổ sung từ khối lượng giao, không tự sửa hàng loạt.
