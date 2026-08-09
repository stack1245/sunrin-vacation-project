"use client";

import dynamic from 'next/dynamic';

// Next.js의 서버 사이드 렌더링(SSR) 과정에서 Phaser가 에러를 내지 않도록
// 브라우저에서만 로드하도록 설정 (ssr: false)
const NQueenGame = dynamic(() => import('../components/test'), {
    ssr: false,
});

export default function NQueenTestPage() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#2d2d2d' }}>
            {/* Phaser 게임 렌더링 */}
            <NQueenGame />
        </div>
    );
}