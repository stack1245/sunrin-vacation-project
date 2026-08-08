/**
 * E 파트 · 가짜 F12(가상 DevTools) Phaser 어댑터
 *
 * 퍼즐 뷰모델을 Phaser 게임 오브젝트로 그리고 키 입력을 퍼즐 조작으로 옮기는 얇은 계층이다.
 * 판정·상태·저장 규칙은 전혀 갖지 않는다.
 *
 * ## 실제 개발자 도구와의 분리
 *
 * 이 창은 게임 캔버스 위에 Phaser 도형과 텍스트로만 그려진다. 실제 브라우저 F12,
 * DevTools 프로토콜, `document.cookie`, `localStorage`, 전역 `console` 을 사용하지 않으며
 * 브라우저 개발자 도구 권한을 요구하지도, 확인하지도 않는다.
 * 실제 F12 키는 바인딩하지 않는다. 브라우저 기본 동작을 가로채지 않기 위해서다.
 *
 * ## 생명주기
 *
 * `open()` 에서 오브젝트와 키 리스너를 만들고 `destroy()` 에서 전부 해제한다.
 * Room의 mount 정리 함수가 반드시 `destroy()` 를 호출하므로 방 전환·언마운트에서
 * 오브젝트나 리스너가 남지 않는다.
 */

import type Phaser from "phaser";

import {
  buildControlRoomViewModel,
  CONTROL_ROOM_VISIBLE_LINES,
  type ControlRoomPuzzleSnapshot,
  type ControlRoomStatusTone,
  type ControlRoomViewModel,
} from "../../puzzles/control-room/index.ts";
import type {
  ControlRoomTabId,
  VirtualConsoleLevel,
} from "../../puzzles/control-room/index.ts";

const DEPTH_BASE = 200;

const PANEL = {
  x: 480,
  y: 270,
  width: 884,
  height: 470,
} as const;

const LEFT = PANEL.x - PANEL.width / 2 + 24;
const TOP = PANEL.y - PANEL.height / 2;

const LINE_HEIGHT = 22;
const BODY_TOP = TOP + 104;

const MONO_FONT = "Consolas, D2Coding, Menlo, monospace";

const LEVEL_COLORS: Record<VirtualConsoleLevel, string> = {
  system: "#7f8ea6",
  input: "#d8cbff",
  output: "#e5e7eb",
  success: "#86efac",
  warning: "#fcd34d",
  error: "#fca5a5",
};

const TONE_COLORS: Record<ControlRoomStatusTone, string> = {
  info: "#a99ad8",
  success: "#86efac",
  warning: "#fcd34d",
  error: "#fca5a5",
};

/** 어댑터가 퍼즐 상태 머신에 전달하는 조작. */
export interface FakeDevtoolsOverlayHandlers {
  onType(character: string): void;
  onBackspace(): void;
  onSubmit(): void;
  onCycleTab(direction: 1 | -1): void;
  onRequestClose(): void;
}

/** 인쇄 가능한 단일 문자인지 확인한다. 조합 키와 기능 키를 걸러낸다. */
function isPrintableKey(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}

export class FakeDevtoolsOverlay {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly bodyTexts: Phaser.GameObjects.Text[] = [];
  private readonly tabTexts: Phaser.GameObjects.Text[] = [];
  private titleText: Phaser.GameObjects.Text | null = null;
  private inputText: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private footerText: Phaser.GameObjects.Text | null = null;
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private opened = false;
  /** 마지막으로 그린 탭. 닫기 단축키가 콘솔 입력과 충돌하지 않도록 참조한다. */
  private activeTab: ControlRoomTabId = "console";
  private readonly scene: Phaser.Scene;
  private readonly handlers: FakeDevtoolsOverlayHandlers;

  constructor(scene: Phaser.Scene, handlers: FakeDevtoolsOverlayHandlers) {
    this.scene = scene;
    this.handlers = handlers;
  }

  /** 창이 떠 있는지 확인한다. */
  isOpen(): boolean {
    return this.opened;
  }

  /** 창을 생성하고 키 입력을 연결한다. 이미 열려 있으면 갱신만 한다. */
  open(snapshot: ControlRoomPuzzleSnapshot): void {
    if (this.opened) {
      this.render(snapshot);
      return;
    }

    this.opened = true;
    this.build();
    this.attachKeyboard();
    this.render(snapshot);
  }

  /** 스냅숏을 화면에 반영한다. */
  render(snapshot: ControlRoomPuzzleSnapshot): void {
    if (!this.opened) {
      return;
    }

    this.activeTab = snapshot.activeTab;
    this.apply(buildControlRoomViewModel(snapshot));
  }

  /** 오브젝트와 키 리스너를 모두 해제한다. 여러 번 호출해도 안전하다. */
  destroy(): void {
    this.detachKeyboard();

    for (const object of this.objects.splice(0)) {
      object.destroy();
    }

    this.bodyTexts.length = 0;
    this.tabTexts.length = 0;
    this.titleText = null;
    this.inputText = null;
    this.statusText = null;
    this.footerText = null;
    this.opened = false;
  }

