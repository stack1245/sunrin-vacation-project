import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "OutOfBounds",
  description: "경계 밖으로 나아가는 스토리형 웹 방탈출 게임",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#030708",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
