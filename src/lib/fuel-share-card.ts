import { drawReportFooter } from "@/lib/weekly-trends-share-card";
import { averageFuelPrice, formatFuelDate, formatFuelPrice, fuelReportPages, type FuelReport, type FuelPriceRow } from "@/lib/fuel-prices";

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
export async function renderFuelCards(report: FuelReport): Promise<Blob[]> {
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
    for (const [index, rows] of pages.entries()) blobs.push(await renderPage(report, rows, index, pages.length, logos, brand));
    return blobs;
}

async function renderPage(report: FuelReport, rows: FuelPriceRow[], page: number, total: number, logos: Map<string, HTMLImageElement>, logo: HTMLImageElement): Promise<Blob> {
    const width = 1080;
    const height = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser cannot generate this image.");
    ctx.fillStyle = "#070a0f";
    ctx.fillRect(0, 0, width, height);
    const logoW = 190;
    ctx.drawImage(logo, width - 64 - logoW, 48, logoW, logoW * logo.naturalHeight / logo.naturalWidth);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 22px Poppins, sans-serif";
    ctx.fillText("GHANA FUEL PRICES", 64, 88);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 80px Poppins, sans-serif";
    ctx.fillText("FLUID PUMP", 64, 178);
    const gradient = ctx.createLinearGradient(64, 0, 620, 0);
    gradient.addColorStop(0, "#22d3ee");
    gradient.addColorStop(1, "#80d44b");
    ctx.fillStyle = gradient;
    ctx.fillText("REPORT", 64, 248);
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 29px Poppins, sans-serif";
    ctx.fillText(formatFuelDate(report.report_date), 64, 300);
    ctx.font = "500 22px Poppins, sans-serif";
    const drawAverage = (type: "petrol" | "diesel", y: number, color: string) => {
        const label = `Average ${type}: `;
        const price = averageFuelPrice(report.prices, type);
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(label, 64, y);
        ctx.fillStyle = price === null ? "#94a3b8" : color;
        ctx.fillText(price === null ? "unavailable" : `GHS ${price.toFixed(2)} / litre`, 64 + ctx.measureText(label).width, y);
    };
    drawAverage("petrol", 351, "#67e8f9");
    drawAverage("diesel", 386, "#34d399");
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 22px Poppins, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Page ${page + 1} of ${total}`, 1016, 351);
    const columns = [64, 585, 798, 1016];
    ctx.font = "600 23px Poppins, sans-serif";
    ["Name", "Petrol (GHS)", "Diesel (GHS)", "Premium (GHS)"].forEach((label, i) => {
        ctx.fillStyle = i === 1 ? "#67e8f9" : i === 2 ? "#34d399" : "#ffffff";
        ctx.textAlign = i === 0 ? "left" : "right";
        ctx.fillText(label, columns[i], 433);
    });
    rows.forEach((row, index) => {
        const top = 457 + index * 67;
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
        while (ctx.measureText(name).width > 282 && name.length > 1) name = name.slice(0, -2) + "…";
        ctx.fillText(name, 130, top + 43);
        [row.petrol, row.diesel, row.premium].forEach((price, i) => {
            ctx.textAlign = "right";
            ctx.fillText(formatFuelPrice(price), columns[i + 1], top + 43);
        });
    });
    ctx.textAlign = "left";
    drawReportFooter(ctx, "dark", height);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not encode the image.")), "image/png"));
}
