import type {
  StageOneRoomModule,
  StageOneRoomMountContext,
} from "@/game/stage-one/contracts";

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;

/**
 * 과학 실험실 기본 타일, 바닥, 벽 그래픽 및 경계 충돌 설정
 */
function drawRoomBase(context: StageOneRoomMountContext, title: string): void {
  const { scene } = context;
  const floor = scene.add.graphics();

  // 과학 실험실 특유의 어두운 청록빛 바닥 (0x05131a)
  floor.fillStyle(0x05131a, 1);
  floor.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // 그리드 라인 (실험실 타일 느낌: 0x143240, 0.4 opacity)
  floor.lineStyle(1, 0x143240, 0.4);

  for (let x = 0; x <= WORLD_WIDTH; x += 48) {
    floor.lineBetween(x, 0, x, WORLD_HEIGHT);
  }

  for (let y = 0; y <= WORLD_HEIGHT; y += 48) {
    floor.lineBetween(0, y, WORLD_WIDTH, y);
  }

  floor.setDepth(-20);
  context.track(floor);

  // 방 타이틀 레이블
  const label = scene.add
    .text(48, 44, title, {
      color: "#e2e8f0",
      fontFamily: "Pretendard, Noto Sans KR, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
    })
    .setDepth(-5);
  context.track(label);

  // 사방 외곽 충돌 벽 설정 (A 파트 공통 규격)
  context.addWall({
    x: WORLD_WIDTH / 2,
    y: 16,
    width: WORLD_WIDTH,
    height: 32,
  });
  context.addWall({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT - 16,
    width: WORLD_WIDTH,
    height: 32,
  });
  context.addWall({
    x: 16,
    y: WORLD_HEIGHT / 2,
    width: 32,
    height: WORLD_HEIGHT,
  });
  context.addWall({
    x: WORLD_WIDTH - 16,
    y: WORLD_HEIGHT / 2,
    width: 32,
    height: WORLD_HEIGHT,
  });
}

/**
 * D 파트 - 과학 실험실 Room 모듈 정의
 */
