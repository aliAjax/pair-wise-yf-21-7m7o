import type { Carpet } from "../types";

export type CarpetStatus = "repairing" | "pending" | "done";

export function carpetStatus(carpet: Carpet): CarpetStatus {
  if (carpet.review === "pending") return "pending";
  if (carpet.steps.every((s) => s.status === "done")) return "done";
  return "repairing";
}

const STATUS_LABEL: Record<CarpetStatus, string> = {
  repairing: "修复中",
  pending: "待复核",
  done: "已完工",
};

export function CarpetSidebar({
  carpets,
  selectedId,
  filter,
  filters,
  onFilterChange,
  onSelect,
}: {
  carpets: Carpet[];
  selectedId: string;
  filter: string;
  filters: string[];
  onFilterChange: (f: string) => void;
  onSelect: (id: string) => void;
}) {
  const shown =
    filter === "全部"
      ? carpets
      : carpets.filter((c) => c.origin.includes(filter));

  return (
    <aside className="panel sidebar">
      <h2>档案列表</h2>
      <div className="chips">
        {["全部", ...filters].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => onFilterChange(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="carpet-list">
        {shown.length === 0 && (
          <p className="list-empty">该产地暂无档案</p>
        )}
        {shown.map((c) => {
          const status = carpetStatus(c);
          const activeStep = c.steps.find((s) => s.status === "active");
          return (
            <button
              key={c.id}
              className={
                "carpet-item" + (c.id === selectedId ? " is-selected" : "")
              }
              onClick={() => onSelect(c.id)}
            >
              <div className="carpet-item-top">
                <strong>{c.id}</strong>
                <span className={"status-badge " + status}>
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <p className="carpet-name">{c.name}</p>
              <p className="carpet-meta">
                {c.origin} · {c.era}
              </p>
              {activeStep && status !== "done" && (
                <p className="carpet-step">当前工序：{activeStep.name}</p>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
