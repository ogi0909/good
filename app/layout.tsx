import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "영양제 타임라인 가이드",
  description: "개인 맞춤형 영양제 충돌 방지 및 복용 타임라인 SPA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
