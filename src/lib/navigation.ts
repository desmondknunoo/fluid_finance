/**
 * Hash routing.
 *
 *   #                      landing page
 *   #<section-id>          landing page, scrolled to a section
 *   #gse-live/<view>       landing page, GSE Live section on a given view
 *   #/stock/MTNGH          a single ticker
 */

export type ViewMode = "table" | "grid" | "heatmap";

export const VIEW_MODES: ViewMode[] = ["table", "grid", "heatmap"];

export const GSE_LIVE_SECTION = "gse-live";

const STOCK_ROUTE = /^#\/stock\/([A-Za-z0-9._-]+)$/;
const LIVE_VIEW_ROUTE = /^#gse-live\/([A-Za-z]+)$/;

export type Route =
    | { kind: "home"; section: string | null; view: ViewMode | null }
    | { kind: "stock"; symbol: string };

export function parseRoute(hash = window.location.hash): Route {
    const stock = hash.match(STOCK_ROUTE);
    if (stock) return { kind: "stock", symbol: stock[1].toUpperCase() };

    const live = hash.match(LIVE_VIEW_ROUTE);
    if (live) {
        const requested = live[1].toLowerCase() as ViewMode;
        return {
            kind: "home",
            section: GSE_LIVE_SECTION,
            view: VIEW_MODES.includes(requested) ? requested : null,
        };
    }

    const section = hash.startsWith("#") && hash.length > 1 && !hash.startsWith("#/")
        ? hash.slice(1)
        : null;
    return { kind: "home", section, view: null };
}

export function openStock(symbol: string): void {
    window.location.hash = `#/stock/${symbol.toUpperCase()}`;
}

export function openGseLive(view?: ViewMode): void {
    window.location.hash = view ? `#gse-live/${view}` : `#${GSE_LIVE_SECTION}`;
}

/** Leaving a ticker returns to the live market section it was opened from. */
export function closeStock(): void {
    window.location.hash = `#${GSE_LIVE_SECTION}`;
}
