export const RESOURCE_ZONE_IDS = ["A", "B", "C", "D", "E"] as const;

export type ResourceZoneId = (typeof RESOURCE_ZONE_IDS)[number];

export type ResourceAllocation = Record<ResourceZoneId, number>;

export const RESOURCE_ZONE_LABELS: Readonly<Record<ResourceZoneId, string>> = {
  A: "구역 A (주거)",
  B: "구역 B (산업)",
  C: "구역 C (연구)",
  D: "구역 D (농업)",
  E: "구역 E (발전)",
};

export const RESOURCE_ALLOCATION_RULES = [
  { id: "total", label: "총 자원 합계 100개" },
  { id: "zone-a-prime", label: "구역 A: 15 이상 30 이하의 소수" },
  { id: "zone-b-double-e", label: "구역 B: 구역 E의 정확히 2배" },
  {
    id: "zone-c-multiple-of-five",
    label: "구역 C: 5의 배수이면서 구역 A보다 큼",
  },
  { id: "zone-d-sum", label: "구역 D: 구역 A + 구역 E" },
  { id: "zone-e-multiple-of-eight", label: "구역 E: 8의 배수" },
] as const;

export type ResourceAllocationRuleId =
  (typeof RESOURCE_ALLOCATION_RULES)[number]["id"];

export interface ResourceAllocationEvaluation {
  total: number;
  ruleChecks: Readonly<Record<ResourceAllocationRuleId, boolean>>;
  isSolved: boolean;
}

const INITIAL_RESOURCE_ALLOCATION: ResourceAllocation = {
  A: 20,
  B: 20,
  C: 20,
  D: 20,
  E: 20,
};

const MINIMUM_ZONE_RESOURCES = 0;
const MAXIMUM_ZONE_RESOURCES = 100;
const REQUIRED_TOTAL_RESOURCES = 100;

function isPrime(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) {
    return false;
  }

  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) {
      return false;
    }
  }

  return true;
}

export function createInitialResourceAllocation(): ResourceAllocation {
  return { ...INITIAL_RESOURCE_ALLOCATION };
}

export function adjustResourceAllocation(
  allocation: ResourceAllocation,
  zoneId: ResourceZoneId,
  delta: number,
): ResourceAllocation {
  const nextValue = Math.min(
    MAXIMUM_ZONE_RESOURCES,
    Math.max(MINIMUM_ZONE_RESOURCES, allocation[zoneId] + delta),
  );

  return {
    ...allocation,
    [zoneId]: nextValue,
  };
}

export function evaluateResourceAllocation(
  allocation: ResourceAllocation,
): ResourceAllocationEvaluation {
  const { A, B, C, D, E } = allocation;
  const total = RESOURCE_ZONE_IDS.reduce(
    (sum, zoneId) => sum + allocation[zoneId],
    0,
  );
  const ruleChecks: Record<ResourceAllocationRuleId, boolean> = {
    total: total === REQUIRED_TOTAL_RESOURCES,
    "zone-a-prime": A >= 15 && A <= 30 && isPrime(A),
    "zone-b-double-e": B === E * 2,
    "zone-c-multiple-of-five": C % 5 === 0 && C > A,
    "zone-d-sum": D === A + E,
    "zone-e-multiple-of-eight": E % 8 === 0,
  };

  return {
    total,
    ruleChecks,
    isSolved: Object.values(ruleChecks).every(Boolean),
  };
}
