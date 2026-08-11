import type Phaser from "phaser";

import type { StageOneSaveState } from "@/types/stage-one";
import type { StageOneRoomAccess, StageOneRoomModule } from "../../contracts/room.ts";
import { CAESAR_PUZZLE, checkCaesarAnswer } from "../../puzzles/archive/caesarPuzzle.ts";
import {
  checkVigenereAnswer,
  describeArchiveClues,
  VIGENERE_PUZZLE,
} from "../../puzzles/archive/vigenerePuzzle.ts";

const ARCHIVE_EXIT_POSITION = { x: 110, y: 270 };
const ARCHIVE_SPAWN_FROM_HALLWAY = { x: 220, y: 270 };
const ARCHIVE_DEFAULT_SPAWN = { x: 480, y: 270 };

function requiresEntrance(state: StageOneSaveState): StageOneRoomAccess {
  return state.entranceUnlocked
    ? { allowed: true }
    : { allowed: false, reason: "입구 잠금장치가 해제되지 않았습니다." };
}

/**
 * scene.add.dom 대신 순수 키보드 캡처로 답을 입력받는다.
 * 이유: 공통 Phaser 설정(createStageOneGame.ts)에 dom.createContainer가
 * 아직 켜져 있지 않아, 방 모듈만으로는 DOM 입력을 보장할 수 없다.
 * interactionRunning 플래그가 이미 이동을 막아주므로 별도 처리가 필요 없다.
 */
function readAnswerLine(
  scene: Phaser.Scene,
  display: Phaser.GameObjects.Text,
): Promise<string> {
  return new Promise((resolve) => {
    let buffer = "";
    display.setText("_");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        cleanup();
        resolve(buffer);
        return;
      }
      if (event.key === "Escape") {
        cleanup();
        resolve("");
        return;
      }
      if (event.key === "Backspace") {
        buffer = buffer.slice(0, -1);
      } else if (event.key.length === 1 && buffer.length < 32) {
        buffer += event.key;
      }
      display.setText(`${buffer}_`);
    };

    const cleanup = () => {
      scene.input.keyboard?.off("keydown", handleKeyDown);
    };

    scene.input.keyboard?.on("keydown", handleKeyDown);
  });
}

