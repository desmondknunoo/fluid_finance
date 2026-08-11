import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RotateCw, Search, TrendingDown, TrendingUp, LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { StockCard } from "@/components/stock/stock-card";
import { Sparkline } from "@/components/stock/price-chart";
import { heatColor } from "@/components/stock/heat-squares";
// import { HeatSquares } from "@/components/stock/heat-squares";
import {
    formatCedis,
    formatCompact,
    getAllStocks,
    getEquityDetail,
    isMarketOpen,
    type Stock,
} from "@/lib/gse";
import { getSeries, recordAll, sliceRange } from "@/lib/history";
import {
    GSE_LIVE_SECTION,
    openStock,
    VIEW_MODES,
    type ViewMode,
} from "@/lib/navigation";

const VIEW_ICONS = {
    table: Rows3,
    heatmap: LayoutGrid,
} as const;

const REFRESH_MS = 30_000;

type SortKey = "symbol" | "company" | "price" | "change" | "changePercent" | "volume";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
    return (
        <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] px-5 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{label}</div>
            <div
                className={cn(
                    "mt-1.5 font-mono text-2xl font-bold",
                    tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-ink",
                )}
            >
                {value}
            </div>
        </div>
    );
}

function tileSpanClass(marketCap: number | undefined, largestMarketCap: number) {
    if (!marketCap || !largestMarketCap) return "col-span-1 sm:col-span-2";

    const relativeSize = marketCap / largestMarketCap;
    if (relativeSize >= 0.45) return "col-span-2 row-span-2 sm:col-span-4 lg:col-span-6 lg:row-span-3";
    if (relativeSize >= 0.18) return "col-span-2 sm:col-span-3 lg:col-span-4 lg:row-span-2";
    if (relativeSize >= 0.06) return "col-span-1 sm:col-span-2 lg:col-span-3 lg:row-span-2";
    return "col-span-1 sm:col-span-2";
}

/**
 * The market floor of the landing page: every listed company, readable as a
 * table, a heatmap of cards, or a heatmap, alongside session stats and movers.
 */
