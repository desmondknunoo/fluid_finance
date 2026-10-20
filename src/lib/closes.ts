import { api } from "@/lib/api";

/** Migrated historical GSE closes and new daily snapshots from the Finance backend. */
const CACHE_TTL = 5 * 60_000;

export interface StockClose {
    symbol: string;
    trading_date: string;
    price: number;
    recorded_at: string | null;
}

let cache: { at: number; rows: StockClose[] } | null = null;

async function fetchAllCloses(): Promise<StockClose[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL) return cache.rows;
    const { items: rows } = await api<{ items: StockClose[] }>("/editorial/closes", { auth: false });
    if (!Array.isArray(rows)) throw new Error("Closing price response is invalid.");
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
