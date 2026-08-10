"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2 } from "lucide-react";
import { supabase, type StockPrice } from "@/lib/supabase";

interface DateGroup {
  date: string;
  prices: StockPrice[];
}

export function HistoricalPrices() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Group by trading_date
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

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
          className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-ink/[0.08] px-5 py-4">
            <Calendar size={14} className="text-ink/40" />
            <h3 className="text-sm font-bold text-ink">{formatDisplayDate(group.date)}</h3>
            <span className="text-xs text-ink/40">{group.prices.length} stocks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/[0.06] bg-ink/[0.01]">
                  <th className="px-5 py-3 text-[10px] font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-ink/40 uppercase tracking-wider text-right">Closing Price</th>
                </tr>
              </thead>
              <tbody>
                {group.prices.map((row) => (
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
      ))}
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
