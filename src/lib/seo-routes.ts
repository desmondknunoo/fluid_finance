/**
 * Fluid Finance - search and link-preview metadata
 *
 * One source for every page's title, description, canonical URL, robots rule, Open Graph and
 * Twitter tags and JSON-LD. Three consumers read it:
 *   - the app (src/lib/seo.ts) updates <head> on every navigation;
 *   - scripts/prerender.mjs writes dist/<route>.html for the static routes and stock pages;
 *   - the Pages Functions in functions/ (via server/) fill in articles, threads, forum
 *     categories and profiles at request time, and build /sitemap.xml.
 *
 * It must stay free of DOM, React and `@/` imports so Node and the Workers runtime can bundle it.
 * Every value is real: no ratings, prices or dates are invented.
 */

import { COMPANY_META } from "./gse";
import { HELP_FAQS } from "./help-faqs";
import { SOCIAL_LINKS } from "./links";
import { logoUrl } from "./logos";
import { parsePath, type Route } from "./navigation";

export const SITE_URL = "https://finance.fluidterra.com";
export const SITE_NAME = "Fluid Finance";
export const DEFAULT_IMAGE = { url: `${SITE_URL}/og/default.png`, width: 1200, height: 630, alt: "Fluid Finance: Ghana's markets, in focus" };
export const LOGO_URL = `${SITE_URL}/icons/icon-512.png`;
const TWITTER_HANDLE = (() => {
    const x = SOCIAL_LINKS.find((social) => social.key === "x");
    const handle = x?.href.split("/").filter(Boolean).pop();
    return handle ? `@${handle}` : null;
})();

export type JsonLd = Record<string, unknown>;

export interface CrawlerSummary {
    heading: string;
    paragraphs: string[];
    links?: { href: string; label: string }[];
}

export interface PageMeta {
    title: string;
    description: string;
    /** Canonical path on SITE_URL, including any meaningful query string. */
    path: string;
    robots?: "index" | "noindex";
    type?: "website" | "article" | "profile";
    image?: { url: string; width?: number; height?: number; alt?: string };
    publishedTime?: string | null;
    modifiedTime?: string | null;
    section?: string;
    tags?: string[];
    jsonLd?: JsonLd[];
    /** Short text for crawlers and link unfurlers, placed inside #root until React mounts. */
    summary?: CrawlerSummary;
}

