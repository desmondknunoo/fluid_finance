import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RotateCw, Search, TrendingDown, TrendingUp, LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { Sparkline } from "@/components/stock/price-chart";
import { Notice } from "@/components/ui/form";
import { heatmapTileClass } from "@/lib/heatmap-style";
import {
    formatCedis,
    formatCompact,
    getAllStocks,
    isMarketOpen,
    type Stock,
} from "@/lib/gse";
import { getSeries, recordAll, sliceRange } from "@/lib/history";
import {
    GSE_LIVE_SECTION,
    openStock,
    stockHref,
    VIEW_MODES,
    openGseLive,
    type ViewMode,
} from "@/lib/navigation";

const VIEW_ICONS = {
    table: Rows3,
    heatmap: LayoutGrid,
} as const;

const REFRESH_MS = 30_000;

type SortKey = "symbol" | "company" | "price" | "change" | "changePercent" | "volume";

const COLUMNS: [SortKey, string, boolean][] = [
    // key, label, numeric
    ["symbol", "Symbol", false],
    ["company", "Name", false],
    ["price", "Price", true],
    ["change", "Change", true],
    ["changePercent", "% Change", true],
    ["volume", "Volume", true],
];

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
    return (
        <div className="news-stat">
            <dt>{label}</dt>
            <dd className={tone === "up" ? "news-up" : tone === "down" ? "news-down" : undefined}>{value}</dd>
        </div>
    );
}

