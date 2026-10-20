/**
 * Hash routing.
 *
 *   #                      landing page
 *   #<section-id>          landing page, scrolled to a section
 *   #gse-live/<view>       GSE Live page, with a given view
 *   #/stock/MTNGH          a single ticker
 *   #/about-us             about page
 *   #/contact-support      contact support page
 *   #/privacy-policy       privacy policy page
 *   #/learning-center      learning center page
 *   #/help-center          help center page
 *   #/market-education     market education page
 *   #/gse-live             GSE Live page
 *   #/fuel                 public pump-price report
 *   #/fx                   public exchange rates
 *   #/articles             research articles; #/articles/<slug> opens one
 *   #/forum                discussions; #/forum/c/<category>, #/forum/t/<id>, #/forum/new
 *   #/login #/register #/reset-password #/settings   member account
 *   #/u/<username>         a member profile
 */

export type ViewMode = "table" | "heatmap";

export const VIEW_MODES: ViewMode[] = ["table", "heatmap"];

export const GSE_LIVE_SECTION = "gse-live";

const STOCK_ROUTE = /^#\/stock\/([A-Za-z0-9._-]+)$/;
const LIVE_VIEW_ROUTE = /^#\/?gse-live\/([A-Za-z]+)$/;
const ARTICLE_ROUTE = /^#\/articles\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const PROFILE_ROUTE = /^#\/u\/([a-z0-9_]{3,24})$/i;
const FORUM_CATEGORY_ROUTE = /^#\/forum\/c\/([a-z0-9-]+)$/;
const FORUM_THREAD_ROUTE = /^#\/forum\/t\/([0-9a-f-]{36})$/i;
const FORUM_NEW_ROUTE = /^#\/forum\/new(?:\/([a-z0-9-]+))?$/;

