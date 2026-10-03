import type { Carpet, DamageMark, Dimensions } from "../types";
import { areaOf, yarnOf } from "../domain";

interface Props {
  carpet: Carpet;
  dims: Dimensions;
  damages: DamageMark[];
  /** 冻结展示：已完工工序回看时不随新实测变化 */
  frozen?: boolean;
}

const W = 320;

export default function RugMap({ carpet, dims, damages, frozen }: Props) {
  const h = Math.round((W * dims.length) / dims.width);
  return (
    <div className={"rugmap" + (frozen ? " frozen" : "")}>
      <svg viewBox={`0 0 ${W} ${h}`} role="img" aria-label="纹样局部标记图">
        <rect x="2" y="2" width={W - 4} height={h - 4} rx="10"
          fill="#f3ead8" stroke="#8a6a3f" strokeWidth="3" />
        <rect x="14" y="14" width={W - 28} height={h - 28} rx="6"
          fill="none" stroke="#b49463" strokeWidth="1.5" strokeDasharray="6 5" />
        {damages.map((d, i) => (
          <g key={d.id}>
            <ellipse
              cx={d.x * W}
              cy={d.y * h}
              rx={Math.max(3, d.rx * W)}
              ry={Math.max(3, d.ry * h)}
              fill="rgba(164,63,43,0.22)"
              stroke="#a43f2b"
              strokeWidth="2"
              strokeDasharray="5 3"
            >
              <title>
                {`${d.code}｜圈选 ${Math.round(d.rx * dims.width * 2)}×${Math.round(
                  d.ry * dims.length * 2
                )}cm｜面积 ${Math.round(areaOf(d, dims))}cm²｜补线 ${yarnOf(
                  d,
                  dims,
                  carpet.knotDensity
                ).toFixed(2)}m`}
              </title>
            </ellipse>
            <text
              x={d.x * W}
              y={d.y * h + 4}
              textAnchor="middle"
              fontSize="11"
              fill="#7c2d12"
              fontWeight="700"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <p className="rugmap-cap">
        {frozen ? "历史快照圈选（尺寸已冻结）" : "圈选按比例随最新实测自动换算"} ·{" "}
        {dims.width} × {dims.length} cm
      </p>
    </div>
  );
}
