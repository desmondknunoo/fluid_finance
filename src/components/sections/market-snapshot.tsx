import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { StockCard } from "@/components/stock/stock-card";
import { MoversShareSheet } from "@/components/stock/movers-share-sheet";

type Tab = "gainers" | "losers" | "active";

function todayLabel(): string {
    return new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

const MOVER_TABS: { key: Tab; label: string; shareClasses: string }[] = [
    { key: "gainers", label: "Top Gainers", shareClasses: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/30" },
    { key: "losers", label: "Top Losers", shareClasses: "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/30" },
    { key: "active", label: "Most Active", shareClasses: "bg-fluid-cyan/10 border-fluid-cyan/20 text-fluid-cyan hover:bg-fluid-cyan/20 hover:border-fluid-cyan/30" },
];

export const MarketSnapshot = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("gainers");
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getAllStocks();
                if (cancelled) return;
                recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
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

    const activeTabConfig = MOVER_TABS.find((t) => t.key === activeTab) ?? MOVER_TABS[0];

    if (loading) {
        return (
            <section id="market-snapshot" className="relative overflow-hidden bg-canvas py-14 sm:py-20 md:py-24">
                <div className="page-container flex min-h-[300px] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-ink/40" />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section id="market-snapshot" className="relative overflow-hidden bg-canvas py-14 sm:py-20 md:py-24">
                <div className="page-container flex min-h-[300px] items-center justify-center">
                    <p className="text-ink/40">Failed to load market data</p>
                </div>
            </section>
        );
    }

    return (
        <section id="market-snapshot" className="relative overflow-hidden bg-canvas py-14 sm:py-20 md:py-24">
            <div className="page-container relative z-10">

                {/* Movers Table */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden"
                >
                    <div className="flex flex-col gap-4 border-b border-ink/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">Market movers</p>
                                <h2 className="mt-1 text-lg font-bold text-ink">Today&apos;s standouts</h2>
                            </div>
                            <button
                                onClick={() => setShareOpen(true)}
                                disabled={movers.length === 0}
                                className={cn(
                                    "shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 sm:hidden",
                                    activeTabConfig.shareClasses,
                                )}
                            >
                                <Share2 size={13} />
                                Share
                            </button>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="grid flex-1 grid-cols-3 rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-1 sm:flex-none sm:min-w-[440px]">
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
                            <button
                                onClick={() => setShareOpen(true)}
                                disabled={movers.length === 0}
                                className={cn(
                                    "hidden shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 sm:inline-flex",
                                    activeTabConfig.shareClasses,
                                )}
                            >
                                <Share2 size={13} />
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Mobile: stacked cards instead of a sideways-scrolling table. */}
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
                                        <tr
                                            key={stock.symbol}
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
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 font-medium",
                                                    stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                                                )}>
                                                    {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-ink/60">
                                                {stock.volume.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1 text-sm text-ink/60">
                                                    View <ChevronRight size={14} />
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </div>

            {/* Background Glows */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-ink/[0.02] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-ink/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <MoversShareSheet
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                card={{ category: activeTab, stocks: movers, date: todayLabel() }}
            />
        </section >
    );
};
