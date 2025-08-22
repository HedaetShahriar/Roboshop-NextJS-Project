"use client";

import { memo, useMemo, useState } from "react";

function normalize(series, width, height, padding = 24, formatDate) {
  const w = width - padding * 2;
  const h = height - padding * 2;
  if (!series?.length) return { bars: [], max: 0 };
  const max = Math.max(...series.map(d => Number(d.value || 0)), 0);
  const step = w / series.length;
  const bars = series.map((d, i) => {
    const v = Number(d.value || 0);
    const bh = max > 0 ? (v / max) * h : 0;
    const dateStr = d.date;
    let label = dateStr;
    try {
      if (formatDate && dateStr) label = formatDate(new Date(dateStr));
    } catch {}
    return {
      x: padding + i * step + 4,
      y: padding + (h - bh),
      width: Math.max(2, step - 8),
      height: bh,
      value: v,
      label,
      dateISO: dateStr,
    };
  });
  return { bars, max };
}

function BarChartBase({ data, width = 640, height = 180, color = "#0ea5e9", grid = true, showLine = false, showArea = false, tooltip = true, dateFormatOptions = { month: 'short', day: 'numeric' }, locale }) {
  const formatter = useMemo(() => new Intl.DateTimeFormat(locale, dateFormatOptions), [locale, dateFormatOptions]);
  const formatDate = (d) => formatter.format(d);
  const { bars, max } = useMemo(() => normalize(data, width, height, 24, formatDate), [data, width, height, formatter]);
  const [hover, setHover] = useState(null);
  const padding = 24;
  const areaPath = useMemo(() => {
    if (!showArea || bars.length === 0) return null;
    const top = bars.map((b, i) => `${i === 0 ? 'M' : 'L'} ${b.x + b.width / 2} ${b.y}`);
    const bottom = `L ${bars[bars.length - 1].x + bars[bars.length - 1].width / 2} ${height - padding} L ${bars[0].x + bars[0].width / 2} ${height - padding} Z`;
    return top.join(' ') + ' ' + bottom;
  }, [bars, showArea, height]);
  const linePath = useMemo(() => {
    if (!showLine || bars.length === 0) return null;
    return bars.map((b, i) => `${i === 0 ? 'M' : 'L'} ${b.x + b.width / 2} ${b.y}`).join(' ');
  }, [bars, showLine]);
  return (
    <svg width={width} height={height} role="img" aria-label="Bar chart" className="w-full h-auto select-none">
      {/* gridlines */}
      {grid && (
        <g stroke="#e5e7eb" strokeWidth="1">
          <line x1="24" y1="24" x2={width - 24} y2="24" />
          <line x1="24" y1={height / 2} x2={width - 24} y2={height / 2} />
          <line x1="24" y1={height - 24} x2={width - 24} y2={height - 24} />
        </g>
      )}
      {/* area fill */}
      {areaPath && (
        <path d={areaPath} fill={color + '33'} stroke="none" />
      )}
      {/* line */}
      {linePath && (
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      )}
      {/* bars */}
      <g>
        {bars.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            fill={color}
            rx="3"
            onMouseEnter={() => setHover({ i, b })}
            onMouseMove={(e) => setHover({ i, b, clientX: e.clientX, clientY: e.clientY })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </g>
      {/* axis labels (last and first) */}
      {bars.length > 0 && (
        <g fill="#6b7280" fontSize="10">
          <text x="24" y={height - 8}>{bars[0].label}</text>
          <text x={width - 24} y={height - 8} textAnchor="end">{bars[bars.length - 1].label}</text>
          <text x="24" y="20">Max: {max}</text>
        </g>
      )}
      {/* simple tooltip */}
      {tooltip && hover && (
        <g>
          <rect x={hover.b.x} y={Math.max(hover.b.y - 28, 0)} width="110" height="24" rx="4" fill="#111827" opacity="0.9" />
          <text x={hover.b.x + 6} y={Math.max(hover.b.y - 12, 12)} fill="#fff" fontSize="11">
            {hover.b.label}: {hover.b.value}
          </text>
        </g>
      )}
    </svg>
  );
}

export default memo(BarChartBase);
