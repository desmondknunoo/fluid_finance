import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listCloses, type StockClose as StockPrice } from "@/lib/closes";

interface DateGroup {
  date: string;
  prices: StockPrice[];
}

/** Recorded closing prices, one trading day at a time, as an editorial data table. */
export function HistoricalPrices() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listCloses();
        if (cancelled) return;

        const map = new Map<string, StockPrice[]>();
        for (const row of data) {
          const existing = map.get(row.trading_date) || [];
          existing.push(row);
          map.set(row.trading_date, existing);
        }

        const dateGroups: DateGroup[] = Array.from(map.entries())
          .map(([date, prices]) => ({ date, prices }))
          .sort((a, b) => b.date.localeCompare(a.date));

        setGroups(dateGroups);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="news-loading" role="status">Loading closing prices…</p>;
  }

  if (error) {
    return <p className="news-notice news-notice--error" role="alert">{error}</p>;
  }

  if (groups.length === 0) {
    return (
      <div className="news-empty">
        <h3>No closing prices yet</h3>
        <p>No price history recorded yet. Data will appear as the app is used.</p>
      </div>
    );
  }

  const current = groups[pageIndex];
  const hasPrev = pageIndex < groups.length - 1;
  const hasNext = pageIndex > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-baseline gap-3">
          <h3 className="news-headline-sm">{formatDisplayDate(current.date)}</h3>
          <span className="news-byline">{current.prices.length} stocks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="news-byline tabular-nums">{pageIndex + 1} / {groups.length}</span>
          <button
            type="button"
            onClick={() => hasPrev && setPageIndex(pageIndex + 1)}
            disabled={!hasPrev}
            aria-label="Earlier trading day"
            className="news-icon-button disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => hasNext && setPageIndex(pageIndex - 1)}
            disabled={!hasNext}
            aria-label="Later trading day"
            className="news-icon-button disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="news-table-wrap">
        <table className="news-table">
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col" className="num">Closing price</th>
            </tr>
          </thead>
          <tbody>
            {current.prices.map((row) => (
              <tr key={`${row.trading_date}-${row.symbol}`}>
                <td className="font-bold uppercase">{row.symbol}</td>
                <td className="num">GHS {row.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
