import Phaser from "phaser";

import {
  STAGE_ONE_ROOM_DISPLAY_NAMES,
  type StageOneRoomId,
  type StageOneSaveState,
} from "@/types/stage-one";
import type {
  StageOneGameEventMap,
  StageOneGameEvents,
  StageOneHudState,
} from "../contracts/events";
import type {
  StageOneInteractionContext,
  StageOneInteractionDefinition,
  StageOnePortalDefinition,
  StageOneProgressPatch,
  StageOneRectangle,
  StageOneRoomModule,
  StageOneRoomRegistry,
} from "../contracts/room";
import type { StageOneSession } from "./stageOneSession";
import {
  calculateStageOneVelocity,
  STAGE_ONE_JUMP_VELOCITY,
} from "./movement";
import {
  getStageOnePlayerAnimationKey,
  getStageOnePlayerTextureKey,
  STAGE_ONE_PLAYER_ANIMATIONS,
  type StageOnePlayerAnimation,
} from "./playerAnimations";
import {
  STAGE_ONE_WORLD_HEIGHT,
  STAGE_ONE_WORLD_WIDTH,
} from "./referenceRooms";
import { StageOneModalInputLock } from "./modalInputLock";
import {
  createSideViewRoomBackdrop,
  STAGE_ONE_SIDE_VIEW_FLOOR_TOP,
  STAGE_ONE_SIDE_VIEW_PLAYER_Y,
  STAGE_ONE_SIDE_VIEW_PORTAL_Y,
} from "./sideViewPresentation";

export const STAGE_ONE_SCENE_KEY = "stage-one";

interface MovementKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
  pause: Phaser.Input.Keyboard.Key;
}

interface StageOneSceneOptions {
  session: StageOneSession;
  events: StageOneGameEvents<StageOneGameEventMap>;
  rooms: readonly StageOneRoomModule[];
}

function isTextInputActive(): boolean {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    (activeElement instanceof HTMLElement && activeElement.isContentEditable)
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "요청을 처리하지 못했습니다.";
}

export class StageOneScene extends Phaser.Scene {
  private readonly session: StageOneSession;
  private readonly gameEvents: StageOneGameEvents<StageOneGameEventMap>;
  private readonly rooms: StageOneRoomRegistry;
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private movementKeys!: MovementKeys;
  private currentRoom!: StageOneRoomModule;
  private activeInteraction: StageOneInteractionDefinition | null = null;
  private interactionRunning = false;
  private paused = false;
  private readonly modalInputLock = new StageOneModalInputLock();
  private readonly deferredModalInputReleases = new Set<() => void>();
  private roomCleanup: (() => void) | null = null;
  private readonly roomObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly roomColliders: Phaser.Physics.Arcade.Collider[] = [];
  private readonly interactions: StageOneInteractionDefinition[] = [];
  private lastHudAt = 0;
  private lastInteractionPrompt: string | null = null;

  constructor({ session, events, rooms }: StageOneSceneOptions) {
    super({ key: STAGE_ONE_SCENE_KEY });
    this.session = session;
    this.gameEvents = events;
    this.rooms = new Map(rooms.map((room) => [room.id, room]));
  }

  preload(): void {
    for (const [animation, definition] of Object.entries(
      STAGE_ONE_PLAYER_ANIMATIONS,
    ) as [StageOnePlayerAnimation, (typeof STAGE_ONE_PLAYER_ANIMATIONS)[StageOnePlayerAnimation]][]) {
      definition.frames.forEach((path, frameIndex) => {
        this.load.svg(getStageOnePlayerTextureKey(animation, frameIndex), path, {
          width: 72,
          height: 72,
        });
      });
    }
  }

