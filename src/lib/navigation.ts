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
 */

export type ViewMode = "table" | "heatmap";

export const VIEW_MODES: ViewMode[] = ["table", "heatmap"];

export const GSE_LIVE_SECTION = "gse-live";

const STOCK_ROUTE = /^#\/stock\/([A-Za-z0-9._-]+)$/;
const LIVE_VIEW_ROUTE = /^#\/?gse-live\/([A-Za-z]+)$/;

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
] as const;

type PageKind = Exclude<(typeof PAGE_ROUTES)[number]["kind"], "gse-live">;

export type Route =
    | { kind: "home"; section: string | null; view: ViewMode | null }
    | { kind: "stock"; symbol: string }
    | { kind: "gse-live"; view: ViewMode | null }
    | { kind: PageKind };

export function parseRoute(hash = window.location.hash): Route {
    const stock = hash.match(STOCK_ROUTE);
    if (stock) return { kind: "stock", symbol: stock[1].toUpperCase() };

    for (const route of PAGE_ROUTES) {
        if (hash.match(route.pattern)) {
            if (route.kind === "gse-live") {
                return { kind: "gse-live", view: null };
            }
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