  private build(): void {
    const backdrop = this.scene.add
      .rectangle(480, 270, 960, 540, 0x030708, 0.78)
      .setScrollFactor(0)
      .setDepth(DEPTH_BASE);
    const panel = this.scene.add
      .rectangle(PANEL.x, PANEL.y, PANEL.width, PANEL.height, 0x0b1018, 0.98)
      .setStrokeStyle(2, 0x8b7ec8, 0.9)
      .setScrollFactor(0)
      .setDepth(DEPTH_BASE + 1);
    const titleBar = this.scene.add
      .rectangle(PANEL.x, TOP + 20, PANEL.width, 40, 0x151a24, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH_BASE + 2);

    this.objects.push(backdrop, panel, titleBar);

    this.titleText = this.addText(LEFT, TOP + 12, "", 14, "#d8cbff");

    for (let index = 0; index < 4; index += 1) {
      this.tabTexts.push(
        this.addText(LEFT + index * 132, TOP + 60, "", 13, "#7f8ea6"),
      );
    }

    const divider = this.scene.add
      .rectangle(PANEL.x, TOP + 90, PANEL.width - 32, 1, 0x2a3346, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH_BASE + 2);
    this.objects.push(divider);

    for (let index = 0; index < CONTROL_ROOM_VISIBLE_LINES; index += 1) {
      this.bodyTexts.push(
        this.addText(LEFT, BODY_TOP + index * LINE_HEIGHT, "", 13, "#e5e7eb"),
      );
    }

    const inputBar = this.scene.add
      .rectangle(
        PANEL.x,
        BODY_TOP + CONTROL_ROOM_VISIBLE_LINES * LINE_HEIGHT + 18,
        PANEL.width - 32,
        30,
        0x121826,
        1,
      )
      .setScrollFactor(0)
      .setDepth(DEPTH_BASE + 2);
    this.objects.push(inputBar);

    this.inputText = this.addText(
      LEFT,
      BODY_TOP + CONTROL_ROOM_VISIBLE_LINES * LINE_HEIGHT + 8,
      "",
      14,
      "#d8cbff",
    );
    this.statusText = this.addText(
      LEFT,
      BODY_TOP + CONTROL_ROOM_VISIBLE_LINES * LINE_HEIGHT + 48,
      "",
      13,
      "#a99ad8",
    );
    this.footerText = this.addText(
      LEFT,
      TOP + PANEL.height - 30,
      "",
      12,
      "#5f6b80",
    );
  }

  private addText(
    x: number,
    y: number,
    value: string,
    size: number,
    color: string,
  ): Phaser.GameObjects.Text {
    const text = this.scene.add
      .text(x, y, value, {
        color,
        fontFamily: MONO_FONT,
        fontSize: `${size}px`,
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_BASE + 3);

    this.objects.push(text);
    return text;
  }

  private apply(view: ControlRoomViewModel): void {
    this.titleText?.setText(view.title);

    view.tabs.forEach((tab, index) => {
      const target = this.tabTexts[index];

      if (!target) {
        return;
      }

      target.setText(tab.active ? `[ ${tab.label} ]` : `  ${tab.label}  `);
      target.setColor(tab.active ? "#d8cbff" : "#5f6b80");
    });

    for (let index = 0; index < this.bodyTexts.length; index += 1) {
      const target = this.bodyTexts[index];
      const line = view.bodyLines[index];

      if (line) {
        target.setText(line.text);
        target.setColor(LEVEL_COLORS[line.level]);
      } else {
        target.setText("");
      }
    }

    this.inputText?.setText(
      view.caretVisible ? `${view.inputLine}_` : view.inputLine,
    );
    this.statusText?.setText(view.statusText);
    this.statusText?.setColor(TONE_COLORS[view.statusTone]);
    this.footerText?.setText(view.footer);
  }

  private attachKeyboard(): void {
    const keyboard = this.scene.input.keyboard;

    if (!keyboard) {
      return;
    }

    this.keyHandler = (event: KeyboardEvent) => {
      if (!this.opened) {
        return;
      }

      switch (event.key) {
        case "Enter":
          event.preventDefault();
          this.handlers.onSubmit();
          return;
        case "Backspace":
          event.preventDefault();
          this.handlers.onBackspace();
          return;
        case "Tab":
          event.preventDefault();
          this.handlers.onCycleTab(event.shiftKey ? -1 : 1);
          return;
        case "Escape":
          this.handlers.onRequestClose();
          return;
        default:
          break;
      }

      // 콘솔 탭에서는 모든 인쇄 문자가 명령 입력이므로 Q 단축키를 쓰지 않는다.
      if (
        this.activeTab !== "console" &&
        (event.key === "q" || event.key === "Q")
      ) {
        this.handlers.onRequestClose();
        return;
      }

      if (isPrintableKey(event)) {
        this.handlers.onType(event.key);
      }
    };

    keyboard.on("keydown", this.keyHandler);
  }

  private detachKeyboard(): void {
    if (this.keyHandler) {
      this.scene.input.keyboard?.off("keydown", this.keyHandler);
      this.keyHandler = null;
    }
  }
}
