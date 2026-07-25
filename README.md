# The Escape

Next.js App Router 기반 방탈출 웹 게임 플랫폼의 초기 뼈대입니다. 스테이지
선택, 인게임 퍼즐, 인벤토리, 타이머, 시도 횟수, 리더보드 화면이 연결되어
있습니다.

## 기술 스택

- Next.js 16 (App Router, Next.js 14+ 요구사항 충족)
- TypeScript
- Tailwind CSS 4
- Zustand
- Supabase JavaScript Client

## 시작하기

```bash
npm install
npm run dev
```

Supabase를 연결하려면 `.env.example`을 `.env.local`로 복사하고 아래 값을
입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

환경 변수가 없어도 UI 스캐폴딩은 로컬에서 실행됩니다.

## 주요 구조

```text
src/
├── app/                 # 랜딩, 스테이지, 인게임, 리더보드 라우트
├── components/
│   ├── common/          # 공통 헤더, 내비게이션, 모달, Provider 진입점
│   └── game/            # 게임 헤더, 퍼즐 영역, 인벤토리
├── lib/                 # Supabase 클라이언트
├── store/               # Zustand 게임 전역 상태
└── types/               # 게임 도메인 타입
```

## 확인 명령

```bash
npx tsc --noEmit
npm run build
npm test
```
