import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import { Header } from "@/components/common/Header";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost =
    requestHeaders.get("x-forwarded-host")?.split(",")[0].trim() ?? "";
  const rawHost = forwardedHost || requestHeaders.get("host") || "";
  const host = /^[a-zA-Z0-9.-]+(?::\d+)?$/.test(rawHost)
    ? rawHost
    : "localhost:3000";
  const forwardedProtocol =
    requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim() ?? "";
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : host.startsWith("localhost")
        ? "http"
        : "https";
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: "OutOfBounds",
      template: "%s | OutOfBounds",
    },
    description:
      "Break the limits, escape the story. 단계별 스토리를 돌파하는 웹 방탈출 플랫폼.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "OutOfBounds",
      description: "Break the limits, escape the story",
      type: "website",
      images: [{ url: socialImage, alt: "OutOfBounds" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "OutOfBounds",
      description: "Break the limits, escape the story",
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
