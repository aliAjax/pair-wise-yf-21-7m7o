import { useRef } from "react";
import type { Carpet, DamageMark, MarkComputed } from "../types";
import { colorCardOf } from "../utils";

export function PatternMap({
  dims,
  marks,
  selectedId,
  disabled,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
}: {
  dims: { length: number; width: number };
  marks: MarkComputed[];
  selectedId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onAdd: (mark: DamageMark) => void;
  onUpdate: (id: string, patch: Partial<DamageMark>) => void;
  onRemove: (id: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const selected = marks.find((m) => m.id === selectedId) ?? null;
  const selectedColor = selected ? colorCardOf(selected.colorId) : null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = `mk-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    onAdd({
      id,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      r: 10,
      colorId: marks[marks.length - 1]?.colorId ?? "c1",
    });
    onSelect(id);
  };

  return (
    <div className="pattern-wrap">
      <div className="pattern-head">
        <div>
          <h4>纹样局部标记图</h4>
          <p className="pattern-hint">
            {disabled
              ? "待复核期间圈选冻结，不可增改"
              : "点击毯子任意位置圈选破损点，单位随当前实测尺寸换算"}
          </p>
        </div>
        <span className="pattern-dims">
          {dims.length} × {dims.width} cm
        </span>
      </div>

      <div
        ref={mapRef}
        className={"pattern-map" + (disabled ? " is-disabled" : "")}
        style={{ aspectRatio: `${dims.length} / ${dims.width}` }}
        onClick={handleClick}
      >
        <div className="pattern-grid" />
        {marks.map((m) => {
          const c = colorCardOf(m.colorId);
          const isSel = m.id === selectedId;
          return (
            <div
              key={m.id}
              className={"mark" + (isSel ? " is-selected" : "")}
              style={{
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: `${m.r}%`,
                height: `${m.r}%`,
                borderColor: c.hex,
                background: `${c.hex}2e`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onSelect(m.id);
              }}
            >
              <span className="mark-area">{m.areaCm2} cm²</span>
            </div>
          );
        })}
      </div>

      {selected && selectedColor && (
        <div className="mark-controls">
          <div className="mark-controls-row">
            <label className="mark-radius">
              <span>圈选半径 {selected.r}%</span>
              <input
                type="range"
                min={4}
                max={24}
                value={selected.r}
                disabled={disabled}
                onChange={(e) =>
                  onUpdate(selected.id, { r: Number(e.target.value) })
                }
              />
            </label>
            <label className="mark-color">
              <span>补线色卡</span>
              <select
                value={selected.colorId}
                disabled={disabled}
                onChange={(e) =>
                  onUpdate(selected.id, { colorId: e.target.value })
                }
              >
                {["c1", "c2", "c3", "c4", "c5"].map((id) => {
                  const c = colorCardOf(id);
                  return (
                    <option key={id} value={id}>
                      {c.name}
                    </option>
                  );
                })}
              </select>
            </label>
            <button
              className="danger"
              disabled={disabled}
              onClick={() => onRemove(selected.id)}
            >
              删除圈选
            </button>
          </div>
          <p className="mark-thread">
            该圈选破损 {selected.areaCm2} cm²，需补线{" "}
            <strong>{selected.threadM} m</strong>（{selectedColor.name}）
          </p>
        </div>
      )}
    </div>
  );
}
