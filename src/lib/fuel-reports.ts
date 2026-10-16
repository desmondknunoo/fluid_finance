import { api } from "@/lib/api";
import { validateFuelReport, type FuelDraftRow, type FuelReport, type Omc } from "@/lib/fuel-prices";

/**
 * Fluid Pump Report desk calls. Reads are public; writes need an operations, social or admin
 * role, which the Fluid backend checks on the signed-in Firebase identity.
 */

type Items<T> = { items: T[] };

export async function listFuelReports(_authorization = ""): Promise<FuelReport[]> {
    return (await api<Items<FuelReport>>("/editorial/desk/fuel/reports")).items;
}

export async function saveFuelReport(_authorization: string, date: string, rows: FuelDraftRow[]): Promise<FuelReport> {
    validateFuelReport(date, rows, true);
    return api<FuelReport>("/editorial/desk/fuel/reports", { method: "POST", body: { report_date: date, rows } });
}

export async function updateFuelReport(id: string, date: string, rows: FuelDraftRow[]): Promise<FuelReport> {
    validateFuelReport(date, rows, true);
    return api<FuelReport>(`/editorial/desk/fuel/reports/${id}`, { method: "PUT", body: { report_date: date, rows } });
}

export async function deleteFuelReport(id: string): Promise<void> {
    await api(`/editorial/desk/fuel/reports/${id}`, { method: "DELETE" });
}

export async function listOmcs(_authorization = ""): Promise<Omc[]> {
    return (await api<Items<Omc>>("/editorial/fuel/omcs", { auth: false })).items;
}

export async function uploadOmcLogo(_authorization: string, name: string, file: File): Promise<Omc> {
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
        return await api<Omc>("/editorial/desk/fuel/omcs", { method: "POST", body: { name: name.trim(), image: canvas.toDataURL("image/png") } });
    } finally { bitmap.close(); }
}
