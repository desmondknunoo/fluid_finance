/**
 * Fluid Finance - price history
 *
 * IMPORTANT: the GSE API (dev.kwayisi.org/apis/gse) exposes only four resources
 * — /live, /live/{symbol}, /equities and /equities/{symbol} — none of which
 * return a time series. There is no upstream endpoint to pull historical bars
 * from, so history here is assembled from two parts:
 *
 *   1. RECORDED — every time the app loads live prices we stamp one closing
 *      point per trading day into localStorage. This is real observed data and
 *      it accumulates for as long as the app is used.
 *   2. BACKFILL — a deterministic walk (seeded from the ticker, so it is stable
 *      across reloads and devices) that fills the span before the first
 *      recorded point and is anchored to it so the seam is continuous.
 *
 * Every series reports where its earliest real observation starts, and the
 * chart labels the backfilled span so it is never passed off as market data.
 * Swapping in a genuine history feed only means replacing `buildBackfill`.
 */

export type RangeKey = "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export const RANGES: RangeKey[] = ["1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"];

export interface PricePoint {
    /** Epoch milliseconds at UTC midnight of the trading day. */
    t: number;
    close: number;
    recorded: boolean;
}

export interface Series {
    symbol: string;
    points: PricePoint[];
    /** Epoch ms of the first genuinely observed close, or null if none yet. */
    recordedFrom: number | null;
}

const STORAGE_PREFIX = "fluidfinance:history:";
/** Trading days of backfill — roughly three years at ~252 sessions a year. */
const BACKFILL_SESSIONS = 760;
const DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/* deterministic noise                                                 */
/* ------------------------------------------------------------------ */

function seedFrom(symbol: string): number {
    let h = 2166136261;
    for (let i = 0; i < symbol.length; i++) {
        h ^= symbol.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32 — small, fast, and stable for a given seed. */
function rng(seed: number): () => number {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Box–Muller normal draw from a uniform generator. */
function gaussian(next: () => number): number {
    const u = Math.max(next(), 1e-9);
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------ */
/* calendar helpers                                                    */
/* ------------------------------------------------------------------ */

export function startOfTradingDay(date = new Date()): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isWeekend(ms: number): boolean {
    const day = new Date(ms).getUTCDay();
    return day === 0 || day === 6;
}

/** The `count` most recent weekday timestamps ending at `endMs`, ascending. */
function tradingDaysBefore(endMs: number, count: number): number[] {
    const days: number[] = [];
    let cursor = endMs - DAY;
    while (days.length < count) {
        if (!isWeekend(cursor)) days.push(cursor);
        cursor -= DAY;
    }
    return days.reverse();
}

/* ------------------------------------------------------------------ */
/* recorded observations                                               */
/* ------------------------------------------------------------------ */

type StoredPoint = [t: number, close: number];

function readStore(symbol: string): StoredPoint[] {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + symbol);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(
                (p): p is StoredPoint =>
                    Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]),
            )
            .sort((a, b) => a[0] - b[0]);
    } catch {
        return [];
    }
}

function writeStore(symbol: string, points: StoredPoint[]): void {
    try {
        localStorage.setItem(STORAGE_PREFIX + symbol, JSON.stringify(points));
    } catch {
        /* quota or private mode — history simply stops accumulating */
    }
}

/**
 * Stamp today's close for a symbol. Called on every live refresh; the last
 * price seen on a given trading day wins.
 */
export function recordClose(symbol: string, price: number, when = new Date()): void {
    if (!Number.isFinite(price) || price <= 0) return;
    const today = startOfTradingDay(when);
    if (isWeekend(today)) return;

    const points = readStore(symbol);
    const last = points[points.length - 1];
    if (last && last[0] === today) {
        last[1] = price;
    } else {
        points.push([today, price]);
    }
    writeStore(symbol, points.slice(-BACKFILL_SESSIONS * 2));
}

export function recordAll(quotes: { symbol: string; price: number }[]): void {
    for (const { symbol, price } of quotes) recordClose(symbol, price);
}

/* ------------------------------------------------------------------ */
/* backfill                                                            */
/* ------------------------------------------------------------------ */

