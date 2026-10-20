/**
 * Path routing (History API).
 *
 *   /                          landing page (/#<section-id> scrolls to a section)
 *   /stock/MTNGH               a single ticker
 *   /about-us                  about page (/about is an alias)
 *   /contact-support           contact support page
 *   /privacy-policy            privacy policy page
 *   /terms-of-service          terms of service page
 *   /learning-center           learning center page
 *   /help-center               help center page
 *   /market-education          market education page
 *   /market-trends             weekly trends page
 *   /business-news             business & economy page
 *   /gse-live                  GSE Live page; /gse-live/<view> opens a given view
 *   /fuel                      public pump-price report
 *   /fx                        public exchange rates
 *   /articles                  research articles (?section=<id> filters); /articles/<slug> opens one
 *   /opinion                   opinion articles
 *   /saved                     articles saved on this device
 *   /forum                     discussions; /forum/c/<category>, /forum/t/<id>, /forum/new[/<category>]
 *   /login /register /reset-password /settings   member account
 *   /u/<username>              a member profile
 *
 * The site used hash routes (`/#/stock/GCB`) until October 2026. Those links still circulate in
 * share cards, emails, the portal and the backend's publication ledger, so `legacyHashToPath`
 * maps every one of them to its path and `normaliseLegacyUrl` swaps the address in place.
 *
 * Nothing here touches `window` at import time, so the parsers can be tested under Node.
 */

export type ViewMode = "table" | "heatmap";

export const VIEW_MODES: ViewMode[] = ["table", "heatmap"];

export const GSE_LIVE_SECTION = "gse-live";

const STOCK_ROUTE = /^\/stock\/([A-Za-z0-9._-]+)$/;
const LIVE_VIEW_ROUTE = /^\/gse-live\/([A-Za-z]+)$/;
const ARTICLE_ROUTE = /^\/articles\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const PROFILE_ROUTE = /^\/u\/([a-z0-9_]{3,24})$/i;
const FORUM_CATEGORY_ROUTE = /^\/forum\/c\/([a-z0-9-]+)$/;
const FORUM_THREAD_ROUTE = /^\/forum\/t\/([0-9a-f-]{36})$/i;
const FORUM_NEW_ROUTE = /^\/forum\/new(?:\/([a-z0-9-]+))?$/;

const PAGE_ROUTES = [
    { kind: "about", pattern: /^\/about(-us)?$/ },
    { kind: "contact-support", pattern: /^\/contact-support$/ },
    { kind: "privacy-policy", pattern: /^\/privacy-policy$/ },
    { kind: "learning-center", pattern: /^\/learning-center$/ },
    { kind: "help-center", pattern: /^\/help-center$/ },
    { kind: "market-education", pattern: /^\/market-education$/ },
    { kind: "market-trends", pattern: /^\/market-trends$/ },
    { kind: "business-news", pattern: /^\/business-news$/ },
    { kind: "terms-of-service", pattern: /^\/terms-of-service$/ },
    { kind: "gse-live", pattern: /^\/gse-live$/ },
    { kind: "fuel", pattern: /^\/fuel$/ },
    { kind: "fx", pattern: /^\/fx$/ },
    { kind: "articles", pattern: /^\/(?:articles|opinion)$/ },
    { kind: "saved", pattern: /^\/saved$/ },
    { kind: "forum", pattern: /^\/forum$/ },
    { kind: "settings", pattern: /^\/settings$/ },
] as const;

