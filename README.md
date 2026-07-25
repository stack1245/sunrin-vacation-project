# OutOfBounds

스토리 라인을 따라 스테이지별로 진행하는 웹 방탈출 게임 플랫폼의 초기 스캐폴딩입니다.

## 기술 스택

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Zustand
- Supabase JavaScript Client

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에 다음 값을 설정해 주세요.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 주요 구조

```text
src/
├── app/
│   ├── leaderboard/
│   └── stages/[id]/
├── components/
│   ├── common/
│   └── game/
├── lib/
├── store/
└── types/
```

인게임 퍼즐 영역은 실제 기획 로직을 연결하기 위한 플레이스홀더입니다. `PuzzleArea`를 스테이지별 퍼즐 컴포넌트로 교체하고, 공통 진행 상태는 `useGameStore`에 확장할 수 있습니다.

## 확인 명령

```bash
npm run lint
npx tsc --noEmit
npm run build
```