/**
 * A seeded walk over `days`, normalised so its final value equals `anchor`.
 * Volatility and drift are stable per ticker, so a symbol's shape never
 * changes between reloads.
 */
function buildBackfill(symbol: string, days: number[], anchor: number): PricePoint[] {
    const seed = seedFrom(symbol);
    const next = rng(seed);

    // Per-symbol character, drawn once from the seed.
    const dailyVol = 0.008 + next() * 0.022;
    const annualDrift = -0.12 + next() * 0.55;
    const dailyDrift = annualDrift / 252;
    const trendPeriod = 90 + next() * 220;
    const trendAmp = 0.1 + next() * 0.35;
    const phase = next() * Math.PI * 2;

    const raw: number[] = [];
    let level = 1;
    for (let i = 0; i < days.length; i++) {
        const shock = gaussian(next) * dailyVol;
        const cycle = Math.sin((i / trendPeriod) * Math.PI * 2 + phase) * (trendAmp / trendPeriod);
        level *= Math.exp(dailyDrift + cycle + shock);
        raw.push(level);
    }

    const tail = raw[raw.length - 1] || 1;
    const scale = anchor / tail;
    return days.map((t, i) => ({
        t,
        close: Math.max(0.01, Number((raw[i] * scale).toFixed(4))),
        recorded: false,
    }));
}

/* ------------------------------------------------------------------ */
/* public series builder                                               */
/* ------------------------------------------------------------------ */

/**
 * Full daily series for a symbol: backfilled span joined to every close this
 * install has actually observed, ending at the current live price.
 */
export function getSeries(symbol: string, livePrice: number, now = new Date()): Series {
    const today = startOfTradingDay(now);
    const recorded = readStore(symbol).filter((p) => p[0] <= today);

    // Today's live price is authoritative for the final point.
    const merged: StoredPoint[] = [...recorded];
    const last = merged[merged.length - 1];
    if (!isWeekend(today) && Number.isFinite(livePrice) && livePrice > 0) {
        if (last && last[0] === today) last[1] = livePrice;
        else merged.push([today, livePrice]);
    }

    const recordedPoints: PricePoint[] = merged.map(([t, close]) => ({ t, close, recorded: true }));
    const firstReal = recordedPoints[0];
    const anchor = firstReal ? firstReal.close : livePrice;
    const backfillEnd = firstReal ? firstReal.t : today + DAY;
    const backfillDays = tradingDaysBefore(backfillEnd, BACKFILL_SESSIONS);
    const backfill = buildBackfill(symbol, backfillDays, anchor);

    return {
        symbol,
        points: [...backfill, ...recordedPoints],
        recordedFrom: recorded.length > 0 ? recorded[0][0] : null,
    };
}

/** Cut-off timestamp for a range selector, or null for the whole series. */
function rangeStart(range: RangeKey, endMs: number): number | null {
    const end = new Date(endMs);
    switch (range) {
        case "1W":
            return endMs - 7 * DAY;
        case "1M":
            return endMs - 30 * DAY;
        case "3M":
            return endMs - 91 * DAY;
        case "6M":
            return endMs - 182 * DAY;
        case "YTD":
            return Date.UTC(end.getUTCFullYear(), 0, 1);
        case "1Y":
            return endMs - 365 * DAY;
        case "ALL":
            return null;
    }
}

export function sliceRange(series: Series, range: RangeKey): PricePoint[] {
    const points = series.points;
    if (points.length === 0) return points;
    const endMs = points[points.length - 1].t;
    const from = rangeStart(range, endMs);
    if (from === null) return points;
    const windowed = points.filter((p) => p.t >= from);
    // Always give the chart something to draw, even for a very new listing.
    return windowed.length >= 2 ? windowed : points.slice(-2);
}

/** Period return over a slice, as absolute change and percent. */
export function periodChange(points: PricePoint[]): { change: number; percent: number } {
    if (points.length < 2) return { change: 0, percent: 0 };
    const first = points[0].close;
    const last = points[points.length - 1].close;
    const change = last - first;
    return { change, percent: first > 0 ? (change / first) * 100 : 0 };
}
