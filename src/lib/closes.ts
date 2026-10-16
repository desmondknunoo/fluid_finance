import { api } from "@/lib/api";

/**
 * Daily closing prices, one per listing per Accra trading day, recorded by the Fluid backend
 * from its live snapshot. This replaces the browser-written `stock_prices` table: history is
 * complete whether or not anyone opened the site that day.
 */

export interface StockClose {
    symbol: string;
    trading_date: string;
    price: number;
    recorded_at: string | null;
}

export async function listCloses(options: { start?: string; end?: string; symbol?: string } = {}): Promise<StockClose[]> {
    return (await api<{ items: StockClose[] }>("/editorial/closes", { auth: false, query: { start: options.start, end: options.end, symbol: options.symbol } })).items;
}

export async function listCloseDates(): Promise<string[]> {
    return (await api<{ items: string[] }>("/editorial/closes/dates", { auth: false })).items;
}

/** Kept for callers that used the Supabase-era shape. */
export type StockPrice = StockClose;
export const getStockPriceHistory = (startDate: string, endDate: string) => listCloses({ start: startDate, end: endDate });
