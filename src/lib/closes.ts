/** Historical GSE closes in the existing Supabase table until the finance backend is live. */
const SUPABASE_URL = "https://agzazndvqrencvgpovyh.supabase.co/rest/v1/stock_prices";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemF6bmR2cXJlbmN2Z3BvdnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzYzNzAsImV4cCI6MjEwMTk1MjM3MH0.r0Nrl0qzT8ekwyOzpsAUBwFBx1W0Px2Ztcb-u36F9fg";
const CACHE_TTL = 5 * 60_000;
const PAGE_SIZE = 1000;

export interface StockClose {
    symbol: string;
    trading_date: string;
    price: number;
    recorded_at: string | null;
}

let cache: { at: number; rows: StockClose[] } | null = null;

async function fetchAllCloses(): Promise<StockClose[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL) return cache.rows;
    const rows: StockClose[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const url = new URL(SUPABASE_URL);
        url.searchParams.set("select", "symbol,price,trading_date,recorded_at");
        url.searchParams.set("order", "trading_date.asc,symbol.asc");
        url.searchParams.set("limit", String(PAGE_SIZE));
        url.searchParams.set("offset", String(offset));
        const response = await fetch(url, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Could not load closing prices (${response.status}).`);
        const page = (await response.json()) as StockClose[];
        if (!Array.isArray(page)) throw new Error("Closing price response is invalid.");
        rows.push(...page);
        if (page.length < PAGE_SIZE) break;
    }
    cache = { at: Date.now(), rows };
    return rows;
}

export async function listCloses(options: { start?: string; end?: string; symbol?: string } = {}): Promise<StockClose[]> {
    const rows = await fetchAllCloses();
    return rows.filter(row =>
        (!options.symbol || row.symbol === options.symbol) &&
        (!options.start || row.trading_date >= options.start) &&
        (!options.end || row.trading_date <= options.end)
    );
}

export async function listCloseDates(): Promise<string[]> {
    const rows = await fetchAllCloses();
    return [...new Set(rows.map(row => row.trading_date))].sort();
}

export type StockPrice = StockClose;
export const getStockPriceHistory = (startDate: string, endDate: string) => listCloses({ start: startDate, end: endDate });
