# C2A 인수인계 --- Stage 1 · 연구 자료실 암호 퍼즐 및 후속 단서

## 1. 기본 정보

  -----------------------------------------------------------------------
  항목                                내용
  ----------------------------------- -----------------------------------
  기획 차수                           1차

  개발 단계                           `stage-1`

  담당 파트                           C

  담당 영역                           연구 자료실 암호 퍼즐과 과학
                                      실험실·문서 보관실 후속 단서

  담당자                              10409

  작업 브랜치                         `feat/stage-1/C-10409`

  원격 추적 브랜치                    확인 필요

  통합 대상                           `develop/stage-1`

  기능 구현 기준 커밋                 확인 필요

  최종 확인일                         2026-08-10

  구현 상태                           완료

  PR 상태                             확인 필요

  PR                                  없음 / 확인 필요
  -----------------------------------------------------------------------

## 2. 인계 결론

  -----------------------------------------------------------------------
  항목                                내용
  ----------------------------------- -----------------------------------
  A 통합 판정                         조건부 통합

  A가 해야 할 작업                    C의 `archive` Room을 Stage 1 실제
                                      Room 조립 구조에 연결하고, A의
                                      `StageOneProgressBridge`와 C 완료
                                      콜백을 연결

  차단 요인                           현재 대화·파일 자료만으로 원격
                                      브랜치, 최종 커밋, PR 상태와 최종
                                      통합 등록 상태는 확인할 수 없음

  통합 후 필수 회귀 확인              중앙 복도 → 연구 자료실 → 카이사르
                                      → 비즈네르 → 과학 실험실 단서 확인
                                      → 과학 실험실 진입 → 이후 D/E/F
                                      연계
  -----------------------------------------------------------------------

C 파트의 연구 자료실 기능 자체는 구현 완료 상태이며, 기존 개발 과정에서
타입 체크도 오류 없이 통과한 기록이 있다. 다만 현재 A 통합 브랜치에
실제로 등록된 상태와 최종 Git/PR 상태는 이 인수인계 자료만으로 확정할 수
없으므로 `확인 필요`로 남긴다.

기획상 Stage 1은 A가 B → C → D → E → F 순서로 통합하고 저장·이어하기 및
전체 E2E를 검증하는 구조다. fileciteturn6file15

## 3. 완료 범위

-   `archive` 연구 자료실 Room 구현
-   연구 자료실 접근 조건 확인
-   카이사르 암호를 첫 번째 활성 퍼즐로 제공
-   카이사르 성공 전 비즈네르 퍼즐 비활성화
-   비즈네르 암호 입력·검증
-   입력 정규화 및 오답 처리
-   비즈네르 성공 후 과학 실험실 장치 단서 제공
-   같은 완료 흐름에서 문서 보관실용 `%$#@!` 순서 단서 제공
-   C 완료 상태 `archiveClueFound`와 연결되는 콜백 구조
-   `StageOneSaveState` / `StageOneProgressBridge` 계약에 맞춘 구조
-   Room 및 암호 퍼즐 단위 테스트
-   A 공통 게임 구조 없이 독립 확인할 수 있는 `/dev/archive-test` 테스트
    페이지 구성

C 파트의 공식 포함 범위는 연구 자료실 탐색, 두 암호, D/F용 후속 단서,
완료 상태 저장과 재입장 시 단서 재확인이다. 과학 실험실 장치 자체와 문서
보관실 기호 퍼즐 자체는 C 범위에서 제외된다. fileciteturn5file0

## 4. 미완료·제외 범위

-   과학 실험실의 실제 장치 퍼즐 구현은 D 담당
-   보안 코드 생성은 D 담당
-   보안 통제실 퍼즐 및 문서 보관실 해금은 E 담당
-   문서 보관실 최종 기호 퍼즐은 F 담당
-   C가 `scienceLabPuzzleSolved`, `controlRoomSolved` 등의 다른 파트
    완료 플래그를 직접 변경하지 않음
-   C가 Supabase를 직접 호출하지 않음
-   C가 공통 저장 타입·이벤트·DB/RPC/migration을 독자적으로 변경하지
    않음
