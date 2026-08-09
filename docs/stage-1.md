# Stage 1 공통 개발 계약

이 문서는 Stage 1의 역할, 모듈 경계, Room 등록, 진행도 저장, 브랜치 운영과 검증 기준을 한곳에 모은 공통 계약이다. 파트별 구현 세부 내용은 코드와 완료 브랜치의 `기능2A_handoff.md`를 기준으로 한다.

## 1. 역할과 브랜치

| 파트 | 담당 영역 | 담당자 | 작업 브랜치 |
| --- | --- | --- | --- |
| A | 공통 Phaser 기반, Room 조립, 진행도·저장, 통합·QA | 10320 박도현 | `feat/stage-1/A_10320` |
| B | 연구소 외부·입구·중앙 복도 | 10404 김준서 | `feat/stage-1/B_10404` |
| C | 연구 자료실 | 10409 서정권 | `feat/stage-1/C_10409` |
| D | 과학 실험실 | 10514 이동혁 | `feat/stage-1/D_10514` |
| E | 보안 통제실 | 10602 김보민 | `feat/stage-1/E_10602` |
| F | 문서 보관실과 최종 탈출 | 10405 김지산 | `feat/stage-1/F_10405` |

통합 대상은 `develop/stage-1`이고 배포 기준은 `main`이다. 기능 브랜치는 서로 직접 병합하지 않는다.

## 2. worktree와 Pull Request

브랜치와 작업 폴더의 계층을 동일하게 유지한다.

```text
github/main                         → main
github/develop/stage-1              → develop/stage-1
github/feat/stage-1/A_10320           → feat/stage-1/A_10320
github/feat/stage-1/B_10404           → feat/stage-1/B_10404
github/feat/stage-1/F_10405           → feat/stage-1/F_10405
github/feat/stage-1/C_10409           → feat/stage-1/C_10409
github/feat/stage-1/D_10514           → feat/stage-1/D_10514
github/feat/stage-1/E_10602           → feat/stage-1/E_10602
```

- 자신의 worktree와 브랜치에서만 구현한다.
- 작업 전 원격 상태와 미커밋 변경을 확인하고 가능한 경우에만 fast-forward로 동기화한다.
- 기능 완료 후 `develop/stage-1`을 대상으로 Pull Request를 생성한다.
- 공통 타입, 저장 계약, Room 조립 지점의 변경은 A 파트 검토를 받는다.
- 커밋 메시지는 `feat: 한글 설명`, `fix: 한글 설명`, `refactor: 한글 설명`, `docs: 한글 설명` 형식을 사용한다.
- 강제 push, 임의 rebase, 임의 merge, 다른 담당자의 변경 덮어쓰기를 금지한다.

## 3. 실행 구조와 의존성 방향

```text
Next.js StageEntryView
  → Supabase 진행도 어댑터
  → StageOneGameHost
  → createStageOneGame
  → createStageOneRooms
  → 파트별 StageOneRoomModule
```

의존성은 화면과 외부 인프라에서 게임 계약 방향으로만 흐른다.

| 영역 | 책임 | 금지 사항 |
| --- | --- | --- |
| `app`, `components` | 화면, 인증 상태, HUD, Phaser 호스트 | Room 내부 퍼즐 상태 직접 관리 |
| `src/game/stage-one/core` | 공통 Scene, 입력, 이동, 충돌, Room 계약 | 파트별 정답과 연출 하드코딩 |
| `src/game/stage-one/rooms` | Room 조립과 파트별 Room 모듈 | Supabase 직접 호출 |
| `src/game/stage-one/puzzles` | 순수 퍼즐 규칙과 판정 | UI와 저장소 직접 참조 |
| `src/features/stage-one` | 진행도 애플리케이션 서비스와 어댑터 | Phaser 객체 직접 소유 |
| `src/infra` | Supabase 구현과 외부 연결 | 게임 진행 규칙 결정 |

파트별 Room은 공통 계약을 구현하고, A 파트가 `createStageOneRooms`에서 최종 등록 순서와 연결을 관리한다.