export function GseLive({ view }: { view: ViewMode | null }) {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("symbol");
    const [descending, setDescending] = useState(false);
    const [marketCaps, setMarketCaps] = useState<Record<string, number>>({});

    // A #gse-live/<view> link sets the initial mode; the toggle drives it after.
    const [mode, setMode] = useState<ViewMode>(view ?? "table");

    useEffect(() => {
        if (view) setMode(view);
    }, [view]);

    useEffect(() => {
        if (mode === "table" || stocks.length === 0) return;

        let cancelled = false;
        void Promise.allSettled(
            stocks.map(async (stock) => {
                const detail = await getEquityDetail(stock.symbol);
                return [stock.symbol, detail.shares ? detail.shares * stock.price : 0] as const;
            }),
        ).then((results) => {
            if (cancelled) return;
            setMarketCaps((current) => {
                const next = { ...current };
                for (const result of results) {
                    if (result.status === "fulfilled" && result.value[1] > 0) {
                        next[result.value[0]] = result.value[1];
                    }
                }
                return next;
            });
        });

        return () => {
            cancelled = true;
        };
    }, [mode, stocks]);

    const load = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        try {
            const data = await getAllStocks(silent);
            recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
            setStocks(data);
            setUpdatedAt(new Date());
            setError(null);
        } catch {
            setError("Could not reach the Ghana Stock Exchange API.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(() => load(true), REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    const stats = useMemo(() => {
        const volume = stocks.reduce((sum, s) => sum + s.volume, 0);
        const value = stocks.reduce((sum, s) => sum + s.price * s.volume, 0);
        const advancers = stocks.filter((s) => s.change > 0).length;
        const decliners = stocks.filter((s) => s.change < 0).length;
        return { volume, value, advancers, decliners, unchanged: stocks.length - advancers - decliners };
    }, [stocks]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const rows = stocks.filter(
            (s) =>
                !needle ||
                s.symbol.toLowerCase().includes(needle) ||
                s.company.toLowerCase().includes(needle),
        );
        const direction = descending ? -1 : 1;
        return rows.sort((a, b) => {
            switch (sort) {
                case "company":
                    return a.company.localeCompare(b.company) * direction;
                case "price":
                    return (a.price - b.price) * direction;
                case "change":
                    return (a.change - b.change) * direction;
                case "changePercent":
                    return (a.changePercent - b.changePercent) * direction;
                case "volume":
                    return (a.volume - b.volume) * direction;
                default:
                    return a.symbol.localeCompare(b.symbol) * direction;
            }
        });
    }, [stocks, query, sort, descending]);

    const sparks = useMemo(() => {
        const map = new Map<string, number[]>();
        for (const stock of stocks) {
            const window = sliceRange(getSeries(stock.symbol, stock.price), "1M");
            const step = Math.max(1, Math.ceil(window.length / 24));
            map.set(stock.symbol, window.filter((_, i) => i % step === 0).map((p) => p.close));
        }
        return map;
    }, [stocks]);

    const largestMarketCap = useMemo(
        () => Math.max(0, ...filtered.map((stock) => marketCaps[stock.symbol] ?? 0)),
        [filtered, marketCaps],
    );

    const gridStocks = useMemo(
        () => [...filtered].sort((a, b) => (marketCaps[b.symbol] ?? 0) - (marketCaps[a.symbol] ?? 0)),
        [filtered, marketCaps],
    );

    const toggleSort = (key: SortKey) => {
        if (sort === key) setDescending((d) => !d);
        else {
            setSort(key);
            setDescending(key !== "symbol" && key !== "company");
        }
    };

    const marketOpen = isMarketOpen();

    return (
        <section id={GSE_LIVE_SECTION} className="relative scroll-mt-24 bg-canvas py-14 sm:py-20 md:py-24">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold md:text-4xl">GSE Live</h2>
                            <p className="mt-2 max-w-2xl text-sm text-ink/40">
                                All {stocks.length || "—"} equities on the Ghana Stock Exchange, refreshed every
                                30 seconds. Select any ticker for its full price history.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => load(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-ink/[0.08] bg-ink/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink/60 transition-colors hover:border-ink/25 hover:text-ink"
                        >
                            <RotateCw size={14} className={refreshing ? "animate-spin" : undefined} />
                            Refresh
                        </button>
                    </div>

                    {/* Market status */}
                    <div className="grid gap-4 rounded-2xl border border-ink/[0.08] bg-ink/[0.03] px-6 py-5 sm:grid-cols-3">
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                                Ghana Stock Exchange
                            </div>
                            <div
                                className={cn(
                                    "mt-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest",
                                    marketOpen ? "text-emerald-400" : "text-red-500",
                                )}
                            >
                                <span
                                    className={cn(
                                        "h-2 w-2 rounded-full",
                                        marketOpen ? "animate-pulse bg-emerald-400" : "bg-red-500",
                                    )}
                                />
                                {marketOpen ? "Market open" : "Market closed"}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                                Trading hours
                            </div>
                            <div className="mt-1.5 font-mono text-sm text-ink">10:00 – 15:00 GMT</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                                Last update
                            </div>
                            <div className="mt-1.5 font-mono text-sm text-ink">
                                {updatedAt
                                    ? updatedAt.toLocaleTimeString("en-GB", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                          timeZone: "UTC",
                                      })
                                    : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <Stat label="Total volume" value={formatCompact(stats.volume)} />
                        <Stat label="Total value" value={`₵${formatCompact(stats.value)}`} />
                        <Stat label="Advancers" value={String(stats.advancers)} tone="up" />
                        <Stat label="Decliners" value={String(stats.decliners)} tone="down" />
                        <Stat label="Unchanged" value={String(stats.unchanged)} />
                    </div>
                {/* View toggle + search */}
                <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="inline-flex rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-1">
                        {VIEW_MODES.map((key) => {
                            const Icon = VIEW_ICONS[key];
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setMode(key); }}
                                    aria-pressed={mode === key}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors",
                                        mode === key
                                            ? "bg-ink/[0.12] text-ink"
                                            : "text-ink/40 hover:text-ink/70",
                                    )}
                                >
                                    <Icon size={14} />
                                    {key}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 lg:w-72">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"
                            />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search stocks…"
                                aria-label="Search stocks"
                                className="w-full rounded-xl border border-ink/[0.08] bg-ink/[0.03] py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-fluid-cyan/60 focus:outline-none"
                            />
                        </div>
                        <span className="whitespace-nowrap text-xs text-ink/40">
                            {filtered.length} stocks
                        </span>
                    </div>
                </div>

                {loading && (
                    <div className="flex min-h-[400px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-ink/40" />
                    </div>
                )}

                {error && !loading && (
                    <div className="flex min-h-[300px] items-center justify-center text-ink/40">{error}</div>
                )}

                {!loading && !error && (
                    <div className="mt-6 min-w-0">
                        <div className="min-w-0">
                            {mode === "table" && (
                                <>
                                {/* Mobile: stacked cards with a sort control, since a
                                    six-column table can only scroll sideways here. */}
                                <div className="md:hidden">
                                    <div className="mb-3 flex items-center justify-end gap-2">
                                        <label htmlFor="gse-sort" className="text-[11px] uppercase tracking-widest text-ink/40">
                                            Sort
                                        </label>
                                        <select
                                            id="gse-sort"
                                            value={`${sort}:${descending ? "desc" : "asc"}`}
                                            onChange={(e) => {
                                                const [key, dir] = e.target.value.split(":") as [SortKey, "asc" | "desc"];
                                                setSort(key);
                                                setDescending(dir === "desc");
                                            }}
                                            className="rounded-lg border border-ink/[0.08] bg-ink/[0.03] px-3 py-1.5 text-xs text-ink focus:border-fluid-cyan/60 focus:outline-none"
                                        >
                                            <option value="symbol:asc">Symbol A–Z</option>
                                            <option value="symbol:desc">Symbol Z–A</option>
                                            <option value="changePercent:desc">% Change ▼</option>
                                            <option value="changePercent:asc">% Change ▲</option>
                                            <option value="price:desc">Price ▼</option>
                                            <option value="price:asc">Price ▲</option>
                                            <option value="volume:desc">Volume ▼</option>
                                        </select>
                                    </div>
                                    {filtered.length === 0 ? (
                                        <p className="py-10 text-center text-ink/40">No stocks match “{query}”.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {filtered.map((stock) => (
                                                <StockCard key={stock.symbol} stock={stock} onSelect={openStock} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Desktop / tablet: the full sortable table. */}
                                <div className="hidden overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.03] md:block">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-left">
                                            <thead>
                                                <tr className="border-b border-ink/[0.08] bg-ink/[0.01]">
                                                    {(
                                                        [
                                                            ["symbol", "Symbol", "text-left"],
                                                            ["company", "Name", "text-left"],
                                                            ["price", "Price", "text-right"],
                                                            ["change", "Change", "text-right"],
                                                            ["changePercent", "% Change", "text-right"],
                                                            ["volume", "Volume", "text-right"],
                                                        ] as [SortKey, string, string][]
                                                    ).map(([key, label, align]) => (
                                                        <th
                                                            key={key}
                                                            className={cn(
                                                                "px-4 py-4 text-[10px] font-semibold uppercase tracking-widest text-ink/40 md:px-6",
                                                                align,
                                                            )}
                                                        >
                                                            <button
                                                                onClick={() => toggleSort(key)}
                                                                className="transition-colors hover:text-ink"
                                                            >
                                                                {label}
                                                                {sort === key && (descending ? " ↓" : " ↑")}
                                                            </button>
                                                        </th>
                                                    ))}
                                                    <th className="hidden px-4 py-4 text-[10px] font-semibold uppercase tracking-widest text-ink/40 md:table-cell md:px-6">
                                                        1M
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-10 text-center text-ink/40">
                                                            No stocks match “{query}”.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filtered.map((stock) => {
                                                        const positive = stock.change >= 0;
                                                        return (
                                                            <tr
                                                                key={stock.symbol}
                                                                onClick={() => openStock(stock.symbol)}
                                                                tabIndex={0}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" || e.key === " ") {
                                                                        e.preventDefault();
                                                                        openStock(stock.symbol);
                                                                    }
                                                                }}
                                                                className="cursor-pointer border-b border-ink/[0.04] transition-colors last:border-0 hover:bg-ink/[0.03] focus:bg-ink/[0.05] focus:outline-none"
                                                            >
                                                                <td className="px-4 py-3.5 md:px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <TickerLogo symbol={stock.symbol} size={30} />
                                                                        <span className="font-bold text-ink">
                                                                            {stock.symbol}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="max-w-[220px] truncate px-4 py-3.5 text-sm text-ink/60 md:px-6">
                                                                    {stock.company}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right font-mono text-ink md:px-6">
                                                                    {formatCedis(stock.price)}
                                                                </td>
                                                                <td
                                                                    className={cn(
                                                                        "px-4 py-3.5 text-right font-mono md:px-6",
                                                                        stock.change === 0
                                                                            ? "text-ink/40"
                                                                            : positive
                                                                              ? "text-emerald-400"
                                                                              : "text-rose-400",
                                                                    )}
                                                                >
                                                                    {positive ? "+" : ""}
                                                                    {stock.change.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right md:px-6">
                                                                    <span
                                                                        className={cn(
                                                                            "inline-flex items-center gap-1 font-mono text-sm",
                                                                            stock.change === 0
                                                                                ? "text-ink/40"
                                                                                : positive
                                                                                  ? "text-emerald-400"
                                                                                  : "text-rose-400",
                                                                        )}
                                                                    >
                                                                        {stock.change !== 0 &&
                                                                            (positive ? (
                                                                                <TrendingUp size={13} />
                                                                            ) : (
                                                                                <TrendingDown size={13} />
                                                                            ))}
                                                                        {positive ? "+" : ""}
                                                                        {stock.changePercent.toFixed(2)}%
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right font-mono text-ink/60 md:px-6">
                                                                    {stock.volume.toLocaleString()}
                                                                </td>
                                                                <td className="hidden px-4 py-3.5 md:table-cell md:px-6">
                                                                    <Sparkline
                                                                        points={sparks.get(stock.symbol) ?? []}
                                                                        positive={positive}
                                                                        width={72}
                                                                        height={24}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                </>
                            )}

                            {mode === "heatmap" && (
                                <div className="grid auto-rows-[88px] grid-flow-dense grid-cols-2 gap-1.5 sm:auto-rows-[96px] sm:grid-cols-6 lg:auto-rows-[108px] lg:grid-cols-12">
                                    {filtered.length === 0 ? (
                                        <p className="col-span-full py-10 text-center text-ink/40">
                                            No stocks match “{query}”.
                                        </p>
                                    ) : (
                                        gridStocks.map((stock) => {
                                            const marketCap = marketCaps[stock.symbol];
                                            return (
                                                <button
                                                    key={stock.symbol}
                                                    type="button"
                                                    onClick={() => openStock(stock.symbol)}
                                                    title={`${stock.symbol} · ${stock.company} · ${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`}
                                                    className={cn(
                                                        "group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-lg p-3 text-left text-white transition-transform hover:z-10 hover:scale-[1.015] focus:z-10 focus:outline-none focus:ring-2 focus:ring-fluid-cyan/60 sm:p-4",
                                                        tileSpanClass(marketCap, largestMarketCap),
                                                    )}
                                                    style={{ backgroundColor: heatColor(stock.changePercent) }}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-bold sm:text-lg">{stock.symbol}</div>
                                                        <div className="hidden truncate text-[10px] font-medium uppercase tracking-wider text-white/70 sm:block">
                                                            {stock.company}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-mono text-sm font-bold sm:text-xl">
                                                            {stock.changePercent >= 0 ? "+" : ""}
                                                            {stock.changePercent.toFixed(2)}%
                                                        </div>
                                                        <div className="mt-0.5 hidden font-mono text-[10px] text-white/75 sm:block">
                                                            {formatCedis(stock.price)}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* mode === "heatmap" && (
                                <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] p-2 sm:p-4">
                                    <HeatSquares stocks={filtered} onSelect={openStock} marketCaps={marketCaps} />
                                </div>
                            ) */}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    </section>
    );
}
