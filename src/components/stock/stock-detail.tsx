import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Download,
    Globe,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Share2,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceChart } from "@/components/stock/price-chart";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { ShareSheet } from "@/components/stock/share-sheet";
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

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between border-b border-ink/[0.05] py-3 last:border-0">
            <span className="text-sm text-ink/40">{label}</span>
            <span className="font-mono text-sm text-ink">{value}</span>
        </div>
    );
}

function ActionChip({
    icon,
    label,
    tone = "default",
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    tone?: "default" | "positive";
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/[0.08] bg-ink/[0.03] px-3 py-3.5 text-sm font-medium transition-colors hover:border-ink/20 hover:bg-ink/[0.06]",
                tone === "positive" ? "text-emerald-400" : "text-ink/70",
            )}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
        </button>
    );
}

type Tab = "details" | "company" | "directors";

export function StockDetail({ symbol, onBack }: { symbol: string; onBack: () => void }) {
    const [stock, setStock] = useState<Stock | null>(null);
    const [detail, setDetail] = useState<EquityDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<RangeKey>("ALL");
    const [tab, setTab] = useState<Tab>("details");
    const [shareOpen, setShareOpen] = useState(false);

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
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
                <p className="text-ink/60">{error}</p>
                <button
                    onClick={onBack}
                    className="rounded-full border border-ink/10 px-5 py-2 text-sm text-ink/70 transition-colors hover:text-ink"
                >
                    Back to market
                </button>
            </div>
        );
    }

    if (!stock || !series) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas">
                <Loader2 className="h-8 w-8 animate-spin text-ink/40" />
            </div>
        );
    }

    const positive = stock.change >= 0;
    const asOf = new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    });

    return (
        <div className="min-h-screen bg-canvas pb-16 text-ink selection:bg-fluid-cyan selection:text-fluid-action-ink">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-ink/[0.08] bg-canvas/85 backdrop-blur-md">
                <div className="mx-auto flex max-w-3xl items-center px-4 py-4 md:px-6">
                    <button
                        onClick={onBack}
                        aria-label="Back to market"
                        className="rounded-full p-2 text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="flex-1 text-center text-base font-bold tracking-widest">{stock.symbol}</h1>
                    <button
                        onClick={() => setShareOpen(true)}
                        aria-label={`Share ${stock.symbol}`}
                        className="rounded-full p-2 text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                    >
                        <Share2 size={19} />
                    </button>
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

            <div className="mx-auto max-w-3xl px-4 md:px-6">
                {/* Identity + price */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-start gap-4 py-6"
                >
                    <TickerLogo symbol={stock.symbol} />
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-bold">{stock.company}</h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-ink/[0.08] px-2 py-0.5 font-mono text-xs text-ink/70">
                                {stock.symbol}
                            </span>
                            <span className="text-xs text-ink/40">Equity</span>
                            <span className="text-ink/20">·</span>
                            <span className="text-xs text-ink/40">{meta.sector}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{formatCedis(stock.price)}</div>
                        <div
                            className={cn(
                                "mt-1 flex items-center justify-end gap-1 text-sm font-medium",
                                positive ? "text-emerald-400" : "text-rose-400",
                            )}
                        >
                            {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {positive ? "+" : ""}
                            {stock.changePercent.toFixed(2)}% ({positive ? "+" : ""}
                            {stock.change.toFixed(2)})
                        </div>
                    </div>
                </motion.section>

                <div className="flex flex-wrap items-center gap-2 pb-4 text-xs text-ink/40">
                    <span>As of {asOf} GMT</span>
                    <span className="text-ink/20">·</span>
                    <span className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                "h-2 w-2 rounded-full",
                                marketOpen ? "animate-pulse bg-emerald-400" : "bg-ink/30",
                            )}
                        />
                        {marketOpen ? "Market open" : "Market closed"}
                    </span>
                </div>

                {/* Chart */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-4"
                >
                    <div className="mb-2 flex items-baseline justify-between">
                        <span className="text-xs uppercase tracking-wider text-ink/40">Price history</span>
                        <span
                            className={cn(
                                "font-mono text-xs",
                                windowChange.change >= 0 ? "text-emerald-400" : "text-rose-400",
                            )}
                        >
                            {windowChange.change >= 0 ? "+" : ""}
                            {windowChange.percent.toFixed(2)}% over {range}
                        </span>
                    </div>

                    <PriceChart points={visible} positive={windowChange.change >= 0} height={300} />

                    <div className="mt-3 flex items-center justify-between gap-1 border-t border-ink/[0.06] pt-3">
                        {RANGES.map((key) => (
                            <button
                                key={key}
                                onClick={() => setRange(key)}
                                className={cn(
                                    "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
                                    range === key
                                        ? "bg-ink/[0.1] text-ink"
                                        : "text-ink/40 hover:text-ink/80",
                                )}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    <p className="mt-3 text-[11px] leading-relaxed text-ink/30">
                        {series.recordedFrom
                            ? `Closes recorded live from ${new Date(series.recordedFrom).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  timeZone: "UTC",
                              })}. Earlier bars are backfilled — the GSE API serves live quotes only, with no historical series.`
                            : "The GSE API serves live quotes only, with no historical series. Earlier bars are backfilled and anchored to today's real close; live closes are recorded from today onward."}
                    </p>
                </motion.section>

                    {/* Alerts */}
                <div className="mt-4 flex gap-2">
                    <ActionChip
                        icon={<Download size={16} />}
                        label="Export CSV"
                        onClick={() => exportSeries(stock.symbol, visible)}
                    />
                </div>

                {/* Session stats */}
                <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                        { label: "Last", value: formatCedis(stock.price) },
                        { label: "Change", value: `${positive ? "+" : ""}${stock.change.toFixed(2)}` },
                        { label: "Prev close", value: formatCedis(stock.price - stock.change) },
                        { label: "Volume", value: stock.volume.toLocaleString() },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-xl border border-ink/[0.08] bg-ink/[0.02] px-3 py-3"
                        >
                            <div className="text-[10px] uppercase tracking-wider text-ink/40">{item.label}</div>
                            <div className="mt-1 font-mono text-sm text-ink">{item.value}</div>
                        </div>
                    ))}
                </section>

                {/* Tabs */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.02]">
                    <div className="flex border-b border-ink/[0.08]">
                        {(
                            [
                                ["details", "Details"],
                                ["company", "Company"],
                                ["directors", "Directors"],
                            ] as [Tab, string][]
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={cn(
                                    "flex-1 py-3.5 text-sm font-medium transition-colors",
                                    tab === key ? "bg-ink/[0.05] text-ink" : "text-ink/40 hover:text-ink",
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="px-5 py-2">
                        {tab === "details" && (
                            <>
                                <StatRow label="Ticker" value={stock.symbol} />
                                <StatRow label="Sector" value={meta.sector} />
                                <StatRow label="Industry" value={meta.industry} />
                                <StatRow
                                    label="Market cap"
                                    value={detail?.capital ? `₵${formatCompact(detail.capital)}` : "—"}
                                />
                                <StatRow
                                    label="Shares outstanding"
                                    value={detail?.shares ? formatCompact(detail.shares) : "—"}
                                />
                                <StatRow
                                    label="Earnings per share"
                                    value={detail?.eps != null ? formatCedis(detail.eps) : "—"}
                                />
                                <StatRow
                                    label="Dividend per share"
                                    value={detail?.dps != null ? formatCedis(detail.dps) : "—"}
                                />
                                <StatRow
                                    label="P/E ratio"
                                    value={
                                        detail?.eps && detail.eps > 0 ? (stock.price / detail.eps).toFixed(2) : "—"
                                    }
                                />
                                <StatRow
                                    label="Dividend yield"
                                    value={
                                        detail?.dps && stock.price > 0
                                            ? `${((detail.dps / stock.price) * 100).toFixed(2)}%`
                                            : "—"
                                    }
                                />
                            </>
                        )}

                        {tab === "company" && (
                            <div className="py-3">
                                {detail?.company ? (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-ink/40">
                                                Registered name
                                            </div>
                                            <div className="mt-1 text-sm text-ink">{detail.company.name}</div>
                                        </div>
                                        {detail.company.address && (
                                            <div className="flex gap-3">
                                                <MapPin size={16} className="mt-0.5 shrink-0 text-ink/30" />
                                                <span className="text-sm text-ink/70">{detail.company.address}</span>
                                            </div>
                                        )}
                                        {detail.company.telephone && (
                                            <div className="flex gap-3">
                                                <Phone size={16} className="mt-0.5 shrink-0 text-ink/30" />
                                                <span className="text-sm text-ink/70">{detail.company.telephone}</span>
                                            </div>
                                        )}
                                        {detail.company.email && (
                                            <div className="flex gap-3">
                                                <Mail size={16} className="mt-0.5 shrink-0 text-ink/30" />
                                                <a
                                                    href={`mailto:${detail.company.email}`}
                                                    className="text-sm text-ink/70 hover:text-ink"
                                                >
                                                    {detail.company.email}
                                                </a>
                                            </div>
                                        )}
                                        {detail.company.website && (
                                            <div className="flex gap-3">
                                                <Globe size={16} className="mt-0.5 shrink-0 text-ink/30" />
                                                <a
                                                    href={`https://${detail.company.website.replace(/^https?:\/\//, "")}`}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-sm text-ink/70 hover:text-ink"
                                                >
                                                    {detail.company.website}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="py-6 text-center text-sm text-ink/40">
                                        No company profile published for {stock.symbol}.
                                    </p>
                                )}
                            </div>
                        )}

                        {tab === "directors" && (
                            <div className="py-3">
                                {detail?.company?.directors?.length ? (
                                    <ul className="space-y-3">
                                        {detail.company.directors.map((director) => (
                                            <li
                                                key={director.name}
                                                className="flex items-center justify-between border-b border-ink/[0.05] pb-3 last:border-0"
                                            >
                                                <span className="text-sm text-ink">{director.name}</span>
                                                <span className="text-xs text-ink/40">
                                                    {director.position ?? "Director"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="py-6 text-center text-sm text-ink/40">
                                        The exchange publishes no board listing for {stock.symbol}.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <p className="mt-6 text-center text-[11px] leading-relaxed text-ink/25">
                    Fluid Finance publishes market information and education only. Nothing here is a trade
                    facility, an offer, or investment advice.
                </p>
            </div>
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
