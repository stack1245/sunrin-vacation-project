"use client";

import dynamic from "next/dynamic";

// 💡 방금 만드신 컴포넌트의 실제 경로로 수정해 주세요!
// 예: "@/components/MathdokuGameHost"
const MathdokuGameHost = dynamic(
  () => import("@/components/stages/ResourceGameHost"), 
  { 
    ssr: false, // 서버 사이드 렌더링 비활성화 (Phaser 필수 설정)
    loading: () => <div className="flex h-[600px] w-[600px] items-center justify-center text-white bg-[#333333]">게임 로딩 중...</div>
  }
);

export default function MathdokuPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-8">
      
      {/* 게임이 들어갈 컨테이너 테두리 꾸미기 (옵션) */}
      <div className="overflow-hidden rounded-xl border-4 border-zinc-700 shadow-2xl">
        <MathdokuGameHost />
      </div>
    </main>
  );
}