import type { Metadata } from "next";
import { headers } from "next/headers";

import { AppProvider, Header } from "@/components/common";

import "./globals.css";

const siteDescription =
  "흩어진 단서를 모으고 제한된 시도 안에 사건의 진실을 밝혀내는 방탈출 웹 게임.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const socialImageUrl = new URL("/og.png", origin).toString();

  return {
    title: {
      default: "The Escape",
      template: "%s | The Escape",
    },
    description: siteDescription,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title: "The Escape",
      description: siteDescription,
      images: [
        {
          url: socialImageUrl,
          width: 1728,
          height: 904,
          alt: "The Escape — Interactive Mystery Archive",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "The Escape",
      description: siteDescription,
      images: [socialImageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        style={
          {
            "--font-ui":
              '"Pretendard Variable", Pretendard, Inter, system-ui, sans-serif',
            "--font-display": 'Georgia, "Times New Roman", serif',
          } as React.CSSProperties
        }
      >
        <AppProvider>
          <Header />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
