/**
 * Fluid Finance - social share card
 *
 * Renders a stock's identity, price action and history chart onto a canvas so
 * it can be shared as a single image. Drawn by hand rather than screenshotted
 * from the DOM: everything is same-origin, so the canvas is never tainted and
 * `toBlob` always succeeds.
 */

import { logoUrl } from "@/lib/logos";
import type { PricePoint, RangeKey } from "@/lib/history";

export interface ShareCardInput {
    symbol: string;
    company: string;
    sector: string;
    price: number;
    change: number;
    changePercent: number;
    points: PricePoint[];
    range: RangeKey;
    periodPercent: number;
    /** True when part of the plotted span is backfilled rather than observed. */
    hasBackfill: boolean;
    theme?: ShareCardTheme;
}

export type ShareCardTheme = "light" | "dark";

const W = 1080;
const H = 1080;

const PALETTES = {
dark: {
    canvas: "#08090b",
    surface: "#101114",
    border: "rgba(255,255,255,0.09)",
    text: "#ffffff",
    muted: "rgba(255,255,255,0.42)",
    faint: "rgba(255,255,255,0.24)",
    grid: "rgba(255,255,255,0.06)",
    up: "#34d399",
    down: "#fb7185",
    chip: "rgba(255,255,255,0.09)",
    chipText: "rgba(255,255,255,0.75)",
    selected: "rgba(255,255,255,0.12)",
    logo: "/logo/lockup-01.png", // light wordmark, for dark background
    footerBg: "#111318",
    footerText: "#ffffff",
    footerMuted: "rgba(255,255,255,0.6)",
},
light: {
    canvas: "#ffffff",
    surface: "#f5f6f8",
    border: "rgba(9,10,14,0.12)",
    text: "#090a0e",
    muted: "rgba(9,10,14,0.58)",
    faint: "rgba(9,10,14,0.42)",
    grid: "rgba(9,10,14,0.10)",
    up: "#059669",
    down: "#e11d48",
    chip: "rgba(9,10,14,0.08)",
    chipText: "rgba(9,10,14,0.72)",
    selected: "rgba(9,10,14,0.10)",
    logo: "/logo/lockup-04.png", // dark wordmark, for light background
    footerBg: "#e7e9ee",
    footerText: "#0b0d10",
    footerMuted: "rgba(9,10,14,0.6)",
},
} as const;

/** 24×24 brand glyph paths (from components/ui/social-icons). */
const ICONS = {
    instagram:
        "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
    tiktok:
        "M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.86a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.77.12v-3.3a5.9 5.9 0 0 0-.77-.05 5.84 5.84 0 1 0 5.84 5.84V9.4a7.5 7.5 0 0 0 4.4 1.41V7.62a4.3 4.3 0 0 1-3.4-1.8z",
    x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
} as const;

const SOCIALS = [
    { icon: ICONS.instagram, handle: "@fluidfinanceonline" },
    { icon: ICONS.tiktok, handle: "@fluid_finance" },
    { icon: ICONS.x, handle: "@FluidFinanceX" },
] as const;

/** Draws a 24-unit SVG glyph at (x,y) scaled to `size`, filled with `color`. */
function drawGlyph(ctx: CanvasRenderingContext2D, path: string, x: number, y: number, size: number, color: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(path));
    ctx.restore();
}

type ShareCardPalette = (typeof PALETTES)[ShareCardTheme];

function font(weight: number, size: number, mono = false): string {
    const family = mono
        ? "'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace"
        : "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif";
    return `${weight} ${size}px ${family}`;
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let clipped = text;
    while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
        clipped = clipped.slice(0, -1);
    }
    return `${clipped}…`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function tickerHue(symbol: string): number {
    let h = 0;
    for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) % 360;
    return h;
}

function axisPrice(value: number): string {
    if (value >= 1000) return value.toFixed(0);
    if (value >= 100) return value.toFixed(1);
    return value.toFixed(2);
}

function niceTicks(min: number, max: number, count: number): number[] {
    if (!(max > min)) return [min];
    const magnitude = Math.pow(10, Math.floor(Math.log10((max - min) / count)));
    const normalized = (max - min) / count / magnitude;
    const step = (normalized >= 5 ? 10 : normalized >= 2 ? 5 : normalized >= 1 ? 2 : 1) * magnitude;
    const ticks: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) ticks.push(v);
    return ticks;
}

