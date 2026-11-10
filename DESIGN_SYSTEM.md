# HacoLED Design System & Frontend UI Guideline (`v1.0`)

Tài liệu này quy định toàn bộ tiêu chuẩn **Visual Identity, Hệ thống Màu sắc, Font chữ, Họa tiết, Biểu tượng, Thư viện Frontend và Quy chuẩn Component** của hệ sinh thái phần mềm nội bộ **HacoLED**.

Khi xây dựng bất kỳ công cụ (Tool) mới nào cho HacoLED (CRM, Kho vận, Bảo hành, Khảo sát, ERP, Báo giá...), hãy sử dụng tài liệu này làm chuẩn thiết kế để đảm bảo **đồng bộ 100% trải nghiệm thị giác**.

---

## 1. Triết lý Thiết kế (Visual Direction)

- **Phong cách chủ đạo:** **Clean Industrial & Enterprise Light Workspace** — Giao diện sáng, sắc nét, mang hơi hướng kỹ thuật hiện đại (nhờ font chữ góc cạnh *Chakra Petch*) kết hợp bản sắc văn hóa Việt Nam (**Đỏ HacoLED – Vàng Kim – Họa tiết Trống đồng Đông Sơn**).
- **Nguyên tắc thị giác:**
  1. **Nền sáng dịu mắt (`#f5f6fa`) – Thẻ trắng tinh khiết (`#ffffff`)**: Giúp nhân sự làm việc liên tục nhiều giờ với bảng biểu, số liệu mà không mỏi mắt.
  2. **Phân tách bằng đường viền mảnh (`1px solid #e6e9ef`) thay vì đổ bóng đậm**: Chỉ dùng bóng mờ rất nhẹ khi hover hoặc cho các lớp nổi (Modal, Drawer, Dropdown, Toast).
  3. **Điểm nhấn có kiểm soát:** Màu đỏ thương hiệu (`#bd2027`) chỉ dùng cho nút hành động chính (Primary CTA), trạng thái đang chọn (Active state), chỉ số trọng tâm và điểm nhấn thương hiệu.
  4. **Số liệu thẳng hàng tuyệt đối:** Mọi con số KPI, tiến độ, thời gian, tiền tệ đều bật `font-variant-numeric: tabular-nums`.

---

## 2. Công nghệ & Thư viện Frontend Chuẩn (Tech Stack)

Để các công cụ HacoLED có thể dùng chung code và component dễ dàng, thống nhất sử dụng bộ thư viện sau:

| Thành phần | Thư viện / Công nghệ | Phiên bản khuyến nghị | Mục đích sử dụng |
|---|---|---|---|
| **Core Framework** | `next` (App Router) + `react` | Next `^15.5` / React `^18.3` | SSR, Routing, API Routes đồng nhất |
| **Ngôn ngữ** | `typescript` | `^5.5` | Kiểm soát kiểu dữ liệu chặt chẽ |
| **Styling** | `tailwindcss` + CSS Variables | `^3.4` | Utility classes + hệ thống class chuẩn `.ui-*` |
| **Bộ biểu tượng (Icons)** | `lucide-react` | `^0.454.0` | Icon nét mảnh hiện đại, đồng bộ kích thước |
| **Biểu đồ & Đồ thị** | `recharts` | `^3.10.0` | Biểu đồ cột, đường, phễu, tròn trong báo cáo |
| **Font chữ** | `next/font/local` (Chakra Petch) | `.ttf` (`400`, `500`, `600`, `700`) | Self-host để tải tức thì, không bị giật chữ (CLS) |

Lệnh cài đặt nhanh cho dự án mới:
```bash
npm install lucide-react recharts tailwindcss postcss autoprefixer
```

---

## 3. Hệ thống Màu sắc (Color Palette & Tokens)

### 3.1. Bảng màu cốt lõi (Core CSS Variables)

Copy nguyên khối `:root` này vào đầu file `globals.css` của mọi dự án HacoLED:

