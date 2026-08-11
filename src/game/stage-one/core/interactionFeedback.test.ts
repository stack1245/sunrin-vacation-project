import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultStageOneSaveState } from "../../../types/stage-one.ts";
import type { StageOneInteractionDefinition } from "../contracts/room.ts";
import {
  getInteractionActionLabel,
  getInteractionMarkerPosition,
  resolveInteractionPrompt,
  selectNearestInteraction,
} from "./interactionFeedback.ts";

function interaction(
  id: string,
  x: number,
  options: Partial<StageOneInteractionDefinition> = {},
): StageOneInteractionDefinition {
  return {
    id,
    position: { x, y: 360 },
    prompt: `E · ${id}`,
    onInteract: () => undefined,
    ...options,
  };
}

test("활성 범위 안에서 플레이어와 가장 가까운 상호작용을 선택한다", () => {
  const state = createDefaultStageOneSaveState();
  const interactions = [
    interaction("왼쪽", 200, { radius: 100 }),
    interaction("오른쪽", 330, { radius: 100 }),
  ];

  assert.equal(selectNearestInteraction(interactions, state, 275)?.id, "오른쪽");
  assert.equal(selectNearestInteraction(interactions, state, 500), null);
});

test("현재 상태에서 비활성화된 상호작용은 표시 대상에서 제외한다", () => {
  const state = createDefaultStageOneSaveState();
  const disabled = interaction("비활성", 200, {
    enabled: () => false,
    radius: 100,
  });
  const enabled = interaction("활성", 250, { radius: 100 });

  assert.equal(
    selectNearestInteraction([disabled, enabled], state, 205)?.id,
    "활성",
  );
});

test("함수형 프롬프트를 현재 진행 상태로 해석한다", () => {
  const state = {
    ...createDefaultStageOneSaveState(),
    hasKeycard: true,
  };
  const target = interaction("키카드", 200, {
    prompt: (currentState) =>
      currentState.hasKeycard ? "E · 정문 열기" : "E · 키카드 찾기",
  });

  assert.equal(resolveInteractionPrompt(target, state), "E · 정문 열기");
});

test("떠 있는 배지에서는 중복된 E 접두사를 제거한다", () => {
  assert.equal(getInteractionActionLabel("E · 카이사르 암호 입력"), "카이사르 암호 입력");
  assert.equal(getInteractionActionLabel("E - 정문 열기"), "정문 열기");
  assert.equal(getInteractionActionLabel("카이사르 암호를 먼저 해독하세요"), "카이사르 암호를 먼저 해독하세요");
});

test("화면 가장자리 상호작용의 배지가 잘리지 않도록 위치를 제한한다", () => {
  assert.deepEqual(
    getInteractionMarkerPosition(interaction("왼쪽", 30)),
    { x: 145, y: 256 },
  );
  assert.deepEqual(
    getInteractionMarkerPosition(interaction("오른쪽", 930)),
    { x: 815, y: 256 },
  );
});
