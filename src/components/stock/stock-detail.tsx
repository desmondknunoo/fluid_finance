import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, ShoppingCart, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceChart } from "@/components/stock/price-chart";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { ShareSheet } from "@/components/stock/share-sheet";
import { BuyRedirectSheet } from "@/components/stock/buy-redirect-sheet";
import { EmptyState, Notice } from "@/components/ui/form";
import { ThemeToggleButton } from "@/components/ui/theme-toggle";
import {
    formatCedis,
    formatCompact,
    getEquityDetail,
    getStock,
    isMarketOpen,
    metaFor,
    type EquityDetail,
    type Stock,
} from "@/lib/gse";
import { getSeries, periodChange, recordClose, RANGES, sliceRange, type RangeKey } from "@/lib/history";

/** One label/value row of the key-facts rail. */
function FactRow({ label, value }: { label: string; value: string }) {
    return (
        <li className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-ink/[0.68]">{label}</span>
            <span className="news-mono text-right font-semibold text-ink">{value}</span>
        </li>
    );
}

/** A stacked label/value row for longer company facts (address, contacts). */
function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <li className="text-sm">
            <span className="news-label">{label}</span>
            <span className="block break-words text-ink">{children}</span>
        </li>
    );
}

function SessionStat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
    return (
        <div className="news-stat">
            <dt>{label}</dt>
            <dd className={tone === "up" ? "news-up" : tone === "down" ? "news-down" : undefined}>{value}</dd>
        </div>
    );
}

type Tab = "details" | "company" | "directors";

const TABS: [Tab, string][] = [
    ["details", "Details"],
    ["company", "Company"],
    ["directors", "Directors"],
];

/**
 * The company page for one listing (the route lives in navigation.ts). It renders on its own, outside
 * the site masthead, so it
 * carries a slim bar of its own (back, share, theme) above the editorial page: an intro with the
 * company name and last price, the session figures, then the chart beside a key-facts rail.
 */
