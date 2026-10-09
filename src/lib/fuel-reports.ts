import { validateFuelReport, type FuelDraftRow, type FuelReport, type Omc } from "@/lib/fuel-prices";

async function request(authorization: string, body?: unknown): Promise<FuelReport[] | FuelReport> {
    const response = await fetch("/api/fuel-reports", {
        method: body ? "POST" : "GET",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("The fuel reports API is unavailable. Start the Cloudflare Pages server or deploy the Pages Function.");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load fuel reports. Please retry.");
    return data;
}
export async function listFuelReports(authorization: string): Promise<FuelReport[]> {
    return await request(authorization) as FuelReport[];
}
export async function saveFuelReport(authorization: string, date: string, rows: FuelDraftRow[]): Promise<FuelReport> {
    validateFuelReport(date, rows, true);
    return await request(authorization, { report_date: date, rows }) as FuelReport;
}
export async function updateFuelReport(id: string, date: string, rows: FuelDraftRow[]): Promise<FuelReport> {
    validateFuelReport(date, rows, true);
    const response = await fetch("/api/fuel-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, report_date: date, rows }),
    });
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("The fuel reports API is unavailable. Start the Cloudflare Pages server or deploy the Pages Function.");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not update the fuel report. Please retry.");
    return data as FuelReport;
}
export async function deleteFuelReport(id: string): Promise<void> {
    const response = await fetch(`/api/fuel-reports?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("The fuel reports API is unavailable. Start the Cloudflare Pages server or deploy the Pages Function.");
    if (!response.ok) throw new Error((await response.json()).error || "Could not delete the fuel report. Please retry.");
}

async function omcRequest(authorization: string, body?: unknown): Promise<unknown> {
    const response = await fetch("/api/fuel-omcs", { method: body ? "POST" : "GET", headers: { Authorization: authorization, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("OMC storage is unavailable. Start the Pages server and apply the OMC migration.");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save the OMC logo. Please retry.");
    return data;
}
export async function listOmcs(authorization: string): Promise<Omc[]> { return await omcRequest(authorization) as Omc[]; }
export async function uploadOmcLogo(authorization: string, name: string, file: File): Promise<Omc> {
    if (!name.trim()) throw new Error("Enter the OMC name before uploading its logo.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Choose a PNG, JPG or WebP logo up to 5 MB.");
    const bitmap = await createImageBitmap(file);
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 192; canvas.height = 192;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Your browser cannot prepare the logo.");
        const scale = Math.min(176 / bitmap.width, 176 / bitmap.height);
        ctx.drawImage(bitmap, (192 - bitmap.width * scale) / 2, (192 - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
        return await omcRequest(authorization, { name: name.trim(), image: canvas.toDataURL("image/png") }) as Omc;
    } finally { bitmap.close(); }
}
