"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BarChart from "@/components/charts/BarChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ranges = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export default function MetricsPanel() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ series: { revenue: [], orders: [] }, totals: { revenue: 0, orders: 0 }, range: null });

  const load = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/metrics?days=${d}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const fmtCurrency = useMemo(() => (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n), []);
  const fmtInteger = useMemo(() => (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Revenue & Orders</h2>
          <p className="text-sm text-muted-foreground">Timeframe: last {days} days</p>
        </div>
        <div className="flex gap-2">
          {ranges.map(r => (
            <Button key={r.days} size="sm" variant={days === r.days ? 'default' : 'outline'} onClick={() => setDays(r.days)}>{r.label}</Button>
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Total: {fmtCurrency(data.totals?.revenue || 0)}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
              <BarChart data={(data.series?.revenue || [])} color="#10b981" showLine showArea valueFormatter={fmtCurrency} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New orders</CardTitle>
            <CardDescription>Total: {data.totals?.orders || 0}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
              <BarChart data={(data.series?.orders || [])} color="#3b82f6" showLine showArea valueFormatter={fmtInteger} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}