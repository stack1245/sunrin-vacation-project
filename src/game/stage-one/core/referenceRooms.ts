import type {
  StageOnePoint,
  StageOnePortalDefinition,
  StageOneRoomModule,
} from "../contracts/room";
import type {
  StageOneRoomId,
  StageOneSaveState,
} from "../../../types/stage-one.ts";

export const STAGE_ONE_WORLD_WIDTH = 960;
export const STAGE_ONE_WORLD_HEIGHT = 540;

interface ReferenceRoomOptions {
  id: StageOneRoomId;
  displayName: string;
  objective: (state: StageOneSaveState) => string;
  portals: readonly StageOnePortalDefinition[];
  access?: (state: StageOneSaveState) => {
    allowed: boolean;
    reason?: string;
  };
}

const DEFAULT_SPAWN: StageOnePoint = { x: 480, y: 350 };

function createReferenceRoom({
  id,
  displayName,
  objective,
  portals,
  access,
}: ReferenceRoomOptions): StageOneRoomModule {
  return {
    id,
    displayName,
    getObjective: objective,
    getAccess: access,
    getSpawnPoint(fromRoomId) {
      if (!fromRoomId) {
        return DEFAULT_SPAWN;
      }

      if (fromRoomId === "outside" || fromRoomId === "entrance") {
        return { x: 180, y: 350 };
      }

      if (fromRoomId === "hallway") {
        return { x: 780, y: 350 };
      }

      return DEFAULT_SPAWN;
    },
    mount(context) {
      const { scene } = context;
      const floor = scene.add.graphics();

      floor.fillStyle(0x050b10, 1);
      floor.fillRect(0, 0, STAGE_ONE_WORLD_WIDTH, STAGE_ONE_WORLD_HEIGHT);
      floor.lineStyle(1, 0x223341, 0.55);

      for (let x = 0; x <= STAGE_ONE_WORLD_WIDTH; x += 48) {
        floor.lineBetween(x, 0, x, STAGE_ONE_WORLD_HEIGHT);
      }

      for (let y = 0; y <= STAGE_ONE_WORLD_HEIGHT; y += 48) {
        floor.lineBetween(0, y, STAGE_ONE_WORLD_WIDTH, y);
      }

      floor.setDepth(-20);
      context.track(floor);

      const roomLabel = scene.add
        .text(48, 44, displayName, {
          color: "#eef3f5",
          fontFamily: "Cascadia Code, Consolas, monospace",
          fontSize: "28px",
          fontStyle: "bold",
        })
        .setDepth(-5);
      context.track(roomLabel);

      const slotLabel = scene.add
        .text(48, 86, "ROOM MODULE SLOT · 담당 파트 콘텐츠 연결 대기", {
          color: "#6f838f",
          fontFamily: "Consolas, monospace",
          fontSize: "13px",
        })
        .setDepth(-5);
      context.track(slotLabel);

      context.addWall(
        { x: STAGE_ONE_WORLD_WIDTH / 2, y: 16, width: 960, height: 32 },
        0x0b1823,
      );
      context.addWall(
        {
          x: STAGE_ONE_WORLD_WIDTH / 2,
          y: STAGE_ONE_WORLD_HEIGHT - 16,
          width: 960,
          height: 32,
        },
        0x0b1823,
      );
      context.addWall(
        { x: 16, y: STAGE_ONE_WORLD_HEIGHT / 2, width: 32, height: 540 },
        0x0b1823,
      );
      context.addWall(
        {
          x: STAGE_ONE_WORLD_WIDTH - 16,
          y: STAGE_ONE_WORLD_HEIGHT / 2,
          width: 32,
          height: 540,
        },
        0x0b1823,
      );

      for (const portal of portals) {
        context.addPortal(portal);
      }
    },
  };
}

const requiresEntrance = (state: StageOneSaveState) =>
  state.entranceUnlocked
    ? { allowed: true }
    : {
        allowed: false,
        reason: "입구 잠금장치가 해제되지 않았습니다.",
      };

