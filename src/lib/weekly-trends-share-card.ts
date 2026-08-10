/**
 * Fluid Finance - weekly trends share card
 *
 * Renders a 4:5 aspect ratio image showing top gainers or losers for the week.
 */

import { logoUrl } from "@/lib/logos";
import type { Stock } from "@/lib/gse";

export interface WeeklyTrendCardInput {
    type: "gainers" | "losers";
    stocks: Stock[];
    weeklyChanges: { stock: Stock; weeklyChange: number; weeklyChangePercent: number }[];
    startDate: string;
    endDate: string;
    theme?: "light" | "dark";
}

const W = 1080;
const H = 1350;

const PALETTES = {
    dark: {
        canvas: "#08090b",
        surface: "#101114",
        border: "rgba(255,255,255,0.09)",
        text: "#ffffff",
        muted: "rgba(255,255,255,0.42)",
        faint: "rgba(255,255,255,0.24)",
        up: "#34d399",
        down: "#fb7185",
        chip: "rgba(255,255,255,0.09)",
        chipText: "rgba(255,255,255,0.75)",
        rowHover: "rgba(255,255,255,0.03)",
    },
    light: {
        canvas: "#ffffff",
        surface: "#f5f6f8",
        border: "rgba(9,10,14,0.12)",
        text: "#090a0e",
        muted: "rgba(9,10,14,0.58)",
        faint: "rgba(9,10,14,0.42)",
        up: "#059669",
        down: "#e11d48",
        chip: "rgba(9,10,14,0.08)",
        chipText: "rgba(9,10,14,0.72)",
        rowHover: "rgba(9,10,14,0.03)",
    },
} as const;

type Palette = (typeof PALETTES)["dark" | "light"];

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

async function drawLogo(
    ctx: CanvasRenderingContext2D,
    symbol: string,
    x: number,
    y: number,
    size: number,
    ink: Palette,
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
    roundRect(ctx, x, y, size, size, 12);
    ctx.fill();
    ctx.clip();

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

export async function renderWeeklyTrendCard(input: WeeklyTrendCardInput): Promise<Blob> {
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
    const isGainers = input.type === "gainers";
    const accentColor = isGainers ? ink.up : ink.down;

    // Background
    ctx.fillStyle = ink.canvas;
    ctx.fillRect(0, 0, W, H);

    // Subtle gradient glow
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.15, 0, W * 0.5, H * 0.15, W * 0.8);
    glow.addColorStop(0, isGainers ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const M = 64;

    // Brand strip
    ctx.fillStyle = ink.text;
    ctx.font = font(700, 26);
    ctx.letterSpacing = "4px";
    ctx.fillText("FLUID FINANCE", M, M + 22);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 22);
    ctx.textAlign = "right";
    ctx.fillText("Ghana Stock Exchange", W - M, M + 22);
    ctx.textAlign = "left";

    // Header section
    const headerY = M + 80;

    // "WEEK IN REVIEW" label
    ctx.fillStyle = accentColor;
    ctx.font = font(700, 32);
    ctx.letterSpacing = "6px";
    ctx.fillText("WEEK IN REVIEW", M, headerY);
    ctx.letterSpacing = "0px";

    // "TOP GAINERS" or "TOP LOSERS"
    ctx.fillStyle = ink.text;
    ctx.font = font(700, 56);
    ctx.fillText(isGainers ? "TOP GAINERS" : "TOP LOSERS", M, headerY + 60);

    // Date range
    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 26);
    ctx.fillText(`${input.startDate} to ${input.endDate}`, M, headerY + 105);

    // Divider line
    const dividerY = headerY + 140;
    ctx.strokeStyle = ink.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, dividerY);
    ctx.lineTo(W - M, dividerY);
    ctx.stroke();

    // Column headers
    const tableStartY = dividerY + 50;
    ctx.fillStyle = ink.faint;
    ctx.font = font(600, 20);
    ctx.textAlign = "left";
    ctx.fillText("SYMBOL", M + 80, tableStartY);
    ctx.textAlign = "right";
    ctx.fillText("PRICE (GHS)", W - 220, tableStartY);
    ctx.fillText("WEEKLY CHANGE", W - M, tableStartY);

    // Stock rows
    const rowHeight = 110;
    const startY = tableStartY + 40;

    for (let i = 0; i < input.weeklyChanges.length; i++) {
        const item = input.weeklyChanges[i];
        const y = startY + i * rowHeight;

        // Alternating row background
        if (i % 2 === 0) {
            ctx.fillStyle = ink.rowHover;
            roundRect(ctx, M, y - 15, W - M * 2, rowHeight - 10, 12);
            ctx.fill();
        }

        // Rank number
        ctx.fillStyle = ink.faint;
        ctx.font = font(700, 28, true);
        ctx.textAlign = "left";
        ctx.fillText(`${i + 1}.`, M + 16, y + 40);

        // Logo
        await drawLogo(ctx, item.stock.symbol, M + 60, y - 5, 56, ink);

        // Company name and symbol
        const textX = M + 130;
        ctx.fillStyle = ink.text;
        ctx.font = font(700, 26);
        const maxNameWidth = W - textX - 350;
        ctx.fillText(truncate(ctx, item.stock.company, maxNameWidth), textX, y + 20);

        // Symbol chip
        ctx.font = font(600, 18, true);
        const chipW = ctx.measureText(item.stock.symbol).width + 20;
        ctx.fillStyle = ink.chip;
        roundRect(ctx, textX, y + 35, chipW, 30, 6);
        ctx.fill();
        ctx.fillStyle = ink.chipText;
        ctx.textBaseline = "middle";
        ctx.fillText(item.stock.symbol, textX + 10, y + 50);
        ctx.textBaseline = "alphabetic";

        // Price
        ctx.textAlign = "right";
        ctx.fillStyle = ink.text;
        ctx.font = font(600, 26, true);
        ctx.fillText(`₵${item.stock.price.toFixed(2)}`, W - 220, y + 35);

        // Weekly change percentage
        const changePositive = item.weeklyChangePercent >= 0;
        ctx.fillStyle = changePositive ? ink.up : ink.down;
        ctx.font = font(700, 28);
        const changeText = `${changePositive ? "+" : ""}${item.weeklyChangePercent.toFixed(2)}%`;
        ctx.fillText(changeText, W - M, y + 35);

        ctx.textAlign = "left";
    }

    // Footer
    const footerY = H - M;
    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 20);
    const asOf = new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    });
    ctx.fillText(`As of ${asOf} GMT`, M, footerY);

    ctx.textAlign = "right";
    ctx.fillStyle = ink.faint;
    ctx.font = font(500, 18);
    ctx.fillText("fluidfinance.app", W - M, footerY);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode share image"))),
            "image/png",
        );
    });
}