export const scienceLabRoom: StageOneRoomModule = {
  id: "science-lab",
  displayName: "과학 실험실",

  getObjective: (state) => {
    if (!state.archiveClueFound) {
      return "연구 자료실의 단서를 먼저 확보해야 실험 장치를 작동할 수 있습니다.";
    }
    if (state.scienceLabPuzzleSolved) {
      return "실험 장치가 안전 상태입니다. 보안 통제실 코드를 확인하세요.";
    }
    return "실험 장치를 올바른 순서(화학기호→밀도→산소→점화→가열)로 가동하여 보안 코드를 획득하세요.";
  },

  getAccess: () => ({ allowed: true }),

  getSpawnPoint(fromRoomId) {
    if (fromRoomId === "hallway") {
      return { x: 100, y: 270 };
    }
    return { x: 100, y: 270 };
  },

  mount(context) {
    const { scene } = context;
    // contracts.ts의 타입 구조에 따라 progress/state 객체 추출
    const progress = (context as any).progress || context;
    const currentState = progress.state || (context as any).state || {};
    const saveStateFn = progress.saveState || (context as any).saveState;

    // 1. 기본 배경 및 외곽 벽 생성
    drawRoomBase(context, "과학 실험실 (Science Lab)");

    // 2. 실험실 내부 구조물 & 가구 배치 (실험대, 시약장)
    context.addWall({ x: 480, y: 270, width: 280, height: 120 }, 0x0f2330);

    const mainBenchText = scene.add
      .text(480, 270, "[ 메인 순차 실험 장치 ]", {
        align: "center",
        color: "#67e8f9",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(9);
    context.track(mainBenchText);

    // 상단 시약장 및 보조 장비 (충돌 벽)
    context.addWall({ x: 480, y: 90, width: 360, height: 48 }, 0x162c3d);
    const shelfText = scene.add
      .text(480, 90, "시약 선반 및 화학 물질 보관함", {
        align: "center",
        color: "#94a3b8",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        fontSize: "12px",
      })
      .setOrigin(0.5)
      .setDepth(9);
    context.track(shelfText);

    // 3. 포털 설정 (중앙 복도로 돌아가는 문)
    context.addPortal({
      id: "science-lab-to-hallway",
      targetRoomId: "hallway",
      position: { x: 60, y: 270 },
    });

    // 4. 상태 기반 인터랙티브 퍼즐 오브젝트 연동
    const isClueFound = !!currentState.archiveClueFound;
    const isSolved = !!currentState.scienceLabPuzzleSolved;

    // 안내 상태 표시판
    const statusBg = scene.add.graphics();
    statusBg.fillStyle(isSolved ? 0x064e3b : isClueFound ? 0x1e3a5f : 0x451a03, 0.8);
    statusBg.fillRoundedRect(680, 40, 240, 90, 8);
    statusBg.lineStyle(2, isSolved ? 0x10b981 : isClueFound ? 0x3b82f6 : 0xf59e0b, 1);
    statusBg.strokeRoundedRect(680, 40, 240, 90, 8);
    statusBg.setDepth(5);
    context.track(statusBg);

    let statusTitleText = "장치 제어반 상태";
    let statusDescText = "";

    if (!isClueFound) {
      statusDescText = "🔒 잠김: 연구 자료실 단서 필요\n(archiveClueFound = false)";
    } else if (isSolved) {
      statusDescText = "✅ 가열 및 반응 완료!\n보안 통제실 코드: [ CTRL-8029 ]";
    } else {
      statusDescText = "READY: 순서 대기 중\n1.기호 ➔ 2.밀도 ➔ 3.산소\n➔ 4.점화 ➔ 5.가열";
    }

    const statusText = scene.add
      .text(700, 52, `${statusTitleText}\n${statusDescText}`, {
        color: isSolved ? "#6ee7b7" : isClueFound ? "#93c5fd" : "#fcd34d",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        fontSize: "12px",
        lineSpacing: 4,
      })
      .setDepth(6);
    context.track(statusText);

    // 5. 상호작용 키 (E) 및 안내 텍스트 구성
    const interactLabel = isSolved
      ? "보안 코드 재확인 (E)"
      : isClueFound
      ? "실험 장치 조작 (E)"
      : "실험 장치 조사 (E)";

    const promptText = scene.add
      .text(480, 350, interactLabel, {
        color: "#ffffff",
        backgroundColor: "#1e293b",
        padding: { x: 8, y: 4 },
        fontSize: "12px",
        fontFamily: "Pretendard, Noto Sans KR, sans-serif",
      })
      .setOrigin(0.5)
      .setDepth(10);
    context.track(promptText);

    // E 키 입력 이벤트 수신기 연동
    const keyE = scene.input.keyboard?.addKey("E");
    const onKeyDown = () => {
      if (!currentState.archiveClueFound) {
        // D-LAB-001 피드백
        scene.events.emit("hud:message", {
          text: "연구 자료실에서 얻은 실험 관련 단서가 없어 장치를 안전하게 조작할 수 없습니다.",
          type: "warning",
        });
        return;
      }

      if (currentState.scienceLabPuzzleSolved) {
        // D-SAVE-002 완료 상태 재입장 시 코드 재확인
        scene.events.emit("hud:message", {
          text: "실험 장치가 안전 상태로 가동 중입니다. 보안 통제실 코드: [ CTRL-8029 ]",
          type: "info",
        });
        return;
      }

      // 퍼즐 인터페이스 트리거
      scene.events.emit("puzzle:open", {
        puzzleId: "science-lab-sequence",
        onSuccess: async () => {
          // D-SAVE-001: 성공 시 scienceLabPuzzleSolved = true 저장
          if (typeof saveStateFn === "function") {
            await saveStateFn({
              ...currentState,
              scienceLabPuzzleSolved: true,
            });
          }

          scene.events.emit("hud:message", {
            text: "실험 장치 조작 성공! 보안 통제실 코드가 발급되었습니다.",
            type: "success",
          });
        },
      });
    };

    keyE?.on("down", onKeyDown);
  },
};

export default scienceLabRoom;