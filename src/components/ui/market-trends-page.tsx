"use client";

import { useEffect, useState } from "react";
import { Download, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { formatCedis, metaFor, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { getStockPriceHistory, listCloseDates } from "@/lib/closes";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { HistoricalPrices } from "@/components/stock/historical-prices";
import { WeeklyTrendsShareSheet } from "@/components/stock/weekly-trends-share-sheet";
import type { WeeklyTrendCardInput } from "@/lib/weekly-trends-share-card";
import { Notice, SecondaryButton, SelectField, TextField } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { cn } from "@/lib/utils";

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

/** UTC midnight of the Monday of the week containing `date`. */
function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay(); // Sun=0 … Mon=1 … Sat=6
    const diff = (day - 1 + 7) % 7; // days since Monday
    d.setUTCDate(d.getUTCDate() - diff);
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
    // The two week ranges (Mon-Fri) resolved to real recorded trading dates.
    const [week1Range, setWeek1Range] = useState<{ start: string; end: string } | null>(null);
    const [week2Range, setWeek2Range] = useState<{ start: string; end: string } | null>(null);

    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");
    const [exportFridaysOnly, setExportFridaysOnly] = useState(false);
    const [exportWeeklyComparison, setExportWeeklyComparison] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    // The trading days the backend has recorded a close for.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const dates = await listCloseDates();
                if (cancelled) return;
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

    // Pull live prices for the local history; the backend records the daily close itself.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getAllStocks();
                if (cancelled) return;
                recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
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
     * Week in Review = two completed Mon-Fri week ranges.
     * Compares last Friday's close vs. the Friday-before-last's close.
     * Falls back to the two most recent recorded trading days if needed.
     */
    useEffect(() => {
        if (availableDates.length === 0) return;
        let cancelled = false;

        (async () => {
            const lastFriday = getLastFriday(new Date());
            const lastMonday = getMondayOfWeek(lastFriday);
            const prevFriday = getFridayBefore(lastFriday);
            const prevMonday = getMondayOfWeek(prevFriday);

            const week2End = closestOnOrBefore(availableDates, toISODate(lastFriday));
            const week2Start = closestOnOrBefore(availableDates, toISODate(lastMonday));
            const week1End = closestOnOrBefore(availableDates, toISODate(prevFriday));
            const week1Start = closestOnOrBefore(availableDates, toISODate(prevMonday));

            // Need two distinct weeks with both Mon and Fri dates.
            let startDate = week1End;
            let endDate = week2End;
            let w1Start = week1Start;
            let w1End = week1End;
            let w2Start = week2Start;
            let w2End = week2End;

            if (!startDate || !endDate || startDate === endDate || !w1Start || !w2Start) {
                if (availableDates.length >= 2) {
                    endDate = availableDates[availableDates.length - 1];
                    startDate = availableDates[availableDates.length - 2];
                    w1Start = startDate;
                    w1End = startDate;
                    w2Start = endDate;
                    w2End = endDate;
                } else {
                    if (!cancelled) {
                        setWeeklyChanges([]);
                        setWeek1Range(null);
                        setWeek2Range(null);
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

                if (!cancelled && w1Start && w1End && w2Start && w2End) {
                    setWeeklyChanges(changes);
                    setWeek1Range({ start: toISODate(prevMonday), end: toISODate(prevFriday) });
                    setWeek2Range({ start: toISODate(lastMonday), end: toISODate(lastFriday) });
                }
            } catch {
                if (!cancelled) {
                    setWeeklyChanges([]);
                    setWeek1Range(null);
                    setWeek2Range(null);
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

    const rangeLabel = week1Range && week2Range
        ? {
            w1: `${formatDateShort(week1Range.start)} to ${formatDateShort(week1Range.end)}`,
            w2: `${formatDateShort(week2Range.start)} to ${formatDateShort(week2Range.end)}`,
        }
        : null;

    const handleExport = async () => {
        setExporting(true);
        setExportError(null);
        try {
            // The spreadsheet library is large, so it loads only when someone exports.
            const { exportStockPricesToExcel } = await import("@/lib/export-excel");
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
                startDate: rangeLabel?.w1 ?? "",
                endDate: rangeLabel?.w2 ?? "",
            },
        });
    };

    const showReview = !loading && !error && (topGainers.length > 0 || topLosers.length > 0);

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Week in review"
                title="Market Trends"
                description="Weekly winners and losers on the Ghana Stock Exchange, measured week-over-week."
            />

            {/* Week in Review */}
            {showReview && (
                <section className="news-section" aria-labelledby="review-heading">
                    <header className="news-section-header">
                        <h2 id="review-heading">Week in Review</h2>
                        {rangeLabel && <span>{rangeLabel.w1} / {rangeLabel.w2}</span>}
                    </header>
                    <div className="news-columns news-columns--2 mt-6">
                        {topGainers.length > 0 && (
                            <MoverBoard title="Top Gainers" tone="up" items={topGainers} onShare={() => openShareSheet("gainers")} />
                        )}
                        {topLosers.length > 0 && (
                            <MoverBoard title="Top Losers" tone="down" items={topLosers} onShare={() => openShareSheet("losers")} />
                        )}
                    </div>
                </section>
            )}

            {/* Export */}
            <section className="news-section" aria-labelledby="export-heading">
                <header className="news-section-header">
                    <h2 id="export-heading">Export to Excel</h2>
                    <span>Closing prices for the dates the desk has recorded.</span>
                </header>
                <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                    <TextField
                        label="From"
                        type="date"
                        value={exportStartDate}
                        min={availableDates[0] || ""}
                        max={exportEndDate || availableDates[availableDates.length - 1] || ""}
                        onChange={(e) => setExportStartDate(e.target.value)}
                    />
                    <TextField
                        label="To"
                        type="date"
                        value={exportEndDate}
                        min={exportStartDate || availableDates[0] || ""}
                        max={availableDates[availableDates.length - 1] || ""}
                        onChange={(e) => setExportEndDate(e.target.value)}
                    />
                    <SelectField
                        label="Include"
                        value={exportWeeklyComparison ? "comparison" : exportFridaysOnly ? "fridays" : "all"}
                        onChange={(e) => {
                            setExportWeeklyComparison(e.target.value === "comparison");
                            setExportFridaysOnly(e.target.value === "fridays");
                        }}
                    >
                        <option value="all">All prices</option>
                        <option value="fridays">Fridays only</option>
                        <option value="comparison">Weekly comparison</option>
                    </SelectField>
                    <SecondaryButton onClick={handleExport} disabled={exporting} aria-busy={exporting || undefined}>
                        <Download size={14} className={exporting ? "animate-pulse" : undefined} aria-hidden="true" />
                        {exporting ? "Exporting..." : "Export"}
                    </SecondaryButton>
                </div>
                {exportError && <Notice tone="error" className="mt-4">{exportError}</Notice>}
            </section>

            {/* Historical Prices */}
            <section className="news-section" aria-labelledby="history-heading">
                <header className="news-section-header">
                    <h2 id="history-heading">Closing Price History</h2>
                    <span>Database · Daily closing prices recorded from the GSE</span>
                </header>
                <div className="mt-6">
                    <HistoricalPrices />
                </div>
            </section>

            {/* Weekly Trends Share Sheet */}
            {shareSheet.input && (
                <WeeklyTrendsShareSheet
                    open={shareSheet.open}
                    onClose={() => setShareSheet({ open: false, input: null })}
                    card={shareSheet.input}
                />
            )}
        </main>
    );
}

/** One ranked column of the week's movers: a subhead with its share control over a hairline table. */
function MoverBoard({ title, tone, items, onShare }: { title: string; tone: "up" | "down"; items: WeeklyChange[]; onShare: () => void }) {
    const Trend = tone === "up" ? TrendingUp : TrendingDown;
    return (
        <div>
            <div className="flex items-start justify-between gap-3">
                <h3 className={cn("news-subhead flex-1", tone === "up" ? "news-up" : "news-down")}>{title}</h3>
                <button type="button" onClick={onShare} aria-label={`Share ${title.toLowerCase()}`} title={`Share ${title.toLowerCase()}`} className="news-icon-button mt-2">
                    <Share2 size={14} aria-hidden="true" />
                </button>
            </div>
            <div className="news-table-wrap">
                <table className="news-table">
                    <thead>
                        <tr>
                            <th scope="col" className="w-6">#</th>
                            <th scope="col">Symbol</th>
                            <th scope="col" className="num">Closing Price</th>
                            <th scope="col" className="num">Weekly Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr
                                key={item.stock.symbol}
                                onClick={() => openStock(item.stock.symbol)}
                                className="cursor-pointer"
                            >
                                <td className="news-mono text-xs text-ink/[0.68]">{index + 1}</td>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <TickerLogo symbol={item.stock.symbol} size={24} />
                                        <div className="min-w-0">
                                            <span className="font-bold uppercase text-ink">{item.stock.symbol}</span>
                                            <span className="block max-w-[180px] truncate text-xs text-ink/[0.68]">{item.stock.company}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="num font-semibold text-ink">{formatCedis(item.stock.price)}</td>
                                <td className="num">
                                    <span className={cn("news-pill news-mono inline-flex items-center gap-1", tone === "up" ? "news-pill--up" : "news-pill--down")}>
                                        <Trend size={11} aria-hidden="true" />
                                        {tone === "up" ? "+" : ""}{item.weeklyChangePercent.toFixed(2)}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