export function createArchiveRoom(): StageOneRoomModule {
  let caesarSolved = false;

  return {
    id: "archive",
    displayName: "연구 자료실",
    getObjective(state) {
      if (state.archiveClueFound) {
        return "정보와 단서를 가지고 중앙 복도로 돌아가세요.";
      }
      return caesarSolved
        ? "비즈네르 암호를 해독해 다음 단서를 확보하세요."
        : "카이사르 암호를 해독해 자료실 접근 권한을 얻으세요.";
    },
    getAccess: requiresEntrance,
    getSpawnPoint(fromRoomId) {
      return fromRoomId === "hallway" ? ARCHIVE_SPAWN_FROM_HALLWAY : ARCHIVE_DEFAULT_SPAWN;
    },
    mount(context) {
      const { scene } = context;

      if (context.getState().archiveClueFound) {
        caesarSolved = true;
      }

      context.addWall({ x: 480, y: 16, width: 960, height: 32 }, 0x0b1823);
      context.addWall({ x: 480, y: 524, width: 960, height: 32 }, 0x0b1823);
      context.addWall({ x: 16, y: 270, width: 32, height: 540 }, 0x0b1823);
      context.addWall({ x: 944, y: 270, width: 32, height: 540 }, 0x0b1823);

      context.addPortal({
        id: "archive-to-hallway",
        targetRoomId: "hallway",
        position: { ...ARCHIVE_EXIT_POSITION },
      });

      const title = scene.add
        .text(480, 60, "연구 자료실", {
          color: "#eef3f5",
          fontFamily: "Cascadia Code, Consolas, monospace",
          fontSize: "24px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      context.track(title);

      const caesarCipher = scene.add
        .text(480, 150, CAESAR_PUZZLE.cipherText, {
          color: "#b7d8c1",
          fontFamily: "Consolas, monospace",
          fontSize: "20px",
        })
        .setOrigin(0.5);
      context.track(caesarCipher);

      const caesarAnswerLine = scene.add
        .text(480, 185, "", {
          color: "#d4dde1",
          fontFamily: "Consolas, monospace",
          fontSize: "18px",
        })
        .setOrigin(0.5);
      context.track(caesarAnswerLine);

      const vigenereCipher = scene.add
        .text(480, 350, VIGENERE_PUZZLE.cipherText, {
          color: "#b7d8c1",
          fontFamily: "Consolas, monospace",
          fontSize: "20px",
        })
        .setOrigin(0.5);
      context.track(vigenereCipher);

      const vigenereAnswerLine = scene.add
        .text(
          480,
          385,
          context.getState().archiveClueFound ? describeArchiveClues() : "",
          {
            color: "#d4dde1",
            fontFamily: "Consolas, monospace",
            fontSize: "16px",
            align: "center",
          },
        )
        .setOrigin(0.5);
      context.track(vigenereAnswerLine);

      context.addInteraction({
        id: "archive-caesar-terminal",
        position: { x: 480, y: 150 },
        radius: 90,
        enabled: (state) => !state.archiveClueFound,
        prompt: () => (caesarSolved ? "카이사르 단말기 (해독 완료)" : "E · 카이사르 암호 입력"),
        async onInteract(interactionContext) {
          if (caesarSolved) {
            interactionContext.showMessage("이미 해독한 단말기입니다.", "info");
            return;
          }
          const releaseInputLock = interactionContext.acquireModalInputLock();
          let raw: string;

          try {
            raw = await readAnswerLine(scene, caesarAnswerLine);
          } finally {
            releaseInputLock();
          }

          if (checkCaesarAnswer(raw)) {
            caesarSolved = true;
            caesarAnswerLine.setText(CAESAR_PUZZLE.answer);
            interactionContext.showMessage("카이사르 암호를 해독했습니다.", "success");
          } else {
            caesarAnswerLine.setText("");
            interactionContext.showMessage("정답이 아닙니다. 다시 시도하세요.", "warning");
          }
        },
      });

      context.addInteraction({
        id: "archive-vigenere-terminal",
        position: { x: 480, y: 350 },
        radius: 90,
        prompt: (state) => {
          if (state.archiveClueFound) {
            return "E · 확보한 후속 단서 다시 확인";
          }
          return caesarSolved
            ? "E · 비즈네르 암호 입력"
            : "카이사르 암호를 먼저 해독하세요";
        },
        async onInteract(interactionContext) {
          if (interactionContext.getState().archiveClueFound) {
            const clues = describeArchiveClues();
            vigenereAnswerLine.setText(clues);
            interactionContext.showMessage(clues, "info");
            return;
          }

          if (!caesarSolved) {
            interactionContext.showMessage("카이사르 암호를 먼저 해독하세요.", "warning");
            return;
          }

          const releaseInputLock = interactionContext.acquireModalInputLock();
          let raw: string;

          try {
            raw = await readAnswerLine(scene, vigenereAnswerLine);
          } finally {
            releaseInputLock();
          }

          if (checkVigenereAnswer(raw)) {
            await interactionContext.updateProgress(
              { archiveClueFound: true },
              "두 암호를 모두 해독했습니다. 과학 실험실 단서와 최종 순서 단서를 확보했습니다.",
            );
            const clues = describeArchiveClues();
            vigenereAnswerLine.setText(clues);
            interactionContext.showMessage(clues, "success");
          } else {
            vigenereAnswerLine.setText("");
            interactionContext.showMessage("정답이 아닙니다. 다시 시도하세요.", "warning");
          }
        },
      });
    },
  };
}