function xLabel(ms: number, spanDays: number): string {
    const d = new Date(ms);
    if (spanDays > 400) return String(d.getUTCFullYear());
    if (spanDays > 60) return d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Draws the logo (or an initials tile) into a white rounded square. */
async function drawLogo(
    ctx: CanvasRenderingContext2D,
    symbol: string,
    x: number,
    y: number,
    size: number,
    ink: ShareCardPalette,
): Promise<void> {
    const src = logoUrl(symbol);
    const img = src ? await loadImage(src) : null;

    if (!img) {
        const hue = tickerHue(symbol);
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, `hsl(${hue} 62% 42%)`);
        gradient.addColorStop(1, `hsl(${(hue + 40) % 360} 58% 26%)`);
        ctx.fillStyle = gradient;
        roundRect(ctx, x, y, size, size, 20);
        ctx.fill();
        ctx.fillStyle = ink.text;
        ctx.font = font(700, size * 0.32);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbol.slice(0, 2), x + size / 2, y + size / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        return;
    }

    ctx.save();
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, y, size, size, 20);
    ctx.fill();
    ctx.clip();

    // SVGs without intrinsic dimensions report 0 — assume square in that case.
    const naturalW = img.naturalWidth || size;
    const naturalH = img.naturalHeight || size;
    const pad = size * 0.12;
    const box = size - pad * 2;
    const scale = Math.min(box / naturalW, box / naturalH);
    const dw = naturalW * scale;
    const dh = naturalH * scale;
    ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
    ctx.restore();
}

