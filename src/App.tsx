import { useEffect, useMemo, useState } from "react";
import { useCarpets } from "./useCarpets";
import { COLOR_CARDS } from "./utils";
import { CarpetSidebar, carpetStatus } from "./components/CarpetSidebar";
import { CarpetDetail } from "./components/CarpetDetail";

const ORIGIN_FILTERS = ["波斯", "安纳托利亚", "高加索", "藏毯"];

export default function App() {
  const {
    carpets,
    recordMeasurement,
    completeStep,
    confirmReview,
    addMark,
    updateMark,
    removeMark,
    reset,
  } = useCarpets();
  const [selectedId, setSelectedId] = useState<string>(carpets[0]?.id ?? "");
  const [filter, setFilter] = useState<string>("全部");

  useEffect(() => {
    if (!carpets.some((c) => c.id === selectedId)) {
      setSelectedId(carpets[0]?.id ?? "");
    }
  }, [carpets, selectedId]);

  const selected = useMemo(
    () => carpets.find((c) => c.id === selectedId) ?? carpets[0],
    [carpets, selectedId]
  );

  const metrics = useMemo(() => {
    const total = carpets.length;
    const done = carpets.filter((c) => carpetStatus(c) === "done").length;
    const pending = carpets.filter((c) => carpetStatus(c) === "pending").length;
    const repairing = total - done;
    const rate = total ? Math.round((done / total) * 100) : 0;
    return [
      { label: "待修复", value: repairing },
      { label: "纹样档案", value: total },
      { label: "色卡数量", value: COLOR_CARDS.length },
      { label: "完工率", value: `${rate}%` },
      { label: "待复核", value: pending },
    ];
  }, [carpets]);

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62009 · 地毯修复纹样档案</p>
        <h1>按工序实测尺寸档案</h1>
        <span>
          湿洗、拉伸后尺寸常变，师傅不再照档案最早尺寸圈破损、算补线。每道工序按实测尺寸记档，
          尺寸一更新即重算圈选与色卡领用补线长度；已完工工序保留当时尺寸与用线量，两次量差超过登记公差则挂待复核，师傅确认前不往下走工序。
        </span>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <div className="workspace">
        <CarpetSidebar
          carpets={carpets}
          selectedId={selected?.id ?? ""}
          filter={filter}
          filters={ORIGIN_FILTERS}
          onFilterChange={setFilter}
          onSelect={setSelectedId}
        />
        {selected ? (
          <CarpetDetail
            key={selected.id}
            carpet={selected}
            onRecord={(stepKey, l, w, complete, note) =>
              recordMeasurement(selected.id, stepKey, l, w, complete, note)
            }
            onComplete={(stepKey) => completeStep(selected.id, stepKey)}
            onConfirm={() => confirmReview(selected.id)}
            onAddMark={(mark) => addMark(selected.id, mark)}
            onUpdateMark={(markId, patch) =>
              updateMark(selected.id, markId, patch)
            }
            onRemoveMark={(markId) => removeMark(selected.id, markId)}
          />
        ) : (
          <section className="panel detail">
            <p className="empty">暂无档案</p>
          </section>
        )}
      </div>

      <div className="reset-row">
        <button onClick={reset}>重置演示数据</button>
      </div>
    </main>
  );
}