-   중간 퍼즐 진행을 위한 별도 서버 저장 필드는 추가하지 않음

현재 저장 계약에는 방별 하위 퍼즐 중간 진행 필드가 없으므로, 미완료
상태에서 재접속하면 해당 Room의 시작 상태로 복귀하는 것이 기본 계약이다.
fileciteturn5file8

## 5. 공개 통합 계약

### 5.1 공개 진입점

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  구분       ID·이름     공개 심벌              import 경로                                    구현 파일                                           진입 조건                  복귀 대상
  ---------- ----------- ---------------------- ---------------------------------------------- --------------------------------------------------- -------------------------- -------------
  Room       `archive` / `createArchiveRoom`    `@/game/stage-one/rooms/archive/archiveRoom`   `src/game/stage-one/rooms/archive/archiveRoom.ts`   `entranceUnlocked=true`,   기존 Room
             연구 자료실                                                                                                                           `currentRoom=archive`      구조에 따름

  게임 조립  Stage 1     `createStageOneGame`   `@/game/stage-one/core/createStageOneGame`     `src/game/stage-one/core/createStageOneGame.ts`     `initialProgress`,         호출자가
  API        Phaser Host                                                                                                                           `bridge`, `events` 필요    `destroy()`
                                                                                                                                                                              등으로 관리
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

`createArchiveRoom`은 독립 테스트 페이지에서 실제 import되어
`createStageOneGame({ rooms: [createArchiveRoom(), ...] })`에 전달된
기록이 있다. `createStageOneGame` 역시 실제 export 및 import 경로가
확인된다. fileciteturn8file13 fileciteturn8file14

### 5.2 A 조립 지점

  --------------------------------------------------------------------------------------
  항목                                내용
  ----------------------------------- --------------------------------------------------
  조립 파일                           `src/game/stage-one/core/createStageOneGame.ts`,
                                      `src/game/stage-one/core/referenceRooms.ts`

  현재 등록 상태                      확인 필요

  필요한 변경                         실제 A의 Stage 1 Room 조립 구조에서 `archive`
                                      Room을 `createArchiveRoom()`으로 연결

  충돌 주의                           Room ID `archive` 유지. `StageOneRoomId` 및 공통
                                      이벤트/저장 계약을 임의 변경하지 않음
  --------------------------------------------------------------------------------------

현재 `createStageOneGame`은 기본적으로
`createStageOneReferenceRooms()`를 사용하며, 별도의 `rooms` 배열을
전달할 수도 있는 구조다. C 독립 테스트에서는 `createArchiveRoom()`을
명시적으로 전달하는 방식으로 검증했다. fileciteturn8file10

따라서 A 통합 시에는 **독립 테스트용 `rooms: [createArchiveRoom(), ...]`
구조를 그대로 제품 코드에 복사하기보다, A가 소유하는 실제 Room
composition root에 `archive`를 한 번 등록하는 것**이 기준이다.

## 6. 진행도·파트 간 계약

  --------------------------------------------------------------------------------------
  플래그·이벤트              구분           생산자         소비자         저장·사용 시점
  -------------------------- -------------- -------------- -------------- --------------
  `entranceUnlocked`         소비           B/A            C              연구 자료실
                                                                          접근 가능 여부
                                                                          확인

  `currentRoom`              소비           공통 진행도    C/A            `archive` 진입
                                                                          여부 판단

  `archiveClueFound`         생산           C              A / Stage 1    카이사르 +
                                                           공통           비즈네르 완료
                                                                          및 두 후속
                                                                          단서 제공 완료

  과학 실험실 장치 단서      생산           C              D              비즈네르 성공
                                                                          후 제공

  `%$#@!` 순서 단서          생산           C              F              비즈네르 성공
                                                                          후 같은 완료
                                                                          흐름에서 제공

  `scienceLabPuzzleSolved`   소비 결과      D              A/E            C가 변경하지
                                                                          않음

  `controlRoomSolved`        소비 결과      E              A/F            C가 변경하지
                                                                          않음
  --------------------------------------------------------------------------------------

