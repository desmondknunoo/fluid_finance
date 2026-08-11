"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { getAllStocks, type Stock } from "@/lib/gse";
import { recordAll, getSeries, type PricePoint } from "@/lib/history";
import { saveStockPrices, supabase } from "@/lib/supabase";
import { exportStockPricesToExcel } from "@/lib/export-excel";
import { HistoricalPrices } from "@/components/stock/historical-prices";
import { WeeklyTrendsShareSheet } from "@/components/stock/weekly-trends-share-sheet";
import type { WeeklyTrendCardInput } from "@/lib/weekly-trends-share-card";

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
    const [shareSheet, setShareSheet] = useState<{ open: boolean; input: WeeklyTrendCardInput | null }>({
        open: false,
        input: null,
    });
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [exportFridaysOnly, setExportFridaysOnly] = useState(false);
    const [exportWeeklyComparison, setExportWeeklyComparison] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const fetchAvailableDates = async () => {
        try {
            const { data } = await supabase
                .from("stock_prices")
                .select("trading_date")
                .order("trading_date", { ascending: true });
            if (!data) return;
            const dates = [...new Set(data.map((r) => r.trading_date))].sort();
            setAvailableDates(dates);
            if (dates.length > 0) {
                setExportStartDate(dates[0]);
                setExportEndDate(dates[dates.length - 1]);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchAvailableDates();
    }, []);

    const fetchStocks = async (isRefresh = false) => {
        if (isRefresh) setLoading(true);
        try {
            const data = await getAllStocks();
            recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
            saveStockPrices(data.map((s) => ({ symbol: s.symbol, price: s.price }))).catch(() => {});
            setStocks(data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!cancelled) await fetchStocks();
        })();
        return () => { cancelled = true; };
    }, []);

    const handleRefresh = async () => {
        await fetchStocks(true);
        await fetchAvailableDates();
    };

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

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-canvas">
            <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.05] via-transparent to-ink/[0.05] blur-3xl" />

            <div className="page-container relative z-10 py-12 sm:py-16 md:py-20">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight font-poppins">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-ink to-ink/80">Market Trends</span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Real-time market movers, top gainers, losers, and most active stocks on the Ghana Stock Exchange.
                        </p>
                    </motion.div>

                    {/* Export Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="mb-8">
                        <div className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <h3 className="text-sm font-semibold text-ink sm:mr-auto">Export to Excel</h3>
                                <button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-ink/5 border border-ink/10 px-4 py-2 text-sm font-semibold text-ink transition-all hover:bg-ink/10 hover:border-ink/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    {exporting ? "Exporting..." : "Export"}
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                                <input type="date" value={exportStartDate} min={availableDates[0] || ""} max={exportEndDate || availableDates[availableDates.length - 1] || ""} onChange={(e) => setExportStartDate(e.target.value)} className="rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
                                <span className="text-xs text-ink/40">to</span>
                                <input type="date" value={exportEndDate} min={exportStartDate || availableDates[0] || ""} max={availableDates[availableDates.length - 1] || ""} onChange={(e) => setExportEndDate(e.target.value)} className="rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
                                <select value={exportWeeklyComparison ? "comparison" : exportFridaysOnly ? "fridays" : "all"} onChange={(e) => { setExportWeeklyComparison(e.target.value === "comparison"); setExportFridaysOnly(e.target.value === "fridays"); }} className="rounded-lg border border-ink/10 bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/20">
                                    <option value="all">All prices</option>
                                    <option value="fridays">Fridays only</option>
                                    <option value="comparison">Weekly comparison</option>
                                </select>
                            </div>
                            {exportError && <p className="mt-3 text-xs text-rose-500">{exportError}</p>}
                        </div>
                    </motion.div>

                    {/* Historical Prices with refresh + timestamp */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">Database</p>
                                <h2 className="mt-1 text-xl font-bold text-ink">Closing Price History</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-ink/50">Daily closing prices recorded from the GSE</p>
                                    {lastUpdated && (
                                        <span className="text-[10px] text-ink/30">
                                            · Updated {new Date(lastUpdated + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-xs text-ink/60 hover:bg-ink/[0.05] hover:text-ink transition-colors disabled:opacity-50"
                                title="Refresh prices"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                        <HistoricalPrices onLastUpdated={setLastUpdated} />
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
