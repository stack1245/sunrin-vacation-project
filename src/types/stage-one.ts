import type { StageStatus } from "@/types/stage";

export const STAGE_ONE_ID = 1 as const;
export const STAGE_ONE_SAVE_VERSION = 2 as const;
export const STAGE_ONE_MAX_STATE_BYTES = 4_096;
export const STAGE_ONE_MAX_ELAPSED_TIME_MS = Number.MAX_SAFE_INTEGER;

export const STAGE_ONE_ROOM_IDS = [
  "outside",
  "entrance",
  "hallway",
  "archive",
  "science-lab",
  "control-room",
  "document-storage",
] as const;

export type StageOneRoomId = (typeof STAGE_ONE_ROOM_IDS)[number];

export const STAGE_ONE_ROOM_DISPLAY_NAMES = {
  outside: "연구소 외부",
  entrance: "연구소 입구",
  hallway: "중앙 복도",
  archive: "연구 자료실",
  "science-lab": "과학 실험실",
  "control-room": "보안 통제실",
  "document-storage": "문서 보관실",
} as const satisfies Record<StageOneRoomId, string>;

export interface StageOneSaveState {
  version: typeof STAGE_ONE_SAVE_VERSION;
  currentRoom: StageOneRoomId;
  hasKeycard: boolean;
  entranceUnlocked: boolean;
  archiveClueFound: boolean;
  scienceLabPuzzleSolved: boolean;
  controlRoomSolved: boolean;
  documentStorageUnlocked: boolean;
  confidentialDocumentObtained: boolean;
  escaped: boolean;
}

export interface StageOneSaveInput {
  state: StageOneSaveState;
  elapsedTimeMs: number;
}

export interface StageOneProgressSummary {
  status: StageStatus;
  bestClearTimeMs: number | null;
  startedAt: string | null;
  clearedAt: string | null;
  lastPlayedAt: string | null;
}

export interface StageOneProgressResult {
  progress: StageOneProgressSummary;
  state: StageOneSaveState;
  canContinue: boolean;
  elapsedTimeMs: number;
  lastSavedAt: string;
}

export interface StageOneCompleteResult extends StageOneProgressResult {
  stageTwoUnlocked: boolean;
}

export interface StageOneProgressBridge {
  start(): Promise<StageOneProgressResult>;
  load(): Promise<StageOneProgressResult>;
  save(state: StageOneSaveState, elapsedTimeMs: number): Promise<void>;
  complete(): Promise<StageOneCompleteResult>;
}

const BOOLEAN_FIELDS = [
  "hasKeycard",
  "entranceUnlocked",
  "archiveClueFound",
  "scienceLabPuzzleSolved",
  "controlRoomSolved",
  "documentStorageUnlocked",
  "confidentialDocumentObtained",
  "escaped",
] as const satisfies readonly (keyof StageOneSaveState)[];

const STATE_FIELDS = [
  "version",
  "currentRoom",
  ...BOOLEAN_FIELDS,
] as const satisfies readonly (keyof StageOneSaveState)[];

type StageOneBooleanFlags = Pick<
  StageOneSaveState,
  (typeof BOOLEAN_FIELDS)[number]
>;

const ROOM_ID_SET = new Set<string>(STAGE_ONE_ROOM_IDS);
const STATE_FIELD_SET = new Set<string>(STATE_FIELDS);

export class StageOneStateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StageOneStateValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStageOneRoomId(value: unknown): value is StageOneRoomId {
  return typeof value === "string" && ROOM_ID_SET.has(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= STAGE_ONE_MAX_ELAPSED_TIME_MS
  );
}

function assertBooleanFields(
  value: Record<string, unknown>,
): asserts value is Record<string, unknown> & StageOneBooleanFlags {
  for (const field of BOOLEAN_FIELDS) {
    if (typeof value[field] !== "boolean") {
      throw new StageOneStateValidationError(
        `${field} 필드는 boolean 값이어야 합니다.`,
      );
    }
  }
}

function assertStateSize(value: unknown): void {
  let serialized: string;

  try {
    const result = JSON.stringify(value);

    if (result === undefined) {
      throw new StageOneStateValidationError(
        "Stage 1 저장 상태를 JSON으로 변환할 수 없습니다.",
      );
    }

    serialized = result;
  } catch (error) {
    if (error instanceof StageOneStateValidationError) {
      throw error;
    }

    throw new StageOneStateValidationError(
      "Stage 1 저장 상태를 JSON으로 변환할 수 없습니다.",
    );
  }

  if (new TextEncoder().encode(serialized).byteLength > STAGE_ONE_MAX_STATE_BYTES) {
    throw new StageOneStateValidationError(
      `Stage 1 저장 상태는 ${STAGE_ONE_MAX_STATE_BYTES}바이트를 초과할 수 없습니다.`,
    );
  }
}

