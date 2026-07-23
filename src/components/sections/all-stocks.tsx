import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, Search, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/stock/price-chart";
import { TickerLogo } from "@/components/stock/stock-detail";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { getSeries, recordAll, sliceRange } from "@/lib/history";

type SortKey = "symbol" | "price" | "change" | "volume";

const SECTOR_ALL = "All sectors";

interface Row extends Stock {
    spark: number[];
}

export function AllStocks({ onSelect }: { onSelect: (symbol: string) => void }) {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [sector, setSector] = useState(SECTOR_ALL);
    const [sort, setSort] = useState<SortKey>("symbol");
    const [descending, setDescending] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getAllStocks();
                if (cancelled) return;
                recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
                setStocks(data);
            } catch {
                if (!cancelled) setError("Could not reach the Ghana Stock Exchange API.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // 3-month tail of each symbol's series, thinned to a drawable sparkline.
    const rows = useMemo<Row[]>(
        () =>
            stocks.map((stock) => {
                const window = sliceRange(getSeries(stock.symbol, stock.price), "3M");
                const step = Math.max(1, Math.ceil(window.length / 40));
                const spark = window.filter((_, i) => i % step === 0).map((p) => p.close);
                return { ...stock, spark };
            }),
        [stocks],
    );

    const sectors = useMemo(
        () => [SECTOR_ALL, ...Array.from(new Set(stocks.map((s) => s.sector))).sort()],
        [stocks],
    );

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const filtered = rows.filter((row) => {
            if (sector !== SECTOR_ALL && row.sector !== sector) return false;
            if (!needle) return true;
            return (
                row.symbol.toLowerCase().includes(needle) || row.company.toLowerCase().includes(needle)
            );
        });

        const direction = descending ? -1 : 1;
        return filtered.sort((a, b) => {
            switch (sort) {
                case "price":
                    return (a.price - b.price) * direction;
                case "change":
                    return (a.changePercent - b.changePercent) * direction;
                case "volume":
                    return (a.volume - b.volume) * direction;
                default:
                    return a.symbol.localeCompare(b.symbol) * direction;
            }
        });
    }, [rows, query, sector, sort, descending]);

    const toggleSort = (key: SortKey) => {
        if (sort === key) setDescending((d) => !d);
        else {
            setSort(key);
            setDescending(key !== "symbol");
        }
    };

    return (
        <section id="all-stocks" className="relative bg-black pb-24 pt-4 md:pt-12">
            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h2 className="text-2xl font-bold text-white md:text-3xl">Every listed company</h2>
                    <p className="mt-2 max-w-2xl text-sm text-white/40">
                        All {stocks.length || "—"} equities on the Ghana Stock Exchange, live from the exchange
                        feed. Select any ticker for its full price history.
                    </p>
                </motion.div>

                {/* Controls */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search ticker or company"
                            aria-label="Search stocks"
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                        />
                    </div>
                    <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        aria-label="Filter by sector"
                        className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none"
                    >
                        {sectors.map((name) => (
                            <option key={name} value={name} className="bg-black">
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                {loading && (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
                    </div>
                )}

                {error && !loading && (
                    <div className="flex min-h-[200px] items-center justify-center text-white/40">{error}</div>
                )}

                {!loading && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.08] bg-white/[0.01]">
                                        {(
                                            [
                                                ["symbol", "Company", "text-left"],
                                                ["price", "Price", "text-right"],
                                                ["change", "Change", "text-right"],
                                                ["volume", "Volume", "text-right hidden md:table-cell"],
                                            ] as [SortKey, string, string][]
                                        ).map(([key, label, align]) => (
                                            <th
                                                key={key}
                                                className={cn(
                                                    "px-4 py-4 text-xs font-semibold uppercase tracking-wider text-white/40 md:px-6",
                                                    align,
                                                )}
                                            >
                                                <button
                                                    onClick={() => toggleSort(key)}
                                                    className="transition-colors hover:text-white"
                                                >
                                                    {label}
                                                    {sort === key && (descending ? " ↓" : " ↑")}
                                                </button>
                                            </th>
                                        ))}
                                        <th className="hidden px-4 py-4 text-xs font-semibold uppercase tracking-wider text-white/40 sm:table-cell md:px-6">
                                            3M
                                        </th>
                                        <th className="px-4 py-4 md:px-6" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-white/40">
                                                No companies match “{query}”.
                                            </td>
                                        </tr>
                                    ) : (
                                        visible.map((row) => {
                                            const positive = row.change >= 0;
                                            return (
                                                <tr
                                                    key={row.symbol}
                                                    onClick={() => onSelect(row.symbol)}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            onSelect(row.symbol);
                                                        }
                                                    }}
                                                    className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03] focus:bg-white/[0.05] focus:outline-none"
                                                >
                                                    <td className="px-4 py-3.5 md:px-6">
                                                        <div className="flex items-center gap-3">
                                                            <TickerLogo symbol={row.symbol} size={36} />
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-white">
                                                                    {row.symbol}
                                                                </div>
                                                                <div className="truncate text-xs text-white/40">
                                                                    {row.company}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-mono text-white md:px-6">
                                                        {formatCedis(row.price)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right md:px-6">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center gap-1 font-medium",
                                                                positive ? "text-emerald-400" : "text-rose-400",
                                                            )}
                                                        >
                                                            {positive ? (
                                                                <TrendingUp size={14} />
                                                            ) : (
                                                                <TrendingDown size={14} />
                                                            )}
                                                            {positive ? "+" : ""}
                                                            {row.changePercent.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                    <td className="hidden px-4 py-3.5 text-right font-mono text-white/60 md:table-cell md:px-6">
                                                        {row.volume.toLocaleString()}
                                                    </td>
                                                    <td className="hidden px-4 py-3.5 sm:table-cell md:px-6">
                                                        <Sparkline points={row.spark} positive={positive} />
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right md:px-6">
                                                        <ChevronRight
                                                            size={16}
                                                            className="ml-auto text-white/30"
                                                            aria-hidden="true"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {!loading && !error && (
                    <p className="mt-4 text-center text-xs text-white/25">
                        Showing {visible.length} of {stocks.length} listed equities · quotes from the Ghana Stock
                        Exchange, delayed up to 15 minutes
                    </p>
                )}
            </div>

            <div className="pointer-events-none absolute left-0 top-1/4 h-96 w-96 rounded-full bg-white/[0.02] blur-[120px]" />
            <div className="pointer-events-none absolute bottom-1/4 right-0 h-96 w-96 rounded-full bg-white/[0.02] blur-[120px]" />
        </section>
    );
}
