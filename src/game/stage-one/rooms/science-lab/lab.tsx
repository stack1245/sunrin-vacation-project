import type { Scene } from "phaser";

import type { StageOneSaveState } from "@/types/stage-one";
import type { StageOneRoomAccess, StageOneRoomModule } from "../../contracts/room";
// .tsx 확장자를 제거하고 올바른 상대 경로로 수정합니다.
import {
  SCIENCE_LAB_SECURITY_CODE,
  checkSymbolAnswer,
  checkDensityAnswer,
  checkOxygenAnswer,
  checkIgnitionAnswer,
  readLabAnswerLine,
} from "../../puzzles/science-lab/labpuzzle";

const SCIENCE_LAB_SPAWN_FROM_HALLWAY = { x: 220, y: 150 };
const SCIENCE_LAB_DEFAULT_SPAWN = { x: 480, y: 270 };

/**
 * 선행 조건 검증: 입구 및 자료실 단서(archiveClueFound)가 해금되어야 입장/진행 가능 (D-LAB-001)
 */
function requiresArchiveClue(state: StageOneSaveState): StageOneRoomAccess {
  if (!state.entranceUnlocked) {
    return { allowed: false, reason: "입구 잠금장치가 해제되지 않았습니다." };
  }
  if (!state.archiveClueFound) {
    return { allowed: false, reason: "연구 자료실의 단서를 먼저 확보해야 합니다." };
  }
  return { allowed: true };
}

