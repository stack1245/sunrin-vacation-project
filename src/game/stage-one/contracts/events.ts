import type {
  StageOneCompleteResult,
  StageOneRoomId,
  StageOneSaveState,
} from "@/types/stage-one";

export type StageOneSavePhase =
  | "idle"
  | "saving"
  | "retrying"
  | "saved"
  | "failed";

export interface StageOneSaveStatus {
  phase: StageOneSavePhase;
  attempt: number;
  maxAttempts: number;
  message: string;
}

export interface StageOneHudState {
  roomId: StageOneRoomId;
  roomName: string;
  objective: string;
  elapsedTimeMs: number;
  paused: boolean;
  interactionPrompt: string | null;
  state: StageOneSaveState;
}

export interface StageOneGameMessage {
  tone: "info" | "success" | "warning" | "error";
  text: string;
}

export interface StageOneGameEventMap {
  ready: StageOneHudState;
  hud: StageOneHudState;
  "save-status": StageOneSaveStatus;
  message: StageOneGameMessage;
  complete: StageOneCompleteResult;
  "fatal-error": StageOneGameMessage;
}

export type StageOneEventListener<
  EventMap extends object,
  EventName extends keyof EventMap,
> = (payload: EventMap[EventName]) => void;

export interface StageOneGameEvents<EventMap extends object = StageOneGameEventMap> {
  on<EventName extends keyof EventMap>(
    eventName: EventName,
    listener: StageOneEventListener<EventMap, EventName>,
  ): () => void;
  emit<EventName extends keyof EventMap>(
    eventName: EventName,
    payload: EventMap[EventName],
  ): void;
  clear(): void;
}