  create(): void {
    this.physics.world.setBounds(
      0,
      0,
      STAGE_ONE_WORLD_WIDTH,
      STAGE_ONE_WORLD_HEIGHT,
    );

    this.createPlayerAnimations();
    this.player = this.physics.add
      .sprite(0, 0, getStageOnePlayerTextureKey("idle", 0))
      .setDepth(30);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(25, 48).setOffset(24, 17);
    this.playerBody.setCollideWorldBounds(true);
    this.player.play(getStageOnePlayerAnimationKey("idle"));

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("키보드 입력 플러그인을 시작할 수 없습니다.");
    }

    this.movementKeys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      interact: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      sprint: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      pause: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);

    this.cameras.main.setBounds(
      0,
      0,
      STAGE_ONE_WORLD_WIDTH,
      STAGE_ONE_WORLD_HEIGHT,
    );
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    const initialRoomId = this.session.getState().currentRoom;
    this.mountRoom(initialRoomId, null);

    this.game.events.on(Phaser.Core.Events.BLUR, this.handleGameBlur, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);

    const hud = this.createHudState();
    this.gameEvents.emit("ready", hud);
    this.gameEvents.emit("hud", hud);
  }

  update(time: number): void {
    this.flushDeferredModalInputReleases();

    if (isTextInputActive()) {
      this.playerBody.setVelocityX(0);
      this.updateHud(time);
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.movementKeys.pause) &&
      !this.modalInputLock.isActive()
    ) {
      this.setPaused(!this.paused);
    }

    if (
      this.paused ||
      this.interactionRunning ||
      this.modalInputLock.isActive()
    ) {
      this.playerBody.setVelocityX(0);
      this.updateHud(time);
      return;
    }

    const horizontal =
      (this.movementKeys.right.isDown || this.movementKeys.d.isDown ? 1 : 0) -
      (this.movementKeys.left.isDown || this.movementKeys.a.isDown ? 1 : 0);
    const crouching =
      this.movementKeys.down.isDown || this.movementKeys.s.isDown;
    const velocity = calculateStageOneVelocity({
      horizontal,
      sprinting: this.movementKeys.sprint.isDown,
    });

    this.playerBody.setVelocityX(crouching ? 0 : velocity.x);

    if (
      this.playerBody.blocked.down &&
      (Phaser.Input.Keyboard.JustDown(this.movementKeys.up) ||
        Phaser.Input.Keyboard.JustDown(this.movementKeys.w) ||
        Phaser.Input.Keyboard.JustDown(this.movementKeys.jump))
    ) {
      this.playerBody.setVelocityY(-STAGE_ONE_JUMP_VELOCITY);
    }

    this.updatePlayerAnimation(horizontal, crouching);
    this.selectActiveInteraction();

    if (
      this.activeInteraction &&
      Phaser.Input.Keyboard.JustDown(this.movementKeys.interact)
    ) {
      void this.runInteraction(this.activeInteraction);
    }

    this.updateHud(time);
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) {
      return;
    }

    this.paused = paused;
    this.session.setPaused(paused);

    if (paused) {
      this.playerBody.setVelocity(0, 0);
      this.physics.pause();
    } else {
      this.physics.resume();
    }

    this.gameEvents.emit("message", {
      tone: "info",
      text: paused ? "게임을 일시정지했습니다." : "게임을 계속합니다.",
    });
    this.publishHud();
  }

  async retryFailedSave(): Promise<void> {
    const retried = await this.session.retryFailedSave();

    if (!retried) {
      this.gameEvents.emit("message", {
        tone: "info",
        text: "다시 시도할 저장 요청이 없습니다.",
      });
    }
  }

  private mountRoom(
    roomId: StageOneRoomId,
    fromRoomId: StageOneRoomId | null,
  ): void {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error(`${roomId} Room 모듈이 등록되지 않았습니다.`);
    }

    this.clearRoom();
    this.currentRoom = room;
    const spawnPoint = room.getSpawnPoint?.(fromRoomId) ?? {
      x: STAGE_ONE_WORLD_WIDTH / 2,
      y: STAGE_ONE_SIDE_VIEW_PLAYER_Y,
    };

    const cleanup = room.mount({
      scene: this,
      getState: () => this.session.getState(),
      addWall: (bounds, color) => this.addWall(bounds, color),
      addInteraction: (definition) => {
        this.interactions.push(definition);
      },
      addPortal: (definition) => this.addPortal(definition),
      track: (gameObject) => {
        this.roomObjects.push(gameObject);
      },
    });

    for (const gameObject of createSideViewRoomBackdrop(
      this,
      room.id,
      room.displayName,
    )) {
      this.roomObjects.push(gameObject);
    }

    this.addSideViewFloor();
    this.player.setPosition(spawnPoint.x, STAGE_ONE_SIDE_VIEW_PLAYER_Y);
    this.playerBody.reset(spawnPoint.x, STAGE_ONE_SIDE_VIEW_PLAYER_Y);
    this.player.play(getStageOnePlayerAnimationKey("idle"), true);

    this.roomCleanup = cleanup ?? null;
    this.gameEvents.emit("message", {
      tone: "info",
      text: `${room.displayName}에 진입했습니다.`,
    });
    this.publishHud();
  }

  private addWall(bounds: StageOneRectangle, color = 0x0b1823): void {
    const wall = this.add
      .rectangle(bounds.x, bounds.y, bounds.width, bounds.height, color)
      .setDepth(5);

    this.physics.add.existing(wall, true);
    const collider = this.physics.add.collider(this.player, wall);

    this.roomObjects.push(wall);
    this.roomColliders.push(collider);
  }

  private addPortal(definition: StageOnePortalDefinition): void {
    const target = this.rooms.get(definition.targetRoomId);

    if (!target) {
      throw new Error(
        `${definition.targetRoomId} Room 모듈이 등록되지 않았습니다.`,
      );
    }

    const marker = this.add
      .rectangle(
        definition.position.x,
        STAGE_ONE_SIDE_VIEW_PORTAL_Y,
        86,
        146,
        0x071018,
        0.98,
      )
      .setStrokeStyle(2, 0x4a5f6d, 0.9)
      .setDepth(8);
    const label = this.add
      .text(
        definition.position.x,
        STAGE_ONE_SIDE_VIEW_PORTAL_Y - 4,
        target.displayName,
        {
          align: "center",
          color: "#d4dde1",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
          fontSize: "13px",
        },
      )
      .setOrigin(0.5)
      .setDepth(9);

    this.roomObjects.push(marker, label);
    this.interactions.push({
      id: definition.id,
      position: {
        x: definition.position.x,
        y: STAGE_ONE_SIDE_VIEW_PLAYER_Y,
      },
      radius: 90,
      prompt: (state) => {
        const access = target.getAccess?.(state) ?? { allowed: true };

        return access.allowed
          ? (definition.prompt ?? `E · ${target.displayName}(으)로 이동`)
          : `E · ${access.reason ?? "아직 진입할 수 없습니다."}`;
      },
      onInteract: async (context) => {
        await context.transitionTo(definition.targetRoomId);
      },
    });
  }

  private selectActiveInteraction(): void {
    const state = this.session.getState();
    let nearest: StageOneInteractionDefinition | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const interaction of this.interactions) {
      if (interaction.enabled && !interaction.enabled(state)) {
        continue;
      }

      const distance = Math.abs(this.player.x - interaction.position.x);

      if (distance <= (interaction.radius ?? 72) && distance < nearestDistance) {
        nearest = interaction;
        nearestDistance = distance;
      }
    }

    if (nearest !== this.activeInteraction) {
      this.activeInteraction = nearest;
      this.publishHud();
    }
  }

  private async runInteraction(
    interaction: StageOneInteractionDefinition,
  ): Promise<void> {
    if (this.interactionRunning) {
      return;
    }

    this.interactionRunning = true;
    this.playerBody.setVelocityX(0);
    this.player.play(getStageOnePlayerAnimationKey("interact"), true);

    try {
      await interaction.onInteract(this.createInteractionContext());
    } catch (error) {
      this.gameEvents.emit("message", {
        tone: "warning",
        text: getErrorMessage(error),
      });
    } finally {
      this.interactionRunning = false;
      this.publishHud();
    }
  }

  private createInteractionContext(): StageOneInteractionContext {
    return {
      getState: () => this.session.getState(),
      updateProgress: (patch, successMessage) =>
        this.updateProgress(patch, successMessage),
      transitionTo: (roomId) => this.transitionTo(roomId),
      completeEscape: () => this.completeEscape(),
      acquireModalInputLock: () => this.acquireModalInputLock(),
      showMessage: (text, tone = "info") => {
        this.gameEvents.emit("message", { tone, text });
      },
    };
  }

  private createPlayerAnimations(): void {
    for (const [animation, definition] of Object.entries(
      STAGE_ONE_PLAYER_ANIMATIONS,
    ) as [StageOnePlayerAnimation, (typeof STAGE_ONE_PLAYER_ANIMATIONS)[StageOnePlayerAnimation]][]) {
      const key = getStageOnePlayerAnimationKey(animation);

      if (this.anims.exists(key)) {
        continue;
      }

      this.anims.create({
        key,
        frames: definition.frames.map((_, frameIndex) => ({
          key: getStageOnePlayerTextureKey(animation, frameIndex),
        })),
        frameRate: definition.frameRate,
        repeat: definition.repeat,
      });
    }
  }

  private updatePlayerAnimation(horizontal: number, crouching: boolean): void {
    if (!this.playerBody.blocked.down) {
      this.player.play(getStageOnePlayerAnimationKey("jump"), true);
      return;
    }

    if (crouching) {
      this.player.play(getStageOnePlayerAnimationKey("crouch"), true);
      return;
    }

    if (horizontal !== 0) {
      this.player.setFlipX(horizontal < 0);
      this.player.play(getStageOnePlayerAnimationKey("walk"), true);
      return;
    }

    this.player.play(getStageOnePlayerAnimationKey("idle"), true);
  }

  private addSideViewFloor(): void {
    const floorHeight = STAGE_ONE_WORLD_HEIGHT - STAGE_ONE_SIDE_VIEW_FLOOR_TOP;
    const floor = this.add
      .rectangle(
        STAGE_ONE_WORLD_WIDTH / 2,
        STAGE_ONE_SIDE_VIEW_FLOOR_TOP + floorHeight / 2,
        STAGE_ONE_WORLD_WIDTH,
        floorHeight,
        0x000000,
        0,
      )
      .setDepth(4);

    this.physics.add.existing(floor, true);
    this.roomObjects.push(floor);
    this.roomColliders.push(this.physics.add.collider(this.player, floor));
  }

  /**
   * Room 모달이 열려 있는 동안 게임 입력을 잠근다.
   *
   * Esc로 모달을 닫으면 같은 키 입력이 게임 일시정지까지 전달될 수 있으므로,
   * Esc 키가 올라올 때까지 실제 잠금 해제를 미룬다.
   */
  private acquireModalInputLock(): () => void {
    const releaseLock = this.modalInputLock.acquire();
    let released = false;

    this.playerBody.setVelocity(0, 0);

    return () => {
      if (released) {
        return;
      }

      released = true;

      if (this.movementKeys.pause.isDown) {
        this.deferredModalInputReleases.add(releaseLock);
        return;
      }

      releaseLock();
    };
  }

  /** Esc 키가 올라온 뒤 보류된 모달 잠금을 해제한다. */
  private flushDeferredModalInputReleases(): void {
    if (this.movementKeys.pause.isDown) {
      return;
    }

    for (const release of this.deferredModalInputReleases) {
      release();
    }

    this.deferredModalInputReleases.clear();
  }

  private async updateProgress(
    patch: StageOneProgressPatch,
    successMessage?: string,
  ): Promise<StageOneSaveState> {
    try {
      const nextState = await this.session.updateProgress(patch);

      if (successMessage) {
        this.gameEvents.emit("message", {
          tone: "success",
          text: successMessage,
        });
      }

      return nextState;
    } catch (error) {
      const currentState = this.session.getState();
      const patchApplied = Object.entries(patch).every(
        ([key, value]) => currentState[key as keyof StageOneSaveState] === value,
      );

      this.gameEvents.emit("message", {
        tone: "warning",
        text: patchApplied
          ? `게임 진행은 유지되지만 저장에 실패했습니다: ${getErrorMessage(error)}`
          : getErrorMessage(error),
      });
      return currentState;
    } finally {
      this.publishHud();
    }
  }

  private async transitionTo(roomId: StageOneRoomId): Promise<void> {
    const targetRoom = this.rooms.get(roomId);

    if (!targetRoom) {
      throw new Error(`${roomId} Room 모듈이 등록되지 않았습니다.`);
    }

    const access = targetRoom.getAccess?.(this.session.getState()) ?? {
      allowed: true,
    };

    if (!access.allowed) {
      throw new Error(access.reason ?? "아직 진입할 수 없는 구역입니다.");
    }

    const previousRoomId = this.currentRoom.id;

    try {
      await this.session.transitionTo(roomId);
    } catch (error) {
      this.gameEvents.emit("message", {
        tone: "warning",
        text: `방 이동은 계속하지만 저장에 실패했습니다: ${getErrorMessage(error)}`,
      });
    }

    this.mountRoom(roomId, previousRoomId);
  }

  private async completeEscape(): Promise<void> {
    const result = await this.session.completeEscape();
    this.gameEvents.emit("complete", result);
    this.gameEvents.emit("message", {
      tone: "success",
      text: result.stageTwoUnlocked
        ? "Stage 1을 클리어하고 Stage 2를 해금했습니다."
        : "Stage 1을 클리어했습니다.",
    });
    this.publishHud();
  }

  private createHudState(): StageOneHudState {
    const state = this.session.getState();
    const prompt = this.activeInteraction
      ? typeof this.activeInteraction.prompt === "function"
        ? this.activeInteraction.prompt(state)
        : this.activeInteraction.prompt
      : null;

    return {
      roomId: this.currentRoom.id,
      roomName: STAGE_ONE_ROOM_DISPLAY_NAMES[this.currentRoom.id],
      objective: this.currentRoom.getObjective(state),
      elapsedTimeMs: this.session.getElapsedTimeMs(),
      paused: this.paused,
      interactionPrompt: prompt,
      state,
    };
  }

  private updateHud(time: number): void {
    const prompt = this.activeInteraction
      ? typeof this.activeInteraction.prompt === "function"
        ? this.activeInteraction.prompt(this.session.getState())
        : this.activeInteraction.prompt
      : null;

    if (time - this.lastHudAt >= 250 || prompt !== this.lastInteractionPrompt) {
      this.lastHudAt = time;
      this.lastInteractionPrompt = prompt;
      this.publishHud();
    }
  }

  private publishHud(): void {
    if (this.currentRoom) {
      this.gameEvents.emit("hud", this.createHudState());
    }
  }

  private handleGameBlur(): void {
    this.setPaused(true);
  }

  private clearRoom(): void {
    this.roomCleanup?.();
    this.roomCleanup = null;

    for (const release of this.deferredModalInputReleases) {
      release();
    }

    this.deferredModalInputReleases.clear();
    this.modalInputLock.clear();

    for (const collider of this.roomColliders.splice(0)) {
      collider.destroy();
    }

    for (const gameObject of this.roomObjects.splice(0)) {
      gameObject.destroy();
    }

    this.interactions.length = 0;
    this.activeInteraction = null;
    this.lastInteractionPrompt = null;
  }

  private handleShutdown(): void {
    this.game.events.off(Phaser.Core.Events.BLUR, this.handleGameBlur, this);
    this.clearRoom();
    this.input.keyboard?.removeAllKeys(true);
  }
}
