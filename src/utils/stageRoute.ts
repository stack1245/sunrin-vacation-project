const POSTGRES_INTEGER_MAX = 2_147_483_647;

export function parseStageIdPathSegment(segment: string): number | null {
  if (!/^[1-9]\d*$/.test(segment)) {
    return null;
  }

  const stageId = Number(segment);

  return Number.isSafeInteger(stageId) && stageId <= POSTGRES_INTEGER_MAX
    ? stageId
    : null;
}

export function createStagePath(stageId: number): `/stages/${number}` {
  if (
    !Number.isInteger(stageId) ||
    stageId <= 0 ||
    stageId > POSTGRES_INTEGER_MAX
  ) {
    throw new Error("유효한 스테이지 ID가 필요합니다.");
  }

  return `/stages/${stageId}`;
}
