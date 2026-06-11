import React from 'react';

interface Point { label: string; value: number }

export default function BranchStatsChart({ data, height = 160 }: { data: Point[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const padding = 24;
  const w = Math.max(320, data.length * 48);
  const innerW = w - padding * 2;
  const barWidth = innerW / data.length - 8;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        <rect x={0} y={0} width={w} height={height} fill="transparent" />
        {data.map((d, i) => {
          const x = padding + i * (barWidth + 8);
          const h = (d.value / max) * (height - padding * 1.6);
          const y = height - padding - h;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barWidth} height={h} fill="rgba(196,30,58,0.9)" rx={4} />
              <text x={x + barWidth / 2} y={height - padding + 14} fontSize={11} textAnchor="middle" fill="#ddd">{d.label}</text>
              <text x={x + barWidth / 2} y={y - 6} fontSize={11} textAnchor="middle" fill="#fff">{d.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
