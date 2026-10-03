import type { ThreadLine } from "../types";
import { totalThread } from "../utils";

export function ThreadPanel({
  thread,
  frozen,
  title = "色卡领用 · 补线长度",
  emptyHint = "暂无圈选，无需补线",
}: {
  thread: ThreadLine[];
  frozen?: boolean;
  title?: string;
  emptyHint?: string;
}) {
  const total = totalThread(thread);
  return (
    <div className="thread-panel">
      <div className="thread-head">
        <h4>{title}</h4>
        {frozen && <span className="frozen-tag">当时用线量 · 已冻结</span>}
      </div>
      {thread.length === 0 ? (
        <p className="thread-empty">{emptyHint}</p>
      ) : (
        <ul className="thread-list">
          {thread.map((t) => (
            <li key={t.colorId}>
              <span className="swatch" style={{ background: t.hex }} />
              <span className="swatch-name">{t.colorName}</span>
              <strong>{t.lengthM} m</strong>
            </li>
          ))}
        </ul>
      )}
      <div className="thread-total">
        补线合计 <strong>{total} m</strong>
      </div>
    </div>
  );
}
