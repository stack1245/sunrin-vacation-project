    import type {
    StageOneRoomModule,
    StageOneRoomMountContext,
    } from "@/game/stage-one/contracts";

    const WORLD_WIDTH = 960;
    const WORLD_HEIGHT = 540;

    function drawRoomBase(context: StageOneRoomMountContext, title: string): void {
    const { scene } = context;
    const floor = scene.add.graphics();

    floor.fillStyle(0x070b10, 1);
    floor.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    floor.lineStyle(1, 0x222936, 0.45);

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
        color: "#f5f5f4",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
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

    export const entranceRoom: StageOneRoomModule = {
    id: "entrance",
    displayName: "연구소 입구",
    getObjective: () => "중앙 복도로 이동해 연구소 내부를 확인하세요.",
    getAccess: (state) =>
        state.entranceUnlocked
        ? { allowed: true }
        : {
            allowed: false,
            reason: "정문 잠금장치를 먼저 해제하세요.",
            },
    getSpawnPoint(fromRoomId) {
        if (fromRoomId === "hallway") {
        return { x: 720, y: 270 };
        }

        return { x: 220, y: 270 };
    },
    mount(context) {
        drawRoomBase(context, "연구소 입구");

        // 가운데를 막는 안내 데스크 (충돌 벽)
        context.addWall({ x: 480, y: 270, width: 160, height: 64 }, 0x1d2432);

        const desk = context.scene.add
        .text(480, 320, "무인 안내 데스크", {
            align: "center",
            color: "#8f83b8",
            fontFamily: "Pretendard, Noto Sans KR, sans-serif",
            fontSize: "13px",
        })
        .setOrigin(0.5)
        .setDepth(9);
        context.track(desk);

        context.addPortal({
        id: "entrance-to-outside",
        targetRoomId: "outside",
        position: { x: 110, y: 270 },
        });

        context.addPortal({
        id: "entrance-to-hallway",
        targetRoomId: "hallway",
        position: { x: 850, y: 270 },
        });
    },
};