const suffix = (title: string) => `${title} · ${SITE_NAME}`;
export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`);

/* ---- structured data ---------------------------------------------------- */

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationJsonLd(): JsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "NewsMediaOrganization",
        "@id": ORG_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
        image: DEFAULT_IMAGE.url,
        email: "info@fluidterra.com",
        areaServed: { "@type": "Country", name: "Ghana" },
        sameAs: SOCIAL_LINKS.map((social) => social.href),
        parentOrganization: { "@type": "Organization", name: "Fluid Terra", url: "https://fluidterra.com" },
    };
}

/** No SearchAction: the site has no search results URL to point one at. */
export function websiteJsonLd(): JsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: "en-GH",
        publisher: { "@id": ORG_ID },
    };
}

export function breadcrumbJsonLd(trail: [string, string][]): JsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [["Home", "/"] as [string, string], ...trail].map(([name, path], index) => ({
            "@type": "ListItem",
            position: index + 1,
            name,
            item: absoluteUrl(path),
        })),
    };
}

const publisherRef = () => ({ "@type": "NewsMediaOrganization", "@id": ORG_ID, name: SITE_NAME, logo: { "@type": "ImageObject", url: LOGO_URL } });

/* ---- the GSE board -------------------------------------------------------- */

export const STOCK_SYMBOLS = Object.keys(COMPANY_META).sort();

const MARKETS: [string, string] = ["Markets", "/gse-live"];
const COMMUNITY: [string, string] = ["Community", "/forum"];
const RESEARCH: [string, string] = ["Research", "/articles"];

function fit(candidates: string[], min = 140, max = 160): string {
    const inRange = candidates.find((text) => text.length >= min && text.length <= max);
    if (inRange) return inRange;
    const shortEnough = candidates.filter((text) => text.length <= max);
    return shortEnough.length ? shortEnough.reduce((best, text) => (text.length > best.length ? text : best)) : clip(candidates[candidates.length - 1], max);
}

export function stockMeta(rawSymbol: string): PageMeta {
    const symbol = rawSymbol.toUpperCase();
    const known = COMPANY_META[symbol];
    const company = known?.company ?? symbol;
    const sector = known?.sector ?? null;
    const industry = known?.industry ?? null;
    const path = `/stock/${encodeURIComponent(symbol)}`;
    const area = sector ? `${sector.toLowerCase()} stock` : "stock";
    const description = fit([
        `${company} (GSE: ${symbol}) share price today, with the daily change, trading volume, price history and company profile for this ${area} on the Ghana Stock Exchange.`,
        `${company} (GSE: ${symbol}) share price today: daily change, trading volume, price history and company profile for this ${area} listed in Ghana.`,
        `${company} (GSE: ${symbol}) share price today: daily change, trading volume, price history and company profile on the Ghana Stock Exchange.`,
        `${company} (${symbol}) share price today: daily change, volume, price history and company profile for this ${area} on the GSE.`,
        `${symbol} share price today: ${company} daily change, volume, price history and profile on the Ghana Stock Exchange.`,
        `${symbol} share price today: ${company} price, change, volume and history on the GSE.`,
    ]);
    const logo = logoUrl(symbol);
    const corporation: JsonLd = {
        "@context": "https://schema.org",
        "@type": "Corporation",
        name: company,
        tickerSymbol: `GSE:${symbol}`,
        ...(logo ? { logo: absoluteUrl(logo) } : {}),
        ...(industry && sector ? { description: `${company} is listed on the Ghana Stock Exchange under the symbol ${symbol} (${sector}, ${industry}).` } : {}),
    };
    return {
        title: suffix(`${company} (${symbol}) share price today`),
        description,
        path,
        jsonLd: [corporation, breadcrumbJsonLd([MARKETS, [`${company} (${symbol})`, path]])],
        summary: {
            heading: `${company} (${symbol})`,
            paragraphs: [
                sector && industry
                    ? `${company} trades on the Ghana Stock Exchange under the ticker ${symbol}. Sector: ${sector}. Industry: ${industry}.`
                    : `${symbol} trades on the Ghana Stock Exchange.`,
                `Fluid Finance shows the latest ${symbol} share price in cedis, the day's change and trading volume, a price history chart and the company's profile and directors. Prices may be delayed.`,
            ],
            links: [{ href: "/gse-live", label: "All Ghana Stock Exchange share prices" }, { href: "/gse-live/heatmap", label: "GSE market heatmap" }, { href: "/market-trends", label: "Weekly market trends" }],
        },
    };
}

/* ---- static pages ---------------------------------------------------------- */

const HUB_LINKS = [
    { href: "/gse-live", label: "Ghana Stock Exchange live share prices" },
    { href: "/gse-live/heatmap", label: "GSE market heatmap" },
    { href: "/market-trends", label: "Weekly market trends and closing prices" },
    { href: "/fuel", label: "Fuel prices in Ghana" },
    { href: "/fx", label: "Cedi exchange rates" },
    { href: "/articles", label: "Research and analysis" },
    { href: "/opinion", label: "Fluid Finance Opinion" },
    { href: "/business-news", label: "Business and economy news" },
    { href: "/forum", label: "Community forum" },
    { href: "/learning-center", label: "Learning center" },
    { href: "/market-education", label: "Market education" },
    { href: "/help-center", label: "Help center" },
];

const stockLinks = () => STOCK_SYMBOLS.map((symbol) => ({ href: `/stock/${symbol}`, label: `${COMPANY_META[symbol].company} (${symbol}) share price` }));

function datasetJsonLd(input: { name: string; description: string; path: string; variables: string[]; temporalCoverage?: string }): JsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: input.name,
        description: input.description,
        url: absoluteUrl(input.path),
        isAccessibleForFree: true,
        creator: { "@type": "NewsMediaOrganization", "@id": ORG_ID, name: SITE_NAME, url: `${SITE_URL}/` },
        spatialCoverage: { "@type": "Place", name: "Ghana" },
        variableMeasured: input.variables,
        ...(input.temporalCoverage ? { temporalCoverage: input.temporalCoverage } : {}),
    };
}

interface StaticPage {
    title: string;
    description: string;
    heading: string;
    intro: string;
    crumbs?: [string, string][];
    robots?: "noindex";
    jsonLd?: () => JsonLd[];
    links?: () => { href: string; label: string }[];
}

/** Every prerendered path, with the copy shown to search engines and link previews. */
export const STATIC_PAGES: Record<string, StaticPage> = {
    "/": {
        title: "Fluid Finance: Ghana stock prices, markets news and research",
        description: "Ghana Stock Exchange share prices, top gainers and losers, cedi exchange rates, fuel pump prices and independent market research for investors in Ghana.",
        heading: "Fluid Finance: Ghana's markets, in focus",
        intro: "Follow every company listed on the Ghana Stock Exchange, the session's gainers and losers, indicative cedi rates, pump prices by oil marketing company, research from the Fluid Finance desk and a community of Ghanaian investors.",
        jsonLd: () => [organizationJsonLd(), websiteJsonLd()],
        links: () => [...HUB_LINKS, ...stockLinks()],
    },
    "/gse-live": {
        title: suffix("Ghana Stock Exchange live share prices today"),
        description: "Every Ghana Stock Exchange listed company on one board: today's share prices in cedis, daily change, volume and one-month trend, as a table or a heatmap.",
        heading: "Live Market Data",
        intro: "Every listed equity on the Ghana Stock Exchange, as a sortable board or a heatmap. Select any ticker for its full price history.",
        crumbs: [MARKETS],
        jsonLd: () => [{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Companies listed on the Ghana Stock Exchange",
            numberOfItems: STOCK_SYMBOLS.length,
            itemListElement: STOCK_SYMBOLS.map((symbol, index) => ({ "@type": "ListItem", position: index + 1, name: `${COMPANY_META[symbol].company} (${symbol})`, url: absoluteUrl(`/stock/${symbol}`) })),
        }],
        links: stockLinks,
    },
    "/gse-live/heatmap": {
        title: suffix("GSE market heatmap: today's gainers and losers"),
        description: "See the Ghana Stock Exchange at a glance: a heatmap of every listed stock coloured by today's percentage change, with prices in cedis. Open a tile for details.",
        heading: "GSE market heatmap",
        intro: "Every Ghana Stock Exchange listing as a tile, shaded by the session's move. Select a company for its price history and profile.",
        crumbs: [MARKETS, ["Heatmap", "/gse-live/heatmap"]],
        links: stockLinks,
    },
    "/market-trends": {
        title: suffix("GSE weekly market trends and closing prices"),
        description: "The week on the Ghana Stock Exchange: weekly winners and losers, week-over-week changes and historical daily closing prices you can filter and export to Excel.",
        heading: "Market Trends",
        intro: "Weekly winners and losers on the Ghana Stock Exchange, measured week-over-week, with the daily closing prices recorded since August 2026.",
        crumbs: [MARKETS, ["Market trends", "/market-trends"]],
        jsonLd: () => [datasetJsonLd({
            name: "Ghana Stock Exchange daily closing prices",
            description: "Daily closing share prices for companies listed on the Ghana Stock Exchange, recorded by Fluid Finance from the market snapshot and used for weekly trend comparisons.",
            path: "/market-trends",
            variables: ["Closing price (GHS)", "Weekly change (%)"],
            temporalCoverage: "2026-08-10/..",
        })],
    },
    "/business-news": {
        title: suffix("Ghana business and economy news"),
        description: "Ghana business and economy news in one place: today's Ghana Stock Exchange movers, the most active shares and headlines from the Ghanaian business press.",
        heading: "Business & Economy News",
        intro: "Updates on the Ghanaian economy, GSE markets and business developments, with the session's movers and links to the country's business press.",
        crumbs: [["Business & economy", "/business-news"]],
    },
    "/fuel": {
        title: suffix("Fuel prices in Ghana today: petrol and diesel by OMC"),
        description: "Petrol and diesel pump prices in Ghana by oil marketing company, from the dated Fluid Pump Report, in cedis per litre, with the change since the last report.",
        heading: "Fuel prices across Ghana",
        intro: "The Fluid Pump Report: pump prices by oil marketing company, recorded by the Fluid Finance team. Prices are in GHS per litre and may change at the pump.",
        crumbs: [["Fuel prices", "/fuel"]],
        jsonLd: () => [datasetJsonLd({
            name: "Fluid Pump Report: fuel pump prices in Ghana",
            description: "Petrol and diesel pump prices by oil marketing company in Ghana, in cedis per litre, recorded by the Fluid Finance team for each dated report.",
            path: "/fuel",
            variables: ["Petrol price (GHS per litre)", "Diesel price (GHS per litre)"],
        })],
    },
    "/fx": {
        title: suffix("Cedi exchange rates today and currency converter"),
        description: "Indicative Ghana cedi exchange rates recorded by the Fluid Finance desk: buy, sell and mid rates, recent rate history and a currency converter for cedi amounts.",
        heading: "Exchange rates",
        intro: "Indicative cedi exchange rates recorded by the Fluid Finance operations team. Bank and forex bureau rates differ; confirm before you transact.",
        crumbs: [["Exchange rates", "/fx"]],
        jsonLd: () => [datasetJsonLd({
            name: "Indicative Ghana cedi exchange rates",
            description: "Indicative buy, sell and mid exchange rates between the Ghana cedi and major currencies, recorded by the Fluid Finance operations team.",
            path: "/fx",
            variables: ["Buy rate", "Sell rate", "Mid rate"],
        })],
    },
    "/articles": {
        title: suffix("Ghana markets research and analysis"),
        description: "Research and market notes from the Fluid Finance desk on the Ghana Stock Exchange, listed companies, the cedi, fuel prices and the wider Ghanaian economy.",
        heading: "Articles & market notes",
        intro: "Analysis from the Fluid Finance research team on the GSE, the cedi, fuel and the wider economy. Sign in to join the discussion under each piece.",
        crumbs: [RESEARCH],
    },
    "/opinion": {
        title: "Fluid Finance Opinion: commentary on Ghana's markets and economy",
        description: "Commentary, arguments and perspectives on Ghana's markets, business and economy. Each opinion piece reflects its author's views and passes editorial review.",
        heading: "Fluid Finance Opinion",
        intro: "Commentary, arguments and perspectives on markets, business and the economy. Each piece reflects its author's views and passes editorial review before publication.",
        crumbs: [["Opinion", "/opinion"]],
    },
    "/forum": {
        title: suffix("Ghana investing forum: GSE, cedi and fuel"),
        description: "Join Ghanaian investors discussing GSE stocks, company results and dividends, the cedi, fuel prices and personal finance in the Fluid Finance community forum.",
        heading: "Finance forum",
        intro: "Discuss the GSE, the cedi, fuel prices and personal finance with other Fluid Finance members. Keep it civil and factual.",
        crumbs: [COMMUNITY],
    },
    "/learning-center": {
        title: suffix("Learn to invest in Ghana: courses and guides"),
        description: "Learn how investing in Ghana works: courses and guidance from the Bank of Ghana, the SEC and the Ghana Securities Institute, curated for new GSE investors.",
        heading: "Learning Center",
        intro: "Expert analysis, educational content and courses to help you navigate the Ghana Stock Exchange with confidence.",
        crumbs: [["Learning center", "/learning-center"]],
    },
    "/market-education": {
        title: suffix("GSE market education: notices, filings and guides"),
        description: "Understand the Ghana Stock Exchange: market notices, company filings, brochures and guides that explain how the market works and what the numbers mean.",
        heading: "Market Education",
        intro: "Master financial markets, economic indicators and investment strategies through insights and educational resources about the Ghana Stock Exchange.",
        crumbs: [["Market education", "/market-education"]],
    },
    "/help-center": {
        title: suffix("Help Center: questions about investing on the GSE"),
        description: "Answers to common questions about investing on the Ghana Stock Exchange with Fluid Finance: getting started, minimums, verification and market data.",
        heading: "Help Center",
        intro: "Find answers to common questions, get help with trading and connect with our support team.",
        crumbs: [["Help center", "/help-center"]],
        jsonLd: () => [{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: HELP_FAQS.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
        }],
    },
    "/contact-support": {
        title: suffix("Contact support"),
        description: "Contact the Fluid Finance team with questions about Ghana Stock Exchange data, your account, the community forum or anything else on finance.fluidterra.com.",
        heading: "Contact Support",
        intro: "Have a question or need assistance? Our team is here to help you with anything related to Fluid Finance.",
        crumbs: [["Contact support", "/contact-support"]],
    },
    "/about-us": {
        title: suffix("About us: Ghana's markets, in focus"),
        description: "Fluid Finance is a Ghanaian financial publication and market education platform covering the Ghana Stock Exchange, the cedi, fuel prices and the economy.",
        heading: "About Fluid Finance",
        intro: "Fluid Finance is a financial publication and market education platform. It does not execute trades, hold client funds or act as a broker.",
        crumbs: [["About us", "/about-us"]],
    },
    "/privacy-policy": {
        title: suffix("Privacy policy"),
        description: "How Fluid Finance collects, uses and protects your personal data when you read market data, create an account or take part in the community on our site.",
        heading: "Privacy Policy",
        intro: "How Fluid Finance handles your personal data.",
        crumbs: [["Privacy policy", "/privacy-policy"]],
    },
    "/terms-of-service": {
        title: suffix("Terms of service"),
        description: "The terms that apply when you use Fluid Finance: market data and research, member accounts, community rules, and why nothing on the site is investment advice.",
        heading: "Terms of Service",
        intro: "Please read these terms carefully before using Fluid Finance.",
        crumbs: [["Terms of service", "/terms-of-service"]],
    },
    "/saved": {
        title: suffix("Saved for later"),
        description: "Articles you saved on this device for offline reading.",
        heading: "Saved for later",
        intro: "Public articles saved on this device for offline reading.",
        robots: "noindex",
    },
    "/login": {
        title: suffix("Sign in"),
        description: "Sign in to Fluid Finance to comment on research, join forum discussions and keep your public profile.",
        heading: "Welcome back",
        intro: "Sign in to comment, join discussions and keep your profile.",
        robots: "noindex",
    },
    "/register": {
        title: suffix("Create your free account"),
        description: "Create a free Fluid Finance account to comment on research, start forum discussions and keep a public profile for your market views.",
        heading: "Create your account",
        intro: "Free, and all you need to take part in the Fluid Finance community.",
        robots: "noindex",
    },
    "/reset-password": {
        title: suffix("Reset your password"),
        description: "Reset the password for your Fluid Finance account.",
        heading: "Reset your password",
        intro: "We will email you a link to choose a new one.",
        robots: "noindex",
    },
    "/settings": {
        title: suffix("Account settings"),
        description: "Your Fluid Finance account settings.",
        heading: "Your settings",
        intro: "How you appear to other members, plus sign-in and appearance preferences.",
        robots: "noindex",
    },
    "/forum/new": {
        title: suffix("Start a discussion"),
        description: "Start a new discussion in the Fluid Finance community forum.",
        heading: "Start a discussion",
        intro: "Ask a question or share a view.",
        robots: "noindex",
        crumbs: [COMMUNITY, ["New discussion", "/forum/new"]],
    },
};

/** Paths listed in the sitemap: every public, indexable static page. */
export const INDEXABLE_STATIC_PATHS = Object.keys(STATIC_PAGES).filter((path) => STATIC_PAGES[path].robots !== "noindex");

export function staticPageMeta(path: string): PageMeta {
    const page = STATIC_PAGES[path] ?? STATIC_PAGES["/"];
    const canonical = STATIC_PAGES[path] ? path : "/";
    return {
        title: page.title,
        description: page.description,
        path: canonical,
        robots: page.robots ?? "index",
        jsonLd: [...(page.jsonLd?.() ?? []), ...(page.crumbs ? [breadcrumbJsonLd(page.crumbs)] : [])],
        summary: { heading: page.heading, paragraphs: [page.intro], links: page.links?.() ?? HUB_LINKS },
    };
}

/* ---- dynamic pages ---------------------------------------------------------- */

/** The fields of an API article this module reads (structurally compatible with community.Article). */
export interface ArticleLike {
    slug: string;
    title: string;
    excerpt: string | null;
    body?: string;
    cover_url: string | null;
    category: string;
    tags?: string[];
    published_at: string | null;
    created_at?: string;
    updated_at?: string | null;
    author: { username: string; display_name: string } | null;
}

export interface ThreadLike {
    id: string;
    title: string;
    body: string;
    reply_count: number;
    created_at: string;
    updated_at?: string | null;
    last_reply_at: string | null;
    author: { username: string; display_name: string } | null;
    category: { slug: string; name: string } | null;
}

export interface ProfileLike {
    username: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
}

export interface CategoryLike {
    slug: string;
    name: string;
    description: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    markets: "Markets", stocks: "Stocks", economy: "Economy", fuel: "Fuel", fx: "FX",
    "personal-finance": "Personal finance", education: "Education", "company-news": "Company news",
};

/** Article categories the API filters by (community.ARTICLE_CATEGORIES). */
export const ARTICLE_CATEGORY_IDS = Object.keys(CATEGORY_LABELS);

/** Markdown and HTML reduced to one line of plain text. */
export function plainText(source: string): string {
    return source
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/[#>*_`~|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** Shorten at a word boundary, adding an ellipsis only when something was cut. */
export function clip(text: string, max = 160): string {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const space = cut.lastIndexOf(" ");
    return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–-]+$/, "")}…`;
}

/** Only absolute http(s) images are usable as og:image. */
function absoluteImage(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        const parsed = new URL(url, SITE_URL);
        return /^https?:$/.test(parsed.protocol) ? parsed.href : null;
    } catch {
        return null;
    }
}

function personJsonLd(author: { username: string; display_name: string } | null): JsonLd {
    if (!author) return publisherRef();
    return { "@type": "Person", name: author.display_name, url: absoluteUrl(`/u/${author.username}`) };
}

export function articleMeta(article: ArticleLike): PageMeta {
    const path = `/articles/${article.slug}`;
    const category = CATEGORY_LABELS[article.category] ?? "Research";
    const description = clip(article.excerpt?.trim() || plainText(article.body ?? "") || `${article.title}: research from the Fluid Finance desk on Ghana's markets.`, 160);
    const cover = absoluteImage(article.cover_url);
    const published = article.published_at ?? article.created_at ?? null;
    const modified = article.updated_at ?? published;
    const newsArticle: JsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: clip(article.title, 110),
        description,
        url: absoluteUrl(path),
        mainEntityOfPage: absoluteUrl(path),
        image: [cover ?? DEFAULT_IMAGE.url],
        ...(published ? { datePublished: published } : {}),
        ...(modified ? { dateModified: modified } : {}),
        author: [personJsonLd(article.author)],
        publisher: publisherRef(),
        articleSection: category,
        ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
        inLanguage: "en-GH",
        isAccessibleForFree: true,
    };
    return {
        title: suffix(article.title),
        description,
        path,
        type: "article",
        image: cover ? { url: cover, alt: article.title } : undefined,
        publishedTime: published,
        modifiedTime: modified,
        section: category,
        tags: article.tags ?? [],
        jsonLd: [newsArticle, breadcrumbJsonLd([RESEARCH, [clip(article.title, 80), path]])],
        summary: {
            heading: article.title,
            paragraphs: [
                [category, article.author?.display_name ? `By ${article.author.display_name}` : null].filter(Boolean).join(" · "),
                description,
            ].filter(Boolean),
            links: [{ href: "/articles", label: "All research from Fluid Finance" }],
        },
    };
}

