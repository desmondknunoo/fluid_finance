import type { Stock } from "@/lib/gse";
import { getSeries, sliceRange, type PricePoint, type RangeKey } from "@/lib/history";

/**
 * An equal-weight composite of every listing, rebased to 100 at the start of the range, so the
 * Markets Wrap can show one line for "the market". Days are aligned by timestamp; a listing
 * missing a day is simply left out of that day's average.
 */
export function compositeSeries(stocks: Stock[], range: RangeKey = "1M"): PricePoint[] {
    const buckets = new Map<number, { sum: number; count: number; recorded: boolean }>();
    for (const stock of stocks) {
        const points = sliceRange(getSeries(stock.symbol, stock.price), range);
        const base = points[0]?.close;
        if (!base) continue;
        for (const point of points) {
            const bucket = buckets.get(point.t) ?? { sum: 0, count: 0, recorded: false };
            bucket.sum += (point.close / base) * 100;
            bucket.count += 1;
            bucket.recorded = bucket.recorded || point.recorded;
            buckets.set(point.t, bucket);
        }
    }
    return [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([t, bucket]) => ({ t, close: bucket.sum / bucket.count, recorded: bucket.recorded }));
}
