/**
 * Fluid Finance - market movers share card
 *
 * A 4:5 image of the day's Top Gainers, Top Losers or Most Active stocks —
 * same visual language as the Week in Review card (brand logo, clean table,
 * footer strip with tagline + social handles).
 */

import { logoUrl } from "@/lib/logos";
import type { Stock } from "@/lib/gse";

export type MoverCategory = "gainers" | "losers" | "active";

export interface MoversCardInput {
    category: MoverCategory;
    stocks: Stock[]; // pre-sorted top 5
    date: string; // e.g. "11 Aug 2026"
    theme?: "light" | "dark";
}

/**
 * Returns the timestamp string to display on the share card.
 *
 * - During market hours (Mon–Fri 10:00–15:00 GMT): live time → "As of 11 Aug 2026, 14:30 GMT"
 * - Outside market hours: last official close → "As of 11 Aug 2026, 15:00 GMT"
 */
function getShareTimestamp(now = new Date()): string {
    const day = now.getUTCDay();
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const isWeekday = day !== 0 && day !== 6;
    const isDuringHours = isWeekday && minutes >= 10 * 60 && minutes < 15 * 60;

    const fmtDate = (d: Date) =>
        d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    const fmtTime = (d: Date) =>
        d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

    if (isDuringHours) {
        return `As of ${fmtDate(now)}, ${fmtTime(now)} GMT`;
    }

    // Market closed — find last trading day at 15:00
    const close = new Date(now);
    close.setUTCHours(15, 0, 0, 0);
    if (isWeekday && minutes >= 15 * 60) {
        // Mon–Fri after 15:00 → today's close
    } else {
        let daysBack = isWeekday ? 1 : day === 0 ? 2 : 1;
        close.setUTCDate(close.getUTCDate() - daysBack);
    }

    return `As of ${fmtDate(close)}, 15:00 GMT`;
}

const W = 1080;
const H = 1350;

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

const PALETTES = {
    dark: {
        canvas: "#08090b",
        text: "#ffffff",
        muted: "rgba(255,255,255,0.46)",
        faint: "rgba(255,255,255,0.28)",
        border: "rgba(255,255,255,0.09)",
        row: "rgba(255,255,255,0.035)",
        up: "#34d399",
        down: "#fb7185",
        cyan: "#22d3ee",
        chip: "rgba(255,255,255,0.09)",
        chipText: "rgba(255,255,255,0.75)",
        logo: "/logo/lockup-01.png",
        footerBg: "#111318",
        footerText: "#ffffff",
        glow: 0.08,
    },
    light: {
        canvas: "#ffffff",
        text: "#090a0e",
        muted: "rgba(9,10,14,0.56)",
        faint: "rgba(9,10,14,0.4)",
        border: "rgba(9,10,14,0.12)",
        row: "rgba(9,10,14,0.035)",
        up: "#059669",
        down: "#e11d48",
        cyan: "#0e7490",
        chip: "rgba(9,10,14,0.08)",
        chipText: "rgba(9,10,14,0.72)",
        logo: "/logo/lockup-04.png",
        footerBg: "#e7e9ee",
        footerText: "#0b0d10",
        glow: 0.024,
    },
} as const;

