/**
 * E 파트 · 보안 통제실 Room 모듈
 *
 * 담당: 10602 김보민 (파트 E)
 *
 * A의 `StageOneRoomModule` 계약만 구현하며, 이동·충돌·상호작용 선택·방 전환·HUD는
 * 전부 A의 공통 기능을 그대로 사용한다. 별도 HUD를 만들지 않는다.
 *
 * ## 상호작용
 *
 * | ID | 역할 | 잠금 조건 |
 * | --- | --- | --- |
 * | `control-room-terminal` | 가짜 F12 단말을 열어 OTP 인증을 수행 | `scienceLabPuzzleSolved` |
 * | `control-room-lockdown-panel` | 봉쇄 상태 확인과 2단계 재시도 | 없음 (상태별 안내) |
 * | `control-room-notice` | 보안 수칙 힌트 열람 | 없음 |
 *
 * ## 저장
 *
 * 저장은 전부 `context.updateProgress()` 를 통해서만 일어난다.
 * Supabase 클라이언트·테이블명·RPC명을 직접 import하지 않는다.
 */

import type Phaser from "phaser";

import type {
  StageOneRoomModule,
  StageOneInteractionContext,
} from "../../contracts/room.ts";
import type {
  StageOneRoomId,
  StageOneSaveState,
} from "../../../../types/stage-one.ts";
import {
  CONTROL_ROOM_NOTICE_LINES,
  ControlRoomCompletionFlow,
} from "../../puzzles/control-room/index.ts";
import {
  CONTROL_ROOM_CABLE_TRAY,
  CONTROL_ROOM_COLORS,
  CONTROL_ROOM_DEFAULT_SPAWN,
  CONTROL_ROOM_EXIT_POSITION,
  CONTROL_ROOM_LOCKDOWN_PANEL_POSITION,
  CONTROL_ROOM_NOTICE_POSITION,
  CONTROL_ROOM_SERVER_RACKS,
  CONTROL_ROOM_SPAWN_FROM_HALLWAY,
  CONTROL_ROOM_TERMINAL_POSITION,
  CONTROL_ROOM_WALL_THICKNESS,
  CONTROL_ROOM_WORLD_HEIGHT,
  CONTROL_ROOM_WORLD_WIDTH,
} from "./layout.ts";
import { STAGE_ONE_ENVIRONMENT_ASSETS } from "../../core/environmentAssets.ts";
import { ControlRoomTerminalSession } from "./terminalSession.ts";

/** 통제실 Room ID. 저장 계약의 허용 목록과 일치한다. */
export const CONTROL_ROOM_ID: StageOneRoomId = "control-room";

/** 단말 잠금 안내. 과학 실험실 선행 조건은 저장 계약에서도 강제된다. */
const TERMINAL_LOCKED_MESSAGE =
  "실험동 승인 코드가 없어 단말이 인증을 거부합니다. 과학 실험실을 먼저 완료하세요.";

function objective(state: StageOneSaveState): string {
  if (state.documentStorageUnlocked) {
    return "문서 보관실 봉쇄가 해제되었습니다. 중앙 복도로 이동하세요.";
  }

  if (state.controlRoomSolved) {
    return "보안 단말에서 봉쇄 해제를 마저 실행하세요.";
  }

  if (!state.scienceLabPuzzleSolved) {
    return "단말이 실험동 승인 코드를 요구합니다. 과학 실험실을 먼저 완료하세요.";
  }

  return "보안 단말을 조사해 인증 코드를 알아내고 문서 보관실 봉쇄를 해제하세요.";
}

