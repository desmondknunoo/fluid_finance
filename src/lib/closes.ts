/**
 * Daily closing prices, one per listing per Accra trading day.
 *
 * STOPGAP: the Fluid Finance editorial backend (api.finance.fluidterra.com /editorial/closes) isn't
 * reachable yet, so until it's deployed on AWS we read closes from the live webapp market backend's
 * end-of-day snapshots. The Vite dev server proxies `/market-api` to it (CORS is locked to the
 * deployed origin); production calls it directly. When the editorial backend is up, revert this file
 * to the `api("/editorial/closes")` version.
 */

const MARKET_API = import.meta.env.DEV ? "/market-api" : "https://api.fluidterra.com/api/v1/market";
const CACHE_TTL = 5 * 60_000;

export interface StockClose {
    symbol: string;
    trading_date: string;
    price: number;
    recorded_at: string | null;
}

interface EodDay {
    tradingDate: string;
    stocks?: { symbol: string; price: number | string; observedAt?: string | null }[];
}

let cache: { at: number; rows: StockClose[] } | null = null;

/** One request for the whole end-of-day history, flattened to one row per (listing, day). */
async function fetchAllCloses(): Promise<StockClose[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL) return cache.rows;

    const response = await fetch(`${MARKET_API}/eod?limit=400`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Could not load price history (${response.status}).`);
    const data = (await response.json()) as { items?: EodDay[] };

    const rows: StockClose[] = [];
    for (const day of data.items ?? []) {
        for (const quote of day.stocks ?? []) {
            const price = Number(quote.price);
            // Skip listings the snapshot didn't price that day (stored as 0) so the table stays honest.
            if (Number.isFinite(price) && price > 0) {
                rows.push({ symbol: quote.symbol, trading_date: day.tradingDate, price, recorded_at: quote.observedAt ?? null });
            }
        }
    }

    cache = { at: Date.now(), rows };
    return rows;
}

export async function listCloses(options: { start?: string; end?: string; symbol?: string } = {}): Promise<StockClose[]> {
    const rows = await fetchAllCloses();
    return rows.filter(
        (row) =>
            (!options.symbol || row.symbol === options.symbol) &&
            (!options.start || row.trading_date >= options.start) &&
            (!options.end || row.trading_date <= options.end)
    );
}

export async function listCloseDates(): Promise<string[]> {
    const rows = await fetchAllCloses();
    return [...new Set(rows.map((row) => row.trading_date))].sort();
}

/** Kept for callers that used the Supabase-era shape. */
export type StockPrice = StockClose;
export const getStockPriceHistory = (startDate: string, endDate: string) => listCloses({ start: startDate, end: endDate });
