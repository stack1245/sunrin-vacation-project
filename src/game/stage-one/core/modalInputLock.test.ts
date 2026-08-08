import assert from "node:assert/strict";
import test from "node:test";

import { StageOneModalInputLock } from "./modalInputLock.ts";

test("마지막 모달이 닫힐 때까지 입력 잠금을 유지한다", () => {
  const lock = new StageOneModalInputLock();
  const releaseFirst = lock.acquire();
  const releaseSecond = lock.acquire();

  assert.equal(lock.isActive(), true);

  releaseFirst();
  assert.equal(lock.isActive(), true);

  releaseSecond();
  assert.equal(lock.isActive(), false);
});

test("같은 해제 함수를 여러 번 호출해도 다른 잠금에 영향을 주지 않는다", () => {
  const lock = new StageOneModalInputLock();
  const releaseFirst = lock.acquire();
  const releaseSecond = lock.acquire();

  releaseFirst();
  releaseFirst();

  assert.equal(lock.isActive(), true);

  releaseSecond();
  assert.equal(lock.isActive(), false);
});

test("Room 정리 시 남은 잠금을 한 번에 해제한다", () => {
  const lock = new StageOneModalInputLock();

  lock.acquire();
  lock.acquire();
  lock.clear();

  assert.equal(lock.isActive(), false);
});