export function createStageOneReferenceRooms(): readonly StageOneRoomModule[] {
  return [
    createReferenceRoom({
      id: "outside",
      displayName: "연구소 외부",
      objective: (state) =>
        state.entranceUnlocked
          ? "해제된 연구소 입구로 이동하세요."
          : state.hasKeycard
            ? "키카드로 연구소 입구 잠금장치를 해제하세요."
            : "주변을 조사해 연구소 키카드를 찾으세요.",
      portals: [
        {
          id: "outside-to-entrance",
          targetRoomId: "entrance",
          position: { x: 850, y: 270 },
        },
      ],
    }),
    createReferenceRoom({
      id: "entrance",
      displayName: "연구소 입구",
      objective: () => "연구소 내부로 진입하세요.",
      access: requiresEntrance,
      portals: [
        {
          id: "entrance-to-outside",
          targetRoomId: "outside",
          position: { x: 110, y: 270 },
        },
        {
          id: "entrance-to-hallway",
          targetRoomId: "hallway",
          position: { x: 850, y: 270 },
        },
      ],
    }),
    createReferenceRoom({
      id: "hallway",
      displayName: "중앙 복도",
      objective: (state) =>
        state.documentStorageUnlocked
          ? "문서 보관실에서 기밀 문서를 회수하세요."
          : "각 연구 구역의 단서를 순서대로 확보하세요.",
      access: requiresEntrance,
      portals: [
        {
          id: "hallway-to-entrance",
          targetRoomId: "entrance",
          position: { x: 110, y: 270 },
        },
        {
          id: "hallway-to-archive",
          targetRoomId: "archive",
          position: { x: 350, y: 160 },
        },
        {
          id: "hallway-to-science-lab",
          targetRoomId: "science-lab",
          position: { x: 610, y: 160 },
        },
        {
          id: "hallway-to-control-room",
          targetRoomId: "control-room",
          position: { x: 350, y: 400 },
        },
        {
          id: "hallway-to-document-storage",
          targetRoomId: "document-storage",
          position: { x: 610, y: 400 },
        },
      ],
    }),
    createReferenceRoom({
      id: "archive",
      displayName: "연구 자료실",
      objective: (state) =>
        state.archiveClueFound
          ? "확보한 단서를 가지고 중앙 복도로 돌아가세요."
          : "암호화된 연구 기록에서 과학 실험실 단서를 찾으세요.",
      access: requiresEntrance,
      portals: [
        {
          id: "archive-to-hallway",
          targetRoomId: "hallway",
          position: { x: 110, y: 270 },
        },
      ],
    }),
    createReferenceRoom({
      id: "science-lab",
      displayName: "과학 실험실",
      objective: (state) =>
        state.scienceLabPuzzleSolved
          ? "실험 결과를 가지고 중앙 복도로 돌아가세요."
          : "연구 자료실에서 얻은 정보로 실험 장치를 작동하세요.",
      access: requiresEntrance,
      portals: [
        {
          id: "science-lab-to-hallway",
          targetRoomId: "hallway",
          position: { x: 110, y: 270 },
        },
      ],
    }),
    createReferenceRoom({
      id: "control-room",
      displayName: "보안 통제실",
      objective: (state) =>
        state.controlRoomSolved
          ? "문서 보관실 해금 상태를 확인하세요."
          : "보안 시스템을 분석해 문서 보관실을 해제하세요.",
      access: requiresEntrance,
      portals: [
        {
          id: "control-room-to-hallway",
          targetRoomId: "hallway",
          position: { x: 110, y: 270 },
        },
      ],
    }),
    createReferenceRoom({
      id: "document-storage",
      displayName: "문서 보관실",
      objective: (state) =>
        state.confidentialDocumentObtained
          ? "기밀 문서를 가지고 연구소 외부로 탈출하세요."
          : "최종 보안 퍼즐을 해결하고 기밀 문서를 회수하세요.",
      access: (state) =>
        state.documentStorageUnlocked
          ? { allowed: true }
          : {
              allowed: false,
              reason: "보안 통제실에서 문서 보관실을 먼저 해제하세요.",
            },
      portals: [
        {
          id: "document-storage-to-hallway",
          targetRoomId: "hallway",
          position: { x: 110, y: 270 },
        },
      ],
    }),
  ];
}
