import type { Carpet } from "../types";
import { currentDims, fmtDims } from "../domain";
import DamagesPanel from "./DamagesPanel";
import StepsPanel from "./StepsPanel";
import YarnPanel from "./YarnPanel";

export default function DetailView({ carpet }: { carpet: Carpet }) {
  const dims = currentDims(carpet);
  return (
    <section className="detail panel">
      <header className="detail-head">
        <div>
          <p className="eyebrow">{carpet.origin} · {carpet.era}</p>
          <h2>{carpet.id}</h2>
          <p className="muted">
            {carpet.material} · {carpet.dye} · 结密度 {carpet.knotDensity} 结/10cm ·
            登记公差 幅宽±{carpet.widthTol}cm / 长度±{carpet.lengthTol}cm
          </p>
        </div>
        <div className={"dims-now" + (carpet.review ? " review" : "")}>
          <small>
            档案登记 {fmtDims(carpet.registered)}
            {dims.width !== carpet.registered.width ||
            dims.length !== carpet.registered.length
              ? " → 当前实测"
              : "（按登记尺寸回填）"}
          </small>
          <strong>{fmtDims(dims)}</strong>
          {carpet.review && <span className="badge-warn">待复核</span>}
        </div>
      </header>

      <div className="before-after">
        <div>
          <h4>修复前记录</h4>
          <p>{carpet.beforeNote}</p>
        </div>
        <div>
          <h4>修复后记录</h4>
          <p>{carpet.afterNote || "尚未完工，完工验收后填写"}</p>
        </div>
      </div>

      <section className="block">
        <h3>修复工序与实测尺寸</h3>
        <StepsPanel carpet={carpet} />
      </section>

      <section className="block">
        <h3>纹样局部标记图与破损圈选</h3>
        <DamagesPanel carpet={carpet} />
      </section>

      <section className="block">
        <YarnPanel carpet={carpet} />
      </section>
    </section>
  );
}
