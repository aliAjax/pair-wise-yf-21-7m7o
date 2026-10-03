import "./styles.css";
import { useMemo, useState } from "react";
import { StoreProvider, useStore } from "./store";
import Sidebar from "./components/Sidebar";
import DetailView from "./components/DetailView";

function Workspace() {
  const { carpets } = useStore();
  const [selectedId, setSelectedId] = useState(carpets[0]?.id ?? "");
  const selected = carpets.find((c) => c.id === selectedId) ?? carpets[0];

  const metrics = useMemo(() => {
    const repairing = carpets.filter(
      (c) => !c.steps.finish.done
    ).length;
    const review = carpets.filter((c) => c.review).length;
    const cards = new Set(carpets.flatMap((c) => c.cards)).size;
    const finished = carpets.filter((c) => c.steps.finish.done).length;
    const rate = carpets.length
      ? Math.round((finished / carpets.length) * 100)
      : 0;
    return [
      { label: "在修地毯", value: repairing },
      { label: "纹样档案", value: carpets.length },
      { label: "待复核", value: review, warn: review > 0 },
      { label: "领用色卡", value: cards },
      { label: "完工率", value: `${rate}%` },
    ];
  }, [carpets]);

  if (!selected) {
    return <main className="app"><p>暂无档案，请先新增。</p></main>;
  }

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62009 · 手工地毯修复工作室</p>
        <h1>地毯修复纹样档案</h1>
        <span>
          按工序登记湿洗、拉伸后的实测尺寸；实测一更新即重算破损圈选与色卡补线长度，
          已完工工序冻结当时尺寸和用线量；两次实测超公差自动挂待复核，确认前不往下走工序。
        </span>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label} className={m.warn ? "warn" : ""}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <div className="layout">
        <Sidebar
          carpets={carpets}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
        <DetailView key={selected.id} carpet={selected} />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Workspace />
    </StoreProvider>
  );
}
