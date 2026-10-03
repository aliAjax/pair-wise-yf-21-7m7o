import { useState, type ChangeEvent } from "react";
import type { Carpet } from "../types";
import { currentDims, fmtDims } from "../domain";
import { useStore } from "../store";

const ORIGINS = ["全部", "波斯", "安纳托利亚", "高加索", "藏毯"];

export default function Sidebar({
  carpets,
  selectedId,
  onSelect,
}: {
  carpets: Carpet[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [origin, setOrigin] = useState("全部");
  const list = carpets.filter((c) => origin === "全部" || c.origin === origin);
  const reviewCount = carpets.filter((c) => c.review).length;

  return (
    <aside className="sidebar panel">
      <h2>纹样档案</h2>
      <div className="chips">
        {ORIGINS.map((o) => (
          <button
            key={o}
            className={origin === o ? "on" : ""}
            onClick={() => setOrigin(o)}
          >
            {o}
          </button>
        ))}
      </div>

      {reviewCount > 0 && <p className="review-tip">有 {reviewCount} 块地毯尺寸待复核</p>}

      <ul className="archive-list">
        {list.map((c) => {
          const doneCount = Object.values(c.steps).filter((s) => s.done).length;
          return (
            <li
              key={c.id}
              className={c.id === selectedId ? "on" : ""}
              onClick={() => onSelect(c.id)}
            >
              <div className="arch-top">
                <b>{c.id}</b>
                {c.review && <span className="badge-warn">待复核</span>}
              </div>
              <small>
                {c.origin} · {c.era} · {fmtDims(currentDims(c))}
              </small>
              <div className="progress">
                <i style={{ width: `${(doneCount / 5) * 100}%` }} />
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="muted">该产地暂无档案</li>}
      </ul>

      <NewCarpetForm />
    </aside>
  );
}

function NewCarpetForm() {
  const { addCarpet } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    id: "",
    origin: "波斯",
    era: "",
    material: "羊毛",
    dye: "植物染",
    knotDensity: "36",
    width: "",
    length: "",
    widthTol: "3",
    lengthTol: "5",
  });
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  if (!open) return <button className="primary full" onClick={() => setOpen(true)}>＋ 新增地毯档案</button>;

  return (
    <form
      className="new-form"
      onSubmit={(e) => {
        e.preventDefault();
        addCarpet({
          id: f.id || `CAR-${Math.floor(200 + Math.random() * 700)}`,
          origin: f.origin,
          era: f.era || "年代不详",
          material: f.material,
          dye: f.dye,
          knotDensity: Number(f.knotDensity) || 30,
          registered: { width: Number(f.width), length: Number(f.length) },
          widthTol: Number(f.widthTol),
          lengthTol: Number(f.lengthTol),
        });
        setOpen(false);
        setF({ ...f, id: "", era: "", width: "", length: "" });
      }}
    >
      <h3>新增档案（先登记最早尺寸）</h3>
      <input placeholder="档案号 CAR-xxx" value={f.id} onChange={set("id")} />
      <select value={f.origin} onChange={set("origin")}>
        {ORIGINS.slice(1).map((o) => <option key={o}>{o}</option>)}
      </select>
      <input placeholder="年代" value={f.era} onChange={set("era")} />
      <div className="two">
        <input placeholder="材质" value={f.material} onChange={set("material")} />
        <input placeholder="结密度" type="number" value={f.knotDensity} onChange={set("knotDensity")} />
      </div>
      <div className="two">
        <input placeholder="幅宽 cm" type="number" required value={f.width} onChange={set("width")} />
        <input placeholder="长度 cm" type="number" required value={f.length} onChange={set("length")} />
      </div>
      <div className="two">
        <input placeholder="幅宽公差" type="number" value={f.widthTol} onChange={set("widthTol")} />
        <input placeholder="长度公差" type="number" value={f.lengthTol} onChange={set("lengthTol")} />
      </div>
      <div className="modal-actions">
        <button type="button" onClick={() => setOpen(false)}>取消</button>
        <button className="primary">保存</button>
      </div>
    </form>
  );
}