```css
:root {
  /* Nền & Bề mặt (Surfaces) */
  --canvas: #f5f6fa;          /* Nền tổng thể của vùng làm việc (Workspace background) */
  --surface: #ffffff;         /* Nền thẻ Panel, Card, Bảng, Sidebar */
  --surface-subtle: #fafbfc;  /* Nền thanh công cụ phụ, dòng chẵn bảng dữ liệu */

  /* Chữ & Nội dung (Typography Ink) */
  --ink: #242936;             /* Chữ chính, tiêu đề, số liệu */
  --ink-strong: #101828;      /* Tiêu đề tài liệu lớn, chữ nhấn mạnh */
  --muted: #667085;           /* Chữ phụ, mô tả, nhãn cột, thời gian */

  /* Đường viền (Borders & Dividers) */
  --line: #e6e9ef;            /* Viền chuẩn của Panel, Card, Input, Table */
  --line-strong: #dce1ea;     /* Viền lưới bảng dữ liệu (Data Grid) */

  /* Màu Thương hiệu HacoLED (Brand Colors) */
  --red: #bd2027;             /* Đỏ HacoLED chủ đạo (Primary Brand Red) */
  --red-dark: #94171d;        /* Đỏ đậm khi hover/active */
  --red-soft: #fff0f0;        /* Nền đỏ nhạt cho trạng thái Active / Unread / Badge */
  --gold: #f4c34e;            /* Vàng kim HacoLED (chấm logo, họa tiết Đông Sơn) */
  --gold-soft: #fffaf0;       /* Nền vàng kem ấm áp cho Banner chào mừng / Tóm tắt */
  --gold-border: #f0e3c4;     /* Viền cho khối nền vàng kem */

  /* Kích thước chuẩn (Layout & Controls) */
  --sidebar: 270px;           /* Độ rộng thanh menu trái */
  --control-height: 42px;     /* Chiều cao chuẩn của Button, Input, Select */
  --panel-radius: 16px;       /* Bo góc chuẩn của Panel lớn */
}
```

### 3.2. Bảng màu Ngữ nghĩa (Semantic Status & Category Colors)

Khi hiển thị trạng thái công việc, mức độ ưu tiên, thông báo hoặc phân loại tài liệu, luôn kết hợp **nền pastel dịu + chữ đậm độ tương phản cao (WCAG AA)**:

| Ngữ cảnh / Trạng thái | Màu nền (`background`) | Màu chữ / Icon (`color`) | Màu viền (`border`) | Ứng dụng thực tế |
|---|---|---|---|---|
| **Thương hiệu / Đang chọn (Brand / Active)** | `#fff0f0` | `#bd2027` / `#94171d` | `#e8b6b8` | Menu đang mở, Đang thực hiện, Thông báo mới |
| **Thành công / Hoàn thành (Success)** | `#eaf8f0` / `#effaf3` | `#167b52` / `#187954` | `#d2eddd` | Đã hoàn thành, Đã xác nhận nắm bắt, Đạt KPI |
| **Cảnh báo / Chờ xử lý (Warning / Pending)** | `#fff6de` / `#fff7df` | `#8e6517` / `#98620d` | `#f2e3bb` | Chờ xử lý, Cần xác nhận, Sắp đến hạn |
| **Nguy hiểm / Quá hạn / Lỗi (Danger / Error)** | `#fff1f1` | `#a71d25` / `#b42318` | `#f5d3d5` | Quá hạn, Khẩn cấp, Cảnh báo lỗi, Xóa dữ liệu |
| **Thông tin / Quy trình (Info / SOP)** | `#eef4ff` | `#1d4ed8` | `#c7d7fe` | Quy trình (SOP), Độ phủ đội ngũ, Thông tin hệ thống |
| **Trung tính (Neutral / Default)** | `#f2f4f7` | `#475467` / `#657185` | `#e4e7ec` | Nhãn phụ, Phiên bản (`v1`), Trạng thái mặc định |

### 3.3. Cấu hình `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-chakra)", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#fff1f0",
          100: "#ffe0df",
          500: "#d32b33",
          600: "#bd2027",
          700: "#94171d",
          900: "#701319",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 4. Hệ thống Font chữ & Typography

