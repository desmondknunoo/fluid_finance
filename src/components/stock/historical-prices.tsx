"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase, type StockPrice } from "@/lib/supabase";

interface DateGroup {
  date: string;
  prices: StockPrice[];
}

export function HistoricalPrices() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("stock_prices")
          .select("*")
          .order("trading_date", { ascending: false })
          .order("symbol", { ascending: true });

        if (fetchError) throw fetchError;
        if (cancelled) return;

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
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-ink/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-sm text-rose-500">{error}</div>
    );
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
      <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-ink/40" />
          <h3 className="text-sm font-bold text-ink">{formatDisplayDate(current.date)}</h3>
          <span className="text-xs text-ink/40">{current.prices.length} stocks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/40 mr-2">
            {pageIndex + 1} / {groups.length}
          </span>
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

      {/* Table */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.date}
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
                </tr>
              </thead>
              <tbody>
                {current.prices.map((row) => (
                  <tr key={row.id} className="border-b border-ink/[0.04] last:border-0 hover:bg-ink/[0.02] transition-colors">
                    <td className="px-5 py-2.5 font-bold text-ink uppercase text-sm">{row.symbol}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-sm text-ink">
                      GHS {row.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