function font(weight: number, size: number, mono = false): string {
    const family = mono
        ? "'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace"
        : "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif";
    return `${weight} ${size}px ${family}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

function compactVolume(v: number): string {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return `${v}`;
}

function drawGlyph(ctx: CanvasRenderingContext2D, path: string, x: number, y: number, size: number, color: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(path));
    ctx.restore();
}

async function drawTickerLogo(
    ctx: CanvasRenderingContext2D,
    symbol: string,
    x: number,
    y: number,
    size: number,
): Promise<void> {
    const src = logoUrl(symbol);
    const img = src ? await loadImage(src) : null;

    if (!img) {
        const hue = tickerHue(symbol);
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, `hsl(${hue} 62% 42%)`);
        gradient.addColorStop(1, `hsl(${(hue + 40) % 360} 58% 26%)`);
        ctx.fillStyle = gradient;
        roundRect(ctx, x, y, size, size, 12);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
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
    roundRect(ctx, x, y, size, size, 12);
    ctx.fill();
    ctx.clip();
    const pad = size * 0.12;
    const box = size - pad * 2;
    const nw = img.naturalWidth || size;
    const nh = img.naturalHeight || size;
    const scale = Math.min(box / nw, box / nh);
    ctx.drawImage(img, x + (size - nw * scale) / 2, y + (size - nh * scale) / 2, nw * scale, nh * scale);
    ctx.restore();
}

const TITLES: Record<MoverCategory, string> = {
    gainers: "TOP GAINERS",
    losers: "TOP LOSERS",
    active: "MOST ACTIVE",
};

export async function renderMoversCard(input: MoversCardInput): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    if (document.fonts?.ready) {
        try {
            await document.fonts.load(`700 64px Poppins`);
            await document.fonts.ready;
        } catch {
            /* fall back to system sans */
        }
    }

    const ink = PALETTES[input.theme ?? "dark"];
    const isActive = input.category === "active";
    const accent = input.category === "gainers" ? ink.up : input.category === "losers" ? ink.down : ink.cyan;
    const M = 64;

    // Background
    ctx.fillStyle = ink.canvas;
    ctx.fillRect(0, 0, W, H);

    // Accent glow (softened in light mode)
    const glowRGB =
        input.category === "gainers" ? "52,211,153" : input.category === "losers" ? "251,113,133" : "34,211,238";
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.14, 0, W * 0.5, H * 0.14, W * 0.8);
    glow.addColorStop(0, `rgba(${glowRGB},${ink.glow})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Brand logo
    const logoImg = await loadImage(ink.logo);
    const logoH = 46;
    if (logoImg) {
        const scale = logoH / (logoImg.naturalHeight || logoH);
        ctx.drawImage(logoImg, M, M - 4, (logoImg.naturalWidth || logoH) * scale, logoH);
    } else {
        ctx.fillStyle = ink.text;
        ctx.font = font(700, 26);
        ctx.fillText("FLUID FINANCE", M, M + 24);
    }
    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 22);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("Ghana Stock Exchange", W - M, M + logoH / 2 - 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Header
    const headerY = M + 116;
    ctx.fillStyle = accent;
    ctx.font = font(700, 32);
    ctx.letterSpacing = "6px";
    ctx.fillText("MARKET MOVERS", M, headerY);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = ink.text;
    ctx.font = font(700, 58);
    ctx.fillText(TITLES[input.category], M, headerY + 62);

    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 26);
    ctx.fillText(`${input.date}  ·  Ghana Stock Exchange`, M, headerY + 108);

    const priceRightX = W - 330;
    const changeRightX = W - M;

    const dividerY = headerY + 150;
    ctx.strokeStyle = ink.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, dividerY);
    ctx.lineTo(W - M, dividerY);
    ctx.stroke();

    // Column headers
    const headTextY = dividerY + 44;
    ctx.fillStyle = ink.faint;
    ctx.font = font(600, 19);
    ctx.textAlign = "left";
    ctx.fillText("COMPANY", M + 72, headTextY);
    ctx.textAlign = "right";
    ctx.fillText("PRICE", priceRightX, headTextY);
    ctx.fillText(isActive ? "VOLUME" : "DAY CHANGE", changeRightX, headTextY);
    ctx.textAlign = "left";

    // Rows
    const rowH = 104;
    const rowsTop = headTextY + 28;
    const nameMaxWidth = priceRightX - (M + 128) - 130;

    for (let i = 0; i < input.stocks.length; i++) {
        const stock = input.stocks[i];
        const top = rowsTop + i * rowH;
        const mid = top + rowH / 2;

        if (i % 2 === 0) {
            ctx.fillStyle = ink.row;
            roundRect(ctx, M, top + 6, W - M * 2, rowH - 12, 14);
            ctx.fill();
        }

        // Rank
        ctx.fillStyle = ink.faint;
        ctx.font = font(700, 26, true);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`${i + 1}`, M + 18, mid);
        ctx.textBaseline = "alphabetic";

        // Ticker logo
        const logoSize = 56;
        await drawTickerLogo(ctx, stock.symbol, M + 52, mid - logoSize / 2, logoSize);

        // Company + symbol chip
        const textX = M + 128;
        ctx.fillStyle = ink.text;
        ctx.font = font(700, 26);
        ctx.fillText(truncate(ctx, stock.company, nameMaxWidth), textX, mid - 6);

        ctx.font = font(600, 17, true);
        const chipW = ctx.measureText(stock.symbol).width + 20;
        ctx.fillStyle = ink.chip;
        roundRect(ctx, textX, mid + 8, chipW, 28, 6);
        ctx.fill();
        ctx.fillStyle = ink.chipText;
        ctx.textBaseline = "middle";
        ctx.fillText(stock.symbol, textX + 10, mid + 23);
        ctx.textBaseline = "alphabetic";

        // Price
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = ink.text;
        ctx.font = font(600, 27, true);
        ctx.fillText(`₵${stock.price.toFixed(2)}`, priceRightX, mid);

        // Metric: volume (active) or day-change % (gainers/losers)
        if (isActive) {
            ctx.fillStyle = ink.text;
            ctx.font = font(700, 28, true);
            ctx.fillText(compactVolume(stock.volume), changeRightX, mid);
        } else {
            const positive = stock.changePercent >= 0;
            ctx.fillStyle = positive ? ink.up : ink.down;
            ctx.font = font(700, 30);
            ctx.fillText(`${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%`, changeRightX, mid);
        }
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
    }

    // Timestamp above footer
    const barH = 152;
    const barY = H - barH;
    ctx.fillStyle = ink.faint;
    ctx.font = font(500, 20);
    ctx.textAlign = "center";
    ctx.fillText(getShareTimestamp(), W / 2, barY - 28);
    ctx.textAlign = "left";

    // ---- Footer strip ----
    ctx.fillStyle = ink.footerBg;
    ctx.fillRect(0, barY, W, barH);

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = ink.footerText;
    ctx.font = font(800, 30);
    ctx.letterSpacing = "1px";
    ctx.fillText("DECISIONS THAT", M, barY + 62);

    const buildText = "BUILD WEALTH";
    ctx.font = font(800, 38);
    const buildW = ctx.measureText(buildText).width;
    const buildGrad = ctx.createLinearGradient(M, 0, M + buildW, 0);
    buildGrad.addColorStop(0, "#22d3ee");
    buildGrad.addColorStop(1, "#6366f1");
    ctx.fillStyle = buildGrad;
    ctx.fillText(buildText, M, barY + 108);
    ctx.letterSpacing = "0px";

    const rowGap = 42;
    const socialsTop = barY + 40;
    ctx.font = font(500, 22);
    for (let i = 0; i < SOCIALS.length; i++) {
        const s = SOCIALS[i];
        const cy = socialsTop + i * rowGap;
        const handleW = ctx.measureText(s.handle).width;
        const iconSize = 26;
        const handleLeft = changeRightX - handleW;
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
