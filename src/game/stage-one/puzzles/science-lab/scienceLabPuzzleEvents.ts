import {
  SCIENCE_LAB_STEP_DEFINITIONS,
  type ScienceLabStep,
  type ScienceLabStepDefinition,
  type ScienceLabSubmissionResult,
} from "./scienceLabPuzzle.ts";

export const OPEN_SCIENCE_LAB_PUZZLE_EVENT =
  "open-science-lab-puzzle" as const;

export interface ScienceLabStepRequest {
  readonly step: ScienceLabStep;
  readonly definition: ScienceLabStepDefinition;
  submit(value: string): ScienceLabSubmissionResult;
}

export type ScienceLabStepDialogResult =
  | {
      readonly status: "accepted";
      readonly result: Extract<ScienceLabSubmissionResult, { outcome: "accepted" }>;
    }
  | { readonly status: "cancelled" };

export interface OpenScienceLabPuzzleDetail extends ScienceLabStepRequest {
  complete(result: ScienceLabStepDialogResult): void;
}

export type ScienceLabStepRequester = (
  request: ScienceLabStepRequest,
) => Promise<ScienceLabStepDialogResult>;

export const requestScienceLabStep: ScienceLabStepRequester = (request) =>
  new Promise((resolve) => {
    let completed = false;

    const complete = (result: ScienceLabStepDialogResult) => {
      if (completed) {
        return;
      }

      completed = true;
      resolve(result);
    };

    window.dispatchEvent(
      new CustomEvent<OpenScienceLabPuzzleDetail>(
        OPEN_SCIENCE_LAB_PUZZLE_EVENT,
        {
          detail: {
            ...request,
            definition: SCIENCE_LAB_STEP_DEFINITIONS[request.step],
            complete,
          },
        },
      ),
    );
  });

export function subscribeToScienceLabPuzzleOpen(
  listener: (detail: OpenScienceLabPuzzleDetail) => void,
): () => void {
  const handleOpen = (event: Event) => {
    const detail = (event as CustomEvent<OpenScienceLabPuzzleDetail>).detail;

    if (detail) {
      listener(detail);
    }
  };

  window.addEventListener(OPEN_SCIENCE_LAB_PUZZLE_EVENT, handleOpen);

  return () => {
    window.removeEventListener(OPEN_SCIENCE_LAB_PUZZLE_EVENT, handleOpen);
  };
}
