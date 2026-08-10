"use client";

import dynamic from "next/dynamic";

// Phaser는 브라우저에서만 초기화한다.
const MathdokuGameHost = dynamic(
  () => import("@/components/stages/MathdokuGameHost"),
  {
    ssr: false,
  },
);

export default function MathdokuPreviewPage() {
  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#2d2d2d",
        display: "flex",
        height: "100vh",
        justifyContent: "center",
      }}
    >
      <MathdokuGameHost />
    </div>
  );
}
