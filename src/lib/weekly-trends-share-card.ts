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
        footerBg: "#15171a",
        footerText: "rgba(255,255,255,0.42)",
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
        footerBg: "#f0f1f3",
        footerText: "rgba(9,10,14,0.50)",
    },
} as const;

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

async function drawStockLogo(
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
        roundRect(ctx, x, y, size, size, 10);
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
    roundRect(ctx, x, y, size, size, 10);
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

async function drawBrandLogo(
    ctx: CanvasRenderingContext2D,
    theme: "light" | "dark",
    x: number,
    y: number,
    height: number,
): Promise<void> {
    const src = theme === "dark" ? "/logo/fluidfinance-01.png" : "/logo/fluidfinance-04.png";
    const img = await loadImage(src);

    if (!img) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = font(700, 24);
        ctx.fillText("FLUID FINANCE", x, y + height * 0.7);
        return;
    }

    const naturalW = img.naturalWidth || 200;
    const naturalH = img.naturalHeight || 40;
    const scale = height / naturalH;
    const dw = naturalW * scale;
    ctx.drawImage(img, x, y, dw, height);
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

    // Subtle gradient glow (reduce light mode red gradient by 70%)
    const glowOpacity = input.theme === "light" ? 0.024 : 0.08;
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.12, 0, W * 0.5, H * 0.12, W * 0.8);
    glow.addColorStop(0, isGainers
        ? `rgba(52,211,153,${glowOpacity})`
        : `rgba(251,113,133,${glowOpacity})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const M = 64;

    // Brand logo (top left)
    await drawBrandLogo(ctx, input.theme ?? "dark", M, M - 10, 40);

    // GSE label (top right)
    ctx.fillStyle = ink.muted;
    ctx.font = font(500, 20);
    ctx.textAlign = "right";
    ctx.fillText("Ghana Stock Exchange", W - M, M + 20);
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
    const tableStartY = dividerY + 45;
    ctx.fillStyle = ink.faint;
    ctx.font = font(600, 18);
    ctx.textAlign = "left";
    ctx.fillText("#", M + 8, tableStartY);
    ctx.fillText("COMPANY", M + 50, tableStartY);
    ctx.textAlign = "right";
    ctx.fillText("PRICE", W - 200, tableStartY);
    ctx.fillText("WEEKLY", W - 80, tableStartY);
    ctx.textAlign = "left";

    // Stock rows
    const rowHeight = 105;
    const startY = tableStartY + 35;

    for (let i = 0; i < input.weeklyChanges.length; i++) {
        const item = input.weeklyChanges[i];
        const y = startY + i * rowHeight;

        // Alternating row background
        if (i % 2 === 0) {
            ctx.fillStyle = ink.rowHover;
            roundRect(ctx, M, y - 10, W - M * 2, rowHeight - 5, 10);
            ctx.fill();
        }

        // Rank number
        ctx.fillStyle = ink.faint;
        ctx.font = font(700, 24, true);
        ctx.textAlign = "left";
        ctx.fillText(`${i + 1}`, M + 12, y + 40);

        // Logo
        await drawStockLogo(ctx, item.stock.symbol, M + 45, y, 50);

        // Company name
        const textX = M + 110;
        ctx.fillStyle = ink.text;
        ctx.font = font(700, 24);
        const maxNameWidth = W - textX - 320;
        ctx.fillText(truncate(ctx, item.stock.company, maxNameWidth), textX, y + 18);

        // Symbol chip
        ctx.font = font(600, 16, true);
        const chipW = ctx.measureText(item.stock.symbol).width + 16;
        ctx.fillStyle = ink.chip;
        roundRect(ctx, textX, y + 30, chipW, 26, 6);
        ctx.fill();
        ctx.fillStyle = ink.chipText;
        ctx.textBaseline = "middle";
        ctx.fillText(item.stock.symbol, textX + 8, y + 43);
        ctx.textBaseline = "alphabetic";

        // Price
        ctx.textAlign = "right";
        ctx.fillStyle = ink.muted;
        ctx.font = font(500, 18);
        ctx.fillText("₵" + item.stock.price.toFixed(2), W - 160, y + 30);

        // Weekly change percentage
        const changePositive = item.weeklyChangePercent >= 0;
        ctx.fillStyle = changePositive ? ink.up : ink.down;
        ctx.font = font(700, 22);
        const changeText = `${changePositive ? "+" : ""}${item.weeklyChangePercent.toFixed(2)}%`;
        ctx.fillText(changeText, W - M, y + 30);

        ctx.textAlign = "left";
    }

    // Footer bar
    const footerH = 80;
    const footerY = H - footerH;
    ctx.fillStyle = ink.footerBg;
    ctx.fillRect(0, footerY, W, footerH);

    // Footer border
    ctx.strokeStyle = ink.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, footerY);
    ctx.lineTo(W, footerY);
    ctx.stroke();

    // Footer text
    ctx.fillStyle = ink.footerText;
    ctx.font = font(500, 18);
    ctx.textAlign = "left";
    const asOf = new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
    ctx.fillText(`As of ${asOf} GMT`, M + 20, footerY + footerH / 2 + 6);

    ctx.textAlign = "right";
    ctx.fillText("fluidfinance.app", W - M - 20, footerY + footerH / 2 + 6);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode share image"))),
            "image/png",
        );
    });
}
