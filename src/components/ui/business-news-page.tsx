import { ChevronRight, Share2, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, getAllStocks, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";
import { openStock } from "@/lib/navigation";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { StockCard } from "@/components/stock/stock-card";
import { MoversShareSheet } from "@/components/stock/movers-share-sheet";
import { PageIntro } from "@/components/ui/page-intro";
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

const MOVER_TABS: { key: Tab; label: string }[] = [
    { key: "gainers", label: "Top Gainers" },
    { key: "losers", label: "Top Losers" },
    { key: "active", label: "Most Active" },
];

function MoverRow({ stock, index }: { stock: Stock; index: number }) {
    const positive = stock.change >= 0;
    return (
        <tr
            onClick={() => openStock(stock.symbol)}
            className="cursor-pointer"
        >
            <td>
                <div className="flex items-center gap-3">
                    <span className="w-4 text-xs text-ink/[0.68] news-mono">{index + 1}</span>
                    <TickerLogo symbol={stock.symbol} size={28} />
                    <div className="min-w-0">
                        <span className="font-bold uppercase text-ink">{stock.symbol}</span>
                        <span className="block max-w-[180px] truncate text-xs text-ink/[0.68]">{stock.company}</span>
                    </div>
                </div>
            </td>
            <td className="num news-mono text-ink">{formatCedis(stock.price)}</td>
            <td className="num">
                <span className={cn("inline-flex items-center gap-1 font-medium news-mono", positive ? "news-up" : "news-down")}>
                    {positive ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
                    {positive ? "+" : ""}{stock.change.toFixed(2)}
                </span>
            </td>
            <td className="num hidden md:table-cell text-ink/[0.68]">{stock.volume.toLocaleString()}</td>
            <td className="num">
                <span className="inline-flex items-center gap-1 text-sm text-ink/[0.68]">
                    View <ChevronRight size={14} aria-hidden="true" />
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

    const emptyMessage = `No ${activeTab === "gainers" ? "gainers" : activeTab === "losers" ? "losers" : "active stocks"} at this time`;

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Business & Economy"
                title="Business & Economy News"
                description="Real-time updates on the Ghanaian economy, GSE markets, and business developments."
            />

            {/* Market Movers */}
            <section className="news-section !mt-0" aria-labelledby="movers-heading">
                <header className="news-section-header">
                    <h2 id="movers-heading">Today&apos;s standouts</h2>
                    <span>Market movers</span>
                </header>

                <div className="news-tabs mt-2 items-center">
                    <div role="tablist" aria-label="Market movers" className="flex min-w-0 flex-wrap">
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
                    <button
                        type="button"
                        onClick={() => setShareOpen(true)}
                        disabled={movers.length === 0}
                        className="news-button-quiet news-button-quiet--sm mb-2 ml-auto"
                    >
                        <Share2 size={13} aria-hidden="true" />
                        Share
                    </button>
                </div>

                <div className="flex flex-col gap-2 md:hidden">
                    {movers.length === 0 ? (
                        <p className="news-loading text-center">{emptyMessage}</p>
                    ) : (
                        movers.map((stock, index) => (
                            <StockCard key={stock.symbol} stock={stock} onSelect={openStock} rank={index + 1} />
                        ))
                    )}
                </div>

                <div className="news-table-wrap hidden md:block">
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
                            {movers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="news-loading text-center">
                                        {emptyMessage}
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
            </section>

            {/* Latest News */}
            <section className="news-section" aria-labelledby="latest-news-heading">
                <header className="news-section-header">
                    <h2 id="latest-news-heading">Latest News</h2>
                    <span>Business press and exchange notices</span>
                </header>
                <div className="news-tiles pt-4">
                    {[...marketInsights, ...educationalArticles].map((article) => (
                        <a
                            key={article.title}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-tile"
                        >
                            <p className="news-kicker !mt-0">{article.category}</p>
                            <h3 className="mt-2">{article.title}</h3>
                            <p>{"snippet" in article ? article.snippet : `By ${article.author}`}</p>
                            <span className="news-byline mt-3 inline-flex items-center gap-1">
                                Visit <ArrowUpRight size={12} aria-hidden="true" />
                            </span>
                        </a>
                    ))}
                </div>
            </section>

            <MoversShareSheet
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                card={{ category: activeTab, stocks: movers }}
            />
        </main>
    );
}
