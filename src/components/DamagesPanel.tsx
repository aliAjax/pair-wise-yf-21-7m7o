import { useState } from "react";
import type { Carpet, DamageMark } from "../types";
import { COLOR_CARDS } from "../seed";
import { areaOf, currentDims, yarnOf } from "../domain";
import { useStore } from "../store";
import RugMap from "./RugMap";

let seq = 100;

export default function DamagesPanel({ carpet }: { carpet: Carpet }) {
  const { upsertDamage, deleteDamage } = useStore();
  const dims = currentDims(carpet);
  const [editing, setEditing] = useState<DamageMark | null>(null);

  const blank = (): DamageMark => ({
    id: `D${++seq}`,
    code: `破损-${String(carpet.damages.length + 1).padStart(2, "0")}`,
    desc: "",
    x: 0.5,
    y: 0.5,
    rx: 0.06,
    ry: 0.05,
    cardIds: [],
  });

  return (
    <div className="damages-layout">
      <RugMap carpet={carpet} dims={dims} damages={carpet.damages} />

      <div className="damage-list">
        <div className="heading-row">
          <h3>破损圈选</h3>
          <button onClick={() => setEditing(blank())}>+ 新增圈选</button>
        </div>
        <table className="measure-table">
          <thead>
            <tr>
              <th>编号</th><th>圈选尺寸 cm</th><th>面积 cm²</th>
              <th>补线 m</th><th>色卡</th><th></th>
            </tr>
          </thead>
          <tbody>
            {carpet.damages.map((d) => (
              <tr key={d.id}>
                <td>
                  <b>{d.code}</b>
                  <small className="muted block">{d.desc}</small>
                </td>
                <td>
                  {Math.round(d.rx * dims.width * 2)} ×{" "}
                  {Math.round(d.ry * dims.length * 2)}
                </td>
                <td>{Math.round(areaOf(d, dims))}</td>
                <td>{yarnOf(d, dims, carpet.knotDensity).toFixed(2)}</td>
                <td>
                  {d.cardIds.length
                    ? d.cardIds
                        .map((id) => COLOR_CARDS.find((c) => c.id === id)?.name ?? id)
                        .join("、")
                    : <span className="warn">未配色</span>}
                </td>
                <td className="row-actions">
                  <button onClick={() => setEditing({ ...d })}>改</button>
                  <button onClick={() => deleteDamage(carpet.id, d.id)}>删</button>
                </td>
              </tr>
            ))}
            {carpet.damages.length === 0 && (
              <tr><td colSpan={6} className="muted">暂无破损圈选</td></tr>
            )}
          </tbody>
        </table>
        <p className="hint">
          圈选以相对比例记录，实测尺寸更新后自动重算圈选尺寸、面积与补线长度；
          已完工工序保留其完工快照中的数值，不随此处变化。
        </p>
      </div>

      {editing && (
        <DamageEditor
          carpet={carpet}
          damage={editing}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            upsertDamage(carpet.id, d);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function DamageEditor({
  carpet,
  damage,
  onClose,
  onSave,
}: {
  carpet: Carpet;
  damage: DamageMark;
  onClose: () => void;
  onSave: (d: DamageMark) => void;
}) {
  const dims = currentDims(carpet);
  const [d, setD] = useState<DamageMark>(damage);
  const set = (patch: Partial<DamageMark>) => setD({ ...d, ...patch });

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>圈选破损 {d.id}</h3>
        <div className="field-grid">
          <label>
            <span>编号</span>
            <input value={d.code} onChange={(e) => set({ code: e.target.value })} />
          </label>
          <label>
            <span>说明</span>
            <input value={d.desc} onChange={(e) => set({ desc: e.target.value })} />
          </label>
          <label>
            <span>横向位置（0=左 1=右）</span>
            <input type="range" min="0.03" max="0.97" step="0.01" value={d.x}
              onChange={(e) => set({ x: Number(e.target.value) })} />
          </label>
          <label>
            <span>纵向位置（0=上 1=下）</span>
            <input type="range" min="0.03" max="0.97" step="0.01" value={d.y}
              onChange={(e) => set({ y: Number(e.target.value) })} />
          </label>
          <label>
            <span>半幅占比（当前圈宽 {Math.round(d.rx * dims.width * 2)}cm）</span>
            <input type="range" min="0.01" max="0.3" step="0.005" value={d.rx}
              onChange={(e) => set({ rx: Number(e.target.value) })} />
          </label>
          <label>
            <span>半长占比（当前圈长 {Math.round(d.ry * dims.length * 2)}cm）</span>
            <input type="range" min="0.01" max="0.3" step="0.005" value={d.ry}
              onChange={(e) => set({ ry: Number(e.target.value) })} />
          </label>
        </div>

        <RugMap carpet={carpet} dims={dims} damages={[...carpet.damages.filter((x) => x.id !== d.id), d]} />

        <div className="card-pick">
          <span>关联色卡（决定补线领用归集）：</span>
          {COLOR_CARDS.map((c) => {
            const on = d.cardIds.includes(c.id);
            return (
              <button
                key={c.id}
                className={"chip-card" + (on ? " on" : "")}
                onClick={() => {
                  set({ cardIds: toggleList(d.cardIds, c.id) });
                }}
              >
                <i style={{ background: c.hex }} />
                {c.id} {c.name}
              </button>
            );
          })}
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={() => onSave(d)}>保存圈选</button>
        </div>
      </div>
    </div>
  );
}

function toggleList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
