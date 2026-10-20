import { drawReportFooter } from "@/lib/weekly-trends-share-card";
import { averageFuelPrice, formatFuelChange, formatFuelDate, formatFuelPrice, fuelReportPages, fuelRowChange, type FuelReport, type FuelPriceRow } from "@/lib/fuel-prices";

function loadLogo(url: string, name: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const timeout = window.setTimeout(() => { img.onload = null; img.onerror = null; reject(new Error(`The logo for ${name} could not load. Replace it in the editor before sharing.`)); }, 15000);
        img.onload = () => { clearTimeout(timeout); resolve(img); };
        img.onerror = () => { clearTimeout(timeout); reject(new Error(`The logo for ${name} could not load. Replace it in the editor before sharing.`)); };
        img.src = url;
    });
}

/** Load every logo before generating any pages. No partial report can be shared. */
export async function renderFuelCards(report: FuelReport, previous: FuelReport | null = null): Promise<Blob[]> {
    const pages = fuelReportPages(report.prices);
    await document.fonts.ready;
    const logos = new Map<string, HTMLImageElement>();
    const brand = await loadLogo("/logo/lockup-01.png", "Fluid Finance");
    for (let i = 0; i < report.prices.length; i += 10) {
        await Promise.all(report.prices.slice(i, i + 10).map(async row => {
            logos.set(row.logo_url!, await loadLogo(row.logo_url!, row.name));
        }));
    }
    const blobs: Blob[] = [];
    for (const rows of pages) blobs.push(await renderPage(report, previous, rows, logos, brand));
    return blobs;
}

/** First table row; ten 67px rows end at 1082, leaving the comparison line clear of the 1198 footer. */
const TABLE_TOP = 412;

async function renderPage(report: FuelReport, previous: FuelReport | null, rows: FuelPriceRow[], logos: Map<string, HTMLImageElement>, logo: HTMLImageElement): Promise<Blob> {
    const width = 1080;
    const height = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser cannot generate this image.");
    ctx.fillStyle = "#070a0f";
    ctx.fillRect(0, 0, width, height);
    // Brand lockup top left; averages stacked, right-aligned, in the top right.
    const logoW = 180;
    ctx.drawImage(logo, 64, 40, logoW, logoW * logo.naturalHeight / logo.naturalWidth);
    ctx.textAlign = "right";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 17px Poppins, sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.fillText("AVERAGE · GHS / LITRE", 1016, 70);
    ctx.letterSpacing = "0px";
    // Values right-aligned at the margin, labels in a column to their left.
    const averages = [["Petrol", averageFuelPrice(report.prices, "petrol"), "#67e8f9"], ["Diesel", averageFuelPrice(report.prices, "diesel"), "#34d399"]] as const;
    ctx.font = "700 26px Poppins, sans-serif";
    const valueWidth = Math.max(...averages.map(([, price]) => ctx.measureText(formatFuelPrice(price)).width));
    averages.forEach(([label, price, color], i) => {
        const y = 106 + i * 34;
        ctx.font = "700 26px Poppins, sans-serif";
        ctx.fillStyle = price === null ? "#64748b" : color;
        ctx.fillText(formatFuelPrice(price), 1016, y);
        ctx.font = "500 22px Poppins, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(label, 1016 - valueWidth - 16, y);
    });
    ctx.textAlign = "left";
    // Two-line title: FLUID PUMP over a gradient REPORT, with the date right-aligned on the REPORT line.
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 88px Poppins, sans-serif";
    ctx.fillText("FLUID PUMP", 64, 234);
    const gradient = ctx.createLinearGradient(64, 0, 64 + ctx.measureText("REPORT").width, 0);
    gradient.addColorStop(0, "#22d3ee");
    gradient.addColorStop(1, "#80d44b");
    ctx.fillStyle = gradient;
    ctx.fillText("REPORT", 64, 312);
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 29px Poppins, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(formatFuelDate(report.report_date), 1016, 312);
    ctx.textAlign = "left";
    // Name, petrol, diesel, then each fuel's % change against the previous edition in its own column.
    const columns = [64, 546, 716, 866, 1016];
    const headerColors = ["#ffffff", "#67e8f9", "#34d399", "#67e8f9", "#34d399"];
    ctx.font = "600 21px Poppins, sans-serif";
    ["Name", "Petrol (GHS)", "Diesel (GHS)", "Petrol %", "Diesel %"].forEach((label, i) => {
        ctx.fillStyle = headerColors[i];
        ctx.textAlign = i === 0 ? "left" : "right";
        ctx.fillText(label, columns[i], 388);
    });
    rows.forEach((row, index) => {
        const top = TABLE_TOP + index * 67;
        ctx.fillStyle = index % 2 === 0 ? "#0e1824" : "#070a0f";
        ctx.fillRect(48, top, 984, 67);
        const companyLogo = logos.get(row.logo_url!)!;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.roundRect(64, top + 8, 50, 50, 8); ctx.fill();
        const scale = Math.min(44 / companyLogo.naturalWidth, 44 / companyLogo.naturalHeight);
        const logoWidth = companyLogo.naturalWidth * scale;
        const logoHeight = companyLogo.naturalHeight * scale;
        ctx.drawImage(companyLogo, 67 + (44 - logoWidth) / 2, top + 11 + (44 - logoHeight) / 2, logoWidth, logoHeight);
        ctx.fillStyle = "#ffffff";
        ctx.font = "500 24px Poppins, sans-serif";
        ctx.textAlign = "left";
        let name = row.name;
        while (ctx.measureText(name).width > 262 && name.length > 1) name = name.slice(0, -2) + "…";
        ctx.fillText(name, 130, top + 43);
        [row.petrol, row.diesel].forEach((price, i) => {
            ctx.textAlign = "right";
            ctx.fillText(formatFuelPrice(price), columns[i + 1], top + 43);
        });
        const change = fuelRowChange(row, previous);
        ctx.font = "600 22px Poppins, sans-serif";
        [change.petrol, change.diesel].forEach((value, i) => {
            // Rises in rose, falls in green, no move or no comparison in grey.
            ctx.fillStyle = value === null ? "#64748b" : value > 0 ? "#fb7185" : value < 0 ? "#34d399" : "#94a3b8";
            ctx.fillText(formatFuelChange(value), columns[i + 3], top + 43);
        });
    });
    // What the % columns compare with, right-aligned directly under the table.
    ctx.textAlign = "right";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 22px Poppins, sans-serif";
    ctx.fillText(previous ? `% change vs ${formatFuelDate(previous.report_date)}` : "% change: no earlier report to compare", 1016, TABLE_TOP + rows.length * 67 + 36);
    ctx.textAlign = "left";
    drawReportFooter(ctx, "dark", height);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not encode the image.")), "image/png"));
}
