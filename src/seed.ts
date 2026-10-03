import type { Carpet, ColorCard, StepId, StepState } from "./types";
import { STEP_ORDER } from "./domain";

export const COLOR_CARDS: ColorCard[] = [
  { id: "CC-01", name: "茜草红", hex: "#a43f2b", dye: "植物染·茜草根" },
  { id: "CC-02", name: "靛青", hex: "#22386b", dye: "植物染·木蓝" },
  { id: "CC-03", name: "藏红花金", hex: "#c98a1e", dye: "植物染·藏红花" },
  { id: "CC-04", name: "胡桃褐", hex: "#6b4a2f", dye: "植物染·胡桃皮" },
  { id: "CC-05", name: "石灰白", hex: "#e8e2d4", dye: "天然羊毛本白" },
  { id: "CC-06", name: "松烟墨", hex: "#2f3437", dye: "松烟染" },
];

function emptySteps(): Record<StepId, StepState> {
  return STEP_ORDER.reduce(
    (acc, id) => {
      acc[id] = { measurements: [], done: false };
      return acc;
    },
    {} as Record<StepId, StepState>
  );
}

export const SEED_CARPETS: Carpet[] = [
  {
    id: "CAR-092",
    origin: "波斯",
    era: "约1960s",
    material: "羊毛",
    dye: "植物染",
    knotDensity: 36,
    // 档案最早登记尺寸：湿洗拉伸后毯面回缩，师傅仍按此圈选导致对不上
    registered: { width: 212, length: 318 },
    widthTol: 3,
    lengthTol: 5,
    steps: (() => {
      const s = emptySteps();
      s.inspection.measurements = [
        { at: "2026-09-02", by: "周师傅", width: 212, length: 318 },
      ];
      s.inspection.done = true;
      s.inspection.doneAt = "2026-09-02";
      s.wet_wash.measurements = [
        { at: "2026-09-12", by: "李师傅", width: 208, length: 311 },
      ];
      s.wet_wash.done = true;
      s.wet_wash.doneAt = "2026-09-12";
      s.stretch.measurements = [
        { at: "2026-09-20", by: "李师傅", width: 205, length: 307 },
      ];
      s.stretch.done = true;
      s.stretch.doneAt = "2026-09-20";
      return s;
    })(),
    damages: [
      {
        id: "D1",
        code: "边缘磨损-01",
        desc: "左侧穗头边磨损，需补经纬线",
        x: 0.04,
        y: 0.42,
        rx: 0.05,
        ry: 0.16,
        cardIds: ["CC-04"],
      },
      {
        id: "D2",
        code: "边角破洞-02",
        desc: "右下角蛀洞，约掌心大",
        x: 0.93,
        y: 0.92,
        rx: 0.06,
        ry: 0.05,
        cardIds: ["CC-05", "CC-01"],
      },
    ],
    cards: ["CC-04", "CC-05", "CC-01"],
    review: null,
    beforeNote: "边穗起毛，右角可见底板",
    afterNote: "",
    createdAt: "2026-09-02",
  },
  {
    id: "CAR-117",
    origin: "安纳托利亚",
    era: "约1930s",
    material: "羊毛·棉经",
    dye: "植物染",
    knotDensity: 42,
    registered: { width: 186, length: 264 },
    widthTol: 3,
    lengthTol: 5,
    steps: (() => {
      const s = emptySteps();
      s.inspection.measurements = [
        { at: "2026-09-15", by: "周师傅", width: 186, length: 264 },
      ];
      s.inspection.done = true;
      s.inspection.doneAt = "2026-09-15";
      s.wet_wash.measurements = [
        { at: "2026-09-25", by: "王师傅", width: 183, length: 258 },
        // 第二次量与第一次长度差 8cm，超过登记公差 5cm → 待复核
        { at: "2026-10-01", by: "王师傅", width: 182, length: 250 },
      ];
      return s;
    })(),
    damages: [
      {
        id: "D1",
        code: "中心纹样缺口",
        desc: "中心葵花纹纬线断裂缺绒",
        x: 0.5,
        y: 0.5,
        rx: 0.09,
        ry: 0.08,
        cardIds: ["CC-01", "CC-03"],
      },
    ],
    cards: ["CC-01", "CC-03"],
    review: {
      stepId: "wet_wash",
      measurement: { at: "2026-10-01", by: "王师傅", width: 182, length: 250 },
      against: { at: "2026-09-25", by: "王师傅", width: 183, length: 258 },
      dW: 1,
      dL: 8,
    },
    beforeNote: "中心纹样缺口约 15cm",
    afterNote: "",
    createdAt: "2026-09-15",
  },
  {
    id: "CAR-138",
    origin: "藏毯",
    era: "约1980s",
    material: "羊毛",
    dye: "植物染",
    knotDensity: 30,
    registered: { width: 154, length: 232 },
    widthTol: 4,
    lengthTol: 6,
    steps: (() => {
      const s = emptySteps();
      s.inspection.measurements = [
        { at: "2026-07-04", by: "周师傅", width: 154, length: 232 },
      ];
      s.inspection.done = true;
      s.inspection.doneAt = "2026-07-04";
      s.wet_wash.measurements = [
        { at: "2026-07-18", by: "李师傅", width: 151, length: 227 },
      ];
      s.wet_wash.done = true;
      s.wet_wash.doneAt = "2026-07-18";
      s.stretch.measurements = [
        { at: "2026-07-26", by: "李师傅", width: 150, length: 225 },
      ];
      s.stretch.done = true;
      s.stretch.doneAt = "2026-07-26";
      s.repair.measurements = [
        { at: "2026-08-09", by: "周师傅", width: 150, length: 225 },
      ];
      s.repair.done = true;
      s.repair.doneAt = "2026-08-12";
      s.finish.measurements = [
        { at: "2026-08-20", by: "周师傅", width: 150, length: 225 },
      ];
      s.finish.done = true;
      s.finish.doneAt = "2026-08-20";
      return s;
    })(),
    damages: [
      {
        id: "D1",
        code: "局部褪色-01",
        desc: "上半部靛蓝地色脱色",
        x: 0.5,
        y: 0.22,
        rx: 0.22,
        ry: 0.12,
        cardIds: ["CC-02"],
      },
    ],
    cards: ["CC-02"],
    review: null,
    beforeNote: "局部褪色，靛蓝发灰",
    afterNote: "重织后地色均匀，穗头整理完成",
    createdAt: "2026-07-04",
  },
  {
    id: "CAR-205",
    origin: "高加索",
    era: "约1970s",
    material: "羊毛",
    dye: "化学染",
    knotDensity: 33,
    registered: { width: 198, length: 286 },
    widthTol: 3,
    lengthTol: 5,
    steps: emptySteps(),
    damages: [
      {
        id: "D1",
        code: "边缝开裂",
        desc: "左侧边缝纵向开裂约 40cm",
        x: 0.03,
        y: 0.55,
        rx: 0.04,
        ry: 0.2,
        cardIds: [],
      },
    ],
    cards: [],
    review: null,
    beforeNote: "边缝开裂，等待初检",
    afterNote: "",
    createdAt: "2026-10-01",
  },
];
