import { drawReportFooter } from "@/lib/weekly-trends-share-card";

export type SocialAssetKind =
    | "breaking-news"
    | "news"
    | "company-profile"
    | "just-in"
    | "company-portfolio"
    | "fx"
    | "commodities"
    | "crypto"
    | "indices"
    | "bonds"
    | "other";

export type JustInTemplate = "breaking" | "price-alert" | "company-update" | "market-note" | "economic-release";

export interface SocialAssetInput {
    kind: SocialAssetKind;
    template: JustInTemplate;
    title: string;
    symbol: string;
    value: string;
    change: string;
    date: string;
    details: string;
    source?: string;
    picture?: string;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const ACCENTS: Record<SocialAssetKind, string> = {
    "breaking-news":"#fb7185",
    news:"#27dccc",
    "company-profile":"#416bff",
    "just-in": "#fb7185",
    "company-portfolio": "#34d399",
    fx: "#c4b5fd",
    commodities: "#fcd34d",
    crypto: "#fbbf24",
    indices: "#2dd4bf",
    bonds: "#93c5fd",
    other: "#a5f3fc",
};
const TEMPLATE_ACCENTS: Record<JustInTemplate, string> = {
    breaking: "#fb7185",
    "price-alert": "#67e8f9",
    "company-update": "#34d399",
    "market-note": "#c4b5fd",
    "economic-release": "#fcd34d",
};
const TEMPLATE_LABELS: Record<JustInTemplate, string> = {
    breaking: "BREAKING",
    "price-alert": "PRICE ALERT",
    "company-update": "COMPANY UPDATE",
    "market-note": "MARKET NOTE",
    "economic-release": "ECONOMIC RELEASE",
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
    });
}

function drawTemplateTreatment(ctx: CanvasRenderingContext2D, template: JustInTemplate, accent: string): void {
    const x = 84;
    const y = 222;

    if (template === "breaking") {
        ctx.fillStyle = accent;
        roundedRect(ctx, x, y, 236, 44, 8);
        ctx.fill();
        ctx.fillStyle = "#080d13";
        ctx.font = "700 16px Poppins, system-ui, sans-serif";
        ctx.fillText("BREAKING NEWS", x + 18, y + 28);
        return;
    }

    if (template === "price-alert") {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y + 21);
        ctx.lineTo(x + 20, y + 21);
        ctx.lineTo(x + 30, y + 6);
        ctx.lineTo(x + 42, y + 37);
        ctx.lineTo(x + 54, y + 15);
        ctx.lineTo(x + 66, y + 21);
        ctx.lineTo(x + 185, y + 21);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.font = "700 14px Poppins, system-ui, sans-serif";
        ctx.fillText("PRICE MOVEMENT", x + 207, y + 27);
        return;
    }

    ctx.fillStyle = accent;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    if (template === "company-update") {
        roundedRect(ctx, x, y, 215, 40, 20);
        ctx.stroke();
        ctx.font = "700 13px Poppins, system-ui, sans-serif";
        ctx.fillText("COMPANY BRIEF", x + 20, y + 26);
        return;
    }
    if (template === "market-note") {
        ctx.fillRect(x, y + 3, 5, 38);
        ctx.font = "600 14px Poppins, system-ui, sans-serif";
        ctx.fillText("FROM THE MARKET DESK", x + 19, y + 27);
        return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 270, y);
    ctx.moveTo(x, y + 42);
    ctx.lineTo(x + 270, y + 42);
    ctx.stroke();
    ctx.font = "700 13px Poppins, system-ui, sans-serif";
    ctx.fillText("DATA RELEASE", x + 12, y + 27);
    ctx.beginPath();
    ctx.arc(x + 253, y + 21, 5, 0, Math.PI * 2);
    ctx.fill();
}

function roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function wrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number,
): number {
    const lines = wrappedLines(ctx, text, maxWidth).slice(0, maxLines);
    if (lines.length && wrappedLines(ctx, text, maxWidth).length > maxLines) {
        let last = lines[lines.length - 1];
        while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
            last = last.slice(0, -1);
        }
        lines[lines.length - 1] = `${last}…`;
    }
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return lines.length * lineHeight;
}

function drawDetails(ctx: CanvasRenderingContext2D, details: string, x: number, y: number, accent: string): void {
    const lines = details.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 6);
    if (!lines.length) return;

    ctx.fillStyle = "#ffffff";
    ctx.font = "500 24px Poppins, system-ui, sans-serif";
    lines.forEach((line, index) => {
        const top = y + index * 67;
        ctx.fillStyle = accent;
        roundedRect(ctx, x, top + 7, 8, 8, 4);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        drawWrappedText(ctx, line, x + 24, top + 22, 840, 31, 1);
        ctx.strokeStyle = "rgba(255,255,255,0.09)";
        ctx.beginPath();
        ctx.moveTo(x, top + 50);
        ctx.lineTo(CANVAS_WIDTH - 64, top + 50);
        ctx.stroke();
    });
}

