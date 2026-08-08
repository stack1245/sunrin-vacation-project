import assert from "node:assert/strict";
import test from "node:test";

import type { StageOneRoomMountContext } from "../../contracts/room.ts";
import { createDefaultStageOneSaveState } from "../../../../types/stage-one.ts";
import { outsideRoom } from "./outsideRoom.ts";

interface StubGameObject {
  kind: "graphics" | "rectangle" | "text";
  x?: number;
  y?: number;
  text?: string;
  visible: boolean;
}

function createStubGameObject(
  data: Omit<StubGameObject, "visible">,
): StubGameObject {
  const target = { ...data, visible: true };
  const proxy = new Proxy(target, {
    get(object, property) {
      if (property === "setVisible") {
        return (visible: boolean) => {
          object.visible = visible;
          return proxy;
        };
      }

      if (property in object) {
        return object[property as keyof typeof object];
      }

      return () => proxy;
    },
  });

  return proxy as unknown as StubGameObject;
}

test("이미 획득한 키카드는 본체와 이름표를 모두 숨긴다", () => {
  const objects: StubGameObject[] = [];
  const scene = {
    add: {
      graphics: () => {
        const object = createStubGameObject({ kind: "graphics" });
        objects.push(object);
        return object;
      },
      rectangle: (x: number, y: number) => {
        const object = createStubGameObject({ kind: "rectangle", x, y });
        objects.push(object);
        return object;
      },
      text: (x: number, y: number, text: string) => {
        const object = createStubGameObject({ kind: "text", x, y, text });
        objects.push(object);
        return object;
      },
    },
  };
  const state = {
    ...createDefaultStageOneSaveState(),
    hasKeycard: true,
  };
  const context = {
    scene,
    getState: () => state,
    addWall: () => {},
    addInteraction: () => {},
    addPortal: () => {},
    track: () => {},
  } as unknown as StageOneRoomMountContext;

  outsideRoom.mount(context);

  const card = objects.find(
    (object) => object.kind === "rectangle" && object.x === 250 && object.y === 200,
  );
  const label = objects.find(
    (object) => object.kind === "text" && object.text === "수상한 카드",
  );

  assert.ok(card);
  assert.ok(label);
  assert.equal(card.visible, false);
  assert.equal(label.visible, false);
});