const AUTH_ROUTES = [
    { mode: "login", pattern: /^\/login$/ },
    { mode: "register", pattern: /^\/register$/ },
    { mode: "reset-password", pattern: /^\/reset-password$/ },
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

/** `/fuel/`, `/fuel.html` and `/index.html` all name the same page as `/fuel` and `/`. */
export function normalisePathname(pathname: string): string {
    let path = pathname || "/";
    try { path = decodeURI(path); } catch { /* keep the raw path */ }
    path = path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path || "/";
}

/** Parse a location (pathname, query and fragment) into a route. Unknown paths render the front page. */
export function parsePath(pathname: string, _search = "", hash = ""): Route {
    const path = normalisePathname(pathname);

    const stock = path.match(STOCK_ROUTE);
    if (stock) return { kind: "stock", symbol: stock[1].toUpperCase() };

    const article = path.match(ARTICLE_ROUTE);
    if (article) return { kind: "article", slug: article[1] };

    const profile = path.match(PROFILE_ROUTE);
    if (profile) return { kind: "profile", username: profile[1].toLowerCase() };

    const forumCategory = path.match(FORUM_CATEGORY_ROUTE);
    if (forumCategory) return { kind: "forum", category: forumCategory[1] };

    const thread = path.match(FORUM_THREAD_ROUTE);
    if (thread) return { kind: "thread", id: thread[1].toLowerCase() };

    const newThread = path.match(FORUM_NEW_ROUTE);
    if (newThread) return { kind: "new-thread", category: newThread[1] ?? null };

    for (const route of AUTH_ROUTES) {
        if (route.pattern.test(path)) return { kind: "auth", mode: route.mode };
    }

    for (const route of PAGE_ROUTES) {
        if (route.pattern.test(path)) {
            if (route.kind === "gse-live") return { kind: "gse-live", view: null };
            if (route.kind === "forum") return { kind: "forum", category: null };
            return { kind: route.kind } as Route;
        }
    }

    const live = path.match(LIVE_VIEW_ROUTE);
    if (live) {
        const requested = live[1].toLowerCase() as ViewMode;
        return { kind: "gse-live", view: VIEW_MODES.includes(requested) ? requested : null };
    }

    const section = path === "/" && hash.length > 1 && !hash.startsWith("#/") ? decodeHash(hash.slice(1)) : null;
    return { kind: "home", section, view: null };
}

function decodeHash(value: string): string {
    try { return decodeURIComponent(value); } catch { return value; }
}

/** The current route, read from the address bar. */
export function parseRoute(location: Pick<Location, "pathname" | "search" | "hash"> = window.location): Route {
    return parsePath(location.pathname, location.search, location.hash);
}

/** A stable identity for a route, so re-reading the same address does not re-render or re-scroll. */
export function routeKey(route: Route): string {
    return JSON.stringify(route);
}

/**
 * Map a pre-2026 hash URL fragment to its path, or null when the fragment is an ordinary in-page
 * anchor (`#listen`, `#have-questions`). `#/stock/GCB` → `/stock/GCB`, `#/` → `/`,
 * `#/articles?section=africa` → `/articles?section=africa`, `#gse-live/heatmap` → `/gse-live/heatmap`.
 */
export function legacyHashToPath(hash: string): string | null {
    if (!hash || hash === "#") return null;
    if (hash.startsWith("#/")) {
        const target = hash.slice(1);
        return target === "/" ? "/" : target.replace(/^\/+/, "/");
    }
    if (/^#gse-live\/[A-Za-z]+$/.test(hash)) return `/${hash.slice(1)}`;
    return null;
}

/** Any href this site produces or ever produced, as a same-origin path (`#/fx` → `/fx`). */
export function toPath(href: string): string {
    return legacyHashToPath(href.startsWith("#") ? href : "") ?? href;
}

/* ---- the History API router -------------------------------------------- */

export const NAVIGATE_EVENT = "fluid:navigate";

interface HistoryState {
    fluidScrollY?: number;
}

let pendingScroll: number | null = null;

/** The scroll position to restore after a back/forward navigation, consumed once. */
export function consumePendingScroll(): number | null {
    const value = pendingScroll;
    pendingScroll = null;
    return value;
}

function rememberScroll(): void {
    try {
        const state = (history.state ?? {}) as HistoryState;
        history.replaceState({ ...state, fluidScrollY: window.scrollY }, "");
    } catch {
        /* state is a convenience */
    }
}

function announce(): void {
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/** Go to a same-origin path (pushState) or another site (full load). */
export function navigate(to: string, options: { replace?: boolean } = {}): void {
    let url: URL;
    try {
        url = new URL(toPath(to), window.location.href);
    } catch {
        return;
    }
    if (url.origin !== window.location.origin) {
        window.location.assign(url.href);
        return;
    }
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next === current && !options.replace) return;
    if (options.replace) {
        history.replaceState(history.state, "", next);
    } else {
        rememberScroll();
        history.pushState({}, "", next);
    }
    announce();
}

/**
 * Swap a legacy `/#/…` address for its path without adding a history entry. Runs before the
 * first render and again whenever something sets a `#/…` hash.
 */
export function normaliseLegacyUrl(): boolean {
    const target = legacyHashToPath(window.location.hash);
    if (!target) return false;
    history.replaceState(history.state, "", target);
    return true;
}

/** Subscribe to every address change: our pushState, back/forward and in-page hash changes. */
export function onLocationChange(listener: () => void): () => void {
    const onPop = (event: PopStateEvent) => {
        const state = (event.state ?? {}) as HistoryState;
        pendingScroll = typeof state.fluidScrollY === "number" ? state.fluidScrollY : null;
        listener();
    };
    const onHash = () => {
        normaliseLegacyUrl();
        listener();
    };
    window.addEventListener(NAVIGATE_EVENT, listener);
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onHash);
    return () => {
        window.removeEventListener(NAVIGATE_EVENT, listener);
        window.removeEventListener("popstate", onPop);
        window.removeEventListener("hashchange", onHash);
    };
}

/**
 * Client-side navigation for ordinary links: same-origin left clicks without modifier keys,
 * not opening a new tab or a download, and not already handled. Links that only change the
 * fragment on the current page keep the browser's own anchor behaviour.
 */
export function interceptLinkClicks(root: Document = document): () => void {
    const onClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!anchor) return;
        if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download") || /\bexternal\b/.test(anchor.rel)) return;
        const raw = anchor.getAttribute("href") ?? "";
        if (raw.startsWith("#/") || /^#gse-live\//.test(raw)) {
            event.preventDefault();
            navigate(raw);
            return;
        }
        let url: URL;
        try { url = new URL(anchor.href, window.location.href); } catch { return; }
        if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
        // Files the server answers itself (sitemap, images, the service worker) are not app routes.
        if (/\.(?!html$)[a-z0-9]+$/i.test(url.pathname)) return;
        const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
        if (samePage && url.hash) return;
        event.preventDefault();
        navigate(`${url.pathname}${url.search}${url.hash}`);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
}

