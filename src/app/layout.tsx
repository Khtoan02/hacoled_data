import type { Metadata,Viewport } from "next";
import "./globals.css";
import localFont from "next/font/local";
const chakra = localFont({
  src: [
    { path: "../../public/fonts/chakra-petch-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/chakra-petch-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/chakra-petch-600.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/chakra-petch-700.ttf", weight: "700", style: "normal" },
  ], variable: "--font-chakra", display: "swap",
});

export const viewport:Viewport={themeColor:"#bd2027"};

export const metadata: Metadata = {
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,title:"HacoLED Data",statusBarStyle:"default"},
  icons:{apple:"/icon.png"},
  title: "HacoLED Data | Marketing Workspace",
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
      <body className={`${chakra.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
