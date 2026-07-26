"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { useEffect, useState } from "react";

const newsArticles = [
    {
        category: "Market",
        title: "GSE Composite Index Posts Weekly Gain of 2.4%",
        summary: "Financial stocks lead the rally as inflation fears subside and local investor participation hits record highs.",
        time: "2h ago",
    },
    {
        category: "Economy",
        title: "Bank of Ghana Holds Policy Rate Steady at 27%",
        summary: "Central bank signals cautious approach as inflation moderates but remains above target range.",
        time: "4h ago",
    },
    {
        category: "Company",
        title: "MTN Ghana Reports Strong Mobile Money Growth in Q4",
        summary: "Telecom giant exceeds expectations with mobile money ecosystem expansion driving revenue.",
        time: "6h ago",
    },
    {
        category: "Economy",
        title: "Inflation Moderates to 32.1% in Latest CPI Data",
        summary: "Recent government policies show initial signs of easing price pressures across key sectors.",
        time: "8h ago",
    },
    {
        category: "Market",
        title: "Foreign Investment Inflows Surge 15% Year-over-Year",
        summary: "Global investors show renewed interest in GSE as emerging market fundamentals strengthen.",
        time: "10h ago",
    },
    {
        category: "Company",
        title: "GCB Bank PLC Announces Dividend Update",
        summary: "Banking sector leader reports stable earnings and outlines digital transformation roadmap.",
        time: "12h ago",
    },
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
        </tr>
    );
}

export default function BusinessNewsPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);

    useEffect(() => {
        getAllStocks().then((data) => {
            recordAll(data.map((s) => ({ symbol: s.symbol, price: s.price })));
            setStocks(data);
        }).catch(() => {});
    }, []);

    const topGainers = [...stocks].filter((s) => s.change > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const topLosers = [...stocks].filter((s) => s.change < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] overflow-hidden">
                                <div className="px-6 py-4 border-b border-ink/[0.08]">
                                    <h2 className="font-bold font-poppins">Top Gainers</h2>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-ink/[0.08]">
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Change</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider hidden md:table-cell">Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topGainers.map((stock, i) => <MoverRow key={stock.symbol} stock={stock} index={i} />)}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] overflow-hidden">
                                <div className="px-6 py-4 border-b border-ink/[0.08]">
                                    <h2 className="font-bold font-poppins">Top Losers</h2>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-ink/[0.08]">
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Symbol</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Change</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider hidden md:table-cell">Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topLosers.map((stock, i) => <MoverRow key={stock.symbol} stock={stock} index={i} />)}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>

                    {/* News Articles */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h2 className="text-2xl font-bold mb-8 font-poppins">Latest News</h2>
                        <div className="space-y-6">
                            {newsArticles.map((article) => (
                                <div
                                    key={article.title}
                                    className="p-6 rounded-2xl bg-ink/[0.02] border border-ink/[0.08] hover:border-ink/20 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xs font-bold uppercase tracking-widest text-ink/30">
                                            {article.category}
                                        </span>
                                        <span className="text-xs text-ink/20 flex items-center gap-1">
                                            <Clock size={10} /> {article.time}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-ink mb-2 group-hover:translate-x-1 transition-transform font-poppins">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-ink/40 leading-relaxed">
                                        {article.summary}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