### 4.1. Font chữ chủ đạo: **Chakra Petch**
Toàn bộ giao diện sử dụng duy nhất họ font **Chakra Petch** (hỗ trợ đầy đủ tiếng Việt) với 4 độ đậm:
- `400` (Regular): Văn bản nội dung, đoạn văn, ô nhập liệu.
- `500` (Medium): Mục menu, nút bấm phụ, nhãn trạng thái.
- `600` (SemiBold): Tiêu đề trang, tiêu đề bảng, tiêu đề thẻ, nút hành động chính.
- `700` (Bold): Logo, con số KPI lớn, tiêu đề bài viết/tài liệu.

**Khai báo trong `src/app/layout.tsx`:**
```tsx
import localFont from "next/font/local";

const chakra = localFont({
  src: [
    { path: "../../public/fonts/chakra-petch-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/chakra-petch-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/chakra-petch-600.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/chakra-petch-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-chakra",
  display: "swap",
});
```
*(Nếu làm công cụ HTML tĩnh độc lập không dùng Next.js, có thể nhúng từ Google Fonts: `<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&display=swap" rel="stylesheet">`)*

### 4.2. Thang đo chữ (Type Scale)

| Cấp độ | Cỡ chữ (`font-size`) | Độ đậm (`font-weight`) | Chiều cao dòng (`line-height`) | Quy tắc áp dụng |
|---|---|---|---|---|
| **Page Title (`h1`)** | `28px` (Mobile: `22px`) | `600` | `1.3` | Tiêu đề chính đầu mỗi trang (`workspace-heading h1`) |
| **Document Title** | `27px` (Mobile: `21px`) | `700` | `1.4` | Tiêu đề khi mở đọc thông báo / quy trình toàn trang |
| **KPI Metric Value** | `20px` – `28px` | `600` – `700` | `1.4` | Con số thống kê lớn, bắt buộc có `font-variant-numeric: tabular-nums` |
| **Panel / Section (`h2`)** | `16px` – `17px` | `600` | `1.6` | Tiêu đề các khung `.ui-panel` |
| **Card / Item Title (`h3`)** | `14px` – `16px` | `600` | `1.5` | Tiêu đề công việc, thẻ bài viết, tên phòng chat |
| **Document Reading Body** | `15.5px` | `400` | `1.85` | Nội dung bài viết dài, quy trình SOP (giúp đọc thoải mái) |
| **Workspace Body (Mặc định)** | `13px` – `14px` | `400` – `500` | `1.6` | Cỡ chữ chuẩn trên bảng biểu, form, nút bấm |
| **Caption / Table Header** | `11px` – `12px` | `500` – `600` | `1.5` | Tiêu đề cột bảng (`th`), mô tả phụ, thời gian |
| **Group Label / Badge** | `10px` – `11px` | `600` | `1.2` | Nhãn nhóm menu (`letter-spacing: 1.3px`, IN HOA), trạng thái pill |

---

## 5. Biểu tượng Thương hiệu, Họa tiết & Icon

### 5.1. Cụm Logo chuẩn (`Brand Lockup`)
Cụm logo ở góc trái trên cùng của Sidebar và trang Đăng nhập được dựng hoàn toàn bằng CSS + HTML (không phụ thuộc file ảnh vỡ nét):

```tsx
<a href="/admin" className="brand-lockup" aria-label="HacoLED — Trang chủ">
  <span className="brand-symbol">
    H<span>•</span>
  </span>
  <span>
    <strong>
      Haco<span className="text-brand-600">LED</span>
    </strong>
    <small>DATA WORKSPACE</small> {/* Đổi tên theo tool: CRM WORKSPACE, SURVEY HUB... */}
  </span>
</a>
```
- `.brand-symbol`: Khối vuông `42x42px`, bo góc `11px`, nền `#bd2027`, chữ `H` trắng `30px` Bold, dấu chấm tròn `•` màu vàng `#f4c34e` đặt ở góc phải dưới.
- Phụ đề `<small>`: Cỡ `9px`, in hoa, `letter-spacing: 2px`, màu `#667085`.

### 5.2. Họa tiết Trống đồng Đông Sơn (`.dongson-pattern`)
Đây là dấu ấn nhận diện riêng của HacoLED. Sử dụng file `/public/brand/dongson-original.webp` làm mặt nạ (CSS `mask`) phủ màu vàng kim `--gold`:

