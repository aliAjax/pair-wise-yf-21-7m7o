import type { Carpet } from "../types";
import { COLOR_CARDS } from "../seed";
import {
  STEP_META,
  calcYarnUse,
  currentDims,
  fmtDims,
  totalYarn,
} from "../domain";

export default function YarnPanel({ carpet }: { carpet: Carpet }) {
  const dims = currentDims(carpet);
  const yarn = calcYarnUse(carpet.damages, dims, carpet.knotDensity);

  return (
    <div className="yarn-panel">
      <div className="heading-row">
        <h3>色卡领用 · 补线长度</h3>
        <small className="muted">
          按 {fmtDims(dims)}（最近一次实测）重算，含 10% 损耗
        </small>
      </div>

      <table className="measure-table">
        <thead>
          <tr><th>色卡</th><th>染色</th><th>当前领用长度 m</th><th>状态</th></tr>
        </thead>
        <tbody>
          {yarn.map((y) => {
            const card =
              y.cardId === "__none__"
                ? null
                : COLOR_CARDS.find((c) => c.id === y.cardId);
            return (
              <tr key={y.cardId}>
                <td>
                  {card ? (
                    <span className="card-name">
                      <i style={{ background: card.hex }} />
                      {card.id} {card.name}
                    </span>
                  ) : (
                    <span className="warn">未配色破损</span>
                  )}
                </td>
                <td>{card?.dye ?? "请先在圈选中关联色卡"}</td>
                <td><b>{y.length.toFixed(2)}</b></td>
                <td>
                  {carpet.review ? (
                    <span className="warn">尺寸待复核，暂不发料</span>
                  ) : (
                    <span className="ok">可领用</span>
                  )}
                </td>
              </tr>
            );
          })}
          {yarn.length === 0 && (
            <tr><td colSpan={4} className="muted">暂无破损圈选</td></tr>
          )}
          <tr className="sum-row">
            <td colSpan={2}>合计</td>
            <td><b>{totalYarn(yarn).toFixed(2)}</b></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="freeze-note">
        <h4>已完工工序冻结用线量（不再随新实测变化）</h4>
        <table className="measure-table">
          <thead>
            <tr><th>工序</th><th>完工日</th><th>当时尺寸</th><th>当时冻结用线 m</th></tr>
          </thead>
          <tbody>
            {STEP_META.filter((s) => carpet.steps[s.id].snapshot).map((s) => {
              const snap = carpet.steps[s.id].snapshot!;
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{snap.at}</td>
                  <td>{fmtDims(snap.dims)}</td>
                  <td>{snap.totalYarn.toFixed(2)}</td>
                </tr>
              );
            })}
            {STEP_META.every((s) => !carpet.steps[s.id].snapshot) && (
              <tr><td colSpan={4} className="muted">尚无完工工序</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
