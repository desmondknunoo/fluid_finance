import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { formatCedis, type Stock } from "@/lib/gse";
import { cn } from "@/lib/utils";

/** The tape under the masthead: every GSE quote scrolling, click to open the stock. */
export function QuoteTape({ stocks, className }: { stocks: Stock[]; className?: string }) {
    const [paused, setPaused] = useState(false);
    if (!stocks.length) {
        return (
            <div className={cn("flex h-9 items-center border-y border-ink/[0.08] bg-ink/[0.02] px-4 font-mono text-[11px] uppercase tracking-wider text-ink/40", className)} aria-label="Live GSE quotes">
                GSE quotes load when the market feed is reachable
            </div>
        );
    }
    const items = [...stocks, ...stocks];
    return (
        <div className={cn("quote-tape relative h-9 overflow-hidden border-y border-ink/[0.08] bg-ink/[0.02]", className)} aria-label="Live GSE quotes">
            <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Resume market ticker" : "Pause market ticker"} aria-pressed={paused} className="quote-tape-control">{paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}</button>
            <ul className="quote-tape-track flex h-full w-max items-center" style={paused ? { animationPlayState: "paused" } : undefined}>
                {items.map((stock, index) => {
                    const up = stock.change > 0, down = stock.change < 0;
                    return (
                        <li key={`${stock.symbol}-${index}`} aria-hidden={index >= stocks.length || undefined}>
                            <a href={`/stock/${stock.symbol}`} tabIndex={index >= stocks.length ? -1 : undefined} className="flex h-9 items-center gap-2 border-r border-ink/[0.06] px-3 font-mono text-xs hover:bg-ink/[0.04]">
                                <span className="font-semibold text-ink">{stock.symbol}</span>
                                <span className="tabular-nums text-ink/70">{formatCedis(stock.price)}</span>
                                <span className={cn("tabular-nums", up ? "text-fluid-green" : down ? "text-fluid-rose" : "text-ink/40")}>{up ? "▲" : down ? "▼" : "■"} {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
