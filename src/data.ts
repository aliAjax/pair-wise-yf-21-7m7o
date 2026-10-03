import type { Carpet, DamageMark, Measurement, Step, StepKind } from "./types";
import { computeMarks, computeThread } from "./utils";

export const STEP_TEMPLATES: { key: string; name: string; kind: StepKind }[] = [
  { key: "intake", name: "登记建档", kind: "measure" },
  { key: "wash", name: "湿洗", kind: "measure" },
  { key: "stretch", name: "拉伸定型", kind: "measure" },
  { key: "marking", name: "破损圈选", kind: "mark" },
  { key: "repair", name: "补线修复", kind: "repair" },
  { key: "finish", name: "完工验收", kind: "complete" },
];

const T = (day: string, h = "10:00"): string => `2026-${day}T${h}:00`;

const m = (
  id: string,
  stepKey: string,
  length: number,
  width: number,
  at: string,
  note?: string
): Measurement => ({ id, stepKey, length, width, measuredAt: at, note });

const mark = (
  id: string,
  x: number,
  y: number,
  r: number,
  colorId: string
): DamageMark => ({ id, x, y, r, colorId });

/** 已完成的 measure 工序：快照冻结当时尺寸，圈选/用线为空（破损尚未圈选） */
function measureSnapshotStep(
  key: string,
  length: number,
  width: number,
  at: string,
  doneAt: string
): Step {
  const tpl = STEP_TEMPLATES.find((t) => t.key === key)!;
  return {
    key,
    name: tpl.name,
    kind: tpl.kind,
    status: "done",
    doneAt,
    snapshot: { length, width, measuredAt: at, marks: [], thread: [] },
  };
}

/** 已完成的圈选工序：快照冻结当时尺寸 + 当时圈选换算 + 当时用线量 */
function markingSnapshotStep(
  length: number,
  width: number,
  at: string,
  doneAt: string,
  marks: DamageMark[],
  carpet: Carpet
): Step {
  const tpl = STEP_TEMPLATES.find((t) => t.key === "marking")!;
  return {
    key: "marking",
    name: tpl.name,
    kind: tpl.kind,
    status: "done",
    doneAt,
    snapshot: {
      length,
      width,
      measuredAt: at,
      marks: computeMarks(marks, { length, width }, carpet),
      thread: computeThread(marks, { length, width }, carpet),
    },
  };
}

function buildSteps(
  done: Step[],
  activeKey: string | null
): Step[] {
  const doneKeys = new Set(done.map((s) => s.key));
  let activeUsed = false;
  return STEP_TEMPLATES.map((tpl) => {
    const existing = done.find((s) => s.key === tpl.key);
    if (existing) return existing;
    if (activeKey ? tpl.key === activeKey : !activeUsed) {
      activeUsed = true;
      return { key: tpl.key, name: tpl.name, kind: tpl.kind, status: "active" };
    }
    return { key: tpl.key, name: tpl.name, kind: tpl.kind, status: "locked" };
  });
}

export function seedCarpets(): Carpet[] {
  // CAR-092 波斯羊毛毯：三道尺寸工序已完成，圈选进行中（用当前最新尺寸实时换算）
  const car092: Carpet = {
    id: "CAR-092",
    name: "波斯·手工羊毛毯",
    origin: "波斯",
    era: "约1960s",
    knotDensity: 42,
    material: "羊毛",
    dyeType: "植物染",
    tolerancePct: 2.0,
    archiveLength: 210,
    archiveWidth: 145,
    measurements: [
      m("ms-092-1", "intake", 210, 145, T("09-20", "09:30"), "档案登记尺寸"),
      m("ms-092-2", "wash", 206, 142, T("09-22", "14:10"), "湿洗后复测"),
      m("ms-092-3", "stretch", 208, 144, T("09-24", "11:00"), "拉伸定型后复测"),
    ],
    steps: [],
    marks: [
      mark("mk-092-1", 30, 42, 12, "c1"),
      mark("mk-092-2", 62, 66, 9, "c2"),
    ],
    review: "ok",
  };
  car092.steps = buildSteps(
    [
      measureSnapshotStep("intake", 210, 145, T("09-20", "09:30"), T("09-20", "09:35")),
      measureSnapshotStep("wash", 206, 142, T("09-22", "14:10"), T("09-22", "14:40")),
      measureSnapshotStep("stretch", 208, 144, T("09-24", "11:00"), T("09-24", "11:30")),
    ],
    "marking"
  );

  // CAR-117 安纳托利亚植物染毯：湿洗后尺寸变化超公差，挂待复核，工序不可继续
  const car117: Carpet = {
    id: "CAR-117",
    name: "安纳托利亚·植物染毯",
    origin: "安纳托利亚",
    era: "约1950s",
    knotDensity: 42,
    material: "羊毛",
    dyeType: "植物染",
    tolerancePct: 2.0,
    archiveLength: 180,
    archiveWidth: 120,
    measurements: [
      m("ms-117-1", "intake", 180, 120, T("09-21", "10:00"), "档案登记尺寸"),
      m("ms-117-2", "wash", 168, 111, T("09-23", "15:20"), "湿洗后复测，缩水明显"),
    ],
    steps: [],
    marks: [mark("mk-117-1", 45, 50, 10, "c2")],
    review: "pending",
    reviewReason: "湿洗后尺寸变化 长 6.7% / 宽 7.5%，超过登记公差 2.0%",
  };
  car117.steps = buildSteps(
    [measureSnapshotStep("intake", 180, 120, T("09-21", "10:00"), T("09-21", "10:05"))],
    "wash"
  );

  // CAR-138 藏毯：圈选已完成并冻结快照，补线工序进行中
  const car138: Carpet = {
    id: "CAR-138",
    name: "藏毯·靛蓝纹样毯",
    origin: "藏毯",
    era: "约1970s",
    knotDensity: 30,
    material: "羊毛",
    dyeType: "矿物染",
    tolerancePct: 2.5,
    archiveLength: 160,
    archiveWidth: 95,
    measurements: [
      m("ms-138-1", "intake", 160, 95, T("09-18", "09:00"), "档案登记尺寸"),
      m("ms-138-2", "wash", 158, 94, T("09-19", "10:30"), "湿洗后复测"),
      m("ms-138-3", "stretch", 159, 95, T("09-20", "11:00"), "拉伸定型后复测"),
      m("ms-138-4", "marking", 159, 95, T("09-21", "14:00"), "圈选时复测"),
    ],
    steps: [],
    marks: [
      mark("mk-138-1", 28, 38, 11, "c1"),
      mark("mk-138-2", 55, 60, 8, "c3"),
      mark("mk-138-3", 70, 30, 7, "c1"),
    ],
    review: "ok",
  };
  car138.steps = buildSteps(
    [
      measureSnapshotStep("intake", 160, 95, T("09-18", "09:00"), T("09-18", "09:10")),
      measureSnapshotStep("wash", 158, 94, T("09-19", "10:30"), T("09-19", "11:00")),
      measureSnapshotStep("stretch", 159, 95, T("09-20", "11:00"), T("09-20", "11:30")),
      markingSnapshotStep(159, 95, T("09-21", "14:00"), T("09-21", "15:00"), car138.marks, car138),
    ],
    "repair"
  );

  return [car092, car117, car138];
}
