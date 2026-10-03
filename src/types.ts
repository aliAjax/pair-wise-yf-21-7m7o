// 地毯修复纹样档案 —— 按工序记实测尺寸 / 圈选 / 补线 的领域模型

export type StepStatus = "done" | "active" | "locked";

/** 工序种类：measure 类工序会改变尺寸（登记/湿洗/拉伸），mark 为破损圈选，repair 为补线，complete 为完工 */
export type StepKind = "measure" | "mark" | "repair" | "complete";

/** 一次实测尺寸记录 */
export type Measurement = {
  id: string;
  stepKey: string;
  length: number; // 长 cm
  width: number; // 宽 cm
  measuredAt: string; // ISO 时间
  note?: string;
};

/** 色卡 */
export type ColorCard = {
  id: string;
  name: string;
  hex: string;
};

/** 破损区域圈选（位置/半径均为相对毯子的百分比，颜色关联色卡） */
export type DamageMark = {
  id: string;
  x: number; // % 0-100
  y: number; // % 0-100
  r: number; // % 相对半径
  colorId: string;
};

/** 圈选按当前尺寸换算后的结果 */
export type MarkComputed = DamageMark & {
  areaCm2: number; // 实际面积 cm²
  threadM: number; // 该圈选需补线长度 m
};

/** 某色卡的补线合计 */
export type ThreadLine = {
  colorId: string;
  colorName: string;
  hex: string;
  lengthM: number;
};

/** 工序完工时冻结的快照：当时尺寸 + 当时圈选换算 + 当时用线量 */
export type StepSnapshot = {
  length: number;
  width: number;
  measuredAt: string;
  marks: MarkComputed[];
  thread: ThreadLine[];
};

export type Step = {
  key: string;
  name: string;
  kind: StepKind;
  status: StepStatus;
  doneAt?: string;
  snapshot?: StepSnapshot;
};

export type ReviewState = "ok" | "pending";

export type Carpet = {
  id: string;
  name: string;
  origin: string; // 产地
  era: string; // 年代
  knotDensity: number; // 结密度（结/单位面积，影响用线系数）
  material: string; // 材质
  dyeType: string; // 染色类型
  tolerancePct: number; // 登记公差 %
  archiveLength: number; // 档案最早尺寸
  archiveWidth: number;
  measurements: Measurement[];
  steps: Step[];
  marks: DamageMark[];
  review: ReviewState;
  reviewReason?: string;
  confirmedAt?: string;
};
