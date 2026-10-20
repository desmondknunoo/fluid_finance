import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { MoversShareSheet } from "@/components/stock/movers-share-sheet";

type Tab = "gainers" | "losers" | "active";

const MOVER_TABS: { key: Tab; label: string }[] = [
    { key: "gainers", label: "Top Gainers" },
    { key: "losers", label: "Top Losers" },
    { key: "active", label: "Most Active" },
];

const emptyLabel = (tab: Tab) => tab === "gainers" ? "gainers" : tab === "losers" ? "losers" : "active stocks";

/** The day's movers as a ranked board: a tabbed section band with one hairline table. */
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

    if (loading) {
        return (
            <section id="market-snapshot" className="bg-canvas py-10">
                <div className="page-container news-loading flex min-h-[300px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Loading market data</span>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section id="market-snapshot" className="bg-canvas py-10">
                <div className="page-container flex min-h-[300px] items-center justify-center">
                    <p className="text-sm text-ink/[0.68]">Failed to load market data</p>
                </div>
            </section>
        );
    }

    return (
        <section id="market-snapshot" className="bg-canvas py-10">
            <div className="page-container">
                <div className="news-section">
                    <header className="news-section-header">
                        <h2>Today&apos;s standouts</h2>
                        <span>Market movers</span>
                        <button
                            type="button"
                            onClick={() => setShareOpen(true)}
                            disabled={movers.length === 0}
                            className="news-button-quiet news-button-quiet--sm"
                        >
                            <Share2 size={13} aria-hidden="true" />
                            Share
                        </button>
                    </header>

                    <div className="news-tabs" role="tablist" aria-label="Market movers">
                        {MOVER_TABS.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === key}
                                onClick={() => setActiveTab(key)}
                                className="news-tab"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {movers.length === 0 ? (
                        <p className="news-empty">No {emptyLabel(activeTab)} at this time</p>
                    ) : (
                        <div className="news-table-wrap">
                            <table className="news-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Symbol</th>
                                        <th scope="col" className="num">Price</th>
                                        <th scope="col" className="num">Change</th>
                                        <th scope="col" className="num hidden md:table-cell">Volume</th>
                                        <th scope="col" className="num">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movers.map((stock, index) => (
                                        <tr
                                            key={stock.symbol}
                                            onClick={() => openStock(stock.symbol)}
                                            className="cursor-pointer"
                                        >
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-4 news-mono text-xs text-ink/[0.68]">{index + 1}</span>
                                                    <TickerLogo symbol={stock.symbol} size={24} />
                                                    <div className="min-w-0">
                                                        <span className="font-bold uppercase text-ink">{stock.symbol}</span>
                                                        <span className="block max-w-[180px] truncate text-xs text-ink/[0.68]">{stock.company}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="num font-semibold text-ink">{formatCedis(stock.price)}</td>
                                            <td className="num">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 font-semibold",
                                                    stock.change >= 0 ? "news-up" : "news-down",
                                                )}>
                                                    {stock.change >= 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
                                                    {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="num hidden text-ink/[0.68] md:table-cell">
                                                {stock.volume.toLocaleString()}
                                            </td>
                                            <td className="num">
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-fluid-cyan-ink">
                                                    View <ChevronRight size={14} aria-hidden="true" />
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <MoversShareSheet
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                card={{ category: activeTab, stocks: movers }}
            />
        </section>
    );
};
