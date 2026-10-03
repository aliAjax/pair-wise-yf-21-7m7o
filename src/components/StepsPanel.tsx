import { useState } from "react";
import type { Carpet, StepId } from "../types";
import {
  STEP_META,
  STEP_ORDER,
  dimsAtStep,
  fmtDims,
  stepBlocked,
  stepLocked,
} from "../domain";
import { useStore } from "../store";

export default function StepsPanel({ carpet }: { carpet: Carpet }) {
  const { addMeasurement, completeStep, confirmReview, rejectMeasurement } =
    useStore();
  const [form, setForm] = useState<Record<string, { width: string; length: string; by: string }>>({});
  const [open, setOpen] = useState<StepId | null>(
    STEP_META.find((m) => !carpet.steps[m.id].done)?.id ?? null
  );

  return (
    <div className="steps">
      {carpet.review && (
        <div className="alert">
          <strong>待复核：{STEP_META.find((s) => s.id === carpet.review!.stepId)?.name}</strong>
          <p>
            {carpet.review.measurement.at} 实测{" "}
            {fmtDims({
              width: carpet.review.measurement.width,
              length: carpet.review.measurement.length,
            })}
            ，与 {carpet.review.against.at} 的 {fmtDims(carpet.review.against)}{" "}
            相比，幅宽差 {carpet.review.dW} cm（公差 ±{carpet.widthTol}）、
            长度差 {carpet.review.dL} cm（公差 ±{carpet.lengthTol}）。
            师傅确认前，后续工序暂停。
          </p>
          <div className="alert-actions">
            <button className="primary" onClick={() => confirmReview(carpet.id)}>
              确认偏差，继续工序
            </button>
            <button onClick={() => rejectMeasurement(carpet.id)}>
              该次量错了，撤销复测
            </button>
          </div>
        </div>
      )}

      <ol className="step-list">
        {STEP_META.map((meta) => {
          const st = carpet.steps[meta.id];
          const blocked = stepBlocked(carpet, meta.id);
          const locked = stepLocked(carpet, meta.id);
          const isOpen = open === meta.id;
          const f = form[meta.id] ?? { width: "", length: "", by: "" };
          const dims = dimsAtStep(carpet, meta.id);
          return (
            <li
              key={meta.id}
              className={
                "step" +
                (st.done ? " done" : "") +
                (blocked ? " blocked" : "") +
                (locked ? " locked" : "")
              }
            >
              <header className="step-head" onClick={() => !locked && setOpen(isOpen ? null : meta.id)}>
                <span className="step-badge">
                  {st.done ? "✓" : STEP_ORDER.indexOf(meta.id) + 1}
                </span>
                <div>
                  <b>{meta.name}</b>
                  {meta.changesSize && <em className="size-tag">尺寸敏感</em>}
                  {st.done && st.doneAt && <small>完工 {st.doneAt}</small>}
                  {locked && <small className="muted">前序未完工</small>}
                  {blocked && <small className="warn">待复核暂停</small>}
                </div>
                <div className="step-dims">
                  {st.measurements.length > 0 && (
                    <>
                      <small>最近实测</small>
                      <b>
                                        {st.measurements[st.measurements.length - 1].width} ×{" "}
                        {st.measurements[st.measurements.length - 1].length} cm
                      </b>
                    </>
                  )}
                  {st.snapshot && (
                    <small className="muted">
                      完工冻结 {fmtDims(st.snapshot.dims)} · 用线{" "}
                      {st.snapshot.totalYarn.toFixed(2)}m
                    </small>
                  )}
                </div>
              </header>

              {isOpen && !locked && (
                <div className="step-body">
                  <table className="measure-table">
                    <thead>
                      <tr><th>日期</th><th>师傅</th><th>幅宽cm</th><th>长度cm</th><th>来源</th></tr>
                    </thead>
                    <tbody>
                      {st.measurements.length === 0 && (
                        <tr>
                          <td colSpan={5} className="muted">
                            本工序暂无实测
                            {meta.id === "inspection"
                              ? `，未量前按档案登记尺寸 ${fmtDims(carpet.registered)} 圈选算线`
                              : `，按前序最近一次实测 ${fmtDims(dims)} 回填圈选与补线`}
                          </td>
                        </tr>
                      )}
                      {st.measurements.map((m, i) => (
                        <tr key={i}>
                          <td>{m.at}</td><td>{m.by}</td>
                          <td>{m.width}</td><td>{m.length}</td>
                          <td>工序实测</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!st.done && (
                    <div className="measure-form">
                      <input
                        type="number"
                        placeholder="幅宽 cm"
                        value={f.width}
                        onChange={(e) =>
                          setForm({ ...form, [meta.id]: { ...f, width: e.target.value } })
                        }
                      />
                      <input
                        type="number"
                        placeholder="长度 cm"
                        value={f.length}
                        onChange={(e) =>
                          setForm({ ...form, [meta.id]: { ...f, length: e.target.value } })
                        }
                      />
                      <input
                        placeholder="量测师傅"
                        value={f.by}
                        onChange={(e) =>
                          setForm({ ...form, [meta.id]: { ...f, by: e.target.value } })
                        }
                      />
                      <button
                        disabled={!!carpet.review || !f.width || !f.length}
                        onClick={() => {
                          addMeasurement(carpet.id, meta.id, {
                            width: Number(f.width),
                            length: Number(f.length),
                            by: f.by,
                          });
                          setForm({ ...form, [meta.id]: { width: "", length: "", by: "" } });
                        }}
                      >
                        登记实测并重算
                      </button>
                      <button
                        className="primary"
                        disabled={
                          !!carpet.review ||
                          blocked ||
                          st.measurements.length === 0 ||
                          dims.width === 0
                        }
                        title={st.measurements.length === 0 ? "先登记本工序实测尺寸" : ""}
                        onClick={() => completeStep(carpet.id, meta.id)}
                      >
                        完工并冻结尺寸/用线量
                      </button>
                    </div>
                  )}

                  {st.snapshot && (
                    <details>
                      <summary>查看完工快照（{st.snapshot.at}）</summary>
                      <SnapshotTable carpet={carpet} stepId={meta.id} />
                    </details>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SnapshotTable({ carpet, stepId }: { carpet: Carpet; stepId: StepId }) {
  const snap = carpet.steps[stepId].snapshot!;
  return (
    <table className="measure-table">
      <thead>
        <tr><th>破损</th><th>圈选尺寸(cm)</th><th>色卡</th><th>冻结用线(m)</th></tr>
      </thead>
      <tbody>
        {snap.yarn.map((y) => {
          const related = snap.damages.filter((d) =>
            y.cardId === "__none__" ? d.cardIds.length === 0 : d.cardIds[0] === y.cardId
          );
          return (
            <tr key={y.cardId}>
              <td>{related.map((d) => d.code).join("、") || "—"}</td>
              <td>
                {related
                  .map(
                    (d) =>
                      `${Math.round(d.rx * snap.dims.width * 2)}×${Math.round(
                        d.ry * snap.dims.length * 2
                      )}`
                  )
                  .join("，") || "—"}
              </td>
              <td>{y.cardId === "__none__" ? "未配色" : y.cardId}</td>
              <td>{y.length.toFixed(2)}</td>
            </tr>
          );
        })}
        {snap.yarn.length === 0 && (
          <tr><td colSpan={4} className="muted">完工时无破损圈选</td></tr>
        )}
      </tbody>
    </table>
  );
}
