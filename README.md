# OutOfBounds Stage 1

이 저장소 루트는 A 파트의 공통 Phaser 기반을 사용하는 Stage 1 단일 프로젝트다. 역할별 개발자는 학번 폴더를 새로 만들지 않고 각자 지정된 브랜치와 worktree에서 담당 Room·퍼즐 모듈을 구현한다.

- 전체 개발 상태와 기술 계약: [`docs/stage-1/development-handoff.md`](./docs/stage-1/development-handoff.md)
- Phaser·Room 통합 계약: [`docs/stage-1/game-integration.md`](./docs/stage-1/game-integration.md)
- 역할별 브랜치·worktree: [`docs/stage-1/branch-workflow.md`](./docs/stage-1/branch-workflow.md)
- 진행도·저장 계약: [`docs/stage-1/progress-integration.md`](./docs/stage-1/progress-integration.md)

```powershell
npm ci
npm run dev
```

변경을 전달하기 전 `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`를 모두 확인한다.
