import type {
  Carpet,
  DamageMark,
  Dimensions,
  Measurement,
  StepId,
  YarnUse,
} from "./types";

export const STEP_META: {
  id: StepId;
  name: string;
  /** 是否会引起毯面尺寸变化 */
  changesSize: boolean;
}[] = [
  { id: "inspection", name: "初检建档", changesSize: false },
  { id: "wet_wash", name: "湿洗", changesSize: true },
  { id: "stretch", name: "拉伸定型", changesSize: true },
  { id: "repair", name: "补织修复", changesSize: false },
  { id: "finish", name: "完工验收", changesSize: false },
];

export const STEP_ORDER: StepId[] = STEP_META.map((s) => s.id);

/** 含 10% 损耗的补线换算：每 100cm² 破损需 1m 线（结密度系数另计） */
const BASE_M_PER_CM2 = 0.01;
const WASTE = 1.1;

export function areaOf(d: DamageMark, dims: Dimensions): number {
  // 椭圆圈选面积（cm²），比例半径 × 当前幅宽/长度
  const a = d.rx * dims.width;
  const b = d.ry * dims.length;
  return Math.PI * a * b;
}

/** 单块破损在当前尺寸下需要的补线长度（m），结密度越高用线越多 */
export function yarnOf(
  d: DamageMark,
  dims: Dimensions,
  knotDensity: number
): number {
  const knotFactor = 30 / Math.max(knotDensity, 1);
  return areaOf(d, dims) * BASE_M_PER_CM2 * knotFactor * WASTE;
}

/** 汇总各色卡的补线领用长度（m），未关联色卡的破损归入未配色 */
export function calcYarnUse(
  damages: DamageMark[],
  dims: Dimensions,
  knotDensity: number
): YarnUse[] {
  const map = new Map<string, number>();
  for (const d of damages) {
    const len = yarnOf(d, dims, knotDensity);
    const card = d.cardIds[0] ?? "__none__";
    map.set(card, (map.get(card) ?? 0) + len);
  }
  return [...map.entries()].map(([cardId, length]) => ({
    cardId,
    length: Math.round(length * 100) / 100,
  }));
}

export function totalYarn(yarn: YarnUse[]): number {
  return Math.round(yarn.reduce((s, y) => s + y.length, 0) * 100) / 100;
}

export function latestMeasurement(
  steps: Carpet["steps"],
  upToStep?: StepId
): Measurement | null {
  const upto = upToStep ? STEP_ORDER.indexOf(upToStep) : STEP_ORDER.length;
  let found: Measurement | null = null;
  for (let i = 0; i <= upto && i < STEP_ORDER.length; i++) {
    const list = steps[STEP_ORDER[i]].measurements;
    if (list.length) found = list[list.length - 1];
  }
  return found;
}

/** 当前有效尺寸：取全毯最近一次实测；无实测时退回档案登记尺寸 */
export function currentDims(c: Carpet): Dimensions {
  const m = latestMeasurement(c.steps);
  return m ? { width: m.width, length: m.length } : { ...c.registered };
}

export function dimsAtStep(c: Carpet, stepId: StepId): Dimensions {
  const m = latestMeasurement(c.steps, stepId);
  return m ? { width: m.width, length: m.length } : { ...c.registered };
}

/**
 * 公差复核：同一道工序两次实测（或与前序最近实测）幅宽/长度
 * 超过登记公差时需要师傅确认。
 */
export function checkTolerance(
  c: Carpet,
  stepId: StepId,
  m: Measurement
): { ok: boolean; against: Measurement | null; dW: number; dL: number } {
  const own = c.steps[stepId].measurements;
  const against =
    own.length > 0
      ? own[own.length - 1]
      : latestMeasurement(c.steps, prevStep(stepId));
  if (!against) return { ok: true, against: null, dW: 0, dL: 0 };
  const dW = Math.abs(m.width - against.width);
  const dL = Math.abs(m.length - against.length);
  return {
    ok: dW <= c.widthTol && dL <= c.lengthTol,
    against,
    dW: Math.round(dW * 10) / 10,
    dL: Math.round(dL * 10) / 10,
  };
}

export function prevStep(id: StepId): StepId {
  const i = STEP_ORDER.indexOf(id);
  return STEP_ORDER[Math.max(0, i - 1)];
}

export function nextStep(id: StepId): StepId | null {
  const i = STEP_ORDER.indexOf(id);
  return STEP_ORDER[i + 1] ?? null;
}

/** 待复核未确认前，后续工序不允许推进 */
export function stepBlocked(c: Carpet, stepId: StepId): boolean {
  if (!c.review) return false;
  return STEP_ORDER.indexOf(stepId) > STEP_ORDER.indexOf(c.review.stepId);
}

/** 上一道工序未完工则本道不能开始 */
export function stepLocked(c: Carpet, stepId: StepId): boolean {
  const i = STEP_ORDER.indexOf(stepId);
  if (i === 0) return false;
  return !c.steps[STEP_ORDER[i - 1]].done;
}

export function fmtDims(d: Dimensions): string {
  return `${d.width} × ${d.length} cm`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