export function createScienceLabRoom(): StageOneRoomModule {
  let currentStep: "SYMBOL" | "DENSITY" | "OXYGEN" | "IGNITION" | "HEATING" | "SOLVED" = "SYMBOL";
  let isProcessingHeating = false;

  return {
    id: "science-lab",
    displayName: "과학 실험실",
    getObjective(state) {
      if (state.scienceLabPuzzleSolved) {
        return "획득한 보안 코드를 가지고 보안 통제실로 이동하세요.";
      }
      switch (currentStep) {
        case "SYMBOL":
          return "1단계: 올바른 화학 기호를 선택하여 입력하세요.";
        case "DENSITY":
          return "2단계: 용액 밀도를 알맞게 조절하세요.";
        case "OXYGEN":
          return "3단계: 안전 산소 공급 농도를 설정하세요.";
        case "IGNITION":
          return "4단계: 점화 장치를 활성화하세요.";
        case "HEATING":
          return "5단계: 가열 장치를 가동하여 반응을 완료하세요.";
        default:
          return "실험 장치를 안전한 순서대로 작동시키세요.";
      }
    },
    getAccess: requiresArchiveClue,
    getSpawnPoint(fromRoomId) {
      return fromRoomId === "hallway" ? SCIENCE_LAB_SPAWN_FROM_HALLWAY : SCIENCE_LAB_DEFAULT_SPAWN;
    },
    mount(context) {
      const { scene } = context;
      const isAlreadySolved = context.getState().scienceLabPuzzleSolved;

      if (isAlreadySolved) {
        currentStep = "SOLVED";
      }

      // 맵 벽면 경계 설정
      context.addWall({ x: 480, y: 16, width: 960, height: 32 }, 0x151a24);
      context.addWall({ x: 480, y: 524, width: 960, height: 32 }, 0x151a24);
      context.addWall({ x: 16, y: 270, width: 32, height: 540 }, 0x151a24);
      context.addWall({ x: 944, y: 270, width: 32, height: 540 }, 0x151a24);

      // 복도 귀환 포탈
      context.addPortal({
        id: "science-lab-to-hallway",
        targetRoomId: "hallway",
        position: { x: 220, y: 150 },
      });

      // 타이틀
      const title = scene.add
        .text(480, 50, "과학 실험실 - 순차 실험 장치", {
          color: "#f5f5f4",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
          fontSize: "24px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      context.track(title);

      // 상태 안내 문구 UI
      const statusText = scene.add
        .text(480, 100, isAlreadySolved ? "실험 완료 - 안전 상태 유지 중" : "장치 가동 준비 완료", {
          color: "#a7f3d0",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
          fontSize: "16px",
        })
        .setOrigin(0.5);
      context.track(statusText);

      const inputDisplay = scene.add
        .text(480, 140, "", {
          color: "#ddd6fe",
          fontFamily: "Consolas, monospace",
          fontSize: "20px",
        })
        .setOrigin(0.5);
      context.track(inputDisplay);

      const securityCodeDisplay = scene.add
        .text(480, 450, isAlreadySolved ? `보안 통제실 코드: ${SCIENCE_LAB_SECURITY_CODE}` : "", {
          color: "#f43f5e",
          fontFamily: "Consolas, monospace",
          fontSize: "22px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      context.track(securityCodeDisplay);

      // [1단계] 화학 기호 선택
      context.addInteraction({
        id: "lab-step-symbol",
        position: { x: 250, y: 250 },
        radius: 70,
        enabled: (state) => !state.scienceLabPuzzleSolved && !isProcessingHeating,
        prompt: () => (currentStep === "SYMBOL" ? "E · [1단계] 화학 기호 입력" : "1. 화학 기호 단말기"),
        async onInteract(interactionContext) {
          if (currentStep !== "SYMBOL") {
            interactionContext.showMessage("순서가 올바르지 않습니다. 현재 단계를 먼저 해결하세요.", "warning");
            return;
          }
          statusText.setText("화학 기호를 입력하세요 (단서 참고):");
          const input = await readLabAnswerLine(scene as Scene, inputDisplay);
          if (checkSymbolAnswer(input)) {
            currentStep = "DENSITY";
            inputDisplay.setText("");
            statusText.setText("1단계 완료: 화학 기호가 확인되었습니다.");
            interactionContext.showMessage("화학 기호 승인 완료. 다음: 용액 밀도 조절", "success");
          } else {
            inputDisplay.setText("");
            interactionContext.showMessage("올바르지 않은 화학 기호입니다.", "warning");
          }
        },
      });

      // [2단계] 용액 밀도 조절
      context.addInteraction({
        id: "lab-step-density",
        position: { x: 400, y: 250 },
        radius: 70,
        enabled: (state) => !state.scienceLabPuzzleSolved && !isProcessingHeating,
        prompt: () => (currentStep === "DENSITY" ? "E · [2단계] 용액 밀도 조절" : "2. 밀도 조절 장치"),
        async onInteract(interactionContext) {
          if (currentStep !== "DENSITY") {
            const reason = currentStep === "SYMBOL" ? "1단계(화학 기호)를 먼저 완료하세요." : "순서가 올바르지 않습니다.";
            interactionContext.showMessage(reason, "warning");
            return;
          }
          statusText.setText("목표 밀도 값을 입력하세요:");
          const input = await readLabAnswerLine(scene as Scene, inputDisplay);
          if (checkDensityAnswer(input)) {
            currentStep = "OXYGEN";
            inputDisplay.setText("");
            statusText.setText("2단계 완료: 용액 밀도가 정상 범위에 도달했습니다.");
            interactionContext.showMessage("밀도 설정 완료. 다음: 산소 공급 조절", "success");
          } else {
            inputDisplay.setText("");
            interactionContext.showMessage("밀도 설정 실패. 정확한 수치를 입력하세요.", "warning");
          }
        },
      });

      // [3단계] 산소 공급 장치
      context.addInteraction({
        id: "lab-step-oxygen",
        position: { x: 550, y: 250 },
        radius: 70,
        enabled: (state) => !state.scienceLabPuzzleSolved && !isProcessingHeating,
        prompt: () => (currentStep === "OXYGEN" ? "E · [3단계] 산소 농도 설정" : "3. 산소 공급 장치"),
        async onInteract(interactionContext) {
          if (currentStep !== "OXYGEN") {
            interactionContext.showMessage("이전 단계를 먼저 올바르게 완료해야 합니다.", "warning");
            return;
          }
          statusText.setText("안전 산소 농도(%)를 입력하세요:");
          const input = await readLabAnswerLine(scene as Scene, inputDisplay);
          if (checkOxygenAnswer(input)) {
            currentStep = "IGNITION";
            inputDisplay.setText("");
            statusText.setText("3단계 완료: 산소 공급 제어 정상화.");
            interactionContext.showMessage("산소 농도 설정 완료. 다음: 점화 장치 활성화", "success");
          } else {
            inputDisplay.setText("");
            interactionContext.showMessage("산소 농도 범위를 벗어났습니다.", "warning");
          }
        },
      });

      // [4단계] 점화 장치
      context.addInteraction({
        id: "lab-step-ignition",
        position: { x: 700, y: 250 },
        radius: 70,
        enabled: (state) => !state.scienceLabPuzzleSolved && !isProcessingHeating,
        prompt: () => (currentStep === "IGNITION" ? "E · [4단계] 점화 (ON 입력)" : "4. 점화 장치"),
        async onInteract(interactionContext) {
          if (currentStep !== "IGNITION") {
            interactionContext.showMessage("점화 전 선행 절차를 모두 완수해야 합니다.", "warning");
            return;
          }
          statusText.setText("점화 명령을 입력하세요 (ON):");
          const input = await readLabAnswerLine(scene as Scene, inputDisplay);
          if (checkIgnitionAnswer(input)) {
            currentStep = "HEATING";
            inputDisplay.setText("");
            statusText.setText("4단계 완료: 점화 성공. 가열 반응 준비 완료.");
            interactionContext.showMessage("점화 완료. 이제 가열 스위치를 가동하세요.", "success");
          } else {
            inputDisplay.setText("");
            interactionContext.showMessage("점화 실패. 명령어를 확인하세요.", "warning");
          }
        },
      });

      // [5단계] 가열 스위치 및 폭파 연출 (D-LAB-005)
      context.addInteraction({
        id: "lab-step-heating",
        position: { x: 480, y: 370 },
        radius: 80,
        enabled: (state) => !state.scienceLabPuzzleSolved && !isProcessingHeating,
        prompt: () => (currentStep === "HEATING" ? "E · [최종] 가열 스위치 작동" : "5. 가열 반응 장치"),
        async onInteract(interactionContext) {
          if (currentStep !== "HEATING") {
            interactionContext.showMessage("모든 안전 제어 단계를 완료한 후 가열할 수 있습니다.", "warning");
            return;
          }

          isProcessingHeating = true;
          statusText.setText("가열 장치 작동 중... 화학 반응 진행 중...");
          interactionContext.showMessage("가열을 시작합니다. 반응을 기다리세요.", "info");

          scene.cameras.main.shake(1500, 0.01);

          scene.time.delayedCall(2000, async () => {
            isProcessingHeating = false;
            currentStep = "SOLVED";

            statusText.setText("반응 완료! 보안 통제실 코드가 실린더에 표시됩니다.");
            securityCodeDisplay.setText(`보안 통제실 코드: ${SCIENCE_LAB_SECURITY_CODE}`);

            await interactionContext.updateProgress(
              { scienceLabPuzzleSolved: true },
              `과학 실험실 퍼즐을 해결했습니다! 보안 통제실 코드 [${SCIENCE_LAB_SECURITY_CODE}]를 획득했습니다.`,
            );
          });
        },
      });

      // 완료 후 코드 다시 확인 (D-SAVE-002)
      context.addInteraction({
        id: "lab-solved-terminal",
        position: { x: 480, y: 450 },
        radius: 80,
        enabled: (state) => state.scienceLabPuzzleSolved,
        prompt: () => "보안 코드 다시 확인",
        async onInteract(interactionContext) {
          interactionContext.showMessage(`보안 통제실 접속 코드: ${SCIENCE_LAB_SECURITY_CODE}`, "info");
        },
      });
    },
  };
}