import { useState } from "react";
import type { Carpet, DamageMark } from "../types";
import {
  computeMarks,
  computeThread,
  currentDims,
  fmtDateTime,
  totalThread,
} from "../utils";
import { MeasurementCard } from "./MeasurementCard";
import { PatternMap } from "./PatternMap";
import { ThreadPanel } from "./ThreadPanel";

export function StepTimeline({
  carpet,
  onRecord,
  onComplete,
  onAddMark,
  onUpdateMark,
  onRemoveMark,
}: {
  carpet: Carpet;
  onRecord: (
    stepKey: string,
    length: number,
    width: number,
    complete: boolean,
    note?: string
  ) => void;
  onComplete: (stepKey: string) => void;
  onAddMark: (mark: DamageMark) => void;
  onUpdateMark: (markId: string, patch: Partial<DamageMark>) => void;
  onRemoveMark: (markId: string) => void;
}) {
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const dims = currentDims(carpet);
  const marksComputed = computeMarks(carpet.marks, dims, carpet);
  const thread = computeThread(carpet.marks, dims, carpet);
  const pending = carpet.review === "pending";

  const activeStep = carpet.steps.find((s) => s.status === "active");
  const markingDone = carpet.steps.find((s) => s.key === "marking");
  const repairThread = markingDone?.snapshot?.thread ?? thread;

  return (
    <ol className="step-timeline">
      {carpet.steps.map((step, idx) => {
        const isActive = step.status === "active";
        const isDone = step.status === "done";

        return (
          <li
            key={step.key}
            className={
              "step" +
              (isDone ? " is-done" : "") +
              (isActive ? " is-active" : "") +
              (step.status === "locked" ? " is-locked" : "")
            }
          >
            <div className="step-rail">
              <span className="step-dot">
                {isDone ? "✓" : isActive ? idx + 1 : "·"}
              </span>
              {idx < carpet.steps.length - 1 && <span className="step-line" />}
            </div>

            <div className="step-body">
              <div className="step-head">
                <h4>
                  {idx + 1}. {step.name}
                </h4>
                {isDone && <span className="step-tag done">已完成</span>}
                {isActive && !pending && (
                  <span className="step-tag active">进行中</span>
                )}
                {isActive && pending && (
                  <span className="step-tag pending">待复核 · 已挂起</span>
                )}
                {step.status === "locked" && (
                  <span className="step-tag locked">未开始</span>
                )}
              </div>

              {isDone && step.snapshot && (
                <div className="step-snapshot">
                  <div className="snapshot-row">
                    <span className="snap-label">当时尺寸</span>
                    <strong>
                      {step.snapshot.length} × {step.snapshot.width} cm
                    </strong>
                    <small>{fmtDateTime(step.snapshot.measuredAt)}</small>
                  </div>
                  <div className="snapshot-row">
                    <span className="snap-label">当时圈选</span>
                    <strong>{step.snapshot.marks.length} 处</strong>
                  </div>
                  <div className="snapshot-row">
                    <span className="snap-label">当时用线</span>
                    <strong>{totalThread(step.snapshot.thread)} m</strong>
                  </div>
                  <span className="frozen-tag">
                    已冻结 · 不受后续尺寸变动影响
                  </span>
                </div>
              )}

              {isActive && (
                <div className="step-content">
                  {step.kind === "measure" && (
                    <>
                      <MeasurementCard
                        carpet={carpet}
                        stepKey={step.key}
                        actionLabel="记录实测并完成本工序"
                        complete
                        onRecord={onRecord}
                      />
                      {carpet.measurements[carpet.measurements.length - 1]
                        ?.stepKey === step.key &&
                        !pending && (
                          <button
                            className="primary complete-btn"
                            onClick={() => onComplete(step.key)}
                          >
                            完成本工序（尺寸已记录）
                          </button>
                        )}
                    </>
                  )}

                  {step.kind === "mark" && (
                    <>
                      <MeasurementCard
                        carpet={carpet}
                        stepKey={step.key}
                        actionLabel="记录复测尺寸"
                        complete={false}
                        onRecord={onRecord}
                      />
                      <PatternMap
                        dims={dims}
                        marks={marksComputed}
                        selectedId={selectedMarkId}
                        disabled={pending}
                        onSelect={setSelectedMarkId}
                        onAdd={onAddMark}
                        onUpdate={onUpdateMark}
                        onRemove={onRemoveMark}
                      />
                      <ThreadPanel thread={thread} />
                      <button
                        className="primary complete-btn"
                        disabled={pending}
                        onClick={() => onComplete(step.key)}
                      >
                        {pending
                          ? "待复核 · 师傅确认后可完成圈选"
                          : "完成圈选（冻结当前尺寸与用线）"}
                      </button>
                    </>
                  )}

                  {step.kind === "repair" && (
                    <>
                      <ThreadPanel
                        thread={repairThread}
                        frozen
                        title="补线修复 · 领用工线"
                      />
                      <button
                        className="primary complete-btn"
                        disabled={pending}
                        onClick={() => onComplete(step.key)}
                      >
                        {pending ? "待复核 · 暂不可继续" : "完成补线"}
                      </button>
                    </>
                  )}

                  {step.kind === "complete" && (
                    <>
                      <p className="complete-hint">
                        全部工序已按实测尺寸记录并冻结，可办理完工验收。
                      </p>
                      <button
                        className="primary complete-btn"
                        disabled={pending}
                        onClick={() => onComplete(step.key)}
                      >
                        {pending ? "待复核 · 暂不可验收" : "完工验收"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
