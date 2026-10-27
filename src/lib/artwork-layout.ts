/** Shared spacing for the unchanged 230px Fluid logo and the first heading block. */
export const ARTWORK_LOGO = { top: 44, width: 230, height: 230 * 826 / 1704 } as const;
export const ARTWORK_HEADING_GAP_MULTIPLIER = 2.5;

export function artworkTextTop(ctx: CanvasRenderingContext2D, text: string, font: string, baseline: CanvasTextBaseline, y: number): number {
    const previousFont = ctx.font, previousBaseline = ctx.textBaseline;
    ctx.font = font;
    ctx.textBaseline = baseline;
    const ascent = ctx.measureText(text).actualBoundingBoxAscent;
    const size = Number(font.match(/(\d+(?:\.\d+)?)px/)?.[1] || 30);
    ctx.font = previousFont;
    ctx.textBaseline = previousBaseline;
    return y - (Number.isFinite(ascent) ? ascent : baseline === "top" ? -size * 0.18 : size * 0.75);
}

/** Measure the original Pump Report's visible gap, then multiply it exactly once. */
export function artworkHeadingTop(ctx: CanvasRenderingContext2D, family: string): number {
    const logoBottom = ARTWORK_LOGO.top + ARTWORK_LOGO.height;
    const previousTop = artworkTextTop(ctx, "FLUID PUMP", `800 94px ${family}`, "alphabetic", 242);
    return logoBottom + (previousTop - logoBottom) * ARTWORK_HEADING_GAP_MULTIPLIER;
}

/** The caller restores this group before drawing fixed source/date/footer elements. */
export function beginArtworkContent(ctx: CanvasRenderingContext2D, currentTop: number, family: string): void {
    const offset = artworkHeadingTop(ctx, family) - currentTop;
    ctx.save();
    ctx.translate(0, offset);
}
