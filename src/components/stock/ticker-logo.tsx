import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { logoUrl, tickerHue } from "@/lib/logos";

interface TickerLogoProps {
    symbol: string;
    size?: number;
    className?: string;
}

/**
 * Company mark for a ticker. Uses the exchange logo when one is bundled and
 * falls back to a tinted initials tile for listings without artwork.
 */
export function TickerLogo({ symbol, size = 56, className }: TickerLogoProps) {
    const src = logoUrl(symbol);
    const [failed, setFailed] = useState(false);

    useEffect(() => setFailed(false), [symbol]);

    if (!src || failed) {
        const hue = tickerHue(symbol);
        return (
            <div
                className={cn("flex shrink-0 items-center justify-center rounded-xl font-bold text-white", className)}
                style={{
                    width: size,
                    height: size,
                    fontSize: size * 0.32,
                    background: `linear-gradient(135deg, hsl(${hue} 62% 42%), hsl(${(hue + 40) % 360} 58% 26%))`,
                }}
                aria-hidden="true"
            >
                {symbol.slice(0, 2)}
            </div>
        );
    }

    return (
        <div
            className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white", className)}
            style={{ width: size, height: size, padding: Math.max(3, size * 0.1) }}
        >
            <img
                src={src}
                alt={`${symbol} logo`}
                loading="lazy"
                onError={() => setFailed(true)}
                className="h-full w-full object-contain"
            />
        </div>
    );
}
