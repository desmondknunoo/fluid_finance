"use client";

import { motion } from "framer-motion";
import { ChevronRight, Share2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { StockCard } from "@/components/stock/stock-card";
import { MoversShareSheet } from "@/components/stock/movers-share-sheet";
import { useEffect, useMemo, useState } from "react";

const marketInsights = [
    {
        category: "Business & Financial Times",
        title: "B&FT",
        snippet: "Ghana's leading financial newspaper covering business, finance, and economic news.",
        link: "https://thebftonline.com"
    },
    {
        category: "Business News",
        title: "Ghana Business News",
        snippet: "Comprehensive coverage of Ghana's business landscape and economic developments.",
        link: "https://ghanabusinessnews.com"
    },
    {
        category: "Business News",
        title: "Business Day Ghana",
        snippet: "In-depth business journalism and market analysis for the Ghanaian market.",
        link: "https://businessdayghana.com"
    },
    {
        category: "Business News",
        title: "Graphic Online Business",
        snippet: "Business and financial news from Ghana's most established media house.",
        link: "https://www.graphic.com.gh/business/business-news.html"
    },
    {
        category: "News",
        title: "Citi Business News",
        snippet: "Breaking news and comprehensive coverage of Ghana's business and economic affairs.",
        link: "https://www.citinewsroom.com/category/business/"
    },
    {
        category: "Business News",
        title: "BusinessGhana",
        snippet: "Business news, company profiles, and economic analysis for Ghana.",
        link: "https://businessghana.com"
    }
];

const educationalArticles = [
    {
        category: "Press Release",
        title: "GSE Press Releases & Announcements",
        author: "Ghana Stock Exchange",
        link: "https://gse.com.gh/press-release/"
    },
    {
        category: "Media",
        title: "GSE Testimonial Video",
        author: "Ghana Stock Exchange",
        link: "https://gse.com.gh/gse-testimonial-video/"
    },
    {
        category: "Financial Reports",
        title: "Financial Statements & Filings",
        author: "Ghana Stock Exchange",
        link: "https://gse.com.gh/financial-statements/"
    },
    {
        category: "Market Notices",
        title: "GSE Market Notices & Circulars",
        author: "Ghana Stock Exchange",
        link: "https://gse.com.gh/gse-market-notice/"
    },
    {
        category: "Articles",
        title: "GSE Educational Articles",
        author: "Ghana Stock Exchange",
        link: "http://gse.com.gh/gse-articles/"
    },
    {
        category: "Resources",
        title: "GSE Brochures & Guides",
        author: "Ghana Stock Exchange",
        link: "https://gse.com.gh/gse-brochures/"
    }
];

type Tab = "gainers" | "losers" | "active";

const MOVER_TABS: { key: Tab; label: string; shareClasses: string }[] = [
    { key: "gainers", label: "Top Gainers", shareClasses: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/30" },
    { key: "losers", label: "Top Losers", shareClasses: "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/30" },
    { key: "active", label: "Most Active", shareClasses: "bg-fluid-cyan/10 border-fluid-cyan/20 text-fluid-cyan hover:bg-fluid-cyan/20 hover:border-fluid-cyan/30" },
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

export default function BusinessNewsPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>("gainers");
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => {
        getAllStocks().then((data) => {
            recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
            setStocks(data);
        }).catch(() => {});
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
                                Business & Economy News
                            </span>
                        </h1>
                        <p className="text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
                            Real-time updates on the Ghanaian economy, GSE markets, and business developments.
                        </p>
                    </motion.div>

                    {/* Market Movers */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="rounded-2xl bg-ink/[0.03] border border-ink/[0.08] overflow-hidden mb-16"
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

                    {/* Latest News */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h2 className="text-2xl font-bold mb-8 font-poppins">Latest News</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...marketInsights, ...educationalArticles].map((article) => (
                                <a
                                    key={article.title}
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-6 rounded-2xl bg-ink/[0.02] border border-ink/[0.08] hover:border-ink/20 transition-colors group"
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest text-ink/30 mb-4 block group-hover:text-ink/60 transition-colors">
                                        {article.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-ink mb-3 group-hover:translate-x-1 transition-transform font-poppins">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-ink/40 leading-relaxed mb-4">
                                        {"snippet" in article ? article.snippet : `By ${article.author}`}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-xs text-ink/30 group-hover:text-ink/60 transition-colors">
                                        Visit <ChevronRight size={12} />
                                    </span>
                                </a>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <MoversShareSheet
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                card={{ category: activeTab, stocks: movers }}
            />
        </div>
    );
}
