import { EditorialSections } from '@/components/home/editorial-sections';
import { SocialFeed } from '@/components/home/social-feed';
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, ChevronRight, Fuel, GraduationCap, Landmark, LifeBuoy, MessageSquare, Newspaper, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { categoryLabel, formatRelative, listForumCategories, listLatestFxRates, listPublicFuelReports, listPublishedArticles, listPublishedSocialPosts, listThreads, type Article, type ForumThread, type FxRate, type SocialFeedPost } from "@/lib/community";
import { averageFuelPrice, formatFuelChange, formatFuelDate, formatFuelPrice, fuelPriceChange, type FuelReport } from "@/lib/fuel-prices";
import { formatCedis, formatCompact, type Stock } from "@/lib/gse";
import { getSeries, periodChange, sliceRange } from "@/lib/history";
import { SOCIAL_LINKS } from "@/lib/links";
import { articleHref, forumCategoryHref, threadHref } from "@/lib/navigation";
import { marketBreadth, useMarket } from "@/lib/use-market";
import { compositeSeries } from "@/components/home/composite";
import { QuoteTape } from "@/components/home/quote-tape";
import { PriceChart, Sparkline } from "@/components/stock/price-chart";
import { TickerLogo } from "@/components/stock/ticker-logo";
import { MoversShareSheet } from "@/components/stock/movers-share-sheet";
import { UserChip } from "@/components/community/user-chip";
import { cn } from "@/lib/utils";

/**
 * The front page, laid out like a financial newsroom: tape, market bar, a three-column top grid
 * (Markets Wrap · lead story · Latest), then labelled section bands. Every panel has a quiet
 * state so the page reads well before the feeds or the community have data.
 */

const PRESS = [
    { title: "B&FT", note: "Business & Financial Times", href: "https://thebftonline.com" },
    { title: "Citi Business News", note: "Breaking business news", href: "https://www.citinewsroom.com/category/business/" },
    { title: "Graphic Online Business", note: "Business desk", href: "https://www.graphic.com.gh/business/business-news.html" },
    { title: "GSE market notices", note: "Circulars from the exchange", href: "https://gse.com.gh/gse-market-notice/" },
];

const LEARN = [
    { href: "#/learning-center", title: "Learning Center", note: "Courses and guidance from BoG, SEC and the Ghana Securities Institute.", icon: GraduationCap },
    { href: "#/market-education", title: "Market Education", note: "GSE releases, filings, notices and brochures explained.", icon: BookOpen },
    { href: "#/business-news", title: "Business & Economy", note: "Today's movers and the Ghanaian business press.", icon: Newspaper },
    { href: "#/help-center", title: "Help Center", note: "Opening an account, minimums, withdrawals and verification.", icon: LifeBuoy },
];