```css
.dongson-pattern {
  position: absolute;
  width: 420px;
  aspect-ratio: 1;
  background: var(--gold);
  mask: url("/brand/dongson-original.webp") center/contain no-repeat;
  -webkit-mask: url("/brand/dongson-original.webp") center/contain no-repeat;
  mask-mode: luminance;
  pointer-events: none;
}
```
**Vị trí đặt họa tiết Đông Sơn:**
1. **Banner chào mừng đầu trang (`.overview-greeting`):** Nền `#fffaf0`, viền `#f0e3c4`, đặt `.dongson-pattern` (`width: 280px`, `right: -100px`, `top: -125px`, `opacity: 0.25–0.35`).
2. **Thẻ ghi chú cuối Sidebar (`.sidebar-note`):** Nền `#fff9e9`, đặt `.dongson-pattern` (`width: 190px`, `right: -112px`, `top: -45px`, `opacity: 0.36`).
3. **Cột thương hiệu trang Đăng nhập (`.login-brand-panel`):** Nền đỏ đậm kết hợp vòng trống đồng vàng kim.

### 5.3. Họa tiết Lưới kỹ thuật (`.bg-os-grid`)
Dùng cho các trang tra cứu hoặc nền khung đặc biệt:
```css
.bg-os-grid {
  background-color: #f8fafc;
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### 5.4. Quy chuẩn Biểu tượng (`lucide-react`)
- **Menu điều hướng Sidebar:** `size={19}`, `strokeWidth={1.7}`.
- **Nút hành động (Button Icon):** `size={15}` hoặc `size={16}`.
- **Ô tìm kiếm & Badge nhỏ:** `size={13}` – `size={16}`.
- **Hộp Icon KPI (`.summary-icon` / `.knowledge-kpi-icon`):** Hộp vuông `44x44px` (hoặc `45x45px`), `border-radius: 12px`, bên trong đặt icon `size={20}`.
- **Trạng thái trống (`.ui-empty-icon`):** Hộp vuông `64x64px`, `border-radius: 18px`, nền `#f9fafc`, viền `1px solid #e9ecf1`, icon `size={26}`, `strokeWidth={1.5}`.

---

## 6. Quy chuẩn Bố cục & Các Component Cốt lõi

### 6.1. Bố cục Khung ứng dụng (`DashboardShell`)
- **Sidebar trái (`.app-sidebar`):**
  - Rộng `270px` cố định bên trái màn hình Desktop (`position: fixed`), nền trắng, viền phải `1px solid var(--line)`.
  - Có thể thu gọn (`.sidebar-collapsed`) xuống `84px` (chỉ hiện icon căn giữa).
  - Trên màn hình `< 1024px`, Sidebar ẩn sang trái và mở ra dạng Drawer đè lên lớp mờ `.sidebar-scrim`.
- **Thanh Topbar (`.app-topbar`):**
  - Cao `76px`, dính trên cùng (`position: sticky; top: 0; z-index: 30`), nền trắng, viền dưới `1px solid var(--line)`.
  - Gồm: Nút thu gọn Sidebar + Ô tìm kiếm nhanh chức năng (`.workspace-search`) + Chuông thông báo + Avatar & Tên/Vai trò người dùng + Nút Đăng xuất.
- **Vùng nội dung chính (`.workspace-main`):**
  - Khoảng cách lề `padding: 28px 32px` (Mobile: `18px 16px`), nền `--canvas` (`#f5f6fa`).
  - Luôn mở đầu bằng `.workspace-heading` (trái: `<h1>` + `<p>` mô tả; phải: các nút hành động + breadcrumb `HacoLED > Tên phân hệ`).

### 6.2. Khung Panel (`.ui-panel`)
Mọi bảng dữ liệu, danh sách hoặc biểu mẫu đều nằm trong `.ui-panel`:
```css
.ui-panel {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 16px; /* var(--panel-radius) */
  overflow: hidden;
}
.ui-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
}
```