export const controlRoomRoom: StageOneRoomModule = {
  id: CONTROL_ROOM_ID,
  displayName: "보안 통제실",

  getObjective: objective,

  getAccess(state) {
    return state.entranceUnlocked
      ? { allowed: true }
      : {
          allowed: false,
          reason: "연구소 입구 잠금장치가 해제되지 않았습니다.",
        };
  },

  getSpawnPoint(fromRoomId) {
    return fromRoomId === "hallway"
      ? { ...CONTROL_ROOM_SPAWN_FROM_HALLWAY }
      : { ...CONTROL_ROOM_DEFAULT_SPAWN };
  },

  mount(context) {
    const { scene } = context;
    const terminalSession = new ControlRoomTerminalSession(scene);
    let noticeIndex = 0;

    /** 여러 오브젝트를 한 번에 A의 정리 대상으로 등록한다. */
    const track = (...objects: readonly Phaser.GameObjects.GameObject[]) => {
      for (const object of objects) {
        context.track(object);
      }
    };

    // ── 바닥과 격자 ────────────────────────────────────────────────
    const floor = scene.add.graphics();

    floor.fillStyle(CONTROL_ROOM_COLORS.floor, 1);
    floor.fillRect(0, 0, CONTROL_ROOM_WORLD_WIDTH, CONTROL_ROOM_WORLD_HEIGHT);
    floor.lineStyle(1, CONTROL_ROOM_COLORS.grid, 0.4);

    for (let x = 0; x <= CONTROL_ROOM_WORLD_WIDTH; x += 48) {
      floor.lineBetween(x, 0, x, CONTROL_ROOM_WORLD_HEIGHT);
    }

    for (let y = 0; y <= CONTROL_ROOM_WORLD_HEIGHT; y += 48) {
      floor.lineBetween(0, y, CONTROL_ROOM_WORLD_WIDTH, y);
    }

    floor.setDepth(-20);
    context.track(floor);

    const roomLabel = scene.add
      .text(48, 44, "보안 통제실", {
        color: "#eef3f5",
        fontFamily: "Cascadia Code, Consolas, monospace",
        fontSize: "26px",
        fontStyle: "bold",
      })
      .setDepth(-5);
    context.track(roomLabel);

    // ── 외벽 ──────────────────────────────────────────────────────
    const half = CONTROL_ROOM_WALL_THICKNESS / 2;

    context.addWall(
      {
        x: CONTROL_ROOM_WORLD_WIDTH / 2,
        y: half,
        width: CONTROL_ROOM_WORLD_WIDTH,
        height: CONTROL_ROOM_WALL_THICKNESS,
      },
      CONTROL_ROOM_COLORS.wall,
    );
    context.addWall(
      {
        x: CONTROL_ROOM_WORLD_WIDTH / 2,
        y: CONTROL_ROOM_WORLD_HEIGHT - half,
        width: CONTROL_ROOM_WORLD_WIDTH,
        height: CONTROL_ROOM_WALL_THICKNESS,
      },
      CONTROL_ROOM_COLORS.wall,
    );
    context.addWall(
      {
        x: half,
        y: CONTROL_ROOM_WORLD_HEIGHT / 2,
        width: CONTROL_ROOM_WALL_THICKNESS,
        height: CONTROL_ROOM_WORLD_HEIGHT,
      },
      CONTROL_ROOM_COLORS.wall,
    );
    context.addWall(
      {
        x: CONTROL_ROOM_WORLD_WIDTH - half,
        y: CONTROL_ROOM_WORLD_HEIGHT / 2,
        width: CONTROL_ROOM_WALL_THICKNESS,
        height: CONTROL_ROOM_WORLD_HEIGHT,
      },
      CONTROL_ROOM_COLORS.wall,
    );

    // ── 서버 랙과 케이블 트레이 ────────────────────────────────────
    for (const rack of CONTROL_ROOM_SERVER_RACKS) {
      context.addWall(rack, CONTROL_ROOM_COLORS.serverRack);

      const indicator = scene.add
        .rectangle(rack.x, rack.y - rack.height / 2 + 14, 40, 6, CONTROL_ROOM_COLORS.serverLight, 0.85)
        .setDepth(6);
      context.track(indicator);
    }

    context.addWall(CONTROL_ROOM_CABLE_TRAY, CONTROL_ROOM_COLORS.monitorFrame);

    // ── 모니터 월 (장식) ──────────────────────────────────────────
    const monitorWall = scene.add
      .rectangle(180, 118, 180, 96, CONTROL_ROOM_COLORS.monitorScreen, 0.9)
      .setStrokeStyle(2, CONTROL_ROOM_COLORS.monitorFrame, 1)
      .setDepth(4);
    const monitorText = scene.add
      .text(180, 118, "CCTV\nOFFLINE", {
        align: "center",
        color: "#6f838f",
        fontFamily: "Consolas, monospace",
        fontSize: "13px",
      })
      .setOrigin(0.5)
      .setDepth(5);
    track(monitorWall, monitorText);

    // ── 보안 단말 ────────────────────────────────────────────────
    const terminalBody = scene.add
      .image(
        CONTROL_ROOM_TERMINAL_POSITION.x,
        CONTROL_ROOM_TERMINAL_POSITION.y,
        STAGE_ONE_ENVIRONMENT_ASSETS.securityTerminal.key,
      )
      .setDisplaySize(96, 96)
      .setDepth(6);
    const terminalLabel = scene.add
      .text(
        CONTROL_ROOM_TERMINAL_POSITION.x,
        CONTROL_ROOM_TERMINAL_POSITION.y + 48,
        "보안 단말",
        {
          color: "#b7d8c1",
          fontFamily: "Cascadia Code, Consolas, monospace",
          fontSize: "13px",
        },
      )
      .setOrigin(0.5)
      .setDepth(7);
    track(terminalBody, terminalLabel);

    // ── 봉쇄 제어 패널 ────────────────────────────────────────────
    const released = context.getState().documentStorageUnlocked;
    const panelBody = scene.add
      .rectangle(
        CONTROL_ROOM_LOCKDOWN_PANEL_POSITION.x,
        CONTROL_ROOM_LOCKDOWN_PANEL_POSITION.y,
        72,
        88,
        released
          ? CONTROL_ROOM_COLORS.panelReleased
          : CONTROL_ROOM_COLORS.panelLocked,
        1,
      )
      .setDepth(6);
    const panelLabel = scene.add
      .text(
        CONTROL_ROOM_LOCKDOWN_PANEL_POSITION.x,
        CONTROL_ROOM_LOCKDOWN_PANEL_POSITION.y + 58,
        released ? "봉쇄 해제됨" : "봉쇄 작동 중",
        {
          align: "center",
          color: released ? "#5dbd8b" : "#e0a08f",
          fontFamily: "Cascadia Code, Consolas, monospace",
          fontSize: "12px",
        },
      )
      .setOrigin(0.5)
      .setDepth(7);
    track(panelBody, panelLabel);

    // ── 보안 수칙 안내판 ──────────────────────────────────────────
    const noticeBoard = scene.add
      .rectangle(
        CONTROL_ROOM_NOTICE_POSITION.x,
        CONTROL_ROOM_NOTICE_POSITION.y,
        104,
        64,
        CONTROL_ROOM_COLORS.notice,
        1,
      )
      .setDepth(6);
    const noticeLabel = scene.add
      .text(
        CONTROL_ROOM_NOTICE_POSITION.x,
        CONTROL_ROOM_NOTICE_POSITION.y + 44,
        "보안 수칙",
        {
          color: "#d4dde1",
          fontFamily: "Cascadia Code, Consolas, monospace",
          fontSize: "12px",
        },
      )
      .setOrigin(0.5)
      .setDepth(7);
    track(noticeBoard, noticeLabel);

    // ── 상호작용: 보안 단말 ───────────────────────────────────────
    context.addInteraction({
      id: "control-room-terminal",
      position: { ...CONTROL_ROOM_TERMINAL_POSITION },
      radius: 84,
      prompt: (state) => {
        if (state.documentStorageUnlocked) {
          return "E · 보안 단말 열람";
        }

        if (state.controlRoomSolved) {
          return "E · 봉쇄 해제 마저 실행";
        }

        return state.scienceLabPuzzleSolved
          ? "E · 보안 단말 접속"
          : "E · 단말 잠김 (실험동 승인 코드 필요)";
      },
      async onInteract(interaction) {
        const state = interaction.getState();

        if (!state.scienceLabPuzzleSolved && !state.controlRoomSolved) {
          interaction.showMessage(TERMINAL_LOCKED_MESSAGE, "warning");
          return;
        }

        await terminalSession.start(interaction);
      },
    });

    // ── 상호작용: 봉쇄 제어 패널 ──────────────────────────────────
    context.addInteraction({
      id: "control-room-lockdown-panel",
      position: { ...CONTROL_ROOM_LOCKDOWN_PANEL_POSITION },
      radius: 76,
      prompt: (state) =>
        state.documentStorageUnlocked
          ? "E · 봉쇄 상태 확인"
          : "E · 봉쇄 제어 패널 조작",
      async onInteract(interaction) {
        await runLockdownPanel(interaction);
      },
    });

    // ── 상호작용: 보안 수칙 안내판 ────────────────────────────────
    context.addInteraction({
      id: "control-room-notice",
      position: { ...CONTROL_ROOM_NOTICE_POSITION },
      radius: 72,
      prompt: "E · 보안 수칙 읽기",
      onInteract(interaction) {
        const line = CONTROL_ROOM_NOTICE_LINES[noticeIndex];
        noticeIndex = (noticeIndex + 1) % CONTROL_ROOM_NOTICE_LINES.length;
        interaction.showMessage(line, "info");
      },
    });

    // ── 출입구 ────────────────────────────────────────────────────
    context.addPortal({
      id: "control-room-to-hallway",
      targetRoomId: "hallway",
      position: { ...CONTROL_ROOM_EXIT_POSITION },
    });

    return () => {
      terminalSession.dispose();
    };
  },
};

/**
 * 봉쇄 제어 패널 동작.
 *
 * 인증 전에는 안내만 하고, `controlRoomSolved` 만 반영된 부분 완료 상태에서는
 * 2단계 커밋을 이어서 수행한다. 이미 해제되었으면 저장을 호출하지 않는다.
 */
async function runLockdownPanel(
  interaction: StageOneInteractionContext,
): Promise<void> {
  const state = interaction.getState();

  if (state.documentStorageUnlocked) {
    interaction.showMessage(
      "봉쇄가 해제되어 문서 보관실로 이동할 수 있습니다.",
      "success",
    );
    return;
  }

  if (!state.controlRoomSolved) {
    interaction.showMessage(
      "패널이 잠겨 있습니다. 보안 단말에서 인증을 먼저 통과하세요.",
      "warning",
    );
    return;
  }

  const flow = new ControlRoomCompletionFlow(interaction);
  const result = await flow.commit({
    failedAttempts: 0,
    unlockSource: "console-lockdown-release",
  });

  if (result.outcome === "failed") {
    interaction.showMessage(result.message, "error");
    return;
  }

  if (result.outcome === "blocked") {
    interaction.showMessage(result.message, "warning");
  }
}