function assertProgressionOrder(state: StageOneSaveState): void {
  if (state.entranceUnlocked && !state.hasKeycard) {
    throw new StageOneStateValidationError(
      "키카드를 획득하기 전에는 연구소 입구를 해제할 수 없습니다.",
    );
  }

  if (state.scienceLabPuzzleSolved && !state.archiveClueFound) {
    throw new StageOneStateValidationError(
      "연구 자료실 단서를 획득하기 전에는 과학 실험실 퍼즐을 완료할 수 없습니다.",
    );
  }

  if (state.controlRoomSolved && !state.scienceLabPuzzleSolved) {
    throw new StageOneStateValidationError(
      "과학 실험실 퍼즐을 완료하기 전에는 보안 통제실 퍼즐을 완료할 수 없습니다.",
    );
  }

  if (state.documentStorageUnlocked && !state.controlRoomSolved) {
    throw new StageOneStateValidationError(
      "보안 통제실 퍼즐을 완료하기 전에는 문서 보관실을 해제할 수 없습니다.",
    );
  }

  if (
    state.confidentialDocumentObtained &&
    !state.documentStorageUnlocked
  ) {
    throw new StageOneStateValidationError(
      "문서 보관실을 해제하기 전에는 기밀 문서를 획득할 수 없습니다.",
    );
  }

  if (state.escaped && !state.confidentialDocumentObtained) {
    throw new StageOneStateValidationError(
      "기밀 문서를 획득하기 전에는 탈출을 완료할 수 없습니다.",
    );
  }
}

export function createDefaultStageOneSaveState(): StageOneSaveState {
  return {
    version: STAGE_ONE_SAVE_VERSION,
    currentRoom: "outside",
    hasKeycard: false,
    entranceUnlocked: false,
    archiveClueFound: false,
    scienceLabPuzzleSolved: false,
    controlRoomSolved: false,
    documentStorageUnlocked: false,
    confidentialDocumentObtained: false,
    escaped: false,
  };
}

export function validateStageOneSaveState(
  value: unknown,
): StageOneSaveState {
  assertStateSize(value);

  if (!isRecord(value)) {
    throw new StageOneStateValidationError(
      "Stage 1 저장 상태는 객체여야 합니다.",
    );
  }

  const keys = Object.keys(value);

  if (
    keys.length !== STATE_FIELDS.length ||
    keys.some((key) => !STATE_FIELD_SET.has(key))
  ) {
    throw new StageOneStateValidationError(
      "Stage 1 저장 상태에 누락되었거나 허용되지 않은 필드가 있습니다.",
    );
  }

  if (value.version !== STAGE_ONE_SAVE_VERSION) {
    throw new StageOneStateValidationError(
      `지원하지 않는 저장 버전입니다. 버전 ${STAGE_ONE_SAVE_VERSION}을 사용해 주세요.`,
    );
  }

  if (!isStageOneRoomId(value.currentRoom)) {
    throw new StageOneStateValidationError(
      "허용되지 않은 Stage 1 방 ID입니다.",
    );
  }

  assertBooleanFields(value);

  const state: StageOneSaveState = {
    version: STAGE_ONE_SAVE_VERSION,
    currentRoom: value.currentRoom,
    hasKeycard: value.hasKeycard,
    entranceUnlocked: value.entranceUnlocked,
    archiveClueFound: value.archiveClueFound,
    scienceLabPuzzleSolved: value.scienceLabPuzzleSolved,
    controlRoomSolved: value.controlRoomSolved,
    documentStorageUnlocked: value.documentStorageUnlocked,
    confidentialDocumentObtained: value.confidentialDocumentObtained,
    escaped: value.escaped,
  };

  assertProgressionOrder(state);

  return state;
}

export function validateStageOneSaveInput(
  value: unknown,
): StageOneSaveInput {
  if (!isRecord(value)) {
    throw new StageOneStateValidationError(
      "Stage 1 저장 요청 형식을 확인해 주세요.",
    );
  }

  if (!isNonNegativeSafeInteger(value.elapsedTimeMs)) {
    throw new StageOneStateValidationError(
      "경과 시간은 0 이상의 안전한 정수여야 합니다.",
    );
  }

  return {
    state: validateStageOneSaveState(value.state),
    elapsedTimeMs: value.elapsedTimeMs,
  };
}
