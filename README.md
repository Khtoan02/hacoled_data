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
