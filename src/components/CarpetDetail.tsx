import type { Carpet, DamageMark } from "../types";
import { currentDims } from "../utils";
import { ReviewBanner } from "./ReviewBanner";
import { StepTimeline } from "./StepTimeline";
import { carpetStatus } from "./CarpetSidebar";

export function CarpetDetail({
  carpet,
  onRecord,
  onComplete,
  onConfirm,
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
  onConfirm: () => void;
  onAddMark: (mark: DamageMark) => void;
  onUpdateMark: (markId: string, patch: Partial<DamageMark>) => void;
  onRemoveMark: (markId: string) => void;
}) {
  const dims = currentDims(carpet);
  const status = carpetStatus(carpet);

  return (
    <section className="panel detail">
      <div className="detail-head">
        <div>
          <p className="eyebrow">
            {carpet.id} · {carpet.origin}
          </p>
          <h2>{carpet.name}</h2>
          <p className="detail-specs">
            {carpet.era} · {carpet.material} · {carpet.dyeType} · 结密度{" "}
            {carpet.knotDensity} 结/dm²
          </p>
        </div>
        <div className="detail-dims">
          <div className="dim-chip">
            <span>档案最早尺寸</span>
            <strong>
              {carpet.archiveLength} × {carpet.archiveWidth} cm
            </strong>
          </div>
          <div className="dim-chip current">
            <span>当前实测尺寸</span>
            <strong>
              {dims.length} × {dims.width} cm
            </strong>
          </div>
          <span className={"status-badge " + status}>
            {status === "repairing"
              ? "修复中"
              : status === "pending"
              ? "待复核"
              : "已完工"}
          </span>
        </div>
      </div>

      <div className="tolerance-line">
        登记公差 <b>{carpet.tolerancePct}%</b>
        {carpet.confirmedAt && (
          <span className="confirmed-note">
            · 已于 {new Date(carpet.confirmedAt).toLocaleString("zh-CN")}{" "}
            确认尺寸差异
          </span>
        )}
      </div>

      <ReviewBanner carpet={carpet} onConfirm={onConfirm} />

      <StepTimeline
        carpet={carpet}
        onRecord={onRecord}
        onComplete={onComplete}
        onAddMark={onAddMark}
        onUpdateMark={onUpdateMark}
        onRemoveMark={onRemoveMark}
      />
    </section>
  );
}
