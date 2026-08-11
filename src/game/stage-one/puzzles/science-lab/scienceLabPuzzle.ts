export const SCIENCE_LAB_SECURITY_CODE = "SEC-8042-CTRL" as const;

export const SCIENCE_LAB_STEPS = [
  "symbol",
  "density",
  "oxygen",
  "ignition",
  "heating",
] as const;

export type ScienceLabStep = (typeof SCIENCE_LAB_STEPS)[number];

export interface ScienceLabChoice {
  readonly value: string;
  readonly label: string;
  readonly description: string;
}

export interface ScienceLabStepDefinition {
  readonly step: ScienceLabStep;
  readonly order: number;
  readonly title: string;
  readonly shortLabel: string;
  readonly prompt: string;
  readonly hint: string;
  readonly choices: readonly ScienceLabChoice[];
}

export const SCIENCE_LAB_STEP_DEFINITIONS: Readonly<
  Record<ScienceLabStep, ScienceLabStepDefinition>
> = {
  symbol: {
    step: "symbol",
    order: 1,
    title: "화학 기호 선택",
    shortLabel: "화학 기호",
    prompt: "냉각 회로의 기준 화합물을 선택하세요.",
    hint: "저장조의 물방울 표식과 같은 화합물을 찾으세요.",
    choices: [
      { value: "CO2", label: "CO₂", description: "탄소 계열 시료" },
      { value: "H2O", label: "H₂O", description: "냉각 회로 기준 시료" },
      { value: "NaCl", label: "NaCl", description: "염화물 계열 시료" },
    ],
  },
  density: {
    step: "density",
    order: 2,
    title: "용액 밀도 조절",
    shortLabel: "용액 밀도",
    prompt: "기준 시료와 같은 상대 밀도를 선택하세요.",
    hint: "기준 시료와 동일한 값은 상대 밀도 1.0입니다.",
    choices: [
      { value: "0.8", label: "0.8", description: "기준보다 낮음" },
      { value: "1.0", label: "1.0", description: "기준과 동일" },
      { value: "1.2", label: "1.2", description: "기준보다 높음" },
    ],
  },
  oxygen: {
    step: "oxygen",
    order: 3,
    title: "산소 공급 설정",
    shortLabel: "산소 공급",
    prompt: "표준 대기 수준의 산소 공급 값을 선택하세요.",
    hint: "과도하거나 부족한 공급 대신 표준 대기 수준을 유지하세요.",
    choices: [
      { value: "12", label: "12%", description: "공급 부족" },
      { value: "21", label: "21%", description: "표준 대기 수준" },
      { value: "35", label: "35%", description: "공급 과다" },
    ],
  },
  ignition: {
    step: "ignition",
    order: 4,
    title: "점화 장치 승인",
    shortLabel: "점화",
    prompt: "안전 절차가 끝난 점화 장치의 활성화 명령을 선택하세요.",
    hint: "대기나 해제가 아닌 활성화 명령이 필요합니다.",
    choices: [
      { value: "ARM", label: "ARM", description: "대기 상태로 전환" },
      { value: "ON", label: "ON", description: "점화 장치 활성화" },
      { value: "OFF", label: "OFF", description: "점화 장치 해제" },
    ],
  },
  heating: {
    step: "heating",
    order: 5,
    title: "가열 반응 시작",
    shortLabel: "가열",
    prompt: "연구 자료실에서 확인한 마지막 절차를 선택하세요.",
    hint: "순서 단서의 마지막 단계는 가열입니다.",
    choices: [
      { value: "PURGE", label: "PURGE", description: "회로 초기화" },
      { value: "HEAT", label: "HEAT", description: "가열 반응 시작" },
      { value: "STOP", label: "STOP", description: "장치 정지" },
    ],
  },
};

const SCIENCE_LAB_ANSWERS: Readonly<Record<ScienceLabStep, string>> = {
  symbol: "H2O",
  density: "1.0",
  oxygen: "21",
  ignition: "ON",
  heating: "HEAT",
};

export interface ScienceLabPuzzleSnapshot {
  readonly currentStep: ScienceLabStep | null;
  readonly completedSteps: readonly ScienceLabStep[];
  readonly solved: boolean;
}

export type ScienceLabSubmissionResult =
  | {
      readonly outcome: "accepted";
      readonly completedStep: ScienceLabStep;
      readonly nextStep: ScienceLabStep | null;
      readonly solved: boolean;
      readonly message: string;
    }
  | {
      readonly outcome: "rejected" | "wrong-step" | "already-solved";
      readonly expectedStep: ScienceLabStep | null;
      readonly message: string;
    };

function normalizeScienceLabAnswer(value: string): string {
  return value.trim().replaceAll(" ", "").toUpperCase();
}

export class ScienceLabPuzzle {
  private stepIndex = 0;

  constructor(solved = false) {
    this.reset(solved);
  }

  reset(solved = false): void {
    this.stepIndex = solved ? SCIENCE_LAB_STEPS.length : 0;
  }

  getSnapshot(): ScienceLabPuzzleSnapshot {
    return {
      currentStep: SCIENCE_LAB_STEPS[this.stepIndex] ?? null,
      completedSteps: SCIENCE_LAB_STEPS.slice(0, this.stepIndex),
      solved: this.stepIndex >= SCIENCE_LAB_STEPS.length,
    };
  }

  submit(step: ScienceLabStep, rawValue: string): ScienceLabSubmissionResult {
    const snapshot = this.getSnapshot();

    const currentStep = snapshot.currentStep;

    if (!currentStep) {
      return {
        outcome: "already-solved",
        expectedStep: null,
        message: "이미 안전 절차를 모두 완료했습니다.",
      };
    }

    if (currentStep !== step) {
      const expected = SCIENCE_LAB_STEP_DEFINITIONS[currentStep];

      return {
        outcome: "wrong-step",
        expectedStep: currentStep,
        message: `현재 단계는 ${expected.title}입니다. 연구 자료실의 순서 단서를 확인하세요.`,
      };
    }

    const answer = SCIENCE_LAB_ANSWERS[step];

    if (normalizeScienceLabAnswer(rawValue) !== normalizeScienceLabAnswer(answer)) {
      return {
        outcome: "rejected",
        expectedStep: step,
        message: "선택한 설정이 승인 조건과 일치하지 않습니다. 장치 힌트를 다시 확인하세요.",
      };
    }

    this.stepIndex += 1;
    const nextStep = SCIENCE_LAB_STEPS[this.stepIndex] ?? null;
    const solved = nextStep === null;

    const message = nextStep
      ? `${SCIENCE_LAB_STEP_DEFINITIONS[step].title} 완료. 다음 단계는 ${SCIENCE_LAB_STEP_DEFINITIONS[nextStep].title}입니다.`
      : "모든 안전 절차가 승인되었습니다. 가열 반응을 시작합니다.";

    return {
      outcome: "accepted",
      completedStep: step,
      nextStep,
      solved,
      message,
    };
  }
}