공통 `StageOneSaveState`에는 `archiveClueFound`,
`scienceLabPuzzleSolved`, `controlRoomSolved`, `documentStorageUnlocked`
등이 별도 최종 완료 플래그로 존재한다. `StageOneProgressBridge`는
`start()`, `load()`, `save()`, `complete()` 계약을 제공한다.
fileciteturn7file9

C의 공식 출력 상태는 `archiveClueFound=true`이며, D에는 화학 기호 → 밀도
→ 산소 → 점화 → 가열 순서를 이해할 수 있는 단서를 제공하고, F에는
`%$#@!` 순서를 제공한다. fileciteturn5file0

### 저장 및 재입장 규칙

1.  카이사르 성공 전에는 비즈네르 입력을 활성화하지 않는다.
2.  비즈네르 성공 후 두 후속 단서를 제공한다.
3.  두 암호와 단서 제공이 끝나면 `archiveClueFound=true`를 저장하는
    구조로 연결한다.
4.  미완료 중간 단계는 서버에 별도 저장하지 않는다.
5.  `archiveClueFound=true` 상태로 재입장하면 암호를 강제로 다시 풀게
    하지 않고 두 단서를 재확인할 수 있어야 한다. fileciteturn5file8

## 7. 주요 파일

  -------------------------------------------------------------------------------------------------
  역할                                파일
  ----------------------------------- -------------------------------------------------------------
  공개 Room export                    `src/game/stage-one/rooms/archive/archiveRoom.ts`

  Room 테스트                         `src/game/stage-one/rooms/archive/archiveRoom.test.ts`

  카이사르 퍼즐                       `src/game/stage-one/puzzles/archive/caesarPuzzle.ts`

  카이사르 테스트                     `src/game/stage-one/puzzles/archive/caesarPuzzle.test.ts`

  비즈네르 퍼즐                       `src/game/stage-one/puzzles/archive/vigenerePuzzle.ts`

  비즈네르 테스트                     `src/game/stage-one/puzzles/archive/vigenerePuzzle.test.ts`

  공통 게임 조립                      `src/game/stage-one/core/createStageOneGame.ts`

  Room 참조/조립                      `src/game/stage-one/core/referenceRooms.ts`

  공통 진행도 타입                    `src/types/stage-one.ts`

  공통 이벤트                         `src/game/stage-one/contracts/events.ts`

  Room 계약                           `src/game/stage-one/contracts/room.ts`

  독립 브라우저 테스트                `src/app/dev/archive-test/`
  -------------------------------------------------------------------------------------------------

독립 테스트 페이지는 Phaser의 브라우저 전용 특성 때문에 `next/dynamic`의
`ssr:false`를 사용해 Room을 마운트하도록 구성되었다.
fileciteturn8file0

> `src/app/dev/archive-test/`는 개발 과정에서 독립 검증을 위해 만든 임시
> 테스트 경로다. 기존 작업 기록에서는 실제 PR 전에 제거하는 것으로
> 안내되었다. fileciteturn8file13

## 8. QA 시나리오

### 8.1 준비 상태

-   시작 위치: `archive` / 연구 자료실
-   필요한 선행 플래그:
    -   `entranceUnlocked=true`
    -   `currentRoom=archive`
-   독립 테스트 전용 상태:
    -   `hasKeycard=true`
    -   `entranceUnlocked=true`
    -   `currentRoom=archive`
-   정답·테스트 전용 값: 실제 정답은 인수인계서의 QA 용도로만 관리하며
    일반 사용자 문서에는 노출하지 않는다.

독립 테스트 페이지에서는 mock Bridge와 `archive` 초기 상태를 사용해
Phaser Room을 단독 검증했다. fileciteturn7file6

### 8.2 정상 동선

