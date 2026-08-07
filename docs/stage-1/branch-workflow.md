# Stage 1 역할별 브랜치·worktree 운영 가이드

> 기준일: 2026-08-08
>
> 통합 대상: `develop/stage-1`
>
> 공통 기준: A 파트 `feat/stage-1/10320`

## 1. 운영 원칙

Stage 1은 저장소 루트의 단일 Next.js 프로젝트로 개발한다. 학번별 프로젝트 폴더를 복제하지 않으며, 여섯 역할은 A 공통 Phaser 기반에서 분기한 독립 브랜치와 worktree를 사용한다.

```text
develop/stage-1
  └─ feat/stage-1/10320  ← 공통 프로젝트·Phaser 기반
       ├─ feat/stage-1/10404
       ├─ feat/stage-1/10409
       ├─ feat/stage-1/10514
       ├─ feat/stage-1/10602
       └─ feat/stage-1/10405
```

B~F 브랜치는 A 공통 기준 커밋을 포함한다. 통합할 때는 A 브랜치를 먼저 `develop/stage-1`에 반영한 뒤 B~F를 반영해야 공통 구조가 중복되거나 충돌하지 않는다. Pull Request 생성·병합은 별도 승인 후 수행한다.

기존 `dev/stage-1`은 같은 커밋을 가리키는 `develop/stage-1`로 대체해 제거했다. 이전 `feat/stage-1` 통합 이력과 공용 `assets` 브랜치의 고유 이력은 각각 `archive/feat-stage-1-legacy-20260808`, `archive/assets-legacy-20260808` 태그로 보존한 뒤 활성 브랜치에서 제거했다. 신규 작업은 이 문서의 통합·역할 브랜치에서만 진행한다.

역할별 브랜치와 worktree 이름은 `feat/stage-1/학번` 형식만 사용한다. 담당 역할은 문서와 코드 소유 경계에서 관리하고 브랜치·폴더 이름에는 넣지 않는다.

## 2. 역할·담당자·브랜치

| 파트 | 담당자 | 담당 범위 | 브랜치 | worktree |
| --- | --- | --- | --- | --- |
| A | 10320 탁도형 | 공통 Phaser, Room 계약, 진행도·저장, HUD, 통합 주도 | `feat/stage-1/10320` | `github/feat/stage-1/10320` |
| B | 10404 김준서 | 연구소 외부, 입구, 중앙 복도, 키카드, 최종 탈출 | `feat/stage-1/10404` | `github/feat/stage-1/10404` |
| C | 10409 서정권 | 연구 자료실, 카이사르·비즈네르 암호, 실험실 단서 | `feat/stage-1/10409` | `github/feat/stage-1/10409` |
| D | 10514 이동혁 | 과학 실험실, 화학·밀도·산소·점화·가열 퍼즐 | `feat/stage-1/10514` | `github/feat/stage-1/10514` |
| E | 10602 김보민 | 보안 통제실, 가상 F12·Cookie·Console·OTP | `feat/stage-1/10602` | `github/feat/stage-1/10602` |
| F | 10405 김지산 | 문서 보관실, hello world·스도쿠·N-Queens·자원 분배·기밀 문서 | `feat/stage-1/10405` | `github/feat/stage-1/10405` |

모든 경로의 기준 루트는 `D:/.dev/school/sunrin/방학 프로젝트/OutOfBounds/`다.

## 3. 코드 소유 경계

| 소유자 | 직접 수정하는 기본 경로 | 규칙 |
| --- | --- | --- |
| A | `src/game/stage-one/contracts/**`, `src/game/stage-one/core/**`, `src/game/stage-one/progressBridge.ts`, `src/components/stages/StageOneGameHost.tsx`, 진행도·저장 계약 | 공통 계약 변경을 검토하고 B~F 통합을 조립한다. |
| B | `src/game/stage-one/rooms/outside/**`, `rooms/entrance/**`, `rooms/hallway/**`, 해당 에셋·테스트 | 외부 탈출은 F의 기밀 문서 플래그와 A의 `completeEscape()`를 사용한다. |
| C | `src/game/stage-one/rooms/archive/**`, `src/game/stage-one/puzzles/archive/**`, 해당 에셋·테스트 | 성공 후 `archiveClueFound`만 공통 API로 갱신한다. |
| D | `src/game/stage-one/rooms/science-lab/**`, `src/game/stage-one/puzzles/science-lab/**`, 해당 에셋·테스트 | 성공 후 `scienceLabPuzzleSolved`만 공통 API로 갱신한다. |
| E | `src/game/stage-one/rooms/control-room/**`, `src/game/stage-one/puzzles/control-room/**`, 해당 에셋·테스트 | 성공 후 통제실·보관실 해금 플래그를 공통 API로 갱신한다. |
| F | `src/game/stage-one/rooms/document-storage/**`, `src/game/stage-one/puzzles/document-storage/**`, 해당 에셋·테스트 | 기밀 문서 획득까지만 저장하고 최종 탈출은 B에 연결한다. |

경로가 아직 없으면 담당 브랜치에서 필요한 최소 디렉터리와 파일을 만든다. 다른 파트의 소유 파일이나 A 공통 계약을 직접 바꿔야 한다면 먼저 변경 이유와 필요한 API를 A에게 전달한다. Phaser·Room·퍼즐 코드에서 Supabase를 직접 import하지 않는다.

## 4. 작업 시작과 종료

작업 시작 전 현재 worktree, 브랜치, 원격 추적 브랜치와 미커밋 변경을 확인한다. 다른 worktree의 변경을 복사해 덮어쓰지 않고, 공통 기반 갱신은 담당 브랜치의 커밋 단위로 반영한다.

작업을 마칠 때는 담당 기능 테스트와 아래 공통 검사를 실행한다.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

커밋 메시지는 `feat(학번): 한글 설명` 형식을 사용한다. 관련 파일만 커밋하고 현재 역할 브랜치와 같은 이름의 원격 브랜치로 push한다. force push, 임의 rebase, 다른 역할 브랜치 병합, `develop/stage-1` 또는 `main` 직접 병합은 하지 않는다.

## 5. 통합 순서

1. A 공통 기반을 먼저 검증하고 `develop/stage-1` 반영 대상으로 확정한다.
2. B~F는 A 기준 커밋 위에서 담당 Room·퍼즐을 완성한다.
3. 각 파트가 테스트, 타입 검사, 린트, 빌드 결과와 알려진 제한을 A에게 전달한다.
4. A 반영 후 B→C→D→E→F 순서로 충돌과 진행 플래그를 확인한다.
5. 신규 시작, 이어하기, 저장 실패 재시도, 기밀 문서 획득, 외부 탈출, Stage 2 해금을 통합 검증한다.

이 순서는 브랜치 병합 승인 자체를 의미하지 않는다. 실제 Pull Request 생성과 병합은 팀 합의 또는 별도 요청이 있을 때 수행한다.
