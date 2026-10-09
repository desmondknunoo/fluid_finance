export const FUEL_TYPES = ["petrol", "diesel", "premium"] as const;
export type FuelType = typeof FUEL_TYPES[number];
export const MAX_OMCS = 500;
export const OMCS_PER_IMAGE = 10;
export const OMC_LOGO_BASE = "https://agzazndvqrencvgpovyh.supabase.co/storage/v1/object/public/omc-logos/";
export const validOmcLogo = (url: unknown): url is string => typeof url === "string" && (bundledLogoUrls.has(url) || new RegExp(`^${OMC_LOGO_BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-f0-9-]+\\.png$`).test(url));
export interface Omc { name: string; logo_url: string }
export interface FuelPriceRow {
    name: string;
    logo_url?: string;
    petrol: number | null;
    diesel: number | null;
    premium: number | null;
}
export interface FuelReport {
    id: string;
    report_date: string;
    prices: FuelPriceRow[];
    created_at: string;
}
export interface FuelDraftRow { name: string; logo_url?: string; petrol: string; diesel: string; premium: string }
export type FuelSort = "az" | "za" | "price-asc" | "price-desc" | "popular";
export const POPULAR_OMCS = ["Goil", "StarOil", "Shell", "TotalEnergies", "Zen", "Benab", "Frimps", "Petrosol", "Allied Oil", "Puma Energy", "So Energy", "MISA Energy", "Pacific", "Top Oil", "JP", "Frontier", "Power Fuels", "ICON"];
const popularity = new Map(POPULAR_OMCS.map((name, index) => [name.toLowerCase(), index]));
/** Reorder complete rows without changing prices or logos. Missing prices always go last. */
export function sortFuelRows(rows: FuelDraftRow[], order: FuelSort, fuel: FuelType = "petrol"): FuelDraftRow[] {
    const nameCompare = (a: FuelDraftRow, b: FuelDraftRow) => a.name.trim().localeCompare(b.name.trim(), "en", { sensitivity: "base" });
    const price = (row: FuelDraftRow) => {
        const value = row[fuel].trim();
        return value && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
    };
    return [...rows].sort((a, b) => {
        if (order === "az") return nameCompare(a, b);
        if (order === "za") return nameCompare(b, a);
        if (order === "popular") return (popularity.get(a.name.trim().toLowerCase()) ?? Infinity) - (popularity.get(b.name.trim().toLowerCase()) ?? Infinity) || nameCompare(a, b);
        const left = price(a), right = price(b);
        if (left === null) return right === null ? nameCompare(a, b) : 1;
        if (right === null) return -1;
        return (order === "price-asc" ? left - right : right - left) || nameCompare(a, b);
    });
}
// User-supplied list, in the requested order. No additional OMCs inferred.
export const DEFAULT_SUPPLIERS = ["MISA Energy", "Shell", "So Energy", "Puma Energy", "Allied Oil", "TotalEnergies", "Power Fuels", "Pacific", "Petrosol", "Frontier", "Top Oil", "Goil", "StarOil", "Frimps", "JP", "Zen", "ICON", "Benab"];
const logoFiles = [
    "1762118862633-MISA.webp", "1762118921269-Shell.webp", "1762118934605-SoEnergy.webp",
    "1762118913549-Puma.webp", "1762117899122-Allied.webp", "1762118956625-TotalEnergies.webp",
    "71cbd486-dfdc-480b-9b4e-b2508a15a1d7-logopower_.webp", "1762118890505-Pacific.webp",
    "1762118902708-Petrosol.webp", "1762118764253-Frontier.webp", "1765742459598-TopOil.webp",
    "1762118804328-Goil.webp", "1762118942573-StarOil.webp", "1762118754577-Frimps.webp",
    "1762118847297-JP.webp", "1762118996141-Zen.webp", "1762118823739-ICONEnergy.webp", "1762118729582-Benab.webp",
];
export const DEFAULT_OMCS: Omc[] = DEFAULT_SUPPLIERS.map((name, index) => ({ name, logo_url: `/fuel/${logoFiles[index]}` }));
const bundledLogoUrls = new Set(DEFAULT_OMCS.map(omc => omc.logo_url));
export function mergeOmcLibrary(uploaded: Omc[]): Omc[] {
    const library = new Map(DEFAULT_OMCS.map(omc => [omc.name.toLowerCase(), omc]));
    for (const omc of uploaded) library.set(omc.name.trim().toLowerCase(), omc);
    return [...library.values()];
}
export const blankFuelRow = (name = ""): FuelDraftRow => ({ name, logo_url: DEFAULT_OMCS.find(omc => omc.name.toLowerCase() === name.trim().toLowerCase())?.logo_url, petrol: "", diesel: "", premium: "" });

export function validateFuelReport(date: string, rows: FuelDraftRow[], requireLogos = false): FuelPriceRow[] {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
        throw new Error("Choose a valid report date.");
    }
    if (!rows.length || rows.length > MAX_OMCS) throw new Error(`Include between 1 and ${MAX_OMCS} OMCs.`);
    const names = new Set<string>();
    return rows.map((row, i) => {
        const name = row.name.trim();
        if (!name || name.length > 60) throw new Error(`Supplier ${i + 1} needs a name of 1–60 characters.`);
        if (names.has(name.toLowerCase())) throw new Error(`The supplier “${name}” appears twice.`);
        names.add(name.toLowerCase());
        const result: FuelPriceRow = { name, petrol: null, diesel: null, premium: null };
        if (row.logo_url && !validOmcLogo(row.logo_url)) throw new Error(`Upload a valid logo for ${name}.`);
        if (requireLogos && !row.logo_url) throw new Error(`Add a logo for ${name} before saving.`);
        if (row.logo_url) result.logo_url = row.logo_url;
        for (const type of FUEL_TYPES) {
            const raw = row[type].trim();
            if (!raw) continue;
            if (!/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 9999.99) {
                throw new Error(`${name}: enter a ${type} price between 0.01 and 9,999.99, with at most two decimal places.`);
            }
            result[type] = Number(raw);
        }
        if (FUEL_TYPES.every(type => result[type] === null)) throw new Error(`Enter at least one price for ${name}, or remove that supplier.`);
        return result;
    });
}

export function fuelReportPages(rows: FuelPriceRow[]): FuelPriceRow[][] {
    if (!rows.length) throw new Error("This report has no OMCs.");
    const missing = rows.filter(row => !validOmcLogo(row.logo_url));
    if (missing.length) throw new Error(`Add logos before sharing: ${missing.map(row => row.name).join(", ")}. Open the report in the editor to add them.`);
    return Array.from({ length: Math.ceil(rows.length / OMCS_PER_IMAGE) }, (_, i) => rows.slice(i * OMCS_PER_IMAGE, (i + 1) * OMCS_PER_IMAGE));
}

export function averageFuelPrice(rows: FuelPriceRow[], type: FuelType): number | null {
    const prices = rows.flatMap(row => row[type] === null ? [] : [row[type]!]);
    return prices.length ? prices.reduce((sum, price) => sum + Math.round(price * 100), 0) / prices.length / 100 : null;
}
export const formatFuelPrice = (value: number | null) => value === null ? "—" : value.toFixed(2);
export const formatFuelDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" });
