    import assert from "node:assert/strict";
    import test from "node:test";

    import { createDefaultStageOneSaveState } from "../../../../types/stage-one.ts";
    import { outsideRoom } from "../outside/outsideRoom.ts";
    import { entranceRoom } from "../entrance/entranceRoom.ts";
    import { hallwayRoom } from "./hallwayRoom.ts";

    test("B 파트 Room ID와 표시명이 계약과 일치한다", () => {
    assert.equal(outsideRoom.id, "outside");
    assert.equal(entranceRoom.id, "entrance");
    assert.equal(hallwayRoom.id, "hallway");
    assert.equal(outsideRoom.displayName, "연구소 외부");
    assert.equal(entranceRoom.displayName, "연구소 입구");
    assert.equal(hallwayRoom.displayName, "중앙 복도");
    });

    test("정문을 해제하기 전에는 입구와 복도에 들어갈 수 없다", () => {
    const locked = createDefaultStageOneSaveState();

    assert.equal(entranceRoom.getAccess?.(locked).allowed, false);
    assert.equal(hallwayRoom.getAccess?.(locked).allowed, false);
    });

    test("정문을 해제하면 입구와 복도에 들어갈 수 있다", () => {
    const unlocked = {
        ...createDefaultStageOneSaveState(),
        hasKeycard: true,
        entranceUnlocked: true,
    };

    assert.equal(entranceRoom.getAccess?.(unlocked).allowed, true);
    assert.equal(hallwayRoom.getAccess?.(unlocked).allowed, true);
    });

    test("외부 목표 문구가 진행 상태에 따라 바뀐다", () => {
    const start = createDefaultStageOneSaveState();
    const withKeycard = { ...start, hasKeycard: true };
    const unlocked = { ...withKeycard, entranceUnlocked: true };

    assert.notEqual(
        outsideRoom.getObjective(start),
        outsideRoom.getObjective(withKeycard),
    );
    assert.notEqual(
        outsideRoom.getObjective(withKeycard),
        outsideRoom.getObjective(unlocked),
    );
    });

    test("복도 목표 문구가 다음 선행 조건을 가리킨다", () => {
    const base = {
        ...createDefaultStageOneSaveState(),
        hasKeycard: true,
        entranceUnlocked: true,
    };

    assert.match(hallwayRoom.getObjective(base), /연구 자료실/);
    assert.match(
        hallwayRoom.getObjective({ ...base, archiveClueFound: true }),
        /과학 실험실/,
    );
    assert.match(
        hallwayRoom.getObjective({
        ...base,
        archiveClueFound: true,
        scienceLabPuzzleSolved: true,
        }),
        /보안 통제실/,
    );
    });

    test("각 방의 시작 위치가 화면 안에 있다", () => {
    const rooms = [outsideRoom, entranceRoom, hallwayRoom];

    for (const room of rooms) {
        const spawn = room.getSpawnPoint?.(null) ?? { x: 480, y: 270 };

        assert.ok(spawn.x > 32 && spawn.x < 928, `${room.id} x 범위`);
        assert.ok(spawn.y > 32 && spawn.y < 508, `${room.id} y 범위`);
    }
});