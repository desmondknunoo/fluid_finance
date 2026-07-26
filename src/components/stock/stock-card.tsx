import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCedis, type Stock } from "@/lib/gse";
import { TickerLogo } from "@/components/stock/ticker-logo";

interface StockCardProps {
    stock: Stock;
    onSelect: (symbol: string) => void;
    /** 1-based position badge, for ranked lists like Top Gainers. */
    rank?: number;
    /** Show today's volume as a footer meta row. */
    showVolume?: boolean;
}

/**
 * Tap-friendly stock row for narrow viewports, where a multi-column table would
 * otherwise scroll sideways. Everything a row conveys — identity, price, the
 * day's move, optional volume — stacked into one full-width card with a
 * comfortable touch target.
 */
export function StockCard({ stock, onSelect, rank, showVolume = true }: StockCardProps) {
    const positive = stock.change >= 0;
    const flat = stock.change === 0;

    return (
        <button
            type="button"
            onClick={() => onSelect(stock.symbol)}
            className="flex w-full items-center gap-3 rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-3 text-left transition-colors hover:border-ink/20 hover:bg-ink/[0.05] focus:outline-none focus:ring-2 focus:ring-fluid-cyan/60 active:bg-ink/[0.06]"
        >
            {rank !== undefined && (
                <span className="w-4 shrink-0 text-center font-mono text-xs text-ink/30">{rank}</span>
            )}
            <TickerLogo symbol={stock.symbol} size={38} />

            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-bold uppercase text-ink">{stock.symbol}</span>
                    <span className="shrink-0 font-mono text-ink">{formatCedis(stock.price)}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-ink/40">{stock.company}</span>
                    <span
                        className={cn(
                            "flex shrink-0 items-center gap-1 font-mono text-xs font-medium",
                            flat ? "text-ink/40" : positive ? "text-emerald-400" : "text-rose-400",
                        )}
                    >
                        {!flat && (positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
                        {positive ? "+" : ""}
                        {stock.change.toFixed(2)}
                        <span className="text-ink/30">·</span>
                        {positive ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                    </span>
                </div>
                {showVolume && (
                    <div className="mt-1.5 flex items-center justify-between border-t border-ink/[0.05] pt-1.5 text-[11px] text-ink/30">
                        <span className="uppercase tracking-wider">Volume</span>
                        <span className="font-mono">{stock.volume.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <ChevronRight size={16} className="shrink-0 text-ink/25" aria-hidden="true" />
        </button>
    );
}