### 6.3. Hệ thống Nút bấm (Buttons)
- **Primary Button (`.primary-button`):**
  - Nền `--red` (`#bd2027`), chữ `#ffffff`, `font-weight: 600`, `font-size: 13px`, `min-height: 42px`, `padding: 10px 16px`, `border-radius: 9px`.
  - Hover: nền `--red-dark` (`#94171d`).
- **Secondary Button (`.secondary-button`):**
  - Nền `#ffffff`, viền `1px solid #d7dce4`, chữ `--ink` (`#242936`), `font-weight: 500`, `font-size: 13px`, `min-height: 42px`, `padding: 10px 14px`, `border-radius: 9px`.
  - Hover: viền `--red`, chữ `--red`, nền `#fff9f8`.
- **Compact Button (`.compact`):**
  - Dùng trong dòng bảng hoặc góc thẻ: `min-height: 32px`, `padding: 5px 10px`, `font-size: 11px`, `border-radius: 7px`.
- **Icon Button (`.icon-button`):**
  - Nút vuông `38x38px` (hoặc `32x32px` trong bảng), `border-radius: 8px`, viền `1px solid var(--line)`, nền trắng, căn giữa icon.

### 6.4. Ô nhập liệu & Biểu mẫu (Inputs, Selects, Textareas)
- Chiều cao tối thiểu `42px` – `44px`, `padding: 10px 12px`, `border: 1px solid #d7dce4`, `border-radius: 8px` – `9px`, `background: #ffffff`, `font-size: 13px`.
- Con trỏ nhập liệu: `caret-color: var(--red)`.
- Khi Focus:
  ```css
  input:focus, select:focus, textarea:focus {
    outline: 2px solid #bd202726;
    border-color: var(--red);
  }
  ```

### 6.5. Quy tắc Hiển thị Chi tiết (Drawer vs Full-Page Reader)
- **Dùng Side Drawer (`.ui-drawer`, rộng `560px` – `820px`) khi:**
  - Tạo mới / chỉnh sửa nhanh một bản ghi (công việc, kênh, chỉ tiêu KPI, bài đăng).
  - Xem danh sách thông báo chuông.
- **Dùng Trang đọc Toàn màn hình (`.knowledge-document-paper`, rộng toàn khung chính) khi:**
  - Hiển thị nội dung tài liệu, thông báo, quy trình SOP, báo cáo phân tích dài hoặc bảng nhiều cột để đảm bảo không gian trình bày rộng rãi, rõ ràng.

---

## 7. Tiêu chuẩn Trải nghiệm, Đa thiết bị & Khả năng truy cập (UX & A11y)

1. **Ngôn ngữ giao diện:** 100% tiếng Việt rõ nghĩa, ngắn gọn, dùng thuật ngữ vận hành thực tế (tránh trộn lẫn tiếng Anh trừ các từ viết tắt chuyên ngành như `KPI`, `SOP`, `CRM`, `Lead`, `SEO`).
2. **Định dạng thời gian & múi giờ:** Luôn format theo chuẩn Việt Nam (`vi-VN`, `timeZone: "Asia/Ho_Chi_Minh"`, định dạng `dd/mm/yyyy, HH:mm`).
3. **Bàn phím & Focus (`Accessibility`):**
   - Mọi nút chỉ có icon (`.icon-button`) bắt buộc phải có `aria-label="..."` bằng tiếng Việt.
   - Modal/Drawer khi mở phải khóa cuộn nền (`overflow: hidden`), tự động focus vào phần tử đầu tiên, hỗ trợ bấm phím `Escape` để đóng và giữ vòng lặp phím `Tab` bên trong.
4. **Responsive Breakpoints chuẩn:**
   - `<= 1200px`: Các thanh công cụ (Toolbar) tự động xuống dòng (`flex-wrap: wrap`).
   - `<= 1023px`: Sidebar chuyển thành menu trượt (Off-canvas drawer), Topbar hiện nút Hamburger (`Mở menu`).
   - `<= 960px`: Lưới KPI 3–4 cột chuyển về 1–2 cột; khoảng đệm trang tài liệu thu gọn vừa màn hình.
   - `<= 640px`: Bảng dữ liệu hỗ trợ cuộn ngang mượt hoặc chuyển sang bố cục thẻ dọc trên điện thoại.