export async function renderSocialAsset(input: SocialAssetInput): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not prepare the image.");

    await document.fonts.ready;
    const justIn = input.kind === "just-in" || input.kind === "breaking-news";
    const accent = justIn ? TEMPLATE_ACCENTS[input.template] : ACCENTS[input.kind];
    const category = justIn
        ? TEMPLATE_LABELS[input.template]
        : input.kind.replaceAll("-", " ").toUpperCase();
    const margin = 64;

    ctx.fillStyle = "#08090b";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const logo = await loadImage("/logo/lockup-01.png");
    if (logo) {
        const logoHeight = 46;
        const scale = logoHeight / (logo.naturalHeight || logoHeight);
        ctx.drawImage(logo, margin, margin - 4, (logo.naturalWidth || logoHeight) * scale, logoHeight);
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 26px Poppins, system-ui, sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("FLUID FINANCE", margin, margin + 24);
        ctx.letterSpacing = "0px";
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.56)";
    ctx.font = "500 22px Poppins, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(input.kind === "company-portfolio" ? "Company portfolio" : "Fluid Finance", CANVAS_WIDTH - margin, margin + 19);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const headerY = margin + 116;
    ctx.fillStyle = accent;
    ctx.font = "700 32px Poppins, system-ui, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText(category, margin, headerY);
    ctx.letterSpacing = "0px";
    if (justIn) drawTemplateTreatment(ctx, input.template, accent);

    const title = input.title.trim() || "Market update";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 58px Poppins, system-ui, sans-serif";
    const titleTop = headerY + (justIn ? 130 : 62);
    const titleHeight = drawWrappedText(ctx, title, margin, titleTop, CANVAS_WIDTH - margin * 2, 68, 3);

    const instrument = input.symbol.trim().toUpperCase();
    const showQuote = input.value.trim() || input.change.trim();
    let sectionY = titleTop + titleHeight + 28;

    if (instrument || showQuote) {
        const quoteHeight = showQuote ? 204 : 105;
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        roundedRect(ctx, margin, sectionY, CANVAS_WIDTH - margin * 2, quoteHeight, 14);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.09)";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (instrument) {
            ctx.fillStyle = "rgba(255,255,255,0.62)";
            ctx.font = "600 19px Poppins, system-ui, sans-serif";
            ctx.fillText(instrument, margin + 24, sectionY + 37);
        }
        if (input.value.trim()) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "700 48px Poppins, system-ui, sans-serif";
            ctx.fillText(input.value.trim().slice(0, 25), margin + 24, sectionY + (instrument ? 103 : 68));
        }
        if (input.change.trim()) {
            ctx.fillStyle = input.change.trim().startsWith("-") ? "#fb7185" : "#34d399";
            ctx.font = "700 25px Poppins, system-ui, sans-serif";
            ctx.fillText(input.change.trim().slice(0, 30), margin + 24, sectionY + quoteHeight - 28);
        }
        sectionY += quoteHeight + 34;
    }

    if (input.picture) {
        const photo = await loadImage(input.picture);
        if (!photo) throw new Error("The selected picture could not be loaded.");
        const height = Math.min(300, Math.max(150, 1030 - sectionY));
        const scale = Math.max((CANVAS_WIDTH - margin * 2) / photo.naturalWidth, height / photo.naturalHeight);
        ctx.save(); ctx.beginPath(); ctx.rect(margin, sectionY, CANVAS_WIDTH - margin * 2, height); ctx.clip();
        ctx.drawImage(photo, margin + (CANVAS_WIDTH-margin*2-photo.naturalWidth*scale)/2, sectionY+(height-photo.naturalHeight*scale)/2, photo.naturalWidth*scale, photo.naturalHeight*scale); ctx.restore();
        sectionY += height + 34;
    }
    if (input.details.trim()) {
        ctx.fillStyle = "rgba(255,255,255,0.46)";
        ctx.font = "600 18px Poppins, system-ui, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText(input.kind === "company-portfolio" ? "PORTFOLIO" : "THE DETAILS", margin, sectionY);
        ctx.letterSpacing = "0px";
        if (input.kind === "news" || justIn || input.kind === "company-profile") {
            ctx.fillStyle="rgba(255,255,255,0.88)";ctx.font="500 28px Poppins, system-ui, sans-serif";
            drawWrappedText(ctx,input.details,margin,sectionY+44,CANVAS_WIDTH-margin*2,40,Math.max(1,Math.floor((CANVAS_HEIGHT-245-sectionY)/40)));
        } else {
            const availableLines = Math.max(0, Math.floor((CANVAS_HEIGHT - 225 - sectionY) / 67));
            drawDetails(ctx, input.details.split("\n").slice(0, availableLines).join("\n"), margin, sectionY + 27, accent);
        }
    }

    ctx.fillStyle = "rgba(255,255,255,0.46)";
    ctx.font = "500 20px Poppins, system-ui, sans-serif";
    ctx.textAlign = "center";
    if (input.source?.trim()) {
        ctx.font = "500 18px Poppins, system-ui, sans-serif";
        drawWrappedText(ctx, `Source: ${input.source.trim()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 210, 900, 24, 1);
    }
    ctx.fillText(`As of ${input.date || new Date().toLocaleDateString("en-GB")}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 180);
    ctx.textAlign = "left";
    drawReportFooter(ctx, "dark", CANVAS_HEIGHT);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("The image could not be exported. Try again."));
        }, "image/png");
    });
}
