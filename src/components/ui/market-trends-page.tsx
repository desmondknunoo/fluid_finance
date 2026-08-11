"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { formatCedis, metaFor, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { saveStockPrices, getStockPriceHistory, supabase } from "@/lib/supabase";
import { exportStockPricesToExcel } from "@/lib/export-excel";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { HistoricalPrices } from "@/components/stock/historical-prices";
import { WeeklyTrendsShareSheet } from "@/components/stock/weekly-trends-share-sheet";
import type { WeeklyTrendCardInput } from "@/lib/weekly-trends-share-card";

interface WeeklyChange {
    stock: Stock;
    weeklyChange: number;
    weeklyChangePercent: number;
}

/** UTC midnight of the most recent Friday on or before `date` (today if it's Friday). */
function getLastFriday(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay(); // Sun=0 … Fri=5 … Sat=6
    const diff = (day - 5 + 7) % 7; // days since the most recent Friday
    d.setUTCDate(d.getUTCDate() - diff);
    return d;
}

/** The Friday one week before the given Friday. */
function getFridayBefore(friday: Date): Date {
    const d = new Date(friday);
    d.setUTCDate(d.getUTCDate() - 7);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function toISODate(date: Date): string {
    return date.toISOString().split("T")[0];
}

/** Nearest recorded trading date on or before `target` (handles holidays / gaps). */
function closestOnOrBefore(dates: string[], target: string): string | null {
    let best: string | null = null;
    for (const d of dates) {
        if (d <= target && (best === null || d > best)) best = d;
    }
    return best;
}

function formatDateShort(iso: string): string {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    });
}