---

## 8. Tiêu chuẩn Trình quản lý Hiện đại (Lấy cảm hứng từ Twenty CRM / Linear)

1. **Hộp lệnh Tìm kiếm & Thao tác nhanh Toàn cục (`⌘K` / `Ctrl+K` Command Palette):**
   - Tích hợp nút kích hoạt `⌘K` (`.cmd-trigger-pill`) ngay trong thanh tìm kiếm Topbar và lắng nghe phím tắt `Cmd+K` / `Ctrl+K` trên toàn ứng dụng.
   - Cho phép nhảy nhanh tới bất kỳ công việc, tài liệu quy trình/thông báo, phân hệ chức năng hoặc chạy thao tác nhanh (*Tạo công việc mới*, *Mở Table View*, *Mở Kanban*) bằng phím mũi tên `↑` `↓` và `Enter`.
2. **Thao tác Nhanh Trực tiếp trên Dòng & Tổng kết Chân bảng (Inline Row Actions & Table Footer Aggregation):**
   - Trong chế độ Bảng (`Table`) và Danh sách (`List`), tích hợp cụm nút chấm điểm nhanh **✓ Đạt / ✕ Chưa đạt** (`.inline-review-group`) ngay trên từng dòng để Leader đánh giá chỉ với 1 cú click mà không cần mở Drawer.
   - Chân bảng dữ liệu (`tfoot.work-table-tfoot`) luôn cố định (`sticky bottom`) hiển thị các chỉ số tổng hợp trực tiếp: *Tổng số công việc*, *Số việc gắn kênh*, *Số nhân sự*, *Số việc quá hạn*, *Tổng sản lượng thực tế / kế hoạch*, *% Hoàn thành*, và *Tổng kết ✓ Đạt / ✕ Chưa đạt*.
3. **Drawer Chi tiết Đồng bộ & Bảng Thuộc tính 2 Cột (Unified Brief & Property Grid):**
   - Khung Drawer rộng `620px` trên Desktop.
   - Phần **Đề bài & Yêu cầu công việc** (`.task-brief-summary`) trình bày dạng thẻ dọc rộng 100% chiều ngang (`flex-direction: column`), căn trái toàn bộ tiêu đề và nội dung, đồng nhất giữa góc nhìn của Leader và Nhân viên.
   - Phần thông tin phân công (`.task-meta-list`) trình bày theo chuẩn **Property Grid 2 cột** (`grid-template-columns: 150px 1fr`, viền ngang mảnh `#f2f4f7`).

---

## 9. Prompt Mẫu để Dựng Giao diện Tool Mới Đồng bộ với HacoLED

Khi bạn tạo một dự án hoặc yêu cầu AI code một Tool mới cho HacoLED, bạn chỉ cần đính kèm file `DESIGN_SYSTEM.md` này hoặc dán đoạn Prompt sau:

```markdown
Hãy thiết kế và code giao diện theo đúng tiêu chuẩn HacoLED Design System (DESIGN_SYSTEM.md):
- Giao diện sáng (Light Workspace): nền trang #f5f6fa (--canvas), thẻ trắng #ffffff (--surface), viền mảnh 1px solid #e6e9ef (--line), bo góc panel 16px.
- Màu thương hiệu HacoLED: Đỏ chủ đạo #bd2027 (--red), Đỏ đậm #94171d (--red-dark), Vàng kim #f4c34e (--gold), chữ chính #242936 (--ink), chữ phụ #667085 (--muted).
- Font chữ duy nhất: Chakra Petch (400, 500, 600, 700), bật tabular-nums cho mọi con số thống kê.
- Sử dụng bộ icon lucide-react (size 16-20, strokeWidth 1.7).
- Bố cục gồm Sidebar trái 270px (có cụm logo chữ H nền đỏ chấm vàng và thẻ ghi chú nền vàng kem #fff9e9 kèm họa tiết trống đồng Đông Sơn), Topbar 76px và vùng nội dung chính có KPI Summary Strip + Panel dữ liệu.
- Toàn bộ nhãn, nút bấm, trạng thái và thông báo lỗi hiển thị 100% bằng tiếng Việt chuẩn mực.
```
