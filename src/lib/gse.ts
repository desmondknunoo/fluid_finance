/**
 * Fluid Finance - shared Fluid market snapshot and GSE company metadata client
 *
 * Quotes: https://api.fluidterra.com/api/v1/market/stocks
 * Company metadata: https://dev.kwayisi.org/apis/gse/equities/{symbol}
 */

// kwayisi proxies the GSE's own feed and is CORS-open (`*`), so the board reads it directly in both
// dev and production. `/live` gives the day's price, change and volume per ticker; `/equities/{s}`
// gives company metadata. (This is the public market source; the Fluid trading app has its own.)
const API_BASE = "https://dev.kwayisi.org/apis/gse";
const TTL = 60_000;

/** A row from kwayisi's `/live` ticker: `change` is the day's move vs the previous close. */
interface LiveQuote {
    name: string;
    price: number | string;
    change: number | string;
    volume: number;
}

export interface Director {
    name: string;
    position: string | null;
}

export interface CompanyProfile {
    name: string;
    sector: string | null;
    industry: string | null;
    address: string | null;
    email: string | null;
    telephone: string | null;
    facsimile: string | null;
    website: string | null;
    directors: Director[];
}

export interface EquityDetail {
    name: string;
    price: number;
    capital: number | null;
    eps: number | null;
    dps: number | null;
    shares: number | null;
    company: CompanyProfile | null;
}

export interface Stock {
    symbol: string;
    company: string;
    sector: string;
    industry: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
}

/**
 * Company metadata for every symbol currently listed on the GSE, sourced from
 * `/equities/{symbol}`. Kept locally so the landing page can render all 39
 * companies from one backend market snapshot instead of 39 detail requests.
 */
export const COMPANY_META: Record<string, { company: string; sector: string; industry: string }> = {
    AADS: { company: "AngloGold Ashanti Depositary Shares", sector: "Basic Materials", industry: "Mining" },
    ACCESS: { company: "Access Bank Ghana Plc", sector: "Financials", industry: "Banking" },
    ADB: { company: "Agricultural Development Bank", sector: "Financials", industry: "Banking" },
    AGA: { company: "AngloGold Ashanti Limited", sector: "Basic Materials", industry: "Mining" },
    ALLGH: { company: "Atlantic Lithium Limited", sector: "Basic Materials", industry: "Mining" },
    ASG: { company: "Asante Gold Corporation", sector: "Basic Materials", industry: "Mining" },
    BOPP: { company: "Benso Oil Palm Plantation Limited", sector: "Consumer Goods", industry: "Agriculture" },
    CAL: { company: "CalBank Plc", sector: "Financials", industry: "Banking" },
    CLYD: { company: "Clydestone Ghana Limited", sector: "Technology", industry: "Software & Services" },
    CMLT: { company: "Camelot Ghana Limited", sector: "Industrials", industry: "Printing & Publishing" },
    CPC: { company: "Cocoa Processing Company Limited", sector: "Consumer Goods", industry: "Food Production" },
    DASPHARMA: { company: "Dannex Ayrton Starwin Plc", sector: "Health Care", industry: "Pharmaceuticals & Biotechnology" },
    DIGICUT: { company: "Digicut Production and Advertising Limited", sector: "Consumer Services", industry: "Advertising" },
    EGH: { company: "Ecobank Ghana Limited", sector: "Financials", industry: "Banking" },
    EGL: { company: "Enterprise Group Limited", sector: "Financials", industry: "Insurance" },
    ETI: { company: "Ecobank Transnational Incorporated", sector: "Financials", industry: "Banking" },
    FAB: { company: "First Atlantic Bank Plc", sector: "Financials", industry: "Banking" },
    FML: { company: "Fan Milk PLC", sector: "Consumer Goods", industry: "Food Production" },
    GCB: { company: "GCB Bank Limited", sector: "Financials", industry: "Banking" },
    GGBL: { company: "Guinness Ghana Breweries Limited", sector: "Consumer Goods", industry: "Beverages" },
    GLD: { company: "NewGold Issuer (RF) Limited", sector: "Financials", industry: "Investment Services" },
    GOIL: { company: "Ghana Oil Company Limited", sector: "Oil & Gas", industry: "Oil Equipment & Services" },
    HORDS: { company: "Hords Limited", sector: "Consumer Goods", industry: "Agriculture" },
    IIL: { company: "Intravenous Infusions Limited", sector: "Health Care", industry: "Pharmaceuticals & Biotechnology" },
    KASA: { company: "Kasapreko Plc", sector: "Consumer Goods", industry: "Beverages" },
    MAC: { company: "Mega African Capital Limited", sector: "Financials", industry: "Investment Services" },
    MMH: { company: "Meridian-Marshall Holdings", sector: "Consumer Services", industry: "Real Estate" },
    MTNGH: { company: "Scancom Plc (MTN Ghana)", sector: "Telecommunications", industry: "Mobile Telecommunications" },
    RBGH: { company: "Republic Bank Ghana Limited", sector: "Financials", industry: "Banking" },
    SAMBA: { company: "Samba Foods Limited", sector: "Consumer Goods", industry: "Food Production" },
    SCB: { company: "Standard Chartered Bank (Ghana) Limited", sector: "Financials", industry: "Banking" },
    SCBPREF: { company: "Standard Chartered Bank Ghana (Pref.)", sector: "Financials", industry: "Banking" },
    SIC: { company: "SIC Insurance Company Limited", sector: "Financials", industry: "Insurance" },
    SOGEGH: { company: "Societe Generale Ghana Limited", sector: "Financials", industry: "Banking" },
    TBL: { company: "Trust Bank (Gambia) Limited", sector: "Financials", industry: "Banking" },
    TLW: { company: "Tullow Oil Plc", sector: "Oil & Gas", industry: "Exploration & Production" },
    TOTAL: { company: "TotalEnergies Marketing Ghana Plc", sector: "Oil & Gas", industry: "Oil Equipment & Services" },
    UNIL: { company: "Unilever Ghana Limited", sector: "Consumer Goods", industry: "Household Goods" },
    ZEN: { company: "ZEN Petroleum Holdings Plc", sector: "Oil & Gas", industry: "Integrated Oil & Gas" },
};

