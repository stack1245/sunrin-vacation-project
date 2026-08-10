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

const BROWSER_EXTENSION_ATTRIBUTE_CLEANUP_SCRIPT = `
(() => {
  const processedAttributePattern =
    /^processed_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const isExtensionAttribute = (attributeName) =>
    attributeName === "bis_skin_checked" ||
    attributeName === "bis_register" ||
    processedAttributePattern.test(attributeName);

  const cleanElement = (element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (isExtensionAttribute(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  };

  const cleanTree = (node) => {
    if (!(node instanceof Element)) {
      return;
    }

    cleanElement(node);
    node.querySelectorAll("*").forEach(cleanElement);
  };

  cleanTree(document.documentElement);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName &&
        isExtensionAttribute(mutation.attributeName) &&
        mutation.target instanceof Element
      ) {
        mutation.target.removeAttribute(mutation.attributeName);
      }

      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(cleanTree);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  window.addEventListener(
    "load",
    () => {
      cleanTree(document.documentElement);
      window.setTimeout(() => observer.disconnect(), 0);
    },
    { once: true },
  );
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          id="browser-extension-attribute-cleanup"
          dangerouslySetInnerHTML={{
            __html: BROWSER_EXTENSION_ATTRIBUTE_CLEANUP_SCRIPT,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
