import type {
  StageOneInteractionContext,
  StageOnePoint,
  StageOneRoomMountContext,
  StageOneRoomModule,
} from "../../contracts/room";
import {
  openDocumentStoragePuzzle,
  subscribeToDocumentStoragePuzzleCleared,
  type DocumentStoragePuzzleType,
} from "../../puzzles/document-storage/documentStoragePuzzleEvents.ts";
import type {
  StageOneRoomId,
  StageOneSaveState,
} from "@/types/stage-one";
import {
  STAGE_ONE_WORLD_HEIGHT,
  STAGE_ONE_WORLD_WIDTH,
} from "../../core/referenceRooms.ts";

const DEFAULT_SPAWN: StageOnePoint = { x: 120, y: 270 };

export class DocumentStorageRoomModule implements StageOneRoomModule {
  public readonly id: StageOneRoomId = "document-storage";
  public readonly displayName: string = "문서 보관실";

  // 세부 퍼즐은 저장 계약에 포함되지 않으므로 게임 세션 동안만 유지한다.
  private solvedPuzzles: Record<DocumentStoragePuzzleType, boolean> = {
    ago: false,
    mathdoku: false,
    nqueens: false,
    resource: false,
    ttf: false,
  };

  public getObjective(state: StageOneSaveState): string {
    if (state.confidentialDocumentObtained) {
      return "기밀 문서를 회수했습니다. 중앙 복도를 지나 연구소 외부로 탈출하세요!";
    }
    const solvedCount = Object.values(this.solvedPuzzles).filter(Boolean).length;
    if (solvedCount === 5) {
      return "모든 보안 터미널 해제 완료! 중앙 금고에서 기밀 문서를 회수하세요.";
    }
    return `문서 보관실의 보안 터미널을 해제하세요. (${solvedCount}/5 완료)`;
  }