export function threadMeta(thread: ThreadLike): PageMeta {
    const path = `/forum/t/${thread.id}`;
    const text = plainText(thread.body);
    const description = clip(text ? `${text}` : `${thread.title}: a discussion in the Fluid Finance community forum.`, 160);
    const posting: JsonLd = {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        headline: clip(thread.title, 110),
        text: clip(text, 2000),
        url: absoluteUrl(path),
        mainEntityOfPage: absoluteUrl(path),
        datePublished: thread.created_at,
        ...(thread.updated_at && thread.updated_at !== thread.created_at ? { dateModified: thread.updated_at } : {}),
        author: personJsonLd(thread.author),
        interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: thread.reply_count },
        ...(thread.category ? { isPartOf: { "@type": "WebPage", name: thread.category.name, url: absoluteUrl(`/forum/c/${thread.category.slug}`) } } : {}),
    };
    const crumbs: [string, string][] = [COMMUNITY];
    if (thread.category) crumbs.push([thread.category.name, `/forum/c/${thread.category.slug}`]);
    crumbs.push([clip(thread.title, 80), path]);
    return {
        title: suffix(`${thread.title} · Forum`),
        description,
        path,
        type: "article",
        publishedTime: thread.created_at,
        jsonLd: [posting, breadcrumbJsonLd(crumbs)],
        summary: {
            heading: thread.title,
            paragraphs: [
                `${thread.author ? `Started by ${thread.author.display_name}` : "A discussion"}${thread.category ? ` in ${thread.category.name}` : ""} · ${thread.reply_count} ${thread.reply_count === 1 ? "reply" : "replies"}`,
                description,
            ],
            links: [{ href: "/forum", label: "All forum discussions" }],
        },
    };
}