## 4. Room 계약

각 `StageOneRoomModule`은 다음 책임을 가진다.

- 고유 `id`, 표시 이름, 월드 경계와 플레이어 시작 위치 제공
- 정적 충돌체와 상호작용 지점 등록
- `enter`, `exit`, `destroy` 생명주기에서 리소스 정리
- 공통 상호작용 컨텍스트를 통해 HUD, 모달, 플래그 저장 요청
- 다른 Room의 내부 구현을 직접 가져오지 않고 공개된 플래그와 전환 계약만 사용

Room 추가 시 공통 코어를 복제하지 않는다. 퍼즐 판정은 가능한 한 순수 함수로 분리하고, Phaser 코드는 표시와 입력 전달에 집중한다.

## 5. 진행도와 저장 계약

Stage 1 진행 상태는 `src/types/stage-one.ts`의 타입과 정규화 함수를 단일 기준으로 사용한다. 현재 저장 형식 버전은 `2`이다.

핵심 플래그의 진행 순서는 다음과 같다.

```text
키카드 획득
  → 연구소 입장
  → 연구 자료실 해결
  → 과학 실험실 해결
  → 보안 통제실 해결
  → 문서 보관실 해결
  → 기밀 문서 획득
  → Stage 1 완료
```

- 파트 코드는 새로운 저장 필드를 임의로 추가하지 않고 A 파트에 계약 변경을 요청한다.
- 저장은 전체 상태 덮어쓰기 대신 공통 패치·큐 계약을 사용한다.
- 불러온 값은 정규화한 뒤 사용하고, 누락되거나 오래된 값은 안전한 기본값으로 보정한다.
- 퍼즐 완료 플래그는 성공 판정과 함께 한 번만 저장하고 재입장 시 복구한다.
- 실패한 저장은 화면을 멈추게 하지 말고 공통 오류 처리와 재시도 정책에 맡긴다.

## 6. 입력과 모달

- 이동 키는 `WASD`와 방향키, 상호작용은 `E`, 모달 닫기는 `ESC`를 기본으로 한다.
- 모달이 열려 있으면 Phaser 이동과 상호작용 입력을 잠근다.
- 입력 잠금은 공통 컨텍스트를 통해 처리하며 Room이 전역 키보드 상태를 직접 제어하지 않는다.
- Room을 나가거나 게임을 종료할 때 이벤트 리스너, 타이머, DOM 모달을 정리한다.

## 7. 인수인계 규칙

완료된 파트는 자신의 브랜치 `docs` 폴더에 `기능2A_handoff.md` 형식으로 문서를 남긴다.

```text
docs/B2A_handoff.md
docs/C2A_handoff.md
docs/D2A_handoff.md
docs/E2A_handoff.md
docs/F2A_handoff.md
```

인수인계서에는 다음 내용만 포함한다.

1. 브랜치, 담당자, 완료 범위와 남은 작업
2. A가 등록하거나 검토해야 할 공개 진입점
3. 사용한 진행도 플래그와 다음 파트가 소비할 값
4. 주요 파일과 테스트 파일
5. 재현 가능한 QA 동선과 퍼즐 정답
6. 실행한 검증 명령과 알려진 제한 사항

구현과 맞지 않는 오래된 요청, 개인 메모, 중복 명세는 남기지 않는다.

## 8. 완료 기준

```text
npm test
npm run env:check
npm run typecheck
npm run lint
npm run build
```

모든 명령이 통과하고 다음 항목을 확인해야 파트 완료로 본다.

- 새 Room과 퍼즐이 공통 계약을 벗어나지 않는다.
- 저장 후 새로고침과 재입장에서 진행 상태가 복구된다.
- 모달이 열린 동안 이동과 상호작용이 차단된다.
- 다른 파트의 테스트와 빌드를 깨뜨리지 않는다.
- 실제 환경변수나 비밀정보가 커밋 대상에 포함되지 않는다.
- 인수인계 문서와 Pull Request 설명이 현재 코드와 일치한다.
