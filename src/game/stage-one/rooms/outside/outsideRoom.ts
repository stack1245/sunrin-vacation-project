    import type Phaser from "phaser";

    import type {
    StageOneRoomModule,
    StageOneRoomMountContext,
    } from "@/game/stage-one/contracts";
    import type { StageOneSaveState } from "@/types/stage-one";

    const WORLD_WIDTH = 960;
    const WORLD_HEIGHT = 540;

    /** 바닥 격자, 방 제목, 바깥 벽 네 개를 만든다. */
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

    /** 눈에 보이는 사각형 표식과 이름표를 만든다. */
    function addMarker(
    context: StageOneRoomMountContext,
    options: {
        x: number;
        y: number;
        width: number;
        height: number;
        color: number;
        text: string;
    },
    ): Phaser.GameObjects.Rectangle {
    const { scene } = context;
    const box = scene.add
        .rectangle(
        options.x,
        options.y,
        options.width,
        options.height,
        options.color,
        0.35,
        )
        .setStrokeStyle(2, options.color, 0.95)
        .setDepth(8);
    const label = scene.add
        .text(options.x, options.y + options.height / 2 + 14, options.text, {
        align: "center",
        color: "#ddd6fe",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        fontSize: "13px",
        })
        .setOrigin(0.5)
        .setDepth(9);

    context.track(box);
    context.track(label);

    return box;
    }

    function describeObjective(state: StageOneSaveState): string {
    if (state.confidentialDocumentObtained) {
        return "탈출 지점으로 이동해 연구소를 빠져나가세요.";
    }

    if (state.entranceUnlocked) {
        return "해제된 정문으로 연구소에 진입하세요.";
    }

    if (state.hasKeycard) {
        return "키카드로 정문 잠금장치를 해제하세요.";
    }

    return "주변을 조사해 연구소 키카드를 찾으세요.";
    }

    export const outsideRoom: StageOneRoomModule = {
    id: "outside",
    displayName: "연구소 외부",
    getObjective: describeObjective,
    getSpawnPoint(fromRoomId) {
        if (fromRoomId === "entrance") {
        return { x: 700, y: 270 };
        }

        return { x: 200, y: 380 };
    },
    mount(context) {
        drawRoomBase(context, "연구소 외부");

        // 조작 안내 문구
        const guide = context.scene.add
        .text(
            48,
            96,
            "WASD 또는 방향키로 이동 · Space 달리기 · E 상호작용 · Esc 일시정지",
            {
            color: "#8f83b8",
            fontFamily: "Consolas, monospace",
            fontSize: "13px",
            },
        )
        .setDepth(-5);
        context.track(guide);

        // 1) 키카드
        const keycard = addMarker(context, {
        x: 250,
        y: 200,
        width: 44,
        height: 28,
        color: 0x39d98a,
        text: "수상한 카드",
        });

        if (context.getState().hasKeycard) {
        keycard.setVisible(false);
        }

        context.addInteraction({
        id: "outside-keycard",
        position: { x: 250, y: 200 },
        prompt: "E · 카드 줍기",
        enabled: (state) => !state.hasKeycard,
        async onInteract(game) {
            const next = await game.updateProgress(
            { hasKeycard: true },
            "연구소 키카드를 획득했습니다.",
            );

            if (next.hasKeycard) {
            keycard.setVisible(false);
            }
        },
        });

        // 2) 정문
        addMarker(context, {
        x: 820,
        y: 270,
        width: 96,
        height: 120,
        color: 0x7c6daf,
        text: "정문",
        });

        context.addInteraction({
        id: "outside-front-door",
        position: { x: 820, y: 270 },
        radius: 84,
        prompt: (state) => {
            if (state.entranceUnlocked) {
            return "E · 연구소 입구로 이동";
            }

            return state.hasKeycard
            ? "E · 키카드로 잠금장치 해제"
            : "E · 정문 확인 (키카드 필요)";
        },
        async onInteract(game) {
            const state = game.getState();

            if (!state.entranceUnlocked) {
            if (!state.hasKeycard) {
                game.showMessage(
                "정문이 잠겨 있습니다. 연구소 키카드가 필요합니다.",
                "warning",
                );
                return;
            }

            const next = await game.updateProgress(
                { entranceUnlocked: true },
                "키카드로 정문 잠금장치를 해제했습니다.",
            );

            if (!next.entranceUnlocked) {
                return;
            }
            }

            await game.transitionTo("entrance");
        },
        });

        // 3) 최종 탈출 지점
        addMarker(context, {
        x: 140,
        y: 430,
        width: 96,
        height: 72,
        color: 0xd98a39,
        text: "탈출 경로",
        });

        context.addInteraction({
        id: "outside-escape",
        position: { x: 140, y: 430 },
        radius: 84,
        prompt: (state) =>
            state.confidentialDocumentObtained
            ? "E · 기밀 문서를 가지고 탈출"
            : "E · 탈출 경로 확인 (기밀 문서 필요)",
        async onInteract(game) {
            if (!game.getState().confidentialDocumentObtained) {
            game.showMessage(
                "아직 기밀 문서를 확보하지 못했습니다. 문서 보관실을 먼저 확인하세요.",
                "warning",
            );
            return;
            }

            await game.completeEscape();
        },
        });
    },
};