export function forumCategoryMeta(category: CategoryLike): PageMeta {
    const path = `/forum/c/${category.slug}`;
    const about = category.description?.trim().replace(/\.$/, "") ?? "";
    return {
        title: suffix(`${category.name} · Forum`),
        description: clip(`${category.name} discussions in the Fluid Finance community forum${about ? `: ${about}` : ""}. Ask questions and share views with investors in Ghana.`, 160),
        path,
        jsonLd: [breadcrumbJsonLd([COMMUNITY, [category.name, path]])],
        summary: { heading: category.name, paragraphs: [category.description ?? "Discussions in the Fluid Finance community forum."], links: [{ href: "/forum", label: "All forum discussions" }] },
    };
}

export function profileMeta(profile: ProfileLike): PageMeta {
    const path = `/u/${profile.username}`;
    const bio = profile.bio?.trim();
    const avatar = absoluteImage(profile.avatar_url);
    return {
        title: suffix(`${profile.display_name} (@${profile.username})`),
        description: clip(bio ? `${profile.display_name} (@${profile.username}) on Fluid Finance: ${bio}` : `${profile.display_name} (@${profile.username}) is a member of the Fluid Finance community, discussing Ghana's markets, the cedi and personal finance.`, 160),
        path,
        type: "profile",
        image: avatar ? { url: avatar, alt: profile.display_name } : undefined,
        jsonLd: [{
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: absoluteUrl(path),
            dateCreated: profile.created_at,
            mainEntity: {
                "@type": "Person",
                name: profile.display_name,
                alternateName: `@${profile.username}`,
                identifier: profile.username,
                ...(bio ? { description: bio } : {}),
                ...(avatar ? { image: avatar } : {}),
            },
        }, breadcrumbJsonLd([COMMUNITY, [profile.display_name, path]])],
        summary: { heading: profile.display_name, paragraphs: [`@${profile.username}`, ...(bio ? [bio] : [])], links: [{ href: "/forum", label: "Community forum" }] },
    };
}

