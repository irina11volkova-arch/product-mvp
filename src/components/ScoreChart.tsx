'use client';

interface ScoreChartProps {
  scores: { score: number; date: string }[];
}

export default function ScoreChart({ scores }: ScoreChartProps) {
  if (scores.length < 2) {
    return (
      <div className="text-zinc-400 text-sm text-center py-8">
        Нужно минимум 2 звонка для графика
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xStep = chartW / (scores.length - 1);

  const points = scores.map((s, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - (s.score / 10) * chartH,
    score: s.score,
    date: new Date(s.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[600px]">
        {/* Grid lines */}
        {[0, 2, 4, 6, 8, 10].map(v => {
          const y = padding.top + chartH - (v / 10) * chartH;
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f4f4f5" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-zinc-400" fontSize={11}>
                {v}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#3b82f6" strokeWidth={2} />
            <text x={p.x} y={height - 8} textAnchor="middle" className="fill-zinc-400" fontSize={10}>
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
