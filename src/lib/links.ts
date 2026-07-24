/**
 * Fluid Finance - shared links
 *
 * GSE Live is a section of the landing page, so its entries are in-page hashes.
 * The `/<view>` suffixes are read by src/lib/navigation.ts.
 */

export const GSE_LIVE_HREF = "#gse-live";

export const GSE_LIVE_VIEWS = [
    { key: "table", label: "Table", href: "#gse-live/table" },
    { key: "grid", label: "Grid", href: "#gse-live/grid" },
    { key: "heatmap", label: "Heatmap", href: "#gse-live/heatmap" },
] as const;

export const SOCIAL_LINKS = [
    { key: "x", label: "X", href: "https://x.com/FluidFinanceX" },
    { key: "instagram", label: "Instagram", href: "https://www.instagram.com/fluidfinanceonline" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@fluid_finance" },
] as const;