const PAGE_ROUTES = [
    { kind: "about", pattern: /^#\/about(-us)?$/ },
    { kind: "contact-support", pattern: /^#\/contact-support$/ },
    { kind: "privacy-policy", pattern: /^#\/privacy-policy$/ },
    { kind: "learning-center", pattern: /^#\/learning-center$/ },
    { kind: "help-center", pattern: /^#\/help-center$/ },
    { kind: "market-education", pattern: /^#\/market-education$/ },
    { kind: "market-trends", pattern: /^#\/market-trends$/ },
    { kind: "business-news", pattern: /^#\/business-news$/ },
    { kind: "terms-of-service", pattern: /^#\/terms-of-service$/ },
    { kind: "gse-live", pattern: /^#\/gse-live$/ },
    { kind: "fuel", pattern: /^#\/fuel$/ },
    { kind: "fx", pattern: /^#\/fx$/ },
    { kind: "articles", pattern: /^#\/(?:articles|opinion)(?:\?section=[a-z-]+)?$/ },
    { kind: "saved", pattern: /^#\/saved$/ },
    { kind: "forum", pattern: /^#\/forum$/ },
    { kind: "settings", pattern: /^#\/settings$/ },
] as const;

const AUTH_ROUTES = [
    { mode: "login", pattern: /^#\/login$/ },
    { mode: "register", pattern: /^#\/register$/ },
    { mode: "reset-password", pattern: /^#\/reset-password/ },
] as const;

export type AuthMode = (typeof AUTH_ROUTES)[number]["mode"];

type PageKind = Exclude<(typeof PAGE_ROUTES)[number]["kind"], "gse-live" | "forum">;

export type Route =
    | { kind: "home"; section: string | null; view: ViewMode | null }
    | { kind: "stock"; symbol: string }
    | { kind: "gse-live"; view: ViewMode | null }
    | { kind: "auth"; mode: AuthMode }
    | { kind: "profile"; username: string }
    | { kind: "article"; slug: string }
    | { kind: "forum"; category: string | null }
    | { kind: "thread"; id: string }
    | { kind: "new-thread"; category: string | null }
    | { kind: PageKind };

export function parseRoute(hash = window.location.hash): Route {
    const stock = hash.match(STOCK_ROUTE);
    if (stock) return { kind: "stock", symbol: stock[1].toUpperCase() };

    const article = hash.match(ARTICLE_ROUTE);
    if (article) return { kind: "article", slug: article[1] };

    const profile = hash.match(PROFILE_ROUTE);
    if (profile) return { kind: "profile", username: profile[1].toLowerCase() };

    const forumCategory = hash.match(FORUM_CATEGORY_ROUTE);
    if (forumCategory) return { kind: "forum", category: forumCategory[1] };

    const thread = hash.match(FORUM_THREAD_ROUTE);
    if (thread) return { kind: "thread", id: thread[1].toLowerCase() };

    const newThread = hash.match(FORUM_NEW_ROUTE);
    if (newThread) return { kind: "new-thread", category: newThread[1] ?? null };

    for (const route of AUTH_ROUTES) {
        if (route.pattern.test(hash)) return { kind: "auth", mode: route.mode };
    }

    for (const route of PAGE_ROUTES) {
        if (hash.match(route.pattern)) {
            if (route.kind === "gse-live") return { kind: "gse-live", view: null };
            if (route.kind === "forum") return { kind: "forum", category: null };
            return { kind: route.kind } as Route;
        }
    }

    const live = hash.match(LIVE_VIEW_ROUTE);
    if (live) {
        const requested = live[1].toLowerCase() as ViewMode;
        return {
            kind: "gse-live",
            view: VIEW_MODES.includes(requested) ? requested : null,
        };
    }

    const isPageRoute = PAGE_ROUTES.some(r => r.pattern.test(hash));
    const section = hash.startsWith("#") && hash.length > 1 && !hash.startsWith("#/") && !isPageRoute
        ? hash.slice(1)
        : null;
    return { kind: "home", section, view: null };
}

export function openStock(symbol: string): void {
    window.location.hash = `#/stock/${symbol.toUpperCase()}`;
}

export function openAbout(): void {
    window.location.hash = "#/about-us";
}

export function openContactSupport(): void {
    window.location.hash = "#/contact-support";
}

export function openPrivacyPolicy(): void {
    window.location.hash = "#/privacy-policy";
}

export function openTermsOfService(): void {
    window.location.hash = "#/terms-of-service";
}

export function openLearningCenter(): void {
    window.location.hash = "#/learning-center";
}

export function openHelpCenter(): void {
    window.location.hash = "#/help-center";
}

export function openBusinessNews(): void {
    window.location.hash = "#/business-news";
}

export function openMarketEducation(): void {
    window.location.hash = "#/market-education";
}

export function openMarketTrends(): void {
    window.location.hash = "#/market-trends";
}

export function openGseLive(view?: ViewMode): void {
    window.location.hash = view ? `#/gse-live/${view}` : "#/gse-live";
}

/** Leaving a ticker returns to the GSE Live page. */
export function closeStock(): void {
    window.location.hash = "#/gse-live";
}

/* ---- community ---------------------------------------------------- */

export const articleHref = (slug: string) => `#/articles/${slug}`;
export const profileHref = (username: string) => `#/u/${username}`;
export const forumCategoryHref = (slug: string | null) => (slug ? `#/forum/c/${slug}` : "#/forum");
export const threadHref = (id: string) => `#/forum/t/${id}`;
export const newThreadHref = (category: string | null) => (category ? `#/forum/new/${category}` : "#/forum/new");

export function openArticle(slug: string): void {
    window.location.hash = articleHref(slug);
}

export function openThread(id: string): void {
    window.location.hash = threadHref(id);
}

export function openProfile(username: string): void {
    window.location.hash = profileHref(username);
}

/** Send a visitor to sign in and bring them back to where they were afterwards. */
const RETURN_KEY = "fluidfinance:return-to";

export function openLogin(returnTo = window.location.hash): void {
    try {
        if (returnTo && !/^#\/(login|register|reset-password)/.test(returnTo)) sessionStorage.setItem(RETURN_KEY, returnTo);
    } catch {
        /* storage unavailable — fall back to home */
    }
    window.location.hash = "#/login";
}

export function returnAfterAuth(): void {
    let target = "#/";
    try {
        target = sessionStorage.getItem(RETURN_KEY) || "#/";
        sessionStorage.removeItem(RETURN_KEY);
    } catch {
        /* storage unavailable */
    }
    window.location.hash = target;
}
