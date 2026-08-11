"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Calendar, ChevronLeft, ChevronRight, LineChart, Search, X } from "lucide-react";
import { LineChart as RechartLine, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase, type StockPrice } from "@/lib/supabase";

interface DateGroup {
  date: string;
  prices: StockPrice[];
}

type SortKey = "symbol-asc" | "symbol-desc" | "price-asc" | "price-desc";

export function HistoricalPrices({ onLastUpdated }: { onLastUpdated?: (date: string) => void }) {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("symbol-asc");
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("stock_prices")
        .select("*")
        .order("trading_date", { ascending: false })
        .order("symbol", { ascending: true });

      if (fetchError) throw fetchError;

      const map = new Map<string, StockPrice[]>();
      for (const row of data || []) {
        const existing = map.get(row.trading_date) || [];
        existing.push(row);
        map.set(row.trading_date, existing);
      }

      const dateGroups: DateGroup[] = Array.from(map.entries())
        .map(([date, prices]) => ({ date, prices }))
        .sort((a, b) => b.date.localeCompare(a.date));

      setGroups(dateGroups);

      if (dateGroups.length > 0 && onLastUpdated) {
        onLastUpdated(dateGroups[0].date);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchData();
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredPrices = useMemo(() => {
    if (groups.length === 0) return [];
    const current = groups[pageIndex];
    let prices = [...current.prices];

    if (search) {
      const q = search.toUpperCase();
      prices = prices.filter((p) => p.symbol.includes(q));
    }

    switch (sortKey) {
      case "symbol-asc":
        prices.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
      case "symbol-desc":
        prices.sort((a, b) => b.symbol.localeCompare(a.symbol));
        break;
      case "price-asc":
        prices.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        prices.sort((a, b) => b.price - a.price);
        break;
    }

    return prices;
  }, [groups, pageIndex, search, sortKey]);

  const chartData = useMemo(() => {
    if (!chartSymbol) return [];
    return [...groups]
      .reverse()
      .map((g) => {
        const match = g.prices.find((p) => p.symbol === chartSymbol);
        return { date: formatChartDate(g.date), price: match?.price ?? null };
      })
      .filter((d) => d.price !== null);
  }, [groups, chartSymbol]);

  const cycleSort = () => {
    const order: SortKey[] = ["symbol-asc", "symbol-desc", "price-asc", "price-desc"];
    const idx = order.indexOf(sortKey);
    setSortKey(order[(idx + 1) % order.length]);
  };

  const sortLabel = {
    "symbol-asc": "A → Z",
    "symbol-desc": "Z → A",
    "price-asc": "Price ↑",
    "price-desc": "Price ↓",
  }[sortKey];

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return <div className="text-center py-12 text-sm text-rose-500">{error}</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-ink/40">
        No price history recorded yet. Data will appear as the app is used.
      </div>
    );
  }

  const current = groups[pageIndex];
  const hasPrev = pageIndex < groups.length - 1;
  const hasNext = pageIndex > 0;

  return (
    <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden">
      {/* Header with pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-ink/[0.08] px-5 py-4 gap-3">
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-ink/40" />
          <h3 className="text-sm font-bold text-ink">{formatDisplayDate(current.date)}</h3>
          <span className="text-xs text-ink/40">{filteredPrices.length} stocks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/40 mr-2">{pageIndex + 1} / {groups.length}</span>
          <button
            onClick={() => hasPrev && setPageIndex(pageIndex + 1)}
            disabled={!hasPrev}
            className="rounded-lg border border-ink/10 p-1.5 text-ink/40 transition-colors hover:bg-ink/[0.05] hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => hasNext && setPageIndex(pageIndex - 1)}
            disabled={!hasNext}
            className="rounded-lg border border-ink/10 p-1.5 text-ink/40 transition-colors hover:bg-ink/[0.05] hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Search + Sort bar */}
      <div className="flex items-center gap-2 border-b border-ink/[0.06] px-5 py-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ink/10 bg-canvas pl-8 pr-8 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={cycleSort}
          className="flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs text-ink/60 hover:bg-ink/[0.05] hover:text-ink transition-colors"
        >
          <ArrowUpDown size={12} />
          {sortLabel}
        </button>
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.date + sortKey + search}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/[0.06] bg-ink/[0.01]">
                  <th className="px-5 py-3 text-[10px] font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-ink/40 uppercase tracking-wider text-right">Closing Price</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-ink/40 text-sm">No stocks match "{search}"</td>
                  </tr>
                ) : (
                  filteredPrices.map((row) => (
                    <tr key={row.id} className="border-b border-ink/[0.04] last:border-0 hover:bg-ink/[0.02] transition-colors">
                      <td className="px-5 py-2.5 font-bold text-ink uppercase text-sm">{row.symbol}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-sm text-ink">GHS {row.price.toFixed(2)}</td>
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => setChartSymbol(chartSymbol === row.symbol ? null : row.symbol)}
                          className="rounded p-1 text-ink/30 hover:bg-ink/[0.05] hover:text-ink transition-colors"
                          title={`Show price trend for ${row.symbol}`}
                        >
                          <LineChart size={14} className={chartSymbol === row.symbol ? "text-ink" : ""} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Chart */}
      <AnimatePresence>
        {chartSymbol && chartData.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-ink/[0.08] overflow-hidden"
          >
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-ink uppercase">{chartSymbol} Price Trend</h4>
                <button onClick={() => setChartSymbol(null)} className="text-ink/30 hover:text-ink/60">
                  <X size={14} />
                </button>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartLine data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }} />
                    <YAxis tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }} width={50} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-canvas)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number) => [`GHS ${value.toFixed(2)}`, "Price"]}
                    />
                    <Line type="monotone" dataKey="price" stroke="currentColor" strokeWidth={2} dot={{ r: 3 }} className="text-ink" />
                  </RechartLine>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden animate-pulse">
      <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded bg-ink/10" />
          <div className="h-4 w-32 rounded bg-ink/10" />
          <div className="h-3 w-16 rounded bg-ink/10" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-lg bg-ink/10" />
          <div className="h-8 w-8 rounded-lg bg-ink/10" />
        </div>
      </div>
      <div className="px-5 py-3 border-b border-ink/[0.06]">
        <div className="h-8 rounded-lg bg-ink/10" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-ink/[0.04]">
          <div className="h-4 w-16 rounded bg-ink/10" />
          <div className="h-4 w-20 rounded bg-ink/10" />
        </div>
      ))}
    </div>
  );
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
