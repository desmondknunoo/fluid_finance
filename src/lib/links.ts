/**
 * Fluid Finance - shared external links
 */

/** The GSE Live dashboard, deep-linked to one of its three view modes. */
export const GSE_LIVE_VIEWS = [
    { key: "table", label: "Table", href: "/legacy/index.html?view=table" },
    { key: "grid", label: "Grid", href: "/legacy/index.html?view=grid" },
    { key: "heatmap", label: "Heatmap", href: "/legacy/index.html?view=heatmap" },
] as const;

export const GSE_LIVE_HREF = "/legacy/index.html";

export const SOCIAL_LINKS = [
    { key: "x", label: "X", href: "https://x.com/FluidFinanceX" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@fluid_finance" },
] as const;