export default function MarketTrendsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareSheet, setShareSheet] = useState<{ open: boolean; input: WeeklyTrendCardInput | null }>({
        open: false,
        input: null,
    });

    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [weeklyChanges, setWeeklyChanges] = useState<WeeklyChange[]>([]);
    // The two Fridays actually compared, resolved to real recorded trading dates.
    const [weekRange, setWeekRange] = useState<{ start: string; end: string } | null>(null);

    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");
    const [exportFridaysOnly, setExportFridaysOnly] = useState(false);
    const [exportWeeklyComparison, setExportWeeklyComparison] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    // Fetch the distinct trading dates we have in Supabase.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await supabase
                    .from("stock_prices")
                    .select("trading_date")
                    .order("trading_date", { ascending: true });

                if (cancelled || !data) return;

                const dates = [...new Set(data.map((r) => r.trading_date))].sort();
                setAvailableDates(dates);
                if (dates.length > 0) {
                    setExportStartDate(dates[0]);
                    setExportEndDate(dates[dates.length - 1]);
                }
            } catch {
                // Ignore errors
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Pull live prices (records today's close into Supabase + local history).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getAllStocks();
                if (cancelled) return;
                recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
                saveStockPrices(data.map((s) => ({ symbol: s.symbol, price: s.price }))).catch(() => {});
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    /**
     * Week in Review = last Friday's closing price vs. the Friday-before-last's
     * closing price, both read from the recorded closes in Supabase. If a Friday
     * was a market holiday, we fall back to the nearest recorded trading day
     * before it. Needs two distinct Fridays of data or the section stays hidden.
     */
    useEffect(() => {
        if (availableDates.length === 0) return;
        let cancelled = false;

        (async () => {
            const lastFriday = getLastFriday(new Date());
            const fridayBefore = getFridayBefore(lastFriday);
            let endDate = closestOnOrBefore(availableDates, toISODate(lastFriday));
            let startDate = closestOnOrBefore(availableDates, toISODate(fridayBefore));

            // Until two Fridays of data exist, fall back to the two most recent
            // recorded trading days so the section still shows real movement.
            if (!endDate || !startDate || endDate === startDate) {
                if (availableDates.length >= 2) {
                    endDate = availableDates[availableDates.length - 1];
                    startDate = availableDates[availableDates.length - 2];
                } else {
                    if (!cancelled) {
                        setWeeklyChanges([]);
                        setWeekRange(null);
                    }
                    return;
                }
            }

            try {
                const rows = await getStockPriceHistory(startDate, endDate);
                const lastClose = new Map<string, number>();
                const prevClose = new Map<string, number>();
                for (const r of rows) {
                    if (r.trading_date === endDate) lastClose.set(r.symbol, r.price);
                    else if (r.trading_date === startDate) prevClose.set(r.symbol, r.price);
                }

                const changes: WeeklyChange[] = [];
                for (const [symbol, close] of lastClose) {
                    const before = prevClose.get(symbol);
                    if (before == null || before <= 0) continue;
                    const meta = metaFor(symbol);
                    const weeklyChange = close - before;
                    changes.push({
                        stock: {
                            symbol,
                            company: meta.company,
                            sector: meta.sector,
                            industry: meta.industry,
                            price: close,
                            change: 0,
                            changePercent: 0,
                            volume: 0,
                        },
                        weeklyChange,
                        weeklyChangePercent: (weeklyChange / before) * 100,
                    });
                }

                if (!cancelled) {
                    setWeeklyChanges(changes);
                    setWeekRange({ start: startDate, end: endDate });
                }
            } catch {
                if (!cancelled) {
                    setWeeklyChanges([]);
                    setWeekRange(null);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [availableDates]);

    const topGainers = weeklyChanges
        .filter((w) => w.weeklyChangePercent > 0)
        .sort((a, b) => b.weeklyChangePercent - a.weeklyChangePercent)
        .slice(0, 5);

    const topLosers = weeklyChanges
        .filter((w) => w.weeklyChangePercent < 0)
        .sort((a, b) => a.weeklyChangePercent - b.weeklyChangePercent)
        .slice(0, 5);

    const rangeLabel = weekRange
        ? { start: formatDateShort(weekRange.start), end: formatDateShort(weekRange.end) }
        : { start: "", end: "" };

    const handleExport = async () => {
        setExporting(true);
        setExportError(null);
        try {
            await exportStockPricesToExcel(exportStartDate, exportEndDate, exportFridaysOnly, exportWeeklyComparison);
        } catch (err) {
            setExportError(err instanceof Error ? err.message : "Export failed");
        } finally {
            setExporting(false);
        }
    };

    const openShareSheet = (type: "gainers" | "losers") => {
        const items = type === "gainers" ? topGainers : topLosers;
        setShareSheet({
            open: true,
            input: {
                type,
                stocks: items.map((w) => w.stock),
                weeklyChanges: items,
                startDate: rangeLabel.start,
                endDate: rangeLabel.end,
            },
        });
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-canvas">
            <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.05] via-transparent to-ink/[0.05] blur-3xl" />

            <div className="page-container relative z-10 py-12 sm:py-16 md:py-20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">
                                Market Trends
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Weekly winners and losers on the Ghana Stock Exchange, measured Friday close to Friday close.
                        </p>
                    </motion.div>

                    {/* Export Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="mb-8"
                    >
                        <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3 mb-3 sm:mb-0">
                                <h3 className="text-sm font-semibold text-ink">Export to Excel</h3>
                                <button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-ink/5 border border-ink/10 px-4 py-2 text-sm font-semibold text-ink transition-all hover:bg-ink/10 hover:border-ink/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exporting ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                    {exporting ? "Exporting..." : "Export"}
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="date"
                                    value={exportStartDate}
                                    min={availableDates[0] || ""}
                                    max={exportEndDate || availableDates[availableDates.length - 1] || ""}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                    className="rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                                />
                                <span className="text-xs text-ink/40">to</span>
                                <input
                                    type="date"
                                    value={exportEndDate}
                                    min={exportStartDate || availableDates[0] || ""}
                                    max={availableDates[availableDates.length - 1] || ""}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                    className="rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                                />
                                <select
                                    value={exportWeeklyComparison ? "comparison" : exportFridaysOnly ? "fridays" : "all"}
                                    onChange={(e) => {
                                        setExportWeeklyComparison(e.target.value === "comparison");
                                        setExportFridaysOnly(e.target.value === "fridays");
                                    }}
                                    className="rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                                >
                                    <option value="all">All prices</option>
                                    <option value="fridays">Fridays only</option>
                                    <option value="comparison">Weekly comparison</option>
                                </select>
                            </div>
                            {exportError && <p className="mt-3 text-xs text-rose-500">{exportError}</p>}
                        </div>
                    </motion.div>

                    {/* Week in Review - Top Gainers */}
                    {!loading && !error && topGainers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden">
                                <div className="flex items-start justify-between gap-3 border-b border-ink/[0.08] p-4 sm:p-5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">Week in Review</p>
                                        <h2 className="mt-1 text-lg font-bold text-ink">Top Gainers</h2>
                                        <p className="text-xs text-ink/40 mt-1">{rangeLabel.start} to {rangeLabel.end}</p>
                                    </div>
                                    <button
                                        onClick={() => openShareSheet("gainers")}
                                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/30"
                                    >
                                        <Share2 size={13} />
                                        Share
                                    </button>
                                </div>

                                {/* Mobile cards */}
                                <div className="flex flex-col gap-2 p-4 md:hidden">
                                    {topGainers.map((item, index) => (
                                        <button
                                            key={item.stock.symbol}
                                            onClick={() => openStock(item.stock.symbol)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-3 text-left transition-colors hover:border-ink/20 hover:bg-ink/[0.05]"
                                        >
                                            <span className="w-4 shrink-0 text-center font-mono text-xs text-ink/30">{index + 1}</span>
                                            <TickerLogo symbol={item.stock.symbol} size={38} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <span className="truncate font-bold uppercase text-ink">{item.stock.symbol}</span>
                                                    <span className="shrink-0 font-mono text-ink">{formatCedis(item.stock.price)}</span>
                                                </div>
                                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                                    <span className="truncate text-xs text-ink/40">{item.stock.company}</span>
                                                    <span className="flex shrink-0 items-center gap-1 font-mono text-xs font-medium text-emerald-400">
                                                        <TrendingUp size={12} />
                                                        +{item.weeklyChangePercent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Desktop table */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-ink/[0.08] bg-ink/[0.01]">
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">#</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Closing Price</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider text-right">Weekly Change</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topGainers.map((item, index) => (
                                                <tr
                                                    key={item.stock.symbol}
                                                    onClick={() => openStock(item.stock.symbol)}
                                                    className="border-b border-ink/[0.04] hover:bg-ink/[0.02] transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 font-mono text-xs text-ink/30">{index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <TickerLogo symbol={item.stock.symbol} size={28} />
                                                            <div className="min-w-0">
                                                                <span className="font-bold text-ink uppercase">{item.stock.symbol}</span>
                                                                <span className="block max-w-[220px] truncate text-xs text-ink/40">{item.stock.company}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-ink">{formatCedis(item.stock.price)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                                                            <TrendingUp size={14} />
                                                            +{item.weeklyChangePercent.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Week in Review - Top Losers */}
                    {!loading && !error && topLosers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden">
                                <div className="flex items-start justify-between gap-3 border-b border-ink/[0.08] p-4 sm:p-5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500">Week in Review</p>
                                        <h2 className="mt-1 text-lg font-bold text-ink">Top Losers</h2>
                                        <p className="text-xs text-ink/40 mt-1">{rangeLabel.start} to {rangeLabel.end}</p>
                                    </div>
                                    <button
                                        onClick={() => openShareSheet("losers")}
                                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-500/20 hover:border-rose-500/30"
                                    >
                                        <Share2 size={13} />
                                        Share
                                    </button>
                                </div>

                                {/* Mobile cards */}
                                <div className="flex flex-col gap-2 p-4 md:hidden">
                                    {topLosers.map((item, index) => (
                                        <button
                                            key={item.stock.symbol}
                                            onClick={() => openStock(item.stock.symbol)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-3 text-left transition-colors hover:border-ink/20 hover:bg-ink/[0.05]"
                                        >
                                            <span className="w-4 shrink-0 text-center font-mono text-xs text-ink/30">{index + 1}</span>
                                            <TickerLogo symbol={item.stock.symbol} size={38} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <span className="truncate font-bold uppercase text-ink">{item.stock.symbol}</span>
                                                    <span className="shrink-0 font-mono text-ink">{formatCedis(item.stock.price)}</span>
                                                </div>
                                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                                    <span className="truncate text-xs text-ink/40">{item.stock.company}</span>
                                                    <span className="flex shrink-0 items-center gap-1 font-mono text-xs font-medium text-rose-400">
                                                        <TrendingDown size={12} />
                                                        {item.weeklyChangePercent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Desktop table */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-ink/[0.08] bg-ink/[0.01]">
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">#</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Closing Price</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider text-right">Weekly Change</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topLosers.map((item, index) => (
                                                <tr
                                                    key={item.stock.symbol}
                                                    onClick={() => openStock(item.stock.symbol)}
                                                    className="border-b border-ink/[0.04] hover:bg-ink/[0.02] transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 font-mono text-xs text-ink/30">{index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <TickerLogo symbol={item.stock.symbol} size={28} />
                                                            <div className="min-w-0">
                                                                <span className="font-bold text-ink uppercase">{item.stock.symbol}</span>
                                                                <span className="block max-w-[220px] truncate text-xs text-ink/40">{item.stock.company}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-ink">{formatCedis(item.stock.price)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center gap-1 font-medium text-rose-400">
                                                            <TrendingDown size={14} />
                                                            {item.weeklyChangePercent.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Historical Prices */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <div className="mb-6">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">Database</p>
                            <h2 className="mt-1 text-xl font-bold text-ink">Closing Price History</h2>
                            <p className="text-sm text-ink/50 mt-1">Daily closing prices recorded from the GSE</p>
                        </div>
                        <HistoricalPrices />
                    </motion.div>
                </div>
            </div>

            {/* Weekly Trends Share Sheet */}
            {shareSheet.input && (
                <WeeklyTrendsShareSheet
                    open={shareSheet.open}
                    onClose={() => setShareSheet({ open: false, input: null })}
                    card={shareSheet.input}
                />
            )}
        </div>
    );
}
