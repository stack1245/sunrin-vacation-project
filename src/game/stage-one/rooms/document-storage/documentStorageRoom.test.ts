import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultStageOneSaveState } from "../../../../types/stage-one.ts";
import {
  DocumentStorageRoomModule,
  createDocumentStorageRoom,
  type DocumentStoragePuzzleType,
} from "./index.ts";

test("문서 보관실은 보안 통제실에서 해금한 뒤에만 진입할 수 있다", () => {
  const room = createDocumentStorageRoom();
  const lockedState = createDefaultStageOneSaveState();
  const unlockedState = {
    ...lockedState,
    hasKeycard: true,
    entranceUnlocked: true,
    archiveClueFound: true,
    scienceLabPuzzleSolved: true,
    controlRoomSolved: true,
    documentStorageUnlocked: true,
  };

  assert.equal(room.id, "document-storage");
  assert.equal(room.displayName, "문서 보관실");
  assert.equal(room.getAccess?.(lockedState).allowed, false);
  assert.equal(room.getAccess?.(unlockedState).allowed, true);
});

test("다섯 퍼즐을 모두 풀면 중앙 금고 회수 목표로 전환한다", () => {
  const room = new DocumentStorageRoomModule();
  const puzzleTypes: DocumentStoragePuzzleType[] = [
    "ago",
    "mathdoku",
    "nqueens",
    "resource",
    "ttf",
  ];
  const state = createDefaultStageOneSaveState();

  assert.match(room.getObjective(state), /0\/5 완료/);

  for (const puzzleType of puzzleTypes) {
    room.markPuzzleSolved(puzzleType);
  }

  assert.match(room.getObjective(state), /중앙 금고/);
  assert.match(
    room.getObjective({ ...state, confidentialDocumentObtained: true }),
    /연구소 외부로 탈출/,
  );
});
