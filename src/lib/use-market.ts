import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllStocks, isMarketOpen, type Stock } from "@/lib/gse";
import { recordAll } from "@/lib/history";

/**
 * One live GSE snapshot for every terminal screen. `gse.ts` caches requests for a minute, so
 * several screens mounting at once still cost one fetch; the hook refreshes every 30 seconds
 * while the market is open and records each snapshot into the local price history.
 */

const OPEN_REFRESH_MS = 30_000;
const CLOSED_REFRESH_MS = 5 * 60_000;

export interface MarketSnapshot {
    stocks: Stock[];
    loading: boolean;
    error: string | null;
    updatedAt: Date | null;
    open: boolean;
    symbols: string[];
    bySymbol: Map<string, Stock>;
    refresh: () => void;
}

let shared: { stocks: Stock[]; updatedAt: Date | null; error: string | null } = { stocks: [], updatedAt: null, error: null };
const listeners = new Set<() => void>();

async function load(force: boolean): Promise<void> {
    try {
        const stocks = await getAllStocks(force);
        recordAll(stocks.map((stock) => ({ symbol: stock.symbol, price: stock.price })));
        shared = { stocks, updatedAt: new Date(), error: null };
    } catch (caught) {
        shared = { ...shared, error: caught instanceof Error ? caught.message : "Market data is unavailable." };
    }
    listeners.forEach((listener) => listener());
}

export function useMarket(): MarketSnapshot {
    const [, rerender] = useState(0);
    const [loading, setLoading] = useState(shared.stocks.length === 0);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => {
        const listener = () => { rerender((n) => n + 1); setLoading(false); };
        listeners.add(listener);
        if (shared.stocks.length === 0 || !shared.updatedAt || Date.now() - shared.updatedAt.getTime() > OPEN_REFRESH_MS) void load(false);
        const schedule = () => {
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(async () => { await load(true); schedule(); }, isMarketOpen() ? OPEN_REFRESH_MS : CLOSED_REFRESH_MS);
        };
        schedule();
        return () => { listeners.delete(listener); window.clearTimeout(timer.current); };
    }, []);

    const refresh = useCallback(() => { setLoading(true); void load(true); }, []);
    const bySymbol = useMemo(() => new Map(shared.stocks.map((stock) => [stock.symbol, stock])), [shared.stocks]); // eslint-disable-line react-hooks/exhaustive-deps
    const symbols = useMemo(() => shared.stocks.map((stock) => stock.symbol), [shared.stocks]); // eslint-disable-line react-hooks/exhaustive-deps

    return { stocks: shared.stocks, loading, error: shared.error, updatedAt: shared.updatedAt, open: isMarketOpen(), symbols, bySymbol, refresh };
}

/** Breadth and totals used by WEI and the launchpad. */
export function marketBreadth(stocks: Stock[]) {
    const advancers = stocks.filter((stock) => stock.change > 0);
    const decliners = stocks.filter((stock) => stock.change < 0);
    const unchanged = stocks.length - advancers.length - decliners.length;
    const volume = stocks.reduce((sum, stock) => sum + stock.volume, 0);
    const average = stocks.length ? stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / stocks.length : 0;
    const sectors = new Map<string, { count: number; change: number; volume: number }>();
    for (const stock of stocks) {
        const entry = sectors.get(stock.sector) ?? { count: 0, change: 0, volume: 0 };
        entry.count += 1;
        entry.change += stock.changePercent;
        entry.volume += stock.volume;
        sectors.set(stock.sector, entry);
    }
    return {
        advancers, decliners, unchanged, volume, average,
        sectors: [...sectors.entries()].map(([name, entry]) => ({ name, count: entry.count, average: entry.change / entry.count, volume: entry.volume })).sort((a, b) => b.average - a.average),
        gainers: [...advancers].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
        losers: [...decliners].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
        active: [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5),
    };
}