  public getAccess(state: StageOneSaveState): { allowed: boolean; reason?: string } {
    if (state.documentStorageUnlocked) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "보안 통제실에서 문서 보관실을 먼저 해제하세요.",
    };
  }

  public getSpawnPoint(fromRoomId: StageOneRoomId | null): StageOnePoint {
    if (fromRoomId === "hallway") {
      return { x: 140, y: 270 };
    }
    return DEFAULT_SPAWN;
  }

  public mount(context: StageOneRoomMountContext): () => void {
    const { scene } = context;

    // 문서 보관실 바닥과 보안 시설 격자를 그린다.
    const bg = scene.add.graphics();
    bg.fillStyle(0x050b10, 1);
    bg.fillRect(0, 0, STAGE_ONE_WORLD_WIDTH, STAGE_ONE_WORLD_HEIGHT);

    // 격자 바닥 렌더링 (보안 시설 테마)
    bg.lineStyle(1, 0x223341, 0.55);
    for (let x = 0; x <= STAGE_ONE_WORLD_WIDTH; x += 40) {
      bg.lineBetween(x, 0, x, STAGE_ONE_WORLD_HEIGHT);
    }
    for (let y = 0; y <= STAGE_ONE_WORLD_HEIGHT; y += 40) {
      bg.lineBetween(0, y, STAGE_ONE_WORLD_WIDTH, y);
    }

    // 중앙 기밀 보관 구역의 경계와 상태를 구분한다.
    bg.lineStyle(2, 0x315447, 0.7);
    bg.strokeRect(400, 180, 200, 180);
    bg.fillStyle(0x14261f, 0.45);
    bg.fillRect(400, 180, 200, 180);

    bg.setDepth(-20);
    context.track(bg);

    // Room 라벨 & 타이틀
    const titleText = scene.add
      .text(48, 40, "SECURE DOCUMENT STORAGE", {
        color: "#b7d8c1",
        fontFamily: "Cascadia Code, Consolas, monospace",
        fontSize: "14px",
        fontStyle: "bold",
      })
      .setDepth(-5);
    context.track(titleText);

    const roomLabel = scene.add
      .text(48, 58, "문서 보관실 (최종 구역)", {
        color: "#eef3f5",
        fontFamily: "Cascadia Code, Consolas, monospace",
        fontSize: "24px",
        fontStyle: "bold",
      })
      .setDepth(-5);
    context.track(roomLabel);

    // 2. 벽 & 장애물 배치
    // 외곽 테두리 벽
    context.addWall({ x: STAGE_ONE_WORLD_WIDTH / 2, y: 16, width: 960, height: 32 }, 0x0b1823);
    context.addWall({ x: STAGE_ONE_WORLD_WIDTH / 2, y: STAGE_ONE_WORLD_HEIGHT - 16, width: 960, height: 32 }, 0x0b1823);
    context.addWall({ x: 16, y: STAGE_ONE_WORLD_HEIGHT / 2, width: 32, height: 540 }, 0x0b1823);
    context.addWall({ x: STAGE_ONE_WORLD_WIDTH - 16, y: STAGE_ONE_WORLD_HEIGHT / 2, width: 32, height: 540 }, 0x0b1823);

    // 내부에 서류함 및 서버 랙 정적 장애물 배치
    context.addWall({ x: 260, y: 270, width: 40, height: 180 }, 0x17242c);
    context.addWall({ x: 740, y: 270, width: 40, height: 180 }, 0x17242c);

    // 3. 포탈 (중앙 복도로 이동)
    context.addPortal({
      id: "document-storage-to-hallway",
      targetRoomId: "hallway",
      position: { x: 70, y: 270 },
      prompt: "E - 중앙 복도로 나가기",
    });

    // 4. 퍼즐 터미널 & 금고 그래픽 렌더링
    const terminals: {
      type: DocumentStoragePuzzleType;
      name: string;
      x: number;
      y: number;
      color: number;
    }[] = [
      { type: "ago", name: "보안 노드 [Ago]", x: 210, y: 382, color: 0x315447 },
      { type: "mathdoku", name: "암호 연산 [Mathdoku]", x: 340, y: 382, color: 0x29404a },
      { type: "nqueens", name: "배치 제어 [N-Queens]", x: 470, y: 382, color: 0x3e505a },
      { type: "resource", name: "자원 배분 [Resource]", x: 600, y: 382, color: 0x8b6d3e },
      { type: "ttf", name: "패턴 해독 [TTF]", x: 730, y: 382, color: 0x4f7460 },
    ];

    terminals.forEach((term) => {
      // 터미널 시각적 베이스
      const rect = scene.add
        .rectangle(term.x, term.y, 44, 44, term.color, 0.8)
        .setStrokeStyle(2, 0x8fa1aa, 0.9)
        .setDepth(5);
      context.track(rect);

      const label = scene.add
        .text(term.x, term.y + 30, term.name, {
          color: "#d4dde1",
          fontSize: "11px",
          fontFamily: "Pretendard, sans-serif",
        })
        .setOrigin(0.5)
        .setDepth(5);
      context.track(label);

      // 상호작용 등록
      context.addInteraction({
        id: `terminal-${term.type}`,
        position: { x: term.x, y: term.y },
        radius: 45,
        prompt: () => {
          if (this.solvedPuzzles[term.type]) {
            return `[해제됨] ${term.name}`;
          }
          return `E - ${term.name} 상호작용`;
        },
        onInteract: (ctx: StageOneInteractionContext) => {
          if (this.solvedPuzzles[term.type]) {
            ctx.showMessage(`${term.name} 퍼즐은 이미 해제되었습니다!`, "info");
            return;
          }

          const releaseInputLock = ctx.acquireModalInputLock();

          openDocumentStoragePuzzle({
            puzzleType: term.type,
            title: term.name,
            releaseInputLock,
          });

          ctx.showMessage(`${term.name} 퍼즐 터미널에 접속합니다...`, "info");
        },
      });
    });

    // 5. 중앙 기밀 문서 금고 (Confidential Safe)
    const safeRect = scene.add
      .rectangle(880, 370, 70, 92, 0x251517, 0.96)
      .setStrokeStyle(3, 0xe0a08f)
      .setDepth(10);
    context.track(safeRect);

    const safeText = scene.add
      .text(880, 370, "CONFIDENTIAL\nSAFE", {
        color: "#eef3f5",
        fontSize: "10px",
        fontStyle: "bold",
        fontFamily: "Consolas, monospace",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(11);
    context.track(safeText);

    context.addInteraction({
      id: "confidential-document-safe",
      position: { x: 880, y: 370 },
      radius: 65,
      prompt: (state) => {
        if (state.confidentialDocumentObtained) {
          return "기밀 문서를 이미 회수했습니다.";
        }
        const solvedCount = Object.values(this.solvedPuzzles).filter(Boolean).length;
        if (solvedCount === 5) {
          return "E - 기밀 문서 회수하기 (모든 터미널 해제됨)";
        }
        return `E - 기밀 문서 금고 (보안 터미널 해제 필요: ${solvedCount}/5)`;
      },
      onInteract: async (ctx: StageOneInteractionContext) => {
        const state = ctx.getState();
        if (state.confidentialDocumentObtained) {
          ctx.showMessage("기밀 문서를 이미 확보했습니다. 연구소 외부로 탈출하세요!", "info");
          return;
        }

        const solvedCount = Object.values(this.solvedPuzzles).filter(Boolean).length;
        if (solvedCount < 5) {
          ctx.showMessage(
            `아직 금고가 잠겨 있습니다. 남은 퍼즐 터미널(${5 - solvedCount}개)을 해제하세요.`,
            "warning",
          );
          return;
        }

        // 최종 기밀 문서 획득!
        await ctx.updateProgress(
          { confidentialDocumentObtained: true },
          "기밀 문서를 성공적으로 회수했습니다! 연구소를 탈출하세요.",
        );
      },
    });

    return subscribeToDocumentStoragePuzzleCleared(({ puzzleType }) => {
      this.solvedPuzzles[puzzleType] = true;
    });
  }

  /**
   * 외부에서 특정 퍼즐 클리어 상태를 직접 설정 (테스트 및 복구용)
   */
  public markPuzzleSolved(puzzleType: DocumentStoragePuzzleType): void {
    this.solvedPuzzles[puzzleType] = true;
  }
}

export function createDocumentStorageRoom(): StageOneRoomModule {
  return new DocumentStorageRoomModule();
}

export type {
  DocumentStoragePuzzleType,
  OpenPuzzleEventDetail,
} from "../../puzzles/document-storage/documentStoragePuzzleEvents.ts";
