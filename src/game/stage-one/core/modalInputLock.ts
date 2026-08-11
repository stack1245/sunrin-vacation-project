/**
 * Stage 1 모달 입력 잠금.
 *
 * 여러 Room 모달이 중첩되어도 마지막 잠금이 해제될 때까지 입력 차단을 유지한다.
 * 반환된 해제 함수는 여러 번 호출해도 안전하다.
 */
export class StageOneModalInputLock {
  private readonly tokens = new Set<symbol>();

  isActive(): boolean {
    return this.tokens.size > 0;
  }

  acquire(): () => void {
    const token = Symbol("stage-one-modal-input-lock");
    let released = false;

    this.tokens.add(token);

    return () => {
      if (released) {
        return;
      }

      released = true;
      this.tokens.delete(token);
    };
  }

  clear(): void {
    this.tokens.clear();
  }
}