const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export default function HomePage() {
    const market = useMarket();
    const { user } = useAuth();
    const breadth = useMemo(() => marketBreadth(market.stocks), [market.stocks]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [threads, setThreads] = useState<ForumThread[]>([]);
    const [fx, setFx] = useState<FxRate[]>([]);
    const [fuel, setFuel] = useState<FuelReport | null>(null);
    const [priorFuel, setPriorFuel] = useState<FuelReport | null>(null);
    const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
    const [social, setSocial] = useState<SocialFeedPost[]>([]);
    const [share, setShare] = useState<"gainers" | "losers" | "active" | null>(null);

    useEffect(() => {
        listPublishedArticles({ limit: 120 }).then(setArticles).catch(() => setArticles([]));
        listThreads({ page: 0 }).then((data) => setThreads(data.slice(0, 6))).catch(() => setThreads([]));
        listLatestFxRates().then(setFx).catch(() => setFx([]));
        listPublicFuelReports(2).then((reports) => { setFuel(reports[0] ?? null); setPriorFuel(reports[1] ?? null); }).catch(() => setFuel(null));
        listForumCategories().then((data) => setCategories(data.slice(0, 4))).catch(() => setCategories([]));
        listPublishedSocialPosts(8).then(setSocial).catch(() => setSocial([]));
    }, []);

    const composite = useMemo(() => compositeSeries(market.stocks, "1M"), [market.stocks]);
    const compositeChange = useMemo(() => periodChange(composite), [composite]);
    const usd = fx.find((rate) => rate.base_currency === "USD" && rate.quote_currency === "GHS") ?? null;
    const [lead, ...rest] = articles;
    const latest = useMemo(() => [
        ...articles.map((article) => ({ key: `a-${article.id}`, at: article.published_at ?? article.created_at, title: article.title, href: articleHref(article.slug), kind: categoryLabel(article.category) })),
        ...threads.map((thread) => ({ key: `t-${thread.id}`, at: thread.last_reply_at ?? thread.created_at, title: thread.title, href: threadHref(thread.id), kind: thread.category?.name ?? "Forum" })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8), [articles, threads]);
    const spotlight = breadth.gainers[0] ?? breadth.active[0] ?? null;
    const wrapHeadline = !market.stocks.length
        ? "Ghana Stock Exchange, live when the market feed connects"
        : breadth.advancers.length > breadth.decliners.length
            ? `Advancers lead the GSE as ${breadth.gainers[0]?.symbol ?? "the market"} climbs ${breadth.gainers[0] ? pct(breadth.gainers[0].changePercent) : ""}`
            : breadth.decliners.length > breadth.advancers.length
                ? `Decliners weigh on the GSE; ${breadth.losers[0]?.symbol ?? "the market"} slips ${breadth.losers[0] ? pct(breadth.losers[0].changePercent) : ""}`
                : "A quiet session on the Ghana Stock Exchange";

    return (
        <>
            <QuoteTape stocks={market.stocks} />

            <main className="page-container news-home">
                <div className="news-dateline">
                    <span>Accra <span aria-hidden="true">/</span> {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" })}</span>
                    <span>Ghana Stock Exchange · Prices may be delayed</span>
                </div>
                <div className="news-page-heading">
                    <h1>Today<span className="text-fluid-cyan-ink">.</span></h1>
                    <div className="news-topic-links"><a href="#/gse-live">Equities</a><a href="#/fx">Currencies</a><a href="#/fuel">Energy</a><a href="#/market-trends">Week in review <ArrowRight size={14} aria-hidden="true" /></a></div>
                </div>
                <div className="news-session" aria-label="Market session">
                    <span className="inline-flex items-center gap-2 font-semibold"><span className={cn("h-1.5 w-1.5 rounded-full", market.open ? "bg-fluid-green" : "bg-ink/50")} aria-hidden="true" />GSE {market.open ? "open" : "closed"}</span>
                    {market.stocks.length > 0 && <><span><strong className="text-fluid-green">{breadth.advancers.length} up</strong> / <strong className="text-fluid-rose">{breadth.decliners.length} down</strong></span><span>Volume <strong>{formatCompact(breadth.volume)}</strong></span></>}
                    {usd && <span>USD/GHS <strong>{Number(usd.mid).toFixed(2)}</strong></span>}
                    {fuel && <span>Petrol <strong>GHS {formatFuelPrice(averageFuelPrice(fuel.prices, "petrol"))}/L</strong></span>}
                    <button type="button" onClick={market.refresh} disabled={market.loading} className="ml-auto font-semibold underline underline-offset-4 disabled:opacity-50">{market.loading ? "Updating…" : "Refresh quotes"}</button>
                </div>
                {market.error && <p role="status" className="news-feed-notice">{market.stocks.length ? "Showing the last available quotes. " : "Quotes are temporarily unavailable. "}Use Refresh quotes to try again.</p>}

                <section id="latest" className="news-top-grid" aria-label="Top of the day">
                    <article className="news-lead">
                        <a href="#/gse-live" className="group">
                            <h2 className="news-lead-headline group-hover:underline">{wrapHeadline}</h2>
                            <p className="news-lead-summary">{market.stocks.length ? `${breadth.advancers.length} stocks advance and ${breadth.decliners.length} decline across ${market.stocks.length} listings, with ${formatCompact(breadth.volume)} shares traded.` : "Follow Ghana's listed companies, compare the session's movers and explore the data behind the market."}</p>
                        </a>
                        <div className="news-chart">
                            <div className="flex items-baseline justify-between gap-3"><h3 className="text-sm font-semibold">GSE equal-weight trend</h3><span className="text-xs text-ink/60">1 month · rebased to 100</span></div>
                            {composite.length > 1 ? <PriceChart points={composite} positive={compositeChange.change >= 0} height={185} unit="" /> : <div className="grid h-[185px] place-items-center text-sm text-ink/60">{market.loading ? "Loading market trend…" : "Trend available when quotes reconnect"}</div>}
                            <p className="text-[11px] text-ink/60">{composite.some((point) => !point.recorded) ? "Includes illustrative backfill; not the official GSE index." : "Based on locally recorded quotes; not the official GSE index."}</p>
                        </div>
                        <RelatedBox title="Inside the session">
                            {breadth.gainers[0] && <RelatedLink href={`#/stock/${breadth.gainers[0].symbol}`}>{breadth.gainers[0].company} leads gainers at {formatCedis(breadth.gainers[0].price)}</RelatedLink>}
                            {breadth.losers[0] && <RelatedLink href={`#/stock/${breadth.losers[0].symbol}`}>{breadth.losers[0].company} is the day's biggest faller</RelatedLink>}
                            {!breadth.gainers[0] && !breadth.losers[0] && <RelatedLink href="#/gse-live">Explore all listed companies</RelatedLink>}
                            <RelatedLink href="#/market-trends">The week in review: closing prices and market trends</RelatedLink>
                        </RelatedBox>
                    </article>
                    <div className="news-research">
                        <h2 className="news-column-title">Research & perspective</h2>
                        {lead ? <article>
                            <a href={articleHref(lead.slug)} className="group block">
                                {lead.cover_url && <img src={lead.cover_url} alt="" className="mb-4 aspect-[4/3] w-full object-cover" />}
                                <h3 className="news-story-headline group-hover:underline">{lead.title}</h3>
                                {lead.excerpt && <p className="mt-3 text-sm leading-relaxed text-ink/70">{lead.excerpt}</p>}
                            </a>
                            <div className="mt-4"><UserChip author={lead.author} size="sm" meta={formatRelative(lead.published_at ?? lead.created_at)} /></div>
                            <p className="mt-3 text-xs text-ink/60">{categoryLabel(lead.category)}</p>
                        </article> : <>
                            <a href="#/market-education" className="group block"><h3 className="news-story-headline group-hover:underline">Understand the market behind the numbers.</h3><p className="mt-3 text-sm leading-relaxed text-ink/70">Explore exchange notices, company filings and the essentials of investing on the Ghana Stock Exchange.</p><span className="news-text-link mt-4">Explore market education <ArrowRight size={15} aria-hidden="true" /></span></a>
                            <div className="news-research-note"><BookOpen size={20} className="text-fluid-cyan-ink" aria-hidden="true" /><p>Research articles appear here as the Fluid Finance team publishes.</p></div>
                        </>}
                        {rest.slice(0, 2).map((article) => <a key={article.id} href={articleHref(article.slug)} className="news-secondary-story"><h3>{article.title}</h3><span>{formatRelative(article.published_at ?? article.created_at)}</span></a>)}
                        <a href="#/articles" className="news-text-link mt-6">All research <ArrowRight size={15} aria-hidden="true" /></a>
                    </div>
                    <aside className="news-latest">
                        <h2 className="news-column-title">The latest</h2>
                        {latest.length ? <ol className="news-latest-list">{latest.slice(0, 5).map((item) => <li key={item.key}><a href={item.href}><span>{formatRelative(item.at)} · {item.kind}</span><h3>{item.title}</h3></a></li>)}</ol> : <div className="news-latest-empty"><p>Follow the conversation on Ghana's markets.</p><a href="#/forum" className="news-text-link">Explore discussions <ArrowRight size={14} aria-hidden="true" /></a></div>}
                        {spotlight && <a href={`#/stock/${spotlight.symbol}`} className="news-spotlight"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">In focus</h3><ArrowRight size={14} aria-hidden="true" /></div><div className="mt-4 flex items-center gap-3"><TickerLogo symbol={spotlight.symbol} size={32} /><div><p className="font-bold">{spotlight.symbol}</p><p className="text-xs text-ink/60">{spotlight.company}</p></div></div><div className="mt-4 flex items-baseline justify-between gap-2"><span className="text-2xl font-bold tabular-nums">{formatCedis(spotlight.price)}</span><span className={cn("flex items-center gap-1 text-sm font-semibold", spotlight.change >= 0 ? "text-fluid-green" : "text-fluid-rose")}>{spotlight.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{pct(spotlight.changePercent)}</span></div><Sparkline points={sliceRange(getSeries(spotlight.symbol, spotlight.price), "1M").map((point) => point.close)} positive={spotlight.change >= 0} flat={spotlight.change === 0} width={240} height={48} className="mt-3 w-full" /><p className="mt-1 text-[11px] text-ink/60">Trend includes illustrative backfill</p></a>}
                        <a href="#/business-news" className="news-text-link mt-5">Business & economy <ArrowRight size={14} aria-hidden="true" /></a>
                    </aside>
                </section>

                {/* Markets band */}
                <Band id="markets" label="Markets" links={[["GSE Live", "#/gse-live"], ["Heatmap", "#/gse-live/heatmap"], ["Trends", "#/market-trends"], ["Fuel", "#/fuel"], ["FX", "#/fx"]]}>
                    <div className="grid gap-px bg-ink/[0.08] lg:grid-cols-[1fr_1fr_1fr_1.1fr]">
                        <MoverList title="Top gainers" stocks={breadth.gainers} tone="up" onShare={() => setShare("gainers")} />
                        <MoverList title="Top losers" stocks={breadth.losers} tone="down" onShare={() => setShare("losers")} />
                        <MoverList title="Most active" stocks={breadth.active} tone="neutral" onShare={() => setShare("active")} />
                        <div className="grid gap-px bg-ink/[0.08]">
                            <RailCard href="#/fx" icon={Landmark} title="Cedi rates">
                                {fx.length === 0 ? <p className="text-xs text-ink/45">Desk rates publish here once recorded.</p> : (
                                    <ul className="font-mono text-xs">{fx.filter((rate) => rate.quote_currency === "GHS").slice(0, 4).map((rate) => <li key={rate.id} className="flex justify-between py-0.5"><span className="text-ink/60">{rate.base_currency}/GHS</span><span className="tabular-nums text-ink">{Number(rate.mid).toFixed(2)}</span></li>)}</ul>
                                )}
                            </RailCard>
                            <RailCard href="#/fuel" icon={Fuel} title={fuel ? `Pump prices · ${formatFuelDate(fuel.report_date)}` : "Pump prices"}>
                                {!fuel ? <p className="text-xs text-ink/45">The Fluid Pump Report appears here when published.</p> : (
                                    <ul className="font-mono text-xs">{(["petrol", "diesel"] as const).map((type) => { const now = averageFuelPrice(fuel.prices, type); const change = priorFuel ? fuelPriceChange(now, averageFuelPrice(priorFuel.prices, type)) : null; return <li key={type} className="flex justify-between gap-3 py-0.5"><span className="capitalize text-ink/60">Avg {type}</span><span className="ml-auto tabular-nums text-ink">GHS {formatFuelPrice(now)}</span><span className={cn("w-14 text-right tabular-nums", change === null || change === 0 ? "text-ink/40" : change > 0 ? "text-fluid-rose" : "text-fluid-green")}>{formatFuelChange(change)}</span></li>; })}</ul>
                                )}
                            </RailCard>
                        </div>
                    </div>
                </Band>

                <EditorialSections articles={articles} stocks={market.stocks} loading={market.loading} />

                {/* Community band */}
                <Band id="community" label="Community" links={[["Forum", "#/forum"], ["Articles", "#/articles"], ...categories.map((category) => [category.name, forumCategoryHref(category.slug)] as [string, string])]}>
                    <div className="grid gap-6 p-5 lg:grid-cols-[1.4fr_1fr] md:p-6">
                        <div>
                            {threads.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-ink/[0.12] px-5 py-8 text-center"><MessageSquare size={20} className="mx-auto mb-2 text-ink/30" aria-hidden="true" /><p className="text-sm font-semibold text-ink">No discussions yet</p><p className="mt-1 text-xs text-ink/50">Be the first to ask a question about the GSE, the cedi or fuel prices.</p></div>
                            ) : (
                                <ol className="divide-y divide-ink/[0.06]">
                                    {threads.map((thread) => (
                                        <li key={thread.id}><a href={threadHref(thread.id)} className="group flex items-start gap-3 py-3"><span className="min-w-0 flex-1"><span className="block text-base font-semibold leading-snug text-ink group-hover:text-fluid-cyan-ink">{thread.title}</span><span className="mt-1 block text-xs text-ink/45">{thread.author?.display_name ?? "Member"} · {thread.category?.name} · {formatRelative(thread.last_reply_at ?? thread.created_at)}</span></span><span className="shrink-0 rounded-full bg-ink/[0.05] px-2 py-0.5 font-mono text-[11px] text-ink/60">{thread.reply_count}</span></a></li>
                                    ))}
                                </ol>
                            )}
                        </div>
                        <div className="news-membership p-5">
                            
                            <h3 className="mt-3 text-xl font-bold leading-tight text-ink font-poppins">Join the Fluid Finance community</h3>
                            <p className="mt-2 text-sm leading-relaxed text-ink/60">Comment on research, start discussions and keep a public profile for your market views. Nothing here is investment advice.</p>
                            {user ? <a href="#/forum/new" className="mt-4 inline-flex min-h-[2.75rem] items-center gap-2 rounded-none bg-fluid-cyan px-4 text-sm font-semibold text-fluid-action-ink hover:bg-fluid-cyan-hover">Start a discussion <ArrowRight size={15} /></a> : <a href="#/register" className="mt-4 inline-flex min-h-[2.75rem] items-center gap-2 rounded-none bg-fluid-cyan px-4 text-sm font-semibold text-fluid-action-ink hover:bg-fluid-cyan-hover">Create an account <ArrowRight size={15} /></a>}
                        </div>
                    </div>
                </Band>

                {/* Social desk */}
                <Band id="socials" label="From our socials" links={SOCIAL_LINKS.map((social) => [social.label, social.href] as [string, string])}>
                    <SocialFeed posts={social} />
                </Band>

                {/* Press + Learn */}
                <Band id="learn" label="Learn & follow" links={[["Learning Center", "#/learning-center"], ["Market Education", "#/market-education"], ["Help", "#/help-center"]]}>
                    <div className="grid gap-px bg-ink/[0.08] sm:grid-cols-2 lg:grid-cols-4">
                        {LEARN.map((item) => (
                            <a key={item.href} href={item.href} className="group bg-canvas p-5 transition-colors hover:bg-ink/[0.02]">
                                <item.icon size={24} strokeWidth={1.5} className="mb-6 text-fluid-cyan-ink" aria-hidden="true" />
                                <h3 className="mt-3 text-base font-bold leading-snug text-ink group-hover:text-fluid-cyan-ink">{item.title}</h3>
                                <p className="mt-1 text-sm text-ink/55">{item.note}</p>
                            </a>
                        ))}
                    </div>
                    <div className="grid gap-px border-t border-ink/[0.08] bg-ink/[0.08] sm:grid-cols-2 lg:grid-cols-4">
                        {PRESS.map((source) => (
                            <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-canvas px-5 py-3 text-sm hover:bg-ink/[0.02]"><Newspaper size={15} className="shrink-0 text-ink/40" aria-hidden="true" /><span className="min-w-0"><span className="block font-semibold text-ink">{source.title}</span><span className="block truncate text-xs text-ink/45">{source.note}</span></span></a>
                        ))}
                    </div>
                </Band>
            </main>

            <MoversShareSheet open={share !== null} onClose={() => setShare(null)} card={{ category: share ?? "gainers", stocks: share === "losers" ? breadth.losers : share === "active" ? breadth.active : breadth.gainers }} />
        </>
    );
}

function RelatedBox({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="news-related">
            <p className="py-2 text-xs font-bold text-ink/70">{title}</p>
            <ul className="divide-y divide-ink/[0.06]">{children}</ul>
        </div>
    );
}

function RelatedLink({ href, children }: { href: string; children: ReactNode }) {
    return <li><a href={href} className="block py-2.5 text-sm font-semibold leading-snug text-ink hover:underline">{children}</a></li>;
}

function Band({ id, label, links, children }: { id: string; label: string; links: [string, string][]; children: ReactNode }) {
    return (
        <section id={id} className="news-band" aria-label={label}>
            <header className="news-band-header">
                <h2 className="text-2xl font-bold text-ink font-poppins">{label}</h2>
                {links.map(([text, href]) => <a key={href} href={href} className="text-sm text-ink/50 hover:text-ink" {...(href.startsWith("https://") ? { target: "_blank", rel: "noreferrer noopener" } : {})}>{text}</a>)}
            </header>
            {children}
        </section>
    );
}

function MoverList({ title, stocks, tone, onShare }: { title: string; stocks: Stock[]; tone: "up" | "down" | "neutral"; onShare: () => void }) {
    return (
        <div className="bg-canvas">
            <div className="flex items-center justify-between px-4 py-2.5">
                <h3 className={cn("text-[11px] font-bold uppercase tracking-wider", tone === "up" ? "text-fluid-green" : tone === "down" ? "text-fluid-rose" : "text-fluid-cyan-ink")}>{title}</h3>
                <button type="button" onClick={onShare} disabled={!stocks.length} aria-label={`Share ${title.toLowerCase()}`} className="rounded-md p-1 text-ink/40 hover:bg-ink/[0.05] hover:text-ink disabled:opacity-30"><Share2 size={13} /></button>
            </div>
            {stocks.length === 0 ? <p className="px-4 pb-4 text-xs text-ink/40">{"No data yet"}</p> : (
                <ul>
                    {stocks.map((stock, index) => (
                        <li key={stock.symbol}><a href={`#/stock/${stock.symbol}`} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-ink/[0.03]"><span className="w-4 font-mono text-[11px] text-ink/30">{index + 1}</span><TickerLogo symbol={stock.symbol} size={22} /><span className="min-w-0 flex-1 truncate font-semibold text-ink">{stock.symbol}</span><span className="font-mono text-xs tabular-nums text-ink/70">{formatCedis(stock.price)}</span><span className={cn("w-16 text-right font-mono text-xs tabular-nums", stock.change > 0 ? "text-fluid-green" : stock.change < 0 ? "text-fluid-rose" : "text-ink/40")}>{pct(stock.changePercent)}</span></a></li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function RailCard({ href, icon: Icon, title, children }: { href: string; icon: typeof Fuel; title: string; children: ReactNode }) {
    return (
        <a href={href} className="group block bg-canvas p-4 transition-colors hover:bg-ink/[0.02]">
            <div className="flex items-center gap-2"><Icon size={15} className="text-fluid-cyan-ink" aria-hidden="true" /><h3 className="text-sm font-bold text-ink group-hover:text-fluid-cyan-ink">{title}</h3><ChevronRight size={14} className="ml-auto text-ink/30" aria-hidden="true" /></div>
            <div className="mt-2">{children}</div>
        </a>
    );
}
