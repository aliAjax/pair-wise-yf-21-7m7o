import type { Carpet } from "../types";

export function ReviewBanner({
  carpet,
  onConfirm,
}: {
  carpet: Carpet;
  onConfirm: () => void;
}) {
  if (carpet.review !== "pending") return null;
  return (
    <div className="review-banner" role="alert">
      <div className="review-icon">!</div>
      <div className="review-body">
        <strong>尺寸差异待复核</strong>
        <p>{carpet.reviewReason}</p>
        <p className="review-note">
          师傅确认以前，下一道工序不可继续，圈选与用线暂按当前尺寸挂起。请核对湿洗/拉伸后的实测尺寸。
        </p>
      </div>
      <button className="primary" onClick={onConfirm}>
        确认尺寸差异，继续工序
      </button>
    </div>
  );
}