function drawChart(
    ctx: CanvasRenderingContext2D,
    points: PricePoint[],
    box: { x: number; y: number; w: number; h: number },
    positive: boolean,
    ink: ShareCardPalette,
): void {
    if (points.length < 2) return;

    const axisGutter = 96;
    const labelStrip = 40;
    const plotW = box.w - axisGutter;
    const plotH = box.h - labelStrip;

    const closes = points.map((p) => p.close);
    const rawMin = Math.min(...closes);
    const rawMax = Math.max(...closes);
    const pad = (rawMax - rawMin || rawMax * 0.1 || 1) * 0.12;
    const min = Math.max(0, rawMin - pad);
    const max = rawMax + pad;
    const span = max - min || 1;

    const px = (i: number) => box.x + (i / (points.length - 1)) * plotW;
    const py = (v: number) => box.y + (1 - (v - min) / span) * plotH;

    const pillH = 36;
    const lastY = py(points[points.length - 1].close);

    // horizontal grid + right-hand price axis
    ctx.font = font(500, 22, true);
    ctx.textBaseline = "middle";
    for (const value of niceTicks(min, max, 4)) {
        const y = py(value);
        if (y < box.y - 2 || y > box.y + plotH + 2) continue;
        ctx.strokeStyle = ink.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(box.x, y);
        ctx.lineTo(box.x + plotW, y);
        ctx.stroke();
        // The live-price pill owns the gutter; drop labels it would cover.
        if (Math.abs(y - lastY) < pillH) continue;
        ctx.fillStyle = ink.faint;
        ctx.textAlign = "left";
        ctx.fillText(axisPrice(value), box.x + plotW + 18, y);
    }

    const stroke = positive ? ink.up : ink.down;

    // area fill
    const gradient = ctx.createLinearGradient(0, box.y, 0, box.y + plotH);
    gradient.addColorStop(0, positive ? "rgba(52,211,153,0.30)" : "rgba(251,113,133,0.30)");
    gradient.addColorStop(1, positive ? "rgba(52,211,153,0)" : "rgba(251,113,133,0)");
    ctx.beginPath();
    ctx.moveTo(px(0), box.y + plotH);
    points.forEach((p, i) => ctx.lineTo(px(i), py(p.close)));
    ctx.lineTo(px(points.length - 1), box.y + plotH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // linear price line
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(px(i), py(p.close)) : ctx.lineTo(px(i), py(p.close))));
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // last close marker + pill
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = stroke;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(box.x, lastY);
    ctx.lineTo(box.x + plotW, lastY);
    ctx.stroke();
    ctx.restore();

    const pillW = 84;
    ctx.fillStyle = stroke;
    roundRect(ctx, box.x + plotW + 8, lastY - pillH / 2, pillW, pillH, 8);
    ctx.fill();
    ctx.fillStyle = ink.canvas;
    ctx.font = font(700, 21, true);
    ctx.textAlign = "center";
    ctx.fillText(axisPrice(points[points.length - 1].close), box.x + plotW + 8 + pillW / 2, lastY);

    // date axis
    const spanDays = (points[points.length - 1].t - points[0].t) / 86_400_000;
    const seen = new Set<string>();
    ctx.fillStyle = ink.faint;
    ctx.font = font(500, 22);
    ctx.textBaseline = "top";
    for (let k = 0; k < 5; k++) {
        const i = Math.round((k / 4) * (points.length - 1));
        const label = xLabel(points[i].t, spanDays);
        if (seen.has(label)) continue;
        seen.add(label);
        ctx.textAlign = k === 0 ? "left" : k === 4 ? "right" : "center";
        ctx.fillText(label, px(i), box.y + plotH + 14);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

/** Renders the share card and resolves with a PNG blob. */
export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // Poppins must be resolved before any fillText, or the card renders in a
    // fallback face.
    if (document.fonts?.ready) {
        try {
            await document.fonts.load(`700 64px Poppins`);
            await document.fonts.ready;
        } catch {
            /* fall back to system sans */
        }
    }

    const positive = input.change >= 0;
    const periodPositive = input.periodPercent >= 0;
    const ink = PALETTES[input.theme ?? "dark"];

    // background
    ctx.fillStyle = ink.canvas;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.8, H * 0.12, 0, W * 0.8, H * 0.12, W * 0.75);
    glow.addColorStop(0, positive ? "rgba(52,211,153,0.10)" : "rgba(251,113,133,0.10)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const M = 64;

    // brand strip — logo on the left, exchange note on the right
    const logoImg = await loadImage(ink.logo);
    const brandH = 46;
    if (logoImg) {
        const scale = brandH / (logoImg.naturalHeight || brandH);
        ctx.drawImage(logoImg, M, M - 6, (logoImg.naturalWidth || brandH) * scale, brandH);
    } else {
        ctx.fillStyle = ink.text;
        ctx.font = font(700, 26);
        ctx.letterSpacing = "4px";
        ctx.fillText("FLUID FINANCE", M, M + 24);
        ctx.letterSpacing = "0px";
    }
    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 22);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("Ghana Stock Exchange", W - M, M + brandH / 2 - 6);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // identity
    const logoTop = M + 76;
    const logoSize = 120;
    await drawLogo(ctx, input.symbol, M, logoTop, logoSize, ink);

    const textX = M + logoSize + 32;

    // Reserve exactly what the price block occupies so long names use the rest.
    const priceLabel = `₵${input.price.toFixed(2)}`;
    const changeLabel = `${positive ? "▲" : "▼"} ${positive ? "+" : ""}${input.changePercent.toFixed(2)}%  (${
        positive ? "+" : ""
    }${input.change.toFixed(2)})`;
    ctx.font = font(700, 62);
    const priceW = ctx.measureText(priceLabel).width;
    ctx.font = font(600, 28);
    const priceBlockW = Math.max(priceW, ctx.measureText(changeLabel).width);

    ctx.fillStyle = ink.text;
    ctx.font = font(700, 46);
    ctx.fillText(truncate(ctx, input.company, W - textX - M - priceBlockW - 40), textX, logoTop + 48);

    // ticker chip
    ctx.font = font(600, 24, true);
    const chipW = ctx.measureText(input.symbol).width + 28;
    ctx.fillStyle = ink.chip;
    roundRect(ctx, textX, logoTop + 70, chipW, 38, 8);
    ctx.fill();
    ctx.fillStyle = ink.chipText;
    ctx.textBaseline = "middle";
    ctx.fillText(input.symbol, textX + 14, logoTop + 90);
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 24);
    ctx.fillText(`Equity · ${input.sector}`, textX + chipW + 18, logoTop + 98);

    // price block
    ctx.textAlign = "right";
    ctx.fillStyle = ink.text;
    ctx.font = font(700, 62);
    ctx.fillText(priceLabel, W - M, logoTop + 52);
    ctx.fillStyle = positive ? ink.up : ink.down;
    ctx.font = font(600, 28);
    ctx.fillText(changeLabel, W - M, logoTop + 98);
    ctx.textAlign = "left";

    // chart panel
    const panel = { x: M, y: logoTop + 168, w: W - M * 2, h: 520 };
    ctx.fillStyle = ink.surface;
    roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 28);
    ctx.fill();
    ctx.strokeStyle = ink.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = ink.muted;
    ctx.font = font(600, 22);
    ctx.letterSpacing = "2px";
    ctx.fillText("PRICE HISTORY", panel.x + 36, panel.y + 52);
    ctx.letterSpacing = "0px";

    ctx.textAlign = "right";
    ctx.fillStyle = periodPositive ? ink.up : ink.down;
    ctx.font = font(600, 24, true);
    ctx.fillText(
        `${periodPositive ? "+" : ""}${input.periodPercent.toFixed(2)}% over ${input.range}`,
        panel.x + panel.w - 36,
        panel.y + 52,
    );
    ctx.textAlign = "left";

    drawChart(
        ctx,
        input.points,
        { x: panel.x + 36, y: panel.y + 92, w: panel.w - 72, h: panel.h - 132 },
        periodPositive,
        ink,
    );

    // range strip
    const strip = panel.y + panel.h + 34;
    const ranges: RangeKey[] = ["1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"];
    const cell = (W - M * 2) / ranges.length;
    ctx.font = font(600, 24);
    ctx.textAlign = "center";
    ranges.forEach((key, i) => {
        const cx = M + cell * i + cell / 2;
        if (key === input.range) {
            ctx.fillStyle = ink.selected;
            roundRect(ctx, cx - cell / 2 + 8, strip - 26, cell - 16, 48, 12);
            ctx.fill();
            ctx.fillStyle = ink.text;
        } else {
            ctx.fillStyle = ink.faint;
        }
        ctx.textBaseline = "middle";
        ctx.fillText(key, cx, strip);
    });
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    // timestamp + backfill note, just above the footer strip
    const barH = 132;
    const barY = H - barH;
    const asOf = new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    });
    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 20);
    ctx.textAlign = "left";
    ctx.fillText(`As of ${asOf} GMT`, M, barY - 22);
    if (input.hasBackfill) {
        ctx.textAlign = "right";
        ctx.font = font(500, 18);
        ctx.fillText("Chart includes backfilled history", W - M, barY - 22);
        ctx.textAlign = "left";
    }

    // ---- Footer strip ----
    ctx.fillStyle = ink.footerBg;
    ctx.fillRect(0, barY, W, barH);

    // Tagline (left)
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = ink.footerText;
    ctx.font = font(800, 28);
    ctx.letterSpacing = "1px";
    ctx.fillText("DECISIONS THAT", M, barY + 54);

    const buildText = "BUILD WEALTH";
    ctx.font = font(800, 36);
    const buildW = ctx.measureText(buildText).width;
    const buildGrad = ctx.createLinearGradient(M, 0, M + buildW, 0);
    buildGrad.addColorStop(0, "#22d3ee");
    buildGrad.addColorStop(1, "#6366f1");
    ctx.fillStyle = buildGrad;
    ctx.fillText(buildText, M, barY + 98);
    ctx.letterSpacing = "0px";

    // Socials (right, stacked)
    const rowGap = 38;
    const socialsTop = barY + 34;
    ctx.font = font(500, 21);
    for (let i = 0; i < SOCIALS.length; i++) {
        const s = SOCIALS[i];
        const cy = socialsTop + i * rowGap;
        const handleW = ctx.measureText(s.handle).width;
        const iconSize = 24;
        const handleLeft = W - M - handleW;
        ctx.fillStyle = ink.footerText;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(s.handle, handleLeft, cy);
        drawGlyph(ctx, s.icon, handleLeft - iconSize - 12, cy - iconSize / 2, iconSize, ink.footerText);
    }
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode share image"))),
            "image/png",
        );
    });
}
