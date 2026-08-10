"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Download, Loader2, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll, getSeries, type PricePoint } from "@/lib/history";
import { saveStockPrices } from "@/lib/supabase";
import { exportStockPricesToExcel, getDefaultDateRange } from "@/lib/export-excel";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { StockCard } from "@/components/stock/stock-card";
import { HistoricalPrices } from "@/components/stock/historical-prices";
import { WeeklyTrendsShareSheet } from "@/components/stock/weekly-trends-share-sheet";
import type { WeeklyTrendCardInput } from "@/lib/weekly-trends-share-card";

type Tab = "gainers" | "losers" | "active";

const MOVER_TABS: { key: Tab; label: string }[] = [
    { key: "gainers", label: "Top Gainers" },
    { key: "losers", label: "Top Losers" },
    { key: "active", label: "Most Active" },
];

function MoverRow({ stock, index }: { stock: Stock; index: number }) {
    const positive = stock.change >= 0;
    return (
        <tr
            onClick={() => openStock(stock.symbol)}
            className="border-b border-ink/[0.04] hover:bg-ink/[0.02] transition-colors cursor-pointer"
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <span className="w-4 font-mono text-xs text-ink/30">{index + 1}</span>
                    <TickerLogo symbol={stock.symbol} size={28} />
                    <div className="min-w-0">
                        <span className="font-bold text-ink uppercase">{stock.symbol}</span>
                        <span className="block max-w-[180px] truncate text-xs text-ink/40">{stock.company}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 font-mono text-ink">{formatCedis(stock.price)}</td>
            <td className="px-6 py-4">
                <span className={cn("inline-flex items-center gap-1 font-medium", positive ? "text-emerald-400" : "text-rose-400")}>
                    {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {positive ? "+" : ""}{stock.change.toFixed(2)}
                </span>
            </td>
            <td className="px-6 py-4 hidden md:table-cell text-ink/60">{stock.volume.toLocaleString()}</td>
            <td className="px-6 py-4 text-right">
                <span className="inline-flex items-center gap-1 text-sm text-ink/60">
                    View <ChevronRight size={14} />
                </span>
            </td>
        </tr>
    );
}

function getLastFriday(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = day === 5 ? 7 : day === 6 ? 1 : (day + 2) % 7 + 1;
    d.setUTCDate(d.getUTCDate() - diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function getFridayBefore(date: Date): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - 7);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function findClosestRecordedPoint(points: PricePoint[], targetMs: number): PricePoint | null {
    const recorded = points.filter((p) => p.recorded);
    if (recorded.length === 0) return null;
    let closest = recorded[0];
    let minDiff = Math.abs(recorded[0].t - targetMs);
    for (const p of recorded) {
        const diff = Math.abs(p.t - targetMs);
        if (diff < minDiff) {
            closest = p;
            minDiff = diff;
        }
    }
    return closest;
}

function formatDateShort(date: Date): string {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export default function MarketTrendsPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("gainers");
    const [shareSheet, setShareSheet] = useState<{ open: boolean; input: WeeklyTrendCardInput | null }>({
        open: false,
        input: null,
    });

    const [exportStartDate, setExportStartDate] = useState(getDefaultDateRange().start);
    const [exportEndDate, setExportEndDate] = useState(getDefaultDateRange().end);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getAllStocks();
                if (cancelled) return;
                recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
                saveStockPrices(data.map((s) => ({ symbol: s.symbol, price: s.price }))).catch(() => {});
                setStocks(data);
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

    const movers = useMemo(() => {
        if (stocks.length === 0) return [];
        switch (activeTab) {
            case "gainers":
                return stocks
                    .filter((s) => s.change > 0)
                    .sort((a, b) => b.changePercent - a.changePercent)
                    .slice(0, 5);
            case "losers":
                return stocks
                    .filter((s) => s.change < 0)
                    .sort((a, b) => a.changePercent - b.changePercent)
                    .slice(0, 5);
            case "active":
                return [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5);
        }
    }, [stocks, activeTab]);

    const weeklyChanges = useMemo(() => {
        if (stocks.length === 0) return [];

        const now = new Date();
        const lastFriday = getLastFriday(now);
        const fridayBefore = getFridayBefore(lastFriday);

        return stocks
            .map((stock) => {
                const series = getSeries(stock.symbol, stock.price, now);
                const allPoints = series.points;

                const lastFridayPoint = findClosestRecordedPoint(allPoints, lastFriday.getTime());
                const fridayBeforePoint = findClosestRecordedPoint(allPoints, fridayBefore.getTime());

                if (!lastFridayPoint || !fridayBeforePoint) {
                    return null;
                }

                if (lastFridayPoint.t === fridayBeforePoint.t) {
                    return null;
                }

                const thisWeekClose = lastFridayPoint.close;
                const lastWeekClose = fridayBeforePoint.close;

                const weeklyChange = thisWeekClose - lastWeekClose;
                const weeklyChangePercent = lastWeekClose > 0 ? (weeklyChange / lastWeekClose) * 100 : 0;

                return {
                    stock,
                    weeklyChange,
                    weeklyChangePercent,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [stocks]);

    const topGainers = useMemo(
        () => weeklyChanges.filter((w) => w.weeklyChangePercent > 0).sort((a, b) => b.weeklyChangePercent - a.weeklyChangePercent).slice(0, 5),
        [weeklyChanges]
    );

    const topLosers = useMemo(
        () => weeklyChanges.filter((w) => w.weeklyChangePercent < 0).sort((a, b) => a.weeklyChangePercent - b.weeklyChangePercent).slice(0, 5),
        [weeklyChanges]
    );

    const getDateRange = () => {
        const now = new Date();
        const lastFriday = getLastFriday(now);
        const fridayBefore = getFridayBefore(lastFriday);
        return {
            start: formatDateShort(fridayBefore),
            end: formatDateShort(lastFriday),
        };
    };

    const handleExport = async () => {
        setExporting(true);
        setExportError(null);
        try {
            await exportStockPricesToExcel(exportStartDate, exportEndDate);
        } catch (err) {
            setExportError(err instanceof Error ? err.message : "Export failed");
        } finally {
            setExporting(false);
        }
    };

    const openShareSheet = (type: "gainers" | "losers") => {
        const dateRange = getDateRange();
        const items = type === "gainers" ? topGainers : topLosers;
        setShareSheet({
            open: true,
            input: {
                type,
                stocks: items.map((w) => w.stock),
                weeklyChanges: items,
                startDate: dateRange.start,
                endDate: dateRange.end,
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
                            Real-time market movers, top gainers, losers, and most active stocks on the Ghana Stock Exchange.
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-ink">Export to Excel</h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-ink/60">From:</label>
                                        <input
                                            type="date"
                                            value={exportStartDate}
                                            onChange={(e) => setExportStartDate(e.target.value)}
                                            className="rounded-lg border border-ink/10 bg-canvas px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-ink/60">To:</label>
                                        <input
                                            type="date"
                                            value={exportEndDate}
                                            onChange={(e) => setExportEndDate(e.target.value)}
                                            className="rounded-lg border border-ink/10 bg-canvas px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                                        />
                                    </div>
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
                            </div>
                            {exportError && (
                                <p className="mt-3 text-xs text-rose-500">{exportError}</p>
                            )}
                        </div>
                    </motion.div>


                    {/* Week in Review - Top Gainers */}
                    {/* {!loading && !error && topGainers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden">
                                <div className="flex flex-col gap-4 border-b border-ink/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">Week in Review</p>
                                        <h2 className="mt-1 text-lg font-bold text-ink">Top Gainers</h2>
                                        <p className="text-xs text-ink/40 mt-1">{getDateRange().start} to {getDateRange().end}</p>
                                    </div>
                                    <button
                                        onClick={() => openShareSheet("gainers")}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/30"
                                    >
                                        <Share2 size={14} />
                                        Share
                                    </button>
                                </div>

                                {/* Mobile cards *}
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

                                {/* Desktop table *}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-ink/[0.08] bg-ink/[0.01]">
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">#</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Weekly Change</th>
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
                                                                <span className="block max-w-[180px] truncate text-xs text-ink/40">{item.stock.company}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-ink">{formatCedis(item.stock.price)}</td>
                                                    <td className="px-6 py-4">
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
                    )} */}

                    {/* Week in Review - Top Losers */}
                    {/* {!loading && !error && topLosers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden">
                                <div className="flex flex-col gap-4 border-b border-ink/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500">Week in Review</p>
                                        <h2 className="mt-1 text-lg font-bold text-ink">Top Losers</h2>
                                        <p className="text-xs text-ink/40 mt-1">{getDateRange().start} to {getDateRange().end}</p>
                                    </div>
                                    <button
                                        onClick={() => openShareSheet("losers")}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-500 transition-all hover:bg-rose-500/20 hover:border-rose-500/30"
                                    >
                                        <Share2 size={14} />
                                        Share
                                    </button>
                                </div>

                                {/* Mobile cards *}
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

                                {/* Desktop table *}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-ink/[0.08] bg-ink/[0.01]">
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">#</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Weekly Change</th>
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
                                                                <span className="block max-w-[180px] truncate text-xs text-ink/40">{item.stock.company}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-ink">{formatCedis(item.stock.price)}</td>
                                                    <td className="px-6 py-4">
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
                    )} */}

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

                    {/* Market movers Today's standouts */}
                    {loading ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-ink/40" />
                        </div>
                    ) : error ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <p className="text-ink/40">Failed to load market data</p>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden"
                        >
                            <div className="flex flex-col gap-4 border-b border-ink/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">Market movers</p>
                                    <h2 className="mt-1 text-lg font-bold text-ink">Today&apos;s standouts</h2>
                                </div>
                                <div className="grid grid-cols-3 rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-1 sm:min-w-[440px]">
                                    {MOVER_TABS.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveTab(key)}
                                            className={cn(
                                                "min-w-0 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all sm:px-3",
                                                activeTab === key
                                                    ? "bg-canvas text-ink shadow-sm"
                                                    : "text-ink/40 hover:text-ink/70",
                                            )}
                                        >
                                            <span className="block truncate">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 p-4 md:hidden">
                                {movers.length === 0 ? (
                                    <p className="py-6 text-center text-ink/40">
                                        No {activeTab === "gainers" ? "gainers" : activeTab === "losers" ? "losers" : "active stocks"} at this time
                                    </p>
                                ) : (
                                    movers.map((stock, index) => (
                                        <StockCard key={stock.symbol} stock={stock} onSelect={openStock} rank={index + 1} />
                                    ))
                                )}
                            </div>

                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-ink/[0.08] bg-ink/[0.01]">
                                            <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider">Change</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider hidden md:table-cell">Volume</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-ink/40 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-ink/40">
                                                    No {activeTab === "gainers" ? "gainers" : activeTab === "losers" ? "losers" : "active stocks"} at this time
                                                </td>
                                            </tr>
                                        ) : (
                                            movers.map((stock, index) => (
                                                <MoverRow key={stock.symbol} stock={stock} index={index} />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
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
