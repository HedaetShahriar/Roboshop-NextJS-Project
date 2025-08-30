"use client";
import { useMemo, useState, useEffect } from "react";

function pad(n) { return String(n).padStart(2, '0'); }
function fmtYMD(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseYMD(s) {
  if (!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m-1, d);
}

export default function DateRangePicker({ from, to, onChange }) {
  const fromDate = parseYMD(from);
  const toDate = parseYMD(to);
  const initial = fromDate || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0-11
  const [pendingStart, setPendingStart] = useState(null);

  useEffect(() => {
    // if external from changes, sync view
    if (fromDate) {
      setViewYear(fromDate.getFullYear());
      setViewMonth(fromDate.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  const monthLabel = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
  }, [viewYear, viewMonth]);

  const weeks = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = (first.getDay() + 6) % 7; // make Monday=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    // Fill leading blanks
    for (let i = 0; i < startDay; i++) cells.push(null);
    // Fill actual days
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    // Pad to complete weeks
    while (cells.length % 7 !== 0) cells.push(null);
    // Chunk into weeks
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth]);

  const isSameDay = (a, b) => a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const inRange = (d) => {
    if (!d) return false;
    const s = fromDate || pendingStart;
    const e = toDate || (pendingStart ? null : null);
    if (s && toDate) return d >= s && d <= toDate;
    if (s && pendingStart && !toDate) return d >= s && d <= pendingStart;
    return false;
  };

  const handlePrev = () => {
    const nm = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(nm.getFullYear());
    setViewMonth(nm.getMonth());
  };
  const handleNext = () => {
    const nm = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(nm.getFullYear());
    setViewMonth(nm.getMonth());
  };

  const onDayClick = (d) => {
    if (!d) return;
    if (!fromDate && !toDate && !pendingStart) {
      setPendingStart(d);
      if (onChange) onChange({ from: fmtYMD(d), to });
      return;
    }
    const currentStart = fromDate || pendingStart;
    if (currentStart && !toDate) {
      if (d < currentStart) {
        // swap
        if (onChange) onChange({ from: fmtYMD(d), to: fmtYMD(currentStart) });
      } else if (isSameDay(d, currentStart)) {
        // single day range
        if (onChange) onChange({ from: fmtYMD(d), to: fmtYMD(d) });
      } else {
        if (onChange) onChange({ from: fmtYMD(currentStart), to: fmtYMD(d) });
      }
      setPendingStart(null);
      return;
    }
    // If both set, start new selection
    setPendingStart(d);
    if (onChange) onChange({ from: fmtYMD(d), to: '' });
  };

  const clear = () => {
    setPendingStart(null);
    if (onChange) onChange({ from: '', to: '' });
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between">
        <button type="button" onClick={handlePrev} className="h-4 w-4 text-[8px] inline-flex items-center justify-center rounded border hover:bg-zinc-50">‹</button>
        <div className="text-[9px] font-medium leading-none">{monthLabel}</div>
        <button type="button" onClick={handleNext} className="h-4 w-4 text-[8px] inline-flex items-center justify-center rounded border hover:bg-zinc-50">›</button>
      </div>
      <div className="grid grid-cols-7 text-[7px] text-muted-foreground">
        {['M','T','W','T','F','S','S'].map((d) => (
          <div key={d} className="h-3 flex items-center justify-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map((cell, idx) => {
          if (!cell) return <div key={idx} className="h-4" />;
          const selectedStart = fromDate && isSameDay(cell, fromDate);
          const selectedEnd = toDate && isSameDay(cell, toDate);
          const isSelected = selectedStart || selectedEnd;
          const within = inRange(cell);
          const cls = [
            "h-4 rounded text-[9px] flex items-center justify-center border",
            isSelected ? "bg-zinc-900 text-white border-zinc-900" : within ? "bg-zinc-100" : "bg-white hover:bg-zinc-50",
          ].join(' ');
          return (
            <button key={idx} type="button" className={cls} onClick={() => onDayClick(cell)}>
              {cell.getDate()}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[8px] mt-0.5">
        <div className="text-muted-foreground truncate leading-none">
          {from || '—'}<span className="mx-0.5">→</span>{to || '—'}
        </div>
        <button type="button" onClick={clear} className="h-4 px-1 rounded border text-[8px] bg-white hover:bg-zinc-50 leading-none">Clear</button>
      </div>
    </div>
  );
}
