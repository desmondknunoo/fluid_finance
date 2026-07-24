import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { openStock } from "@/lib/navigation";

type Tab = "gainers" | "losers" | "active";

export const MarketSnapshot = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("gainers");

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

    if (loading) {
        return (
            <section id="market-snapshot" className="pt-4 md:pt-12 pb-24 bg-canvas relative">
                <div className="container mx-auto px-4 md:px-6 flex justify-center items-center min-h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-ink/40" />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section id="market-snapshot" className="pt-4 md:pt-12 pb-24 bg-canvas relative">
                <div className="container mx-auto px-4 md:px-6 flex justify-center items-center min-h-[300px]">
                    <p className="text-ink/40">Failed to load market data</p>
                </div>
            </section>
        );
    }

    return (
        <section id="market-snapshot" className="pt-4 md:pt-12 pb-24 bg-canvas relative">
            <div className="container mx-auto px-4 md:px-6 relative z-10">

                {/* Movers Table */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden"
                >
                    <div className="flex border-b border-ink/[0.08]">
                        {(
                            [
                                ["gainers", "Top Gainers"],
                                ["losers", "Top Losers"],
                                ["active", "Most Active"],
                            ] as [Tab, string][]
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={cn(
                                    "flex-1 py-4 text-sm font-medium transition-colors",
                                    activeTab === key ? "text-ink bg-ink/[0.05]" : "text-ink/40 hover:text-ink"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
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
                                    movers.map((stock) => (
                                        <tr
                                            key={stock.symbol}
                                            onClick={() => openStock(stock.symbol)}
                                            className="border-b border-ink/[0.04] hover:bg-ink/[0.02] transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-ink uppercase">{stock.symbol}</span>
                                                <span className="block max-w-[180px] truncate text-xs text-ink/40">{stock.company}</span>
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
        </section >
    );
};