const cache = new Map<string, { expiry: number; data: unknown }>();

async function request<T>(endpoint: string, force = false, base = API_BASE): Promise<T> {
    const key = `${base}${endpoint}`;
    if (!force) {
        const hit = cache.get(key);
        if (hit && Date.now() < hit.expiry) return hit.data as T;
    }

    const response = await fetch(key, {
        headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`GSE API ${response.status} for ${endpoint}`);

    const data = (await response.json()) as T;
    cache.set(key, { expiry: Date.now() + TTL, data });
    return data;
}

export function changePercent(price: number, change: number): number {
    const previous = price - change;
    if (previous <= 0) return 0;
    return (change / previous) * 100;
}

export function metaFor(symbol: string) {
    return (
        COMPANY_META[symbol] ?? {
            company: symbol,
            sector: "Unclassified",
            industry: "Unclassified",
        }
    );
}

function toStock(quote: LiveQuote): Stock {
    const meta = metaFor(quote.name);
    const price = Number(quote.price);
    const change = Number(quote.change);
    if (!quote.name || !Number.isFinite(price) || !Number.isFinite(change)) {
        throw new Error("Invalid GSE live quote");
    }
    return {
        symbol: quote.name,
        company: meta.company,
        sector: meta.sector,
        industry: meta.industry,
        price,
        change,
        // kwayisi gives the absolute move, so the previous close is price − change.
        changePercent: changePercent(price, change),
        volume: Number(quote.volume) || 0,
    };
}

/** The whole GSE board from kwayisi's live ticker. */
export async function getAllStocks(force = false): Promise<Stock[]> {
    const items = await request<LiveQuote[]>("/live", force);
    if (!Array.isArray(items) || !items.length) throw new Error("GSE live snapshot is empty");
    // Guard against the odd non-trading listing with no quote (e.g. a suspended cross-listing), which
    // would otherwise render as a ¢0.00 row — only show equities the exchange is actually pricing.
    return items
        .map(toStock)
        .filter((stock) => stock.price > 0)
        .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function getStock(symbol: string): Promise<Stock> {
    const quote = await request<LiveQuote>(`/live/${encodeURIComponent(symbol.toUpperCase())}`);
    return toStock(quote);
}

export async function getEquityDetail(symbol: string): Promise<EquityDetail> {
    return request<EquityDetail>(`/equities/${symbol.toLowerCase()}`);
}

/**
 * GSE continuous trading runs 10:00–15:00 GMT, Monday to Friday. Ghana observes
 * no daylight saving, so GMT is the local exchange clock year round.
 */
export function isMarketOpen(now = new Date()): boolean {
    const day = now.getUTCDay();
    if (day === 0 || day === 6) return false;
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    return minutes >= 10 * 60 && minutes < 15 * 60;
}

export function formatCedis(value: number, digits = 2): string {
    return `₵${value.toLocaleString("en-GH", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;
}

export function formatCompact(value: number): string {
    if (!Number.isFinite(value)) return "—";
    const units = [
        { limit: 1e12, suffix: "T" },
        { limit: 1e9, suffix: "B" },
        { limit: 1e6, suffix: "M" },
        { limit: 1e3, suffix: "K" },
    ];
    for (const { limit, suffix } of units) {
        if (Math.abs(value) >= limit) return `${(value / limit).toFixed(2)}${suffix}`;
    }
    return value.toLocaleString();
}