export function StockDetail({ symbol, onBack }: { symbol: string; onBack: () => void }) {
    const [stock, setStock] = useState<Stock | null>(null);
    const [detail, setDetail] = useState<EquityDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<RangeKey>("ALL");
    const [tab, setTab] = useState<Tab>("details");
    const [shareOpen, setShareOpen] = useState(false);
    const [buyOpen, setBuyOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setStock(null);
        setDetail(null);
        setError(null);

        (async () => {
            try {
                const quote = await getStock(symbol);
                if (cancelled) return;
                recordClose(quote.symbol, quote.price);
                setStock(quote);
            } catch {
                if (!cancelled) setError(`Could not load ${symbol} from the GSE API.`);
                return;
            }
            try {
                const equity = await getEquityDetail(symbol);
                if (!cancelled) setDetail(equity);
            } catch {
                /* profile is supplementary — the quote already rendered */
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [symbol]);

    const series = useMemo(
        () => (stock ? getSeries(stock.symbol, stock.price) : null),
        [stock],
    );
    const visible = useMemo(() => (series ? sliceRange(series, range) : []), [series, range]);
    const windowChange = useMemo(() => periodChange(visible), [visible]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [symbol]);

    const meta = metaFor(symbol);
    const marketOpen = isMarketOpen();

    if (error) {
        return (
            <div className="finance-public min-h-screen bg-canvas text-ink">
                <main className="page-container news-page">
                    {/* .news-page zeroes top padding, so the gap comes from this wrapper. */}
                    <div className="pt-10">
                        <Notice tone="error">{error}</Notice>
                        <button type="button" onClick={onBack} className="news-button-secondary mt-6">
                            <ArrowLeft size={16} aria-hidden="true" />
                            Back to market
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (!stock || !series) {
        return (
            <div className="finance-public flex min-h-screen items-center justify-center bg-canvas text-ink/[0.68]" role="status">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading {symbol}</span>
            </div>
        );
    }

    const positive = stock.change >= 0;
    const windowPositive = windowChange.change >= 0;
    const asOf = new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    });

    return (
        <div className="finance-public min-h-screen bg-canvas text-ink selection:bg-fluid-cyan selection:text-fluid-action-ink">
            {/* Page bar: this route has no site masthead, so back, share and theme live here. */}
            <header className="sticky top-0 z-40 border-b border-ink/[0.12] bg-canvas">
                <div className="page-container flex min-h-[56px] items-center justify-between gap-4">
                    <button type="button" onClick={onBack} aria-label="Back to market" className="news-text-link">
                        <ArrowLeft size={16} aria-hidden="true" />
                        Back to market
                    </button>
                    <span className="news-mono text-sm font-bold tracking-[0.12em]" aria-hidden="true">
                        {stock.symbol}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShareOpen(true)}
                            aria-label={`Share ${stock.symbol}`}
                            className="news-icon-button"
                        >
                            <Share2 size={16} aria-hidden="true" />
                        </button>
                        <ThemeToggleButton className="h-9 w-9" />
                    </div>
                </div>
            </header>

            <ShareSheet
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                card={{
                    symbol: stock.symbol,
                    company: stock.company,
                    sector: meta.sector,
                    price: stock.price,
                    change: stock.change,
                    changePercent: stock.changePercent,
                    points: visible,
                    range,
                    periodPercent: windowChange.percent,
                    hasBackfill: visible.some((p) => !p.recorded),
                }}
            />

            <BuyRedirectSheet
                open={buyOpen}
                onClose={() => setBuyOpen(false)}
                symbol={stock.symbol}
                company={stock.company}
            />

            <main className="page-container news-page">
                {/* Identity + price */}
                <header className="news-page-intro">
                    <div>
                        <div className="news-kicker">
                            {meta.sector} · Ghana Stock Exchange
                        </div>
                        <div className="flex items-center gap-4">
                            <TickerLogo symbol={stock.symbol} size={52} />
                            <h1 className="min-w-0 break-words">{stock.company}</h1>
                        </div>
                        <div className="news-byline mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>Equity · {meta.industry}</span>
                            <span aria-hidden="true">·</span>
                            <span>As of {asOf} GMT</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1.5">
                                <span
                                    className={cn(
                                        "h-2 w-2 rounded-full",
                                        marketOpen ? "animate-pulse bg-fluid-green" : "bg-fluid-rose",
                                    )}
                                    aria-hidden="true"
                                />
                                <strong className={marketOpen ? "text-fluid-green" : "text-fluid-rose"}>
                                    {marketOpen ? "Market open" : "Market closed"}
                                </strong>
                            </span>
                        </div>
                    </div>

                    <div className="news-page-actions !flex-none flex-col items-start md:items-end">
                        <dl className="md:text-right">
                            <div className="news-stat">
                                <dt>{stock.symbol} · GHS</dt>
                                <dd>{formatCedis(stock.price)}</dd>
                            </div>
                        </dl>
                        <span className={cn("news-pill gap-1", positive ? "news-pill--up" : "news-pill--down")}>
                            {positive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
                            {positive ? "+" : ""}
                            {stock.changePercent.toFixed(2)}% ({positive ? "+" : ""}
                            {stock.change.toFixed(2)})
                        </span>
                        <button type="button" onClick={() => setBuyOpen(true)} className="news-button mt-1">
                            <ShoppingCart size={16} aria-hidden="true" />
                            Buy
                        </button>
                    </div>
                </header>

                {/* Session figures */}
                <dl className="news-stats" aria-label="Session">
                    <SessionStat label="Last" value={formatCedis(stock.price)} />
                    <SessionStat
                        label="Change"
                        value={`${positive ? "+" : ""}${stock.change.toFixed(2)}`}
                        tone={stock.change > 0 ? "up" : stock.change < 0 ? "down" : undefined}
                    />
                    <SessionStat label="Prev close" value={formatCedis(stock.price - stock.change)} />
                    <SessionStat label="Volume" value={stock.volume.toLocaleString()} />
                </dl>

                <div className="news-columns news-columns--main mt-10">
                    {/* Chart */}
                    <section aria-labelledby="price-history-heading">
                        <h2 id="price-history-heading" className="news-subhead flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            Price history
                            <span className={cn("news-mono font-sans text-xs font-semibold", windowPositive ? "news-up" : "news-down")}>
                                {windowPositive ? "+" : ""}
                                {windowChange.percent.toFixed(2)}% over {range}
                            </span>
                        </h2>

                        {/* Range tabs and export share one hairline, as on the GSE Live board. */}
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-ink/[0.12]">
                            <div className="flex flex-wrap gap-x-1" role="tablist" aria-label="Chart range">
                                {RANGES.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={range === key}
                                        onClick={() => setRange(key)}
                                        className="news-tab !px-2.5 first:!pl-0"
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => exportSeries(stock.symbol, visible)}
                                className="news-button-quiet news-button-quiet--sm mb-2"
                            >
                                <Download size={14} aria-hidden="true" />
                                Export CSV
                            </button>
                        </div>

                        <PriceChart points={visible} positive={windowPositive} height={300} />

                        <p className="news-byline mt-4 border-t border-ink/[0.12] pt-3">
                            {series.recordedFrom
                                ? `Closes recorded live from ${new Date(series.recordedFrom).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      timeZone: "UTC",
                                  })}. Earlier bars are backfilled — the GSE API serves live quotes only, with no historical series.`
                                : "The GSE API serves live quotes only, with no historical series. Earlier bars are backfilled and anchored to today's real close; live closes are recorded from today onward."}
                        </p>
                    </section>

                    {/* Key facts rail */}
                    {/* On one column the subhead's heavy rule already divides; drop the stacked hairline above it. */}
                    <aside aria-labelledby="key-facts-heading" className="max-md:!border-t-0 max-md:!pt-0">
                        <h2 id="key-facts-heading" className="news-subhead">Key facts</h2>
                        <div className="news-tabs" role="tablist" aria-label="Company information">
                            {TABS.map(([key, label]) => (
                                <button
                                    key={key}
                                    id={`stock-tab-${key}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === key}
                                    aria-controls="stock-tab-panel"
                                    onClick={() => setTab(key)}
                                    className="news-tab"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div id="stock-tab-panel" role="tabpanel" aria-labelledby={`stock-tab-${tab}`}>
                            {tab === "details" && (
                                <ul className="news-list">
                                    <FactRow label="Ticker" value={stock.symbol} />
                                    <FactRow label="Sector" value={meta.sector} />
                                    <FactRow label="Industry" value={meta.industry} />
                                    <FactRow
                                        label="Market cap"
                                        value={detail?.capital ? `₵${formatCompact(detail.capital)}` : "—"}
                                    />
                                    <FactRow
                                        label="Shares outstanding"
                                        value={detail?.shares ? formatCompact(detail.shares) : "—"}
                                    />
                                    <FactRow
                                        label="Earnings per share"
                                        value={detail?.eps != null ? formatCedis(detail.eps) : "—"}
                                    />
                                    <FactRow
                                        label="Dividend per share"
                                        value={detail?.dps != null ? formatCedis(detail.dps) : "—"}
                                    />
                                    <FactRow
                                        label="P/E ratio"
                                        value={
                                            detail?.eps && detail.eps > 0 ? (stock.price / detail.eps).toFixed(2) : "—"
                                        }
                                    />
                                    <FactRow
                                        label="Dividend yield"
                                        value={
                                            detail?.dps && stock.price > 0
                                                ? `${((detail.dps / stock.price) * 100).toFixed(2)}%`
                                                : "—"
                                        }
                                    />
                                </ul>
                            )}

                            {tab === "company" &&
                                (detail?.company ? (
                                    <ul className="news-list">
                                        <ProfileRow label="Registered name">{detail.company.name}</ProfileRow>
                                        {detail.company.address && (
                                            <ProfileRow label="Address">{detail.company.address}</ProfileRow>
                                        )}
                                        {detail.company.telephone && (
                                            <ProfileRow label="Telephone">
                                                <span className="news-mono">{detail.company.telephone}</span>
                                            </ProfileRow>
                                        )}
                                        {detail.company.email && (
                                            <ProfileRow label="Email">
                                                <a
                                                    href={`mailto:${detail.company.email}`}
                                                    className="text-fluid-cyan-ink underline-offset-4 hover:underline"
                                                >
                                                    {detail.company.email}
                                                </a>
                                            </ProfileRow>
                                        )}
                                        {detail.company.website && (
                                            <ProfileRow label="Website">
                                                <a
                                                    href={`https://${detail.company.website.replace(/^https?:\/\//, "")}`}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-fluid-cyan-ink underline-offset-4 hover:underline"
                                                >
                                                    {detail.company.website}
                                                </a>
                                            </ProfileRow>
                                        )}
                                    </ul>
                                ) : (
                                    <EmptyState title="No company profile" className="!border-0 !py-2">
                                        No company profile published for {stock.symbol}.
                                    </EmptyState>
                                ))}

                            {tab === "directors" &&
                                (detail?.company?.directors?.length ? (
                                    <ul className="news-list">
                                        {detail.company.directors.map((director) => (
                                            <li
                                                key={director.name}
                                                className="flex items-baseline justify-between gap-4 text-sm"
                                            >
                                                <span className="font-semibold text-ink">{director.name}</span>
                                                <span className="text-right text-xs text-ink/[0.68]">
                                                    {director.position ?? "Director"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <EmptyState title="No board listing" className="!border-0 !py-2">
                                        The exchange publishes no board listing for {stock.symbol}.
                                    </EmptyState>
                                ))}
                        </div>
                    </aside>
                </div>

                <p className="news-byline mt-12 border-t border-ink/[0.12] pt-4">
                    Fluid Finance publishes market information and education only. Nothing here is a trade
                    facility, an offer, or investment advice.
                </p>
            </main>
        </div>
    );
}

function exportSeries(symbol: string, points: { t: number; close: number; recorded: boolean }[]): void {
    const rows = [
        "date,close,source",
        ...points.map(
            (p) =>
                `${new Date(p.t).toISOString().slice(0, 10)},${p.close.toFixed(4)},${
                    p.recorded ? "recorded" : "backfill"
                }`,
        ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${symbol}-history.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