export function openStock(symbol: string): void {
    navigate(`/stock/${symbol.toUpperCase()}`);
}

export function openAbout(): void {
    navigate("/about-us");
}

export function openContactSupport(): void {
    navigate("/contact-support");
}

export function openPrivacyPolicy(): void {
    navigate("/privacy-policy");
}

export function openTermsOfService(): void {
    navigate("/terms-of-service");
}

export function openLearningCenter(): void {
    navigate("/learning-center");
}

export function openHelpCenter(): void {
    navigate("/help-center");
}

export function openBusinessNews(): void {
    navigate("/business-news");
}

export function openMarketEducation(): void {
    navigate("/market-education");
}

export function openMarketTrends(): void {
    navigate("/market-trends");
}

export function openGseLive(view?: ViewMode): void {
    navigate(view ? `/gse-live/${view}` : "/gse-live");
}

/** Leaving a ticker returns to the GSE Live page. */
export function closeStock(): void {
    navigate("/gse-live");
}

/* ---- community ---------------------------------------------------- */

export const stockHref = (symbol: string) => `/stock/${symbol.toUpperCase()}`;
export const articleHref = (slug: string) => `/articles/${slug}`;
export const profileHref = (username: string) => `/u/${username}`;
export const forumCategoryHref = (slug: string | null) => (slug ? `/forum/c/${slug}` : "/forum");
export const threadHref = (id: string) => `/forum/t/${id}`;
export const newThreadHref = (category: string | null) => (category ? `/forum/new/${category}` : "/forum/new");

export function openArticle(slug: string): void {
    navigate(articleHref(slug));
}

export function openThread(id: string): void {
    navigate(threadHref(id));
}

export function openProfile(username: string): void {
    navigate(profileHref(username));
}

/** Send a visitor to sign in and bring them back to where they were afterwards. */
const RETURN_KEY = "fluidfinance:return-to";
const AUTH_PATH = /^\/(login|register|reset-password)(?:$|[?#])/;

function currentLocation(): string {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function openLogin(returnTo = currentLocation()): void {
    const target = toPath(returnTo);
    try {
        if (target && !AUTH_PATH.test(target)) sessionStorage.setItem(RETURN_KEY, target);
    } catch {
        /* storage unavailable — fall back to home */
    }
    navigate("/login");
}

export function returnAfterAuth(): void {
    let target = "/";
    try {
        // Sessions started before the move to paths stored `#/…` targets; toPath maps them.
        const stored = toPath(sessionStorage.getItem(RETURN_KEY) || "/");
        target = stored.startsWith("/") && !stored.startsWith("//") && !AUTH_PATH.test(stored) ? stored : "/";
        sessionStorage.removeItem(RETURN_KEY);
    } catch {
        /* storage unavailable */
    }
    navigate(target);
}
