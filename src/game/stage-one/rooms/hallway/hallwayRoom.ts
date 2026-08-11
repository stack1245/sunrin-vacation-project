    import type {
    StageOneRoomModule,
    StageOneRoomMountContext,
    } from "@/game/stage-one/contracts";
    import type { StageOneRoomId, StageOneSaveState } from "@/types/stage-one";

    const WORLD_WIDTH = 960;
    const WORLD_HEIGHT = 540;

    function drawRoomBase(context: StageOneRoomMountContext, title: string): void {
    const { scene } = context;
    const floor = scene.add.graphics();

    floor.fillStyle(0x050b10, 1);
    floor.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    floor.lineStyle(1, 0x223341, 0.55);

    for (let x = 0; x <= WORLD_WIDTH; x += 48) {
        floor.lineBetween(x, 0, x, WORLD_HEIGHT);
    }

    for (let y = 0; y <= WORLD_HEIGHT; y += 48) {
        floor.lineBetween(0, y, WORLD_WIDTH, y);
    }

    floor.setDepth(-20);
    context.track(floor);

    const label = scene.add
        .text(48, 44, title, {
        color: "#eef3f5",
        fontFamily: "Cascadia Code, Consolas, monospace",
        fontSize: "28px",
        fontStyle: "bold",
        })
        .setDepth(-5);
    context.track(label);

    context.addWall({
        x: WORLD_WIDTH / 2,
        y: 16,
        width: WORLD_WIDTH,
        height: 32,
    });
    context.addWall({
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT - 16,
        width: WORLD_WIDTH,
        height: 32,
    });
    context.addWall({
        x: 16,
        y: WORLD_HEIGHT / 2,
        width: 32,
        height: WORLD_HEIGHT,
    });
    context.addWall({
        x: WORLD_WIDTH - 16,
        y: WORLD_HEIGHT / 2,
        width: 32,
        height: WORLD_HEIGHT,
    });
    }

    /** 복도의 문 하나. 선행 플래그를 만족해야 열린다. */
    interface HallwayDoor {
    id: string;
    targetRoomId: StageOneRoomId;
    label: string;
    x: number;
    y: number;
    isUnlocked: (state: StageOneSaveState) => boolean;
    lockedReason: string;
    }

    const HALLWAY_DOORS: readonly HallwayDoor[] = [
    {
        id: "hallway-to-archive",
        targetRoomId: "archive",
        label: "연구 자료실",
        x: 220,
        y: 150,
        isUnlocked: (state) => state.entranceUnlocked,
        lockedReason: "정문을 먼저 해제하세요.",
    },
    {
        id: "hallway-to-science-lab",
        targetRoomId: "science-lab",
        label: "과학 실험실",
        x: 400,
        y: 150,
        isUnlocked: (state) => state.archiveClueFound,
        lockedReason: "연구 자료실에서 단서를 먼저 확보하세요.",
    },
    {
        id: "hallway-to-control-room",
        targetRoomId: "control-room",
        label: "보안 통제실",
        x: 580,
        y: 150,
        isUnlocked: (state) => state.scienceLabPuzzleSolved,
        lockedReason: "과학 실험실 장치를 먼저 작동시키세요.",
    },
    {
        id: "hallway-to-document-storage",
        targetRoomId: "document-storage",
        label: "문서 보관실",
        x: 760,
        y: 150,
        isUnlocked: (state) => state.documentStorageUnlocked,
        lockedReason: "보안 통제실에서 보관실 잠금을 먼저 해제하세요.",
    },
    ];

    function describeObjective(state: StageOneSaveState): string {
    if (state.confidentialDocumentObtained) {
        return "연구소 외부로 돌아가 탈출하세요.";
    }

    if (state.documentStorageUnlocked) {
        return "문서 보관실에서 기밀 문서를 회수하세요.";
    }

    if (state.scienceLabPuzzleSolved) {
        return "보안 통제실에서 문서 보관실 잠금을 해제하세요.";
    }

    if (state.archiveClueFound) {
        return "과학 실험실에서 장치를 작동시키세요.";
    }

    return "연구 자료실에서 첫 단서를 확보하세요.";
    }

    function addDoor(context: StageOneRoomMountContext, door: HallwayDoor): void {
    const { scene } = context;
    const box = scene.add
        .rectangle(door.x, door.y, 112, 96, 0x0b1823, 0.94)
        .setStrokeStyle(2, 0x4a5f6d, 0.9)
        .setDepth(8);
    const label = scene.add
        .text(door.x, door.y, door.label, {
        align: "center",
        color: "#d4dde1",
        fontFamily: "Cascadia Code, Consolas, monospace",
        fontSize: "13px",
        })
        .setOrigin(0.5)
        .setDepth(9);
    const lockTag = scene.add
        .text(door.x, door.y + 62, "", {
        align: "center",
        color: "#e0a08f",
        fontFamily: "Cascadia Code, Consolas, monospace",
        fontSize: "12px",
        })
        .setOrigin(0.5)
        .setDepth(9);

    lockTag.setText(door.isUnlocked(context.getState()) ? "개방" : "잠김");

    context.track(box);
    context.track(label);
    context.track(lockTag);

    context.addInteraction({
        id: door.id,
        position: { x: door.x, y: door.y },
        radius: 84,
        prompt: (state) =>
        door.isUnlocked(state)
            ? `E · ${door.label}(으)로 이동`
            : `E · ${door.label} 잠김 — ${door.lockedReason}`,
        async onInteract(game) {
        const state = game.getState();

        if (!door.isUnlocked(state)) {
            game.showMessage(`${door.label}: ${door.lockedReason}`, "warning");
            lockTag.setText("잠김");
            return;
        }

        lockTag.setText("개방");
        await game.transitionTo(door.targetRoomId);
        },
    });
    }

    export const hallwayRoom: StageOneRoomModule = {
    id: "hallway",
    displayName: "중앙 복도",
    getObjective: describeObjective,
    getAccess: (state) =>
        state.entranceUnlocked
        ? { allowed: true }
        : {
            allowed: false,
            reason: "정문 잠금장치를 먼저 해제하세요.",
            },
    getSpawnPoint(fromRoomId) {
        if (fromRoomId === "entrance") {
        return { x: 230, y: 400 };
        }

        return { x: 480, y: 340 };
    },
    mount(context) {
        drawRoomBase(context, "중앙 복도");

        for (const door of HALLWAY_DOORS) {
        addDoor(context, door);
        }

        context.addPortal({
        id: "hallway-to-entrance",
        targetRoomId: "entrance",
        position: { x: 110, y: 430 },
        });
    },
};
