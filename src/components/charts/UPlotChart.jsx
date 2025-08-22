"use client";

import React, { useMemo } from "react";
import UPlotReact from "uplot-react";
import 'uplot/dist/uPlot.min.css';

// Simple, lightweight uPlot line/area chart
// props: data [{date: 'YYYY-MM-DD', value:number}], color, height
export default function UPlotChart({ data, color = '#3b82f6', height = 200, area = true }) {
  const { opts, series } = useMemo(() => {
    const x = (data || []).map(d => new Date(d.date).getTime());
    const y = (data || []).map(d => Number(d.value || 0));
    const values = [x, y];
    const max = y.length ? Math.max(...y) : 0;
    const dateFmt = (ts) => {
      const d = new Date(ts);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${m}-${day}`;
    };
    return {
      opts: {
        width: 800,
        height,
        padding: [8, 8, 24, 40],
        cursor: { drag: { x: false, y: false } },
        scales: { x: { time: false }, y: { auto: true } },
        axes: [
          { stroke: '#6b7280', grid: { stroke: '#e5e7eb' }, values: (u, ticks) => ticks.map(dateFmt) },
          { stroke: '#6b7280', grid: { stroke: '#e5e7eb' } },
        ],
        series: [
          {},
          {
            label: 'value',
            stroke: color,
            width: 2,
            fill: area ? `${color}20` : undefined,
          },
        ],
      },
      series: values,
    };
  }, [data, color, height, area]);

  if (!data?.length) return <div className="text-sm text-muted-foreground">No data</div>;

  return (
    <div className="w-full">
      <UPlotReact options={opts} data={series} />
    </div>
  );
}
