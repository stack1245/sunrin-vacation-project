import type { GameObjects, Scene } from "phaser";

/**
 * 보안 통제실(E파트)에 제공될 보안 코드 정의
 */
export const SCIENCE_LAB_SECURITY_CODE = "SEC-8042-CTRL";

/**
 * 순차 장치 퍼즐 단계 타입
 */
export type LabDeviceStep = "SYMBOL" | "DENSITY" | "OXYGEN" | "IGNITION" | "HEATING" | "SOLVED";

export interface LabPuzzleState {
  currentStep: LabDeviceStep;
  symbolAnswer: string;
  densityAnswer: string;
  oxygenAnswer: string;
  ignitionAnswer: string;
  isHeating: boolean;
}

export const LAB_PUZZLE_ANSWERS = {
  SYMBOL: "H2O", // 화학 기호 정답
  DENSITY: "1.0", // 용액 밀도 정답
  OXYGEN: "21", // 산소 농도 정답 (%)
  IGNITION: "ON", // 점화 명령 정답
};

/**
 * 퍼즐 정답 검증 함수 모음
 */
export function checkSymbolAnswer(input: string): boolean {
  return input.trim().toUpperCase() === LAB_PUZZLE_ANSWERS.SYMBOL;
}

export function checkDensityAnswer(input: string): boolean {
  return input.trim() === LAB_PUZZLE_ANSWERS.DENSITY;
}

export function checkOxygenAnswer(input: string): boolean {
  return input.trim() === LAB_PUZZLE_ANSWERS.OXYGEN;
}

export function checkIgnitionAnswer(input: string): boolean {
  return input.trim().toUpperCase() === LAB_PUZZLE_ANSWERS.IGNITION;
}

/**
 * Phaser 키보드 캡처로 텍스트 입력을 처리합니다.
 */
export function readLabAnswerLine(
  scene: Scene,
  display: GameObjects.Text,
  maxLength: number = 16
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
      } else if (event.key.length === 1 && buffer.length < maxLength) {
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