1.  연구 자료실에 진입한다.
2.  첫 번째 활성 퍼즐로 카이사르 암호를 확인한다.
3.  카이사르 정답 입력 후 비즈네르 퍼즐이 활성화되는지 확인한다.
4.  비즈네르 정답 입력 후 과학 실험실 장치 단서가 표시되는지 확인한다.
5.  같은 완료 흐름에서 `%$#@!` 단서가 제공되는지 확인한다.
6.  C 완료 상태가 `archiveClueFound=true`로 연결되는지 확인한다.
7.  A 통합 후 중앙 복도에서 실제 연구 자료실로 진입하는 동선으로
    재검증한다.
8.  완료 상태로 재입장했을 때 두 단서를 다시 확인할 수 있는지 확인한다.

### 8.3 실패·경계 동선

1.  `entranceUnlocked=false` 상태에서 연구 자료실 접근이 거부되는지
    확인한다.
2.  카이사르 오답 입력 시 실패 처리되고 정답이 노출되지 않는지 확인한다.
3.  카이사르 미완료 상태에서 비즈네르 입력이 잠겨 있는지 확인한다.
4.  비즈네르 오답 입력 시 실패 처리되고 정답이 노출되지 않는지 확인한다.
5.  대소문자·공백 등의 입력 차이가 명세의 정규화 규칙에 따라 처리되는지
    확인한다.
6.  빠른 연속 입력/중복 완료에서 `archiveClueFound` 저장이 중복 호출되지
    않는지 확인한다.
7.  미완료 상태 재접속 시 중간 단계가 복구되지 않고 자료실 퍼즐 시작
    상태로 돌아가는지 확인한다.
8.  Room 이탈/재진입 시 입력 UI와 Phaser 객체가 정리되는지 확인한다.

## 9. 검증 근거

  -----------------------------------------------------------------------
  검사                    실행 명령               결과
  ----------------------- ----------------------- -----------------------
  자동 테스트             `npm test`              개발 과정에서 실행 기록
                                                  있음. 당시 기존
                                                  Supabase 관련
                                                  테스트부터 C Room/퍼즐
                                                  테스트까지 추가했으나
                                                  현재 최종 테스트 수는
                                                  확인 필요

  환경변수 구조           `npm run env:check`     최종 실행 결과 확인
                                                  필요

  타입 검사               `npm run typecheck`     이전 개발 과정에서 타입
                                                  오류 없이 통과한 기록
                                                  있음. 현재 최종 실행
                                                  결과는 확인 필요

  린트                    `npm run lint`          최종 실행 결과 확인
                                                  필요

  프로덕션 빌드           `npm run build`         최종 실행 결과 확인
                                                  필요

  변경 공백 검사          `git diff --check`      최종 실행 결과 확인
                                                  필요

  브라우저 QA             `npm run dev` →         독립 Room 동작 확인용
                          `/dev/archive-test`     테스트 페이지 구성 및
                                                  사용 기록 있음. 최종
                                                  통합 QA는 A 브랜치에서
                                                  재확인 필요
  -----------------------------------------------------------------------

개발 과정에서 타입 체크가 오류 없이 통과했다는 기록은 있으며, 이후
사용자 확인 기준으로 현재 오류는 해결된 상태다. 다만 이 문서는 현재
체크아웃된 저장소를 직접 실행한 결과를 대신하는 문서가 아니므로 최종
통합 직전의 검증 명령은 A가 다시 실행해야 한다. fileciteturn8file0

## 10. 알려진 이슈와 위험

  -----------------------------------------------------------------------------------------------------
  우선순위          내용                            영향              후속 조치
  ----------------- ------------------------------- ----------------- ---------------------------------
  높음              현재 자료만으로 A의 실제 Room   C 단독 테스트는   `referenceRooms.ts` 및 실제 Stage
                    composition root에 `archive`가  통과해도 실제     1 조립 지점에서 `archive` 등록
                    최종 등록되었는지는 확정할 수   Stage 1 동선에서  확인
                    없음                            연구 자료실이     
                                                    열리지 않을 수    
                                                    있음              

  중간              `archiveClueFound`의 실제       새로고침/재접속   A의
                    Supabase 저장 호출은 A의        시 완료 상태가    `StageOneProgressBridge.save()`
                    Bridge와 통합되어야 함          유지되지 않을 수  연결 확인
                                                    있음              

  중간              `src/app/dev/archive-test/`는   PR에 테스트 전용  최종 PR 전 삭제 여부 확인
                    독립 테스트용 임시 경로         코드가 들어갈 수  
                                                    있음              

  낮음              최종 Git/PR 정보가 현재         A가 통합 대상과   `git status`, upstream,
                    인수인계 자료에서 확인되지 않음 기준 커밋을 직접  `git log -1`, PR 상태 확인
                                                    확인해야 함       
  -----------------------------------------------------------------------------------------------------