/**
 * The market floor: every listed company, readable as a sortable board or a heatmap,
 * under a session strip and the day's breadth figures. Expects to sit inside a page container.
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

    // A #gse-live/<view> link sets the initial mode; the toggle drives it after.
    const [mode, setMode] = useState<ViewMode>(view ?? "table");

    useEffect(() => {
        if (view) setMode(view);
    }, [view]);

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

    // Keep the heatmap independent of per-equity detail requests.
    const gridStocks = filtered;

    const toggleSort = (key: SortKey) => {
        if (sort === key) setDescending((d) => !d);
        else {
            setSort(key);
            setDescending(key !== "symbol" && key !== "company");
        }
    };

    const marketOpen = isMarketOpen();
    const noMatch = <p className="news-empty">No stocks match “{query}”.</p>;

    return (
        <section id={GSE_LIVE_SECTION} className="news-section scroll-mt-24">
            <header className="news-section-header">
                <h2>GSE Live</h2>
                <span>
                    All {stocks.length || "—"} equities on the Ghana Stock Exchange, refreshed every
                    30 seconds. Select any ticker for its full price history.
                </span>
                <button
                    type="button"
                    onClick={() => load(true)}
                    className="news-button-quiet news-button-quiet--sm"
                >
                    <RotateCw size={14} className={refreshing ? "animate-spin" : undefined} aria-hidden="true" />
                    Refresh
                </button>
            </header>

            {/* Market status */}
            <div className="news-session -mt-px" aria-label="Market status">
                <span className="inline-flex items-center gap-2 font-semibold">
                    <span
                        className={cn("h-1.5 w-1.5", marketOpen ? "animate-pulse bg-fluid-green" : "bg-fluid-rose")}
                        aria-hidden="true"
                    />
                    <span className="text-ink/[0.68]">Ghana Stock Exchange</span>
                    <strong className={marketOpen ? "text-fluid-green" : "text-fluid-rose"}>{marketOpen ? "Market open" : "Market closed"}</strong>
                </span>
                <span>Trading hours <strong>10:00 – 15:00 GMT</strong></span>
                <span>
                    Last update{" "}
                    <strong>
                        {updatedAt
                            ? updatedAt.toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  timeZone: "UTC",
                              })
                            : "—"}
                    </strong>
                </span>
            </div>

            {/* Stats */}
            <dl className="news-stats -mt-px">
                <Stat label="Total volume" value={formatCompact(stats.volume)} />
                <Stat label="Total value" value={`₵${formatCompact(stats.value)}`} />
                <Stat label="Gainers" value={String(stats.advancers)} tone="up" />
                <Stat label="Losers" value={String(stats.decliners)} tone="down" />
                <Stat label="Unchanged" value={String(stats.unchanged)} />
            </dl>

            {/* View toggle + search, sharing one hairline. */}
            <div className="mt-6 flex flex-col gap-3 border-b border-ink/[0.19] md:flex-row md:items-end md:justify-between">
                <div className="flex gap-1" role="group" aria-label="View">
                    {VIEW_MODES.map((key) => {
                        const Icon = VIEW_ICONS[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => { setMode(key); openGseLive(key); }}
                                aria-pressed={mode === key}
                                aria-current={mode === key ? "true" : undefined}
                                className="news-tab inline-flex items-center gap-2 uppercase"
                            >
                                <Icon size={14} aria-hidden="true" />
                                {key}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 pb-3">
                    <div className="flex flex-1 items-center border border-ink/[0.19] focus-within:border-ink md:w-72">
                        <Search size={15} className="ml-3 shrink-0 text-ink/[0.68]" aria-hidden="true" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search stocks…"
                            aria-label="Search stocks"
                            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
                        />
                    </div>
                    <span className="news-byline news-mono whitespace-nowrap">
                        {filtered.length} stocks
                    </span>
                </div>
            </div>

            {loading && (
                <div className="news-loading flex min-h-[320px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Loading market data</span>
                </div>
            )}

            {error && !loading && (
                <Notice tone="error" className="mt-6">{error}</Notice>
            )}

            {!loading && !error && (
                <div className="mt-6 min-w-0">
                    {mode === "table" && (
                        <>
                            {/* Narrow screens: a sort control, since the column headers scroll out of view. */}
                            <div className="mb-4 md:hidden">
                                <label htmlFor="gse-sort" className="news-label">
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
                                    className="news-select"
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

                            {filtered.length === 0 ? noMatch : (
                                <div className="news-table-wrap">
                                    <table className="news-table min-w-[640px]">
                                        <thead>
                                            <tr>
                                                {COLUMNS.map(([key, label, numeric]) => (
                                                    <th
                                                        key={key}
                                                        scope="col"
                                                        aria-sort={sort === key ? (descending ? "descending" : "ascending") : "none"}
                                                        className={cn(numeric && "num", key === "company" && "hidden md:table-cell")}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSort(key)}
                                                            className={cn("uppercase transition-colors hover:text-ink", sort === key && "text-fluid-cyan-ink")}
                                                        >
                                                            {label}
                                                            {sort === key && (descending ? " ↓" : " ↑")}
                                                        </button>
                                                    </th>
                                                ))}
                                                <th scope="col" className="hidden lg:table-cell num">
                                                    1M
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((stock) => {
                                                const positive = stock.change >= 0;
                                                const tone = stock.change === 0 ? "text-ink/[0.68]" : positive ? "news-up" : "news-down";
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
                                                        className="cursor-pointer focus:bg-ink/[0.055] focus:outline-none"
                                                    >
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                <TickerLogo symbol={stock.symbol} size={36} />
                                                                {/* A real link for crawlers and new-tab clicks; the row keeps the keyboard behaviour. */}
                                                                <a href={stockHref(stock.symbol)} tabIndex={-1} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) e.stopPropagation(); }} className="font-bold text-ink">{stock.symbol}</a>
                                                            </div>
                                                            <span className="mt-1 block max-w-[180px] truncate text-xs text-ink/[0.68] md:hidden">{stock.company}</span>
                                                        </td>
                                                        <td className="hidden max-w-[220px] truncate text-ink/[0.68] md:table-cell">
                                                            {stock.company}
                                                        </td>
                                                        <td className="num font-semibold text-ink">
                                                            {formatCedis(stock.price)}
                                                        </td>
                                                        <td className={cn("num", tone)}>
                                                            {positive ? "+" : ""}
                                                            {stock.change.toFixed(2)}
                                                        </td>
                                                        <td className="num">
                                                            <span className={cn("inline-flex items-center gap-1 font-semibold", tone)}>
                                                                {stock.change !== 0 &&
                                                                    (positive ? (
                                                                        <TrendingUp size={13} aria-hidden="true" />
                                                                    ) : (
                                                                        <TrendingDown size={13} aria-hidden="true" />
                                                                    ))}
                                                                {positive ? "+" : ""}
                                                                {stock.changePercent.toFixed(2)}%
                                                            </span>
                                                        </td>
                                                        <td className="num text-ink/[0.68]">
                                                            {stock.volume.toLocaleString()}
                                                        </td>
                                                        <td className="hidden lg:table-cell">
                                                            <Sparkline
                                                                points={sparks.get(stock.symbol) ?? []}
                                                                positive={positive}
                                                                flat={stock.change === 0}
                                                                width={72}
                                                                height={24}
                                                                className="ml-auto"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {mode === "heatmap" && (
                        filtered.length === 0 ? noMatch : (
                            <div className="grid grid-cols-2 gap-px border border-ink/[0.19] bg-ink/[0.19] sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6">
                                {gridStocks.map((stock) => (
                                    <button
                                        key={stock.symbol}
                                        type="button"
                                        onClick={() => openStock(stock.symbol)}
                                        title={`${stock.symbol} · ${stock.company}`}
                                        className={cn(
                                            "min-w-0 p-3 text-left news-mono hover:ring-2 hover:ring-inset hover:ring-current/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fluid-cyan",
                                            heatmapTileClass(stock.change, stock.changePercent),
                                        )}
                                    >
                                        <div className="truncate text-sm font-bold">{stock.symbol}</div>
                                        <div className="mt-1 text-xs">
                                            {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                                        </div>
                                        <div className="mt-2 truncate text-xs">{formatCedis(stock.price)}</div>
                                    </button>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </section>
    );
}
