import { useEffect, useMemo, useRef, useState } from "react";
import type { Stock } from "@/lib/gse";

/**
 * Squarified treemap of the exchange, coloured by the day's percentage change.
 *
 * Tiles are near-equal in area — a small bonus for larger moves — so every
 * listing stays legible. Sizing by volume would collapse most of the market
 * into slivers, since only a handful of GSE symbols trade on a given day.
 */

interface Tile {
    stock: Stock;
    x: number;
    y: number;
    w: number;
    h: number;
}

/** Eleven-step ramp from -5% to +5%, matching the legend below the map. */
export function heatColor(changePercent: number): string {
    const p = Math.max(-5, Math.min(5, changePercent));
    if (Math.abs(p) < 0.005) return "#4b5563";
    const steps = p > 0
        ? ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d"]
        : ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"];
    const index = Math.min(steps.length - 1, Math.floor((Math.abs(p) / 5) * steps.length));
    return steps[index];
}

/**
 * Standard squarified layout: fill the shorter side with a row, extending it
 * while the aspect ratio of its tiles keeps improving.
 */
function squarify(
    items: { stock: Stock; weight: number }[],
    x: number,
    y: number,
    w: number,
    h: number,
): Tile[] {
    const tiles: Tile[] = [];
    let rest = [...items];
    let left = x;
    let top = y;
    let width = w;
    let height = h;

    const aspect = (rowWeight: number, itemWeight: number, side: number, total: number) => {
        const rowArea = (rowWeight / total) * width * height;
        const rowThickness = rowArea / side;
        const itemLength = ((itemWeight / rowWeight) * rowArea) / rowThickness;
        return Math.max(rowThickness / itemLength, itemLength / rowThickness);
    };

    while (rest.length > 0) {
        const total = rest.reduce((sum, i) => sum + i.weight, 0);
        const horizontal = width >= height;
        const side = horizontal ? height : width;

        const row: { stock: Stock; weight: number }[] = [];
        let rowWeight = 0;
        let bestRatio = Infinity;

        for (const item of rest) {
            const nextWeight = rowWeight + item.weight;
            const candidate = [...row, item];
            const ratio = Math.max(
                ...candidate.map((c) => aspect(nextWeight, c.weight, side, total)),
            );
            if (row.length > 0 && ratio > bestRatio) break;
            row.push(item);
            rowWeight = nextWeight;
            bestRatio = ratio;
        }

        const rowArea = (rowWeight / total) * width * height;
        const thickness = rowArea / side;
        let offset = 0;

        for (const item of row) {
            const length = ((item.weight / rowWeight) * rowArea) / thickness;
            tiles.push(
                horizontal
                    ? { stock: item.stock, x: left, y: top + offset, w: thickness, h: length }
                    : { stock: item.stock, x: left + offset, y: top, w: length, h: thickness },
            );
            offset += length;
        }

        if (horizontal) {
            left += thickness;
            width -= thickness;
        } else {
            top += thickness;
            height -= thickness;
        }
        rest = rest.slice(row.length);
    }

    return tiles;
}

interface HeatmapProps {
    stocks: Stock[];
    onSelect: (symbol: string) => void;
    height?: number;
}

export function Heatmap({ stocks, onSelect, height = 560 }: HeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(node);
        setWidth(node.getBoundingClientRect().width);
        return () => observer.disconnect();
    }, []);

    const tiles = useMemo(() => {
        if (width <= 0 || stocks.length === 0) return [];
        const items = [...stocks]
            .sort((a, b) => b.changePercent - a.changePercent)
            .map((stock) => ({
                stock,
                weight: 100 + Math.min(Math.abs(stock.changePercent) * 4, 20),
            }));
        return squarify(items, 0, 0, width, height);
    }, [stocks, width, height]);

    return (
        <div>
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-xl"
                style={{ height }}
            >
                {tiles.map(({ stock, x, y, w, h }) => {
                    const compact = w < 78 || h < 46;
                    return (
                        <button
                            key={stock.symbol}
                            type="button"
                            onClick={() => onSelect(stock.symbol)}
                            title={`${stock.symbol} · ${stock.company} · ₵${stock.price.toFixed(2)} (${
                                stock.changePercent >= 0 ? "+" : ""
                            }${stock.changePercent.toFixed(2)}%)`}
                            className="absolute flex flex-col items-center justify-center overflow-hidden rounded-[3px] p-1 text-center leading-tight text-white transition-[filter] hover:brightness-125 focus:z-10 focus:outline-none focus:ring-2 focus:ring-ink/40"
                            style={{
                                left: x + 1,
                                top: y + 1,
                                width: Math.max(0, w - 2),
                                height: Math.max(0, h - 2),
                                backgroundColor: heatColor(stock.changePercent),
                            }}
                        >
                            <span className={compact ? "text-[9px] font-bold" : "text-xs font-bold"}>
                                {stock.symbol}
                            </span>
                            {!compact && (
                                <span className="font-mono text-[10px] opacity-90">
                                    {stock.changePercent >= 0 ? "+" : ""}
                                    {stock.changePercent.toFixed(2)}%
                                </span>
                            )}
                        </button>
                    );
                })}

                {tiles.length === 0 && (
                    <div className="flex h-full items-center justify-center text-sm text-ink/40">
                        No stocks match your search
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-3">
                <span className="font-mono text-[11px] text-ink/40">-5%</span>
                <div className="flex h-2 w-56 overflow-hidden rounded-full">
                    {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((p) => (
                        <div key={p} className="flex-1" style={{ backgroundColor: heatColor(p) }} />
                    ))}
                </div>
                <span className="font-mono text-[11px] text-ink/40">+5%</span>
            </div>
        </div>
    );
}
