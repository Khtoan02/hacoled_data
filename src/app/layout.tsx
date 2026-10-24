import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HACOLED | MARKETING BASE • Đặc tả Nghiệp vụ & Dữ liệu v1.0",
  description:
    "Hệ thống thiết kế và vận hành HacoLED Marketing Base v1.0 (24/10/2026): 12 phân hệ, 58 công việc, 37 bảng logic, 402 trường, 83 chỉ số, 24 ca kiểm thử.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
