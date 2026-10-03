import { useEffect, useState } from "react";
import type { Carpet } from "../types";
import { backfillDims, currentDims, fmtDateTime } from "../utils";

export function MeasurementCard({
  carpet,
  stepKey,
  actionLabel,
  complete,
  onRecord,
}: {
  carpet: Carpet;
  stepKey: string;
  actionLabel: string;
  complete: boolean;
  onRecord: (
    stepKey: string,
    length: number,
    width: number,
    complete: boolean,
    note?: string
  ) => void;
}) {
  const backfill = backfillDims(carpet);
  const dims = currentDims(carpet);
  const [length, setLength] = useState<string>(String(backfill.length));
  const [width, setWidth] = useState<string>(String(backfill.width));
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    setLength(String(backfill.length));
    setWidth(String(backfill.width));
    setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carpet.id, stepKey]);

  const submit = () => {
    const l = Number(length);
    const w = Number(width);
    if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return;
    onRecord(stepKey, l, w, complete, note.trim() || undefined);
  };

  return (
    <div className="measurement-card">
      <div className="measurement-current">
        <div>
          <span className="eyebrow">当前尺寸（最近一次实测）</span>
          <strong className="dims">
            {dims.length} × {dims.width} <em>cm</em>
          </strong>
        </div>
        <small className="backfill-note">
          {backfill.fromArchive
            ? "已有数据按档案最早尺寸回填"
            : `已按最近一次实测回填 · ${fmtDateTime(backfill.measuredAt)}`}
        </small>
      </div>

      <div className="measurement-form">
        <label>
          <span>实测长 (cm)</span>
          <input
            type="number"
            min={1}
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
        </label>
        <label>
          <span>实测宽 (cm)</span>
          <input
            type="number"
            min={1}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
        </label>
        <label className="note-field">
          <span>备注</span>
          <input
            type="text"
            placeholder="选填，如：湿洗后复测"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button className="primary" onClick={submit}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
