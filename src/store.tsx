import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Carpet,
  DamageMark,
  Dimensions,
  Measurement,
  StepId,
  StepSnapshot,
} from "./types";
import {
  STEP_ORDER,
  calcYarnUse,
  checkTolerance,
  dimsAtStep,
  stepLocked,
  today,
  totalYarn,
} from "./domain";
import { SEED_CARPETS } from "./seed";

const STORAGE_KEY = "rug-archive-v1";

interface StoreValue {
  carpets: Carpet[];
  addCarpet: (c: Omit<Carpet, "steps" | "damages" | "cards" | "review" | "beforeNote" | "afterNote" | "createdAt">) => void;
  addMeasurement: (carpetId: string, stepId: StepId, m: Omit<Measurement, "at"> & { at?: string }) => void;
  /** 师傅确认偏差属实：解除待复核，工序可继续 */
  confirmReview: (carpetId: string) => void;
  /** 复测后撤销最近一次挂起的实测 */
  rejectMeasurement: (carpetId: string) => void;
  completeStep: (carpetId: string, stepId: StepId) => void;
  upsertDamage: (carpetId: string, d: DamageMark) => void;
  deleteDamage: (carpetId: string, damageId: string) => void;
  toggleDamageCard: (carpetId: string, damageId: string, cardId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** 为历史已完工但无快照的工序，按该工序当时尺寸回填快照（尺寸/用线量固化） */
function backfillSnapshots(c: Carpet): Carpet {
  let changed = false;
  const steps = { ...c.steps };
  for (const id of STEP_ORDER) {
    const st = steps[id];
    if (st.done && !st.snapshot) {
      changed = true;
      const dims = dimsAtStep(c, id);
      const yarn = calcYarnUse(c.damages, dims, c.knotDensity);
      const snap: StepSnapshot = {
        at: st.doneAt ?? today(),
        dims,
        damages: c.damages.map((d) => ({ ...d })),
        yarn,
        totalYarn: totalYarn(yarn),
      };
      steps[id] = { ...st, snapshot: snap };
    }
  }
  return changed ? { ...c, steps } : c;
}

function load(): Carpet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Carpet[];
  } catch {
    /* 忽略损坏缓存 */
  }
  return SEED_CARPETS.map(backfillSnapshots);
}

function emptySteps(): Carpet["steps"] {
  return STEP_ORDER.reduce(
    (acc, id) => {
      acc[id] = { measurements: [], done: false };
      return acc;
    },
    {} as Carpet["steps"]
  );
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [carpets, setCarpets] = useState<Carpet[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carpets));
  }, [carpets]);

  const value = useMemo<StoreValue>(
    () => ({
      carpets,

      addCarpet: (c) => {
        const carpet: Carpet = {
          ...c,
          steps: emptySteps(),
          damages: [],
          cards: [],
          review: null,
          beforeNote: "新档案，等待初检",
          afterNote: "",
          createdAt: today(),
        };
        setCarpets((cs) => [carpet, ...cs]);
      },

      addMeasurement: (carpetId, stepId, m) => {
        setCarpets((cs) =>
          cs.map((c) => {
            if (c.id !== carpetId || c.review) return c;
            if (stepLocked(c, stepId)) return c;
            const measurement: Measurement = {
              width: round1(m.width),
              length: round1(m.length),
              at: m.at ?? today(),
              by: m.by || "未署名",
            };
            const result = checkTolerance(c, stepId, measurement);
            const steps = {
              ...c.steps,
              [stepId]: {
                ...c.steps[stepId],
                measurements: [...c.steps[stepId].measurements, measurement],
              },
            };
            // 实测一更新：圈选换算与补线长度均由 currentDims 派生重算
            return {
              ...c,
              steps,
              review: result.ok
                ? null
                : {
                    stepId,
                    measurement,
                    against: result.against!,
                    dW: result.dW,
                    dL: result.dL,
                  },
            };
          })
        );
      },

      confirmReview: (carpetId) => {
        setCarpets((cs) =>
          cs.map((c) => (c.id === carpetId ? { ...c, review: null } : c))
        );
      },

      rejectMeasurement: (carpetId) => {
        setCarpets((cs) =>
          cs.map((c) => {
            if (c.id !== carpetId || !c.review) return c;
            const { stepId, measurement } = c.review;
            const list = c.steps[stepId].measurements;
            const idx = list.lastIndexOf(measurement);
            const kept = idx >= 0 ? list.filter((_, i) => i !== idx) : list;
            return {
              ...c,
              review: null,
              steps: {
                ...c.steps,
                [stepId]: { ...c.steps[stepId], measurements: kept },
              },
            };
          })
        );
      },

      completeStep: (carpetId, stepId) => {
        setCarpets((cs) =>
          cs.map((c) => {
            if (c.id !== carpetId) return c;
            if (c.review || stepLocked(c, stepId)) return c;
            const st = c.steps[stepId];
            if (st.done) return c;
            // 完工前必须已有实测尺寸（初检当工序或前序均可）
            if (!latestExists(c, stepId)) return c;
            const dims: Dimensions = dimsAtStep(c, stepId);
            const yarn = calcYarnUse(c.damages, dims, c.knotDensity);
            const snapshot: StepSnapshot = {
              at: today(),
              dims,
              damages: c.damages.map((d) => ({ ...d })),
              yarn,
              totalYarn: totalYarn(yarn),
            };
            return {
              ...c,
              steps: {
                ...c.steps,
                [stepId]: {
                  ...st,
                  done: true,
                  doneAt: today(),
                  snapshot,
                },
              },
            };
          })
        );
      },

      upsertDamage: (carpetId, d) => {
        setCarpets((cs) =>
          cs.map((c) => {
            if (c.id !== carpetId) return c;
            const exists = c.damages.some((x) => x.id === d.id);
            const damages = exists
              ? c.damages.map((x) => (x.id === d.id ? d : x))
              : [...c.damages, d];
            const cards = unique(damages.flatMap((x) => x.cardIds));
            return { ...c, damages, cards };
          })
        );
      },

      deleteDamage: (carpetId, damageId) => {
        setCarpets((cs) =>
          cs.map((c) => {
            if (c.id !== carpetId) return c;
            const damages = c.damages.filter((x) => x.id !== damageId);
            return {
              ...c,
              damages,
              cards: unique(damages.flatMap((x) => x.cardIds)),
            };
          })
        );
      },

      toggleDamageCard: (carpetId, damageId, cardId) => {
        setCarpets((cs) =>
          cs.map((c) => {
            if (c.id !== carpetId) return c;
            const damages = c.damages.map((d) => {
              if (d.id !== damageId) return d;
              const has = d.cardIds.includes(cardId);
              return {
                ...d,
                cardIds: has
                  ? d.cardIds.filter((x) => x !== cardId)
                  : [...d.cardIds, cardId],
              };
            });
            return { ...c, damages, cards: unique(damages.flatMap((x) => x.cardIds)) };
          })
        );
      },
    }),
    [carpets]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function latestExists(c: Carpet, stepId: StepId): boolean {
  const i = STEP_ORDER.indexOf(stepId);
  for (let k = i; k >= 0; k--) {
    if (c.steps[STEP_ORDER[k]].measurements.length) return true;
  }
  return false;
}

function unique(a: string[]): string[] {
  return [...new Set(a)];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore 必须在 StoreProvider 内使用");
  return ctx;
}
