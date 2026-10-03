import type {
  Carpet,
  ColorCard,
  DamageMark,
  MarkComputed,
  Measurement,
  ThreadLine,
} from "./types";

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** 色卡领用的色卡目录（全局） */
export const COLOR_CARDS: ColorCard[] = [
  { id: "c1", name: "靛蓝", hex: "#1e3a8a" },
  { id: "c2", name: "茜红", hex: "#9f1239" },
  { id: "c3", name: "驼色", hex: "#92400e" },
  { id: "c4", name: "米白", hex: "#e7e5e4" },
  { id: "c5", name: "墨绿", hex: "#064e3b" },
];

export const colorCardOf = (id: string): ColorCard =>
  COLOR_CARDS.find((c) => c.id === id) ?? COLOR_CARDS[0];

/**
 * 毯子当前尺寸：取最近一次实测；从未实测则回退到档案最早尺寸。
 */
export function currentDims(carpet: Carpet): {
  length: number;
  width: number;
  measuredAt?: string;
} {
  const m = carpet.measurements[carpet.measurements.length - 1];
  if (m) return { length: m.length, width: m.width, measuredAt: m.measuredAt };
  return { length: carpet.archiveLength, width: carpet.archiveWidth };
}

/**
 * 回填用的尺寸：优先最近一次实测，否则档案最早尺寸。
 * 用于工序实测录入框的默认值。
 */
export function backfillDims(carpet: Carpet): {
  length: number;
  width: number;
  measuredAt?: string;
  fromArchive: boolean;
} {
  const m = carpet.measurements[carpet.measurements.length - 1];
  if (m)
    return {
      length: m.length,
      width: m.width,
      measuredAt: m.measuredAt,
      fromArchive: false,
    };
  return {
    length: carpet.archiveLength,
    width: carpet.archiveWidth,
    fromArchive: true,
  };
}

/** 单个圈选按当前尺寸换算的实际面积（椭圆，r 为相对半轴） */
export function markAreaCm2(
  mark: DamageMark,
  length: number,
  width: number
): number {
  const rx = (mark.r / 100) * (length / 2);
  const ry = (mark.r / 100) * (width / 2);
  return Math.PI * rx * ry;
}

/** 每 cm² 破损的补线用量（m），与结密度挂钩 */
export function threadPerCm2(carpet: Carpet): number {
  return 0.02 + carpet.knotDensity / 2000;
}

/** 圈选按当前尺寸换算（面积 + 用线） */
export function computeMarks(
  marks: DamageMark[],
  dims: { length: number; width: number },
  carpet: Carpet
): MarkComputed[] {
  const per = threadPerCm2(carpet);
  return marks.map((m) => {
    const area = markAreaCm2(m, dims.length, dims.width);
    return {
      ...m,
      areaCm2: round2(area),
      threadM: round2(area * per),
    };
  });
}

/** 色卡领用：按色卡汇总当前补线长度 */
export function computeThread(
  marks: DamageMark[],
  dims: { length: number; width: number },
  carpet: Carpet
): ThreadLine[] {
  const computed = computeMarks(marks, dims, carpet);
  const map = new Map<string, number>();
  for (const m of computed) {
    map.set(m.colorId, (map.get(m.colorId) ?? 0) + m.threadM);
  }
  return COLOR_CARDS.filter((c) => map.has(c.id)).map((c) => ({
    colorId: c.id,
    colorName: c.name,
    hex: c.hex,
    lengthM: round2(map.get(c.id) ?? 0),
  }));
}

/** 全部圈选的补线合计 */
export function totalThread(thread: ThreadLine[]): number {
  return round2(thread.reduce((s, t) => s + t.lengthM, 0));
}

/**
 * 公差校验：相邻两次实测，长/宽相对变化的最大值是否超过登记公差。
 */
export function toleranceCheck(
  prev: Measurement | undefined,
  curr: Measurement,
  tolerancePct: number
): { exceeded: boolean; pct: number; dl: number; dw: number } {
  if (!prev) return { exceeded: false, pct: 0, dl: 0, dw: 0 };
  const dl = (Math.abs(curr.length - prev.length) / prev.length) * 100;
  const dw = (Math.abs(curr.width - prev.width) / prev.width) * 100;
  const pct = round2(Math.max(dl, dw));
  return { exceeded: pct > tolerancePct, pct, dl: round2(dl), dw: round2(dw) };
}

export const fmtDateTime = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
};
