import "client-only";

import type { PostgrestError } from "@supabase/supabase-js";

import {
  getSupabaseBrowserClient,
  type SupabaseBrowserClient,
} from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import type { StageStatus } from "@/types/stage";
import {
  type StageOneCompleteResult,
  type StageOneProgressResult,
  type StageOneProgressSummary,
  type StageOneSaveInput,
  type StageOneSaveState,
  validateStageOneSaveInput,
  validateStageOneSaveState,
} from "@/types/stage-one";

export type StageOneProgressErrorCode =
  | "AUTH_REQUIRED"
  | "SERVICE_UNAVAILABLE"
  | "STAGE_LOCKED"
  | "INVALID_STATE"
  | "NOT_READY_TO_COMPLETE"
  | "REQUEST_FAILED";

export class StageOneProgressError extends Error {
  constructor(
    public readonly code: StageOneProgressErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "StageOneProgressError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStageStatus(value: unknown): value is StageStatus {
  return (
    value === "locked" ||
    value === "unlocked" ||
    value === "in_progress" ||
    value === "cleared"
  );
}

function isNullableNonNegativeInteger(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
  );
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0
  );
}

function parseProgressSummary(value: unknown): StageOneProgressSummary {
  if (
    !isRecord(value) ||
    !isStageStatus(value.status) ||
    !isNullableNonNegativeInteger(value.bestClearTimeMs) ||
    !isNullableString(value.startedAt) ||
    !isNullableString(value.clearedAt) ||
    !isNullableString(value.lastPlayedAt)
  ) {
    throw new StageOneProgressError(
      "REQUEST_FAILED",
      "Stage 1 진행도 응답 형식을 확인할 수 없습니다.",
    );
  }

  return {
    status: value.status,
    bestClearTimeMs: value.bestClearTimeMs,
    startedAt: value.startedAt,
    clearedAt: value.clearedAt,
    lastPlayedAt: value.lastPlayedAt,
  };
}

function parseProgressResult(value: unknown): StageOneProgressResult {
  if (
    !isRecord(value) ||
    typeof value.canContinue !== "boolean" ||
    !isNonNegativeSafeInteger(value.elapsedTimeMs) ||
    typeof value.lastSavedAt !== "string"
  ) {
    throw new StageOneProgressError(
      "REQUEST_FAILED",
      "Stage 1 저장 데이터 응답 형식을 확인할 수 없습니다.",
    );
  }

  return {
    progress: parseProgressSummary(value.progress),
    state: validateStageOneSaveState(value.state),
    canContinue: value.canContinue,
    elapsedTimeMs: value.elapsedTimeMs,
    lastSavedAt: value.lastSavedAt,
  };
}

function parseCompleteResult(value: unknown): StageOneCompleteResult {
  if (!isRecord(value) || typeof value.stageTwoUnlocked !== "boolean") {
    throw new StageOneProgressError(
      "REQUEST_FAILED",
      "Stage 1 클리어 응답 형식을 확인할 수 없습니다.",
    );
  }

  return {
    ...parseProgressResult(value),
    stageTwoUnlocked: value.stageTwoUnlocked,
  };
}

function toJson(state: StageOneSaveState): Json {
  return {
    version: state.version,
    currentRoom: state.currentRoom,
    hasKeycard: state.hasKeycard,
    entranceUnlocked: state.entranceUnlocked,
    archiveClueFound: state.archiveClueFound,
    scienceLabPuzzleSolved: state.scienceLabPuzzleSolved,
    controlRoomSolved: state.controlRoomSolved,
    documentStorageUnlocked: state.documentStorageUnlocked,
    confidentialDocumentObtained: state.confidentialDocumentObtained,
    escaped: state.escaped,
  };
}

function throwRpcError(error: PostgrestError): never {
  const message = error.message.toLowerCase();

  if (message.includes("authentication")) {
    throw new StageOneProgressError(
      "AUTH_REQUIRED",
      "로그인 후 Stage 1을 이용해 주세요.",
      { cause: error },
    );
  }

  if (message.includes("locked")) {
    throw new StageOneProgressError(
      "STAGE_LOCKED",
      "Stage 1이 아직 잠겨 있습니다.",
      { cause: error },
    );
  }

  if (
    message.includes("confidential document") ||
    message.includes("escape") ||
    message.includes("positive elapsed")
  ) {
    throw new StageOneProgressError(
      "NOT_READY_TO_COMPLETE",
      "기밀 문서를 획득하고 탈출한 뒤 Stage 1을 완료해 주세요.",
      { cause: error },
    );
  }

  if (
    message.includes("save state") ||
    message.includes("save version") ||
    message.includes("elapsed time")
  ) {
    throw new StageOneProgressError(
      "INVALID_STATE",
      "Stage 1 저장 상태가 올바르지 않습니다.",
      { cause: error },
    );
  }

  throw new StageOneProgressError(
    "REQUEST_FAILED",
    "Stage 1 진행도를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    { cause: error },
  );
}

async function getAuthenticatedClient(): Promise<SupabaseBrowserClient> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new StageOneProgressError(
      "SERVICE_UNAVAILABLE",
      "게임 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new StageOneProgressError(
      "AUTH_REQUIRED",
      "로그인 후 Stage 1을 이용해 주세요.",
      error ? { cause: error } : undefined,
    );
  }

  return supabase;
}

export async function startStageOne(): Promise<StageOneProgressResult> {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase.rpc("start_stage_one");

  if (error) {
    throwRpcError(error);
  }

  return parseProgressResult(data);
}

export async function loadStageOneProgress(): Promise<StageOneProgressResult> {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase.rpc("get_stage_one_progress");

  if (error) {
    throwRpcError(error);
  }

  return parseProgressResult(data);
}

export async function saveStageOneProgress(
  input: StageOneSaveInput,
): Promise<void> {
  const validated = validateStageOneSaveInput(input);
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase.rpc("save_stage_one_progress", {
    p_state: toJson(validated.state),
    p_save_version: validated.state.version,
    p_elapsed_time_ms: validated.elapsedTimeMs,
  });

  if (error) {
    throwRpcError(error);
  }
}

export async function completeStageOne(): Promise<StageOneCompleteResult> {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase.rpc("complete_stage_one");

  if (error) {
    throwRpcError(error);
  }

  return parseCompleteResult(data);
}
