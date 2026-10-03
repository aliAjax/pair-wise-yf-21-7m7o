import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { Carpet, DamageMark, Step } from "./types";
import { seedCarpets } from "./data";
import {
  computeMarks,
  computeThread,
  currentDims,
  toleranceCheck,
} from "./utils";

const STORAGE_KEY = "carpet-repair-archive-v1";

type Action =
  | {
      type: "RECORD_MEASUREMENT";
      carpetId: string;
      stepKey: string;
      length: number;
      width: number;
      note?: string;
      complete: boolean;
    }
  | { type: "COMPLETE_STEP"; carpetId: string; stepKey: string }
  | { type: "CONFIRM_REVIEW"; carpetId: string }
  | { type: "ADD_MARK"; carpetId: string; mark: DamageMark }
  | {
      type: "UPDATE_MARK";
      carpetId: string;
      markId: string;
      patch: Partial<DamageMark>;
    }
  | { type: "REMOVE_MARK"; carpetId: string; markId: string }
  | { type: "SELECT"; carpetId: string };

const uid = (): string =>
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function completeSteps(
  steps: Step[],
  stepKey: string,
  dims: { length: number; width: number; measuredAt?: string },
  marks: DamageMark[],
  carpet: Carpet
): Step[] {
  const idx = steps.findIndex((s) => s.key === stepKey && s.status === "active");
  if (idx < 0) return steps;
  const computed = computeMarks(marks, dims, carpet);
  const thread = computeThread(marks, dims, carpet);
  const next = steps.slice();
  next[idx] = {
    ...next[idx],
    status: "done",
    doneAt: new Date().toISOString(),
    snapshot: {
      length: dims.length,
      width: dims.width,
      measuredAt: dims.measuredAt ?? new Date().toISOString(),
      marks: computed,
      thread,
    },
  };
  // 推进到下一道未开始的工序
  for (let i = idx + 1; i < next.length; i++) {
    if (next[i].status === "locked") {
      next[i] = { ...next[i], status: "active" };
      break;
    }
  }
  return next;
}

function reducer(state: Carpet[], action: Action): Carpet[] {
  switch (action.type) {
    case "RECORD_MEASUREMENT": {
      return state.map((c) => {
        if (c.id !== action.carpetId) return c;
        const measurement = {
          id: uid(),
          stepKey: action.stepKey,
          length: action.length,
          width: action.width,
          measuredAt: new Date().toISOString(),
          note: action.note,
        };
        const prev = c.measurements[c.measurements.length - 1];
        const check = toleranceCheck(prev, measurement, c.tolerancePct);
        let review = c.review;
        let reviewReason = c.reviewReason;
        if (check.exceeded) {
          review = "pending";
          reviewReason = `尺寸变化 ${check.pct}%（长 ${check.dl}% / 宽 ${check.dw}%），超过登记公差 ${c.tolerancePct}%`;
        }
        let steps = c.steps;
        if (action.complete && !check.exceeded) {
          steps = completeSteps(
            c.steps,
            action.stepKey,
            {
              length: measurement.length,
              width: measurement.width,
              measuredAt: measurement.measuredAt,
            },
            c.marks,
            c
          );
        }
        return {
          ...c,
          measurements: [...c.measurements, measurement],
          review,
          reviewReason,
          steps,
        };
      });
    }
    case "COMPLETE_STEP": {
      return state.map((c) => {
        if (c.id !== action.carpetId) return c;
        if (c.review === "pending") return c; // 待复核期间禁止往下走工序
        const dims = currentDims(c);
        return {
          ...c,
          steps: completeSteps(c.steps, action.stepKey, dims, c.marks, c),
        };
      });
    }
    case "CONFIRM_REVIEW": {
      return state.map((c) =>
        c.id === action.carpetId
          ? {
              ...c,
              review: "ok",
              reviewReason: undefined,
              confirmedAt: new Date().toISOString(),
            }
          : c
      );
    }
    case "ADD_MARK": {
      return state.map((c) =>
        c.id === action.carpetId ? { ...c, marks: [...c.marks, action.mark] } : c
      );
    }
    case "UPDATE_MARK": {
      return state.map((c) =>
        c.id === action.carpetId
          ? {
              ...c,
              marks: c.marks.map((m) =>
                m.id === action.markId ? { ...m, ...action.patch } : m
              ),
            }
          : c
      );
    }
    case "REMOVE_MARK": {
      return state.map((c) =>
        c.id === action.carpetId
          ? { ...c, marks: c.marks.filter((m) => m.id !== action.markId) }
          : c
      );
    }
    default:
      return state;
  }
}

function load(): Carpet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Carpet[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // ignore
  }
  return seedCarpets();
}

export function useCarpets() {
  const [carpets, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carpets));
    } catch {
      // ignore
    }
  }, [carpets]);

  const actions = useMemo(
    () => ({
      recordMeasurement: (
        carpetId: string,
        stepKey: string,
        length: number,
        width: number,
        complete: boolean,
        note?: string
      ) =>
        dispatch({
          type: "RECORD_MEASUREMENT",
          carpetId,
          stepKey,
          length,
          width,
          complete,
          note,
        }),
      completeStep: (carpetId: string, stepKey: string) =>
        dispatch({ type: "COMPLETE_STEP", carpetId, stepKey }),
      confirmReview: (carpetId: string) =>
        dispatch({ type: "CONFIRM_REVIEW", carpetId }),
      addMark: (carpetId: string, mark: DamageMark) =>
        dispatch({ type: "ADD_MARK", carpetId, mark }),
      updateMark: (
        carpetId: string,
        markId: string,
        patch: Partial<DamageMark>
      ) => dispatch({ type: "UPDATE_MARK", carpetId, markId, patch }),
      removeMark: (carpetId: string, markId: string) =>
        dispatch({ type: "REMOVE_MARK", carpetId, markId }),
    }),
    []
  );

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  return { carpets, ...actions, reset };
}