통합 명세상 공통 파일과 저장 계약은 A를 통해 변경하고, 각 파트가
독자적으로 DB 필드를 만들지 않는 것이 원칙이다. fileciteturn6file6

## 11. 커밋·PR 정보

  구분               값
  ------------------ -----------
  기능 구현 커밋     확인 필요
  후속 수정 커밋     확인 필요
  PR                 확인 필요
  통합 브랜치 반영   확인 필요

A는 C 브랜치에서 아래 명령으로 실제 값을 확인한다.

``` text
git status --short --branch
git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name @{u}
git log -1 --oneline
git diff --stat origin/develop/stage-1...HEAD
```

Stage 1 협업 커밋 scope는 `10320`으로 통일하고 설명은 한글로 작성하는
것이 프로젝트 규칙이다. fileciteturn6file6

## 12. A 통합 체크리스트

-   [ ] `createArchiveRoom` 공개 export와 import 경로가 현재 코드와
    일치한다.
-   [ ] `archive` Room이 실제 Stage 1 composition root에 한 번만
    등록되어 있다.
-   [ ] `archive` ID가 `StageOneRoomId` 계약과 일치한다.
-   [ ] `entranceUnlocked=true` 조건에서 연구 자료실 접근이 가능하다.
-   [ ] 카이사르 → 비즈네르 순서가 유지된다.
-   [ ] 카이사르 성공 전 비즈네르 입력이 잠겨 있다.
-   [ ] 비즈네르 성공 후 D용 과학 실험실 단서가 제공된다.
-   [ ] 같은 완료 흐름에서 F용 `%$#@!` 단서가 제공된다.
-   [ ] `archiveClueFound` 저장이 A의 `StageOneProgressBridge`를 통해
    연결된다.
-   [ ] C가 Supabase 또는 다른 파트의 완료 플래그를 직접 변경하지
    않는다.
-   [ ] `scienceLabPuzzleSolved`는 D가 생산한다.
-   [ ] `controlRoomSolved`는 E가 생산한다.
-   [ ] `npm test`에서 C Room/퍼즐 테스트가 자동 실행된다.
-   [ ] `npm run typecheck`, `npm run lint`, `npm run build`,
    `git diff --check`를 통합 직전에 다시 실행한다.
-   [ ] `src/app/dev/archive-test/`가 최종 PR에 필요한지 확인하고
    불필요하면 제거한다.
-   [ ] PR의 통합 대상이 `develop/stage-1`인지 확인한다.
-   [ ] 실제 환경변수·비밀정보가 커밋에 포함되지 않았는지 확인한다.

## 13. 작성자 최종 확인

-   [x] 모든 `<...>` 자리표시자와 작성 안내를 제거했다.
-   [ ] 브랜치·upstream·기준 커밋·PR 정보를 현재 Git에서 직접 확인했다.
-   [x] 공개 Room export와 주요 import 경로는 기존 작업 기록에서
    확인했다.
-   [x] 진행도 플래그의 생산·소비 관계를 C 명세와 공통 타입 기준으로
    구분했다.
-   [x] 실행하지 않은 최종 검증을 통과했다고 표시하지 않았다.
-   [x] 해결된 과거 오류를 현재 이슈로 남기지 않았다.
-   [x] 실제 환경변수 값·API 키·토큰·개인정보를 기록하지 않았다.
-   [x] 최종 파일명은 `C2A_handoff.md` 형식으로 사용한다.