export function notFoundMeta(path: string, what: string): PageMeta {
    return {
        title: suffix(`${what} not found`),
        description: `This ${what.toLowerCase()} is not available on Fluid Finance. It may have been removed or unpublished.`,
        path,
        robots: "noindex",
    };
}

/**
 * The metadata a route has before any data loads. Pages with API content (articles, threads,
 * profiles, forum categories) replace it once their data arrives.
 */
export function routeMeta(route: Route, search = ""): PageMeta {
    switch (route.kind) {
        case "home": return staticPageMeta("/");
        case "stock": return stockMeta(route.symbol);
        case "gse-live": return staticPageMeta(route.view === "heatmap" ? "/gse-live/heatmap" : "/gse-live");
        case "auth": return staticPageMeta(`/${route.mode}`);
        case "about": return staticPageMeta("/about-us");
        case "articles": {
            const section = new URLSearchParams(search).get("section");
            const base = staticPageMeta("/articles");
            return section && /^[a-z-]+$/.test(section) ? { ...base, path: `/articles?section=${section}` } : base;
        }
        case "article": return { title: suffix("Research"), description: STATIC_PAGES["/articles"].description, path: `/articles/${route.slug}`, type: "article" };
        case "thread": return { title: suffix("Forum discussion"), description: STATIC_PAGES["/forum"].description, path: `/forum/t/${route.id}`, type: "article" };
        case "forum": return route.category
            ? { ...staticPageMeta("/forum"), path: `/forum/c/${route.category}`, jsonLd: [breadcrumbJsonLd([COMMUNITY, [route.category, `/forum/c/${route.category}`]])] }
            : staticPageMeta("/forum");
        case "new-thread": return staticPageMeta("/forum/new");
        case "profile": return { title: suffix(`@${route.username}`), description: STATIC_PAGES["/forum"].description, path: `/u/${route.username}`, type: "profile" };
        default: return staticPageMeta(`/${route.kind}`);
    }
}

