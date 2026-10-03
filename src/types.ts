export type StepId =
  | "inspection"
  | "wet_wash"
  | "stretch"
  | "repair"
  | "finish";

export interface Dimensions {
  /** 幅宽 cm */
  width: number;
  /** 长度 cm */
  length: number;
}

export interface Measurement extends Dimensions {
  /** yyyy-mm-dd */
  at: string;
  by: string;
}

/** 破损圈选：坐标/半径均为相对毯面的比例 0~1，尺寸变化时按比例自动换算 */
export interface DamageMark {
  id: string;
  code: string;
  desc: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** 领用色卡 id */
  cardIds: string[];
}

export interface ColorCard {
  id: string;
  name: string;
  hex: string;
  dye: string;
}

export interface YarnUse {
  cardId: string;
  /** 补线长度 m */
  length: number;
}

/** 工序完工时冻结的快照：保留当时尺寸与用线量 */
export interface StepSnapshot {
  at: string;
  dims: Dimensions;
  damages: DamageMark[];
  yarn: YarnUse[];
  totalYarn: number;
}

export interface StepState {
  measurements: Measurement[];
  done: boolean;
  doneAt?: string;
  snapshot?: StepSnapshot;
}

export interface PendingReview {
  stepId: StepId;
  measurement: Measurement;
  /** 作为比对基准的上一次实测 */
  against: Measurement;
  dW: number;
  dL: number;
}

export interface Carpet {
  id: string;
  origin: string;
  era: string;
  material: string;
  dye: string;
  /** 结密度：结 / 10cm */
  knotDensity: number;
  /** 档案里最早登记的尺寸 */
  registered: Dimensions;
  /** 登记公差 cm */
  widthTol: number;
  lengthTol: number;
  steps: Record<StepId, StepState>;
  damages: DamageMark[];
  /** 已领用色卡 id */
  cards: string[];
  review: PendingReview | null;
  beforeNote: string;
  afterNote: string;
  createdAt: string;
}