/** The metadata for a path as the browser would request it (used by the prerenderer). */
export function metaForPath(pathWithQuery: string): PageMeta {
    const url = new URL(pathWithQuery, SITE_URL);
    if (url.pathname === "/opinion") return staticPageMeta("/opinion");
    return routeMeta(parsePath(url.pathname, url.search, url.hash), url.search);
}

/* ---- rendering ---------------------------------------------------------------- */

export interface HeadTag {
    tag: "title" | "meta" | "link" | "script";
    attrs: Record<string, string>;
    text?: string;
}

/** JSON for a <script> element: `<` is escaped so no value can close the element early. */
export function jsonLdText(data: JsonLd): string {
    return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function headTags(meta: PageMeta): HeadTag[] {
    const url = absoluteUrl(meta.path);
    const image = meta.image ?? DEFAULT_IMAGE;
    const imageAlt = image.alt ?? meta.title;
    const robots = meta.robots === "noindex" ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1";
    const tags: HeadTag[] = [
        { tag: "title", attrs: {}, text: meta.title },
        { tag: "meta", attrs: { name: "description", content: meta.description } },
        { tag: "meta", attrs: { name: "robots", content: robots } },
        { tag: "link", attrs: { rel: "canonical", href: url } },
        { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
        { tag: "meta", attrs: { property: "og:locale", content: "en_GH" } },
        { tag: "meta", attrs: { property: "og:type", content: meta.type ?? "website" } },
        { tag: "meta", attrs: { property: "og:url", content: url } },
        { tag: "meta", attrs: { property: "og:title", content: meta.title } },
        { tag: "meta", attrs: { property: "og:description", content: meta.description } },
        { tag: "meta", attrs: { property: "og:image", content: image.url } },
        ...(image.width ? [{ tag: "meta" as const, attrs: { property: "og:image:width", content: String(image.width) } }] : []),
        ...(image.height ? [{ tag: "meta" as const, attrs: { property: "og:image:height", content: String(image.height) } }] : []),
        { tag: "meta", attrs: { property: "og:image:alt", content: imageAlt } },
    ];
    if (meta.type === "article") {
        if (meta.publishedTime) tags.push({ tag: "meta", attrs: { property: "article:published_time", content: meta.publishedTime } });
        if (meta.modifiedTime) tags.push({ tag: "meta", attrs: { property: "article:modified_time", content: meta.modifiedTime } });
        if (meta.section) tags.push({ tag: "meta", attrs: { property: "article:section", content: meta.section } });
        for (const tag of meta.tags ?? []) tags.push({ tag: "meta", attrs: { property: "article:tag", content: tag } });
    }
    tags.push(
        { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
        ...(TWITTER_HANDLE ? [{ tag: "meta" as const, attrs: { name: "twitter:site", content: TWITTER_HANDLE } }] : []),
        { tag: "meta", attrs: { name: "twitter:title", content: meta.title } },
        { tag: "meta", attrs: { name: "twitter:description", content: meta.description } },
        { tag: "meta", attrs: { name: "twitter:image", content: image.url } },
        { tag: "meta", attrs: { name: "twitter:image:alt", content: imageAlt } },
    );
    for (const block of meta.jsonLd ?? []) tags.push({ tag: "script", attrs: { type: "application/ld+json" }, text: jsonLdText(block) });
    return tags;
}

export function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** The managed head block as HTML. Every element carries `data-seo` so it can be swapped later. */
export function renderHeadTags(meta: PageMeta, indent = "    "): string {
    return headTags(meta).map(({ tag, attrs, text }) => {
        const attributes = Object.entries(attrs).map(([key, value]) => ` ${key}="${escapeHtml(value)}"`).join("");
        if (tag === "title") return `${indent}<title data-seo>${escapeHtml(text ?? "")}</title>`;
        if (tag === "script") return `${indent}<script data-seo${attributes}>${text ?? ""}</script>`;
        return `${indent}<${tag} data-seo${attributes} />`;
    }).join("\n");
}

/** The crawler-visible summary placed in #root; React replaces it when the app mounts. */
export function renderSummary(meta: PageMeta): string {
    const summary = meta.summary;
    if (!summary) return "";
    const paragraphs = summary.paragraphs.filter(Boolean).map((text) => `<p>${escapeHtml(text)}</p>`).join("");
    const links = summary.links?.length
        ? `<nav aria-label="Explore Fluid Finance"><ul>${summary.links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join("")}</ul></nav>`
        : "";
    return `<main class="page-container news-page" data-prerendered><h1>${escapeHtml(summary.heading)}</h1>${paragraphs}${links}</main>`;
}
