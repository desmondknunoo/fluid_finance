import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/lib/history";

interface PriceChartProps {
    points: PricePoint[];
    positive: boolean;
    height?: number;
    /** Currency prefix for axis and tooltip labels. */
    unit?: string;
    className?: string;
}

const PAD = { left: 6, right: 56, top: 14, bottom: 26 };

function niceTicks(min: number, max: number, count: number): number[] {
    if (!(max > min)) return [min];
    const rawStep = (max - min) / count;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const step = (normalized >= 5 ? 10 : normalized >= 2 ? 5 : normalized >= 1 ? 2 : 1) * magnitude;
    const ticks: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) {
        ticks.push(Number(v.toFixed(6)));
    }
    return ticks;
}

function axisPrice(value: number): string {
    if (value >= 1000) return value.toFixed(0);
    if (value >= 100) return value.toFixed(1);
    return value.toFixed(2);
}

function labelForSpan(ms: number, spanDays: number): string {
    const d = new Date(ms);
    if (spanDays > 400) return String(d.getUTCFullYear());
    if (spanDays > 60) return d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function fullDate(ms: number): string {
    return new Date(ms).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function PriceChart({ points, positive, height = 300, unit = "₵", className }: PriceChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [hover, setHover] = useState<number | null>(null);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(node);
        setWidth(node.getBoundingClientRect().width);
        return () => observer.disconnect();
    }, []);

    const stroke = positive ? "#34d399" : "#fb7185";
    const gradientId = useMemo(
        () => `ff-chart-${positive ? "up" : "down"}-${Math.round(height)}`,
        [positive, height],
    );

    const geometry = useMemo(() => {
        if (width <= 0 || points.length < 2) return null;

        const innerW = Math.max(width - PAD.left - PAD.right, 1);
        const innerH = Math.max(height - PAD.top - PAD.bottom, 1);

        const closes = points.map((p) => p.close);
        const rawMin = Math.min(...closes);
        const rawMax = Math.max(...closes);
        const pad = (rawMax - rawMin || rawMax * 0.1 || 1) * 0.12;
        const min = Math.max(0, rawMin - pad);
        const max = rawMax + pad;
        const span = max - min || 1;

        const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
        const y = (v: number) => PAD.top + (1 - (v - min) / span) * innerH;

        // Linear segments — the series is drawn as a plain line graph, not smoothed.
        const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.close).toFixed(2)}`).join(" ");
        const area = `${line} L${x(points.length - 1).toFixed(2)},${(PAD.top + innerH).toFixed(2)} L${x(0).toFixed(
            2,
        )},${(PAD.top + innerH).toFixed(2)} Z`;

        const spanDays = (points[points.length - 1].t - points[0].t) / 86_400_000;
        const tickCount = width < 420 ? 4 : 6;
        const xTicks: { x: number; label: string }[] = [];
        const seen = new Set<string>();
        for (let k = 0; k < tickCount; k++) {
            const i = Math.round((k / (tickCount - 1)) * (points.length - 1));
            const label = labelForSpan(points[i].t, spanDays);
            if (seen.has(label)) continue;
            seen.add(label);
            xTicks.push({ x: x(i), label });
        }

        const yTicks = niceTicks(min, max, 4)
            .filter((v) => y(v) > PAD.top - 2 && y(v) < PAD.top + innerH + 2)
            .map((v) => ({ y: y(v), label: axisPrice(v) }));

        // Index of the first genuinely observed close, for the recorded-data marker.
        const firstRecorded = points.findIndex((p) => p.recorded);

        return {
            x,
            y,
            line,
            area,
            xTicks,
            yTicks,
            innerH,
            innerW,
            lastX: x(points.length - 1),
            lastY: y(points[points.length - 1].close),
            recordedX: firstRecorded > 0 ? x(firstRecorded) : null,
        };
    }, [points, width, height]);

    const handleMove = useCallback(
        (clientX: number) => {
            const node = containerRef.current;
            if (!node || points.length < 2) return;
            const rect = node.getBoundingClientRect();
            const innerW = Math.max(rect.width - PAD.left - PAD.right, 1);
            const ratio = (clientX - rect.left - PAD.left) / innerW;
            const index = Math.round(Math.min(1, Math.max(0, ratio)) * (points.length - 1));
            setHover(index);
        },
        [points.length],
    );

    const active = hover !== null && geometry ? points[hover] : null;

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full select-none", className)}
            style={{ height }}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseLeave={() => setHover(null)}
            onTouchStart={(e) => handleMove(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={() => setHover(null)}
        >
            {geometry && (
                <svg width={width} height={height} className="overflow-visible">
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* horizontal grid + right-hand price axis */}
                    {geometry.yTicks.map((tick) => (
                        <g key={`y-${tick.label}-${tick.y}`}>
                            <line
                                x1={PAD.left}
                                x2={PAD.left + geometry.innerW}
                                y1={tick.y}
                                y2={tick.y}
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth={1}
                            />
                            <text
                                x={PAD.left + geometry.innerW + 10}
                                y={tick.y + 4}
                                fill="rgba(255,255,255,0.35)"
                                fontSize={11}
                                fontFamily="monospace"
                            >
                                {tick.label}
                            </text>
                        </g>
                    ))}

                    {/* boundary between backfilled and recorded data */}
                    {geometry.recordedX !== null && (
                        <line
                            x1={geometry.recordedX}
                            x2={geometry.recordedX}
                            y1={PAD.top}
                            y2={PAD.top + geometry.innerH}
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth={1}
                            strokeDasharray="3 4"
                        />
                    )}

                    <path d={geometry.area} fill={`url(#${gradientId})`} />
                    <path
                        d={geometry.line}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={1.75}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* last close marker */}
                    <line
                        x1={PAD.left}
                        x2={PAD.left + geometry.innerW}
                        y1={geometry.lastY}
                        y2={geometry.lastY}
                        stroke={stroke}
                        strokeOpacity={0.4}
                        strokeWidth={1}
                        strokeDasharray="2 4"
                    />
                    <rect
                        x={PAD.left + geometry.innerW + 4}
                        y={geometry.lastY - 9}
                        width={PAD.right - 8}
                        height={18}
                        rx={4}
                        fill={stroke}
                    />
                    <text
                        x={PAD.left + geometry.innerW + 4 + (PAD.right - 8) / 2}
                        y={geometry.lastY + 4}
                        fill="#0a0a0a"
                        fontSize={11}
                        fontWeight={700}
                        fontFamily="monospace"
                        textAnchor="middle"
                    >
                        {axisPrice(points[points.length - 1].close)}
                    </text>

                    {/* x axis */}
                    {geometry.xTicks.map((tick) => (
                        <text
                            key={`x-${tick.label}`}
                            x={tick.x}
                            y={height - 6}
                            fill="rgba(255,255,255,0.35)"
                            fontSize={11}
                            textAnchor="middle"
                        >
                            {tick.label}
                        </text>
                    ))}

                    {/* hover crosshair */}
                    {active && hover !== null && (
                        <g>
                            <line
                                x1={geometry.x(hover)}
                                x2={geometry.x(hover)}
                                y1={PAD.top}
                                y2={PAD.top + geometry.innerH}
                                stroke="rgba(255,255,255,0.25)"
                                strokeWidth={1}
                            />
                            <circle
                                cx={geometry.x(hover)}
                                cy={geometry.y(active.close)}
                                r={4}
                                fill={stroke}
                                stroke="#000"
                                strokeWidth={2}
                            />
                        </g>
                    )}
                </svg>
            )}

            {active && hover !== null && geometry && (
                <div
                    className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-black/90 px-3 py-2 backdrop-blur-sm"
                    style={{
                        left: Math.min(Math.max(geometry.x(hover) - 60, 0), Math.max(width - 130, 0)),
                        top: 0,
                    }}
                >
                    <div className="font-mono text-sm font-semibold text-white">
                        {unit}
                        {active.close.toFixed(2)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">{fullDate(active.t)}</div>
                    {!active.recorded && (
                        <div className="mt-0.5 text-[10px] text-amber-400/70">backfilled</div>
                    )}
                </div>
            )}

            {!geometry && (
                <div className="flex h-full items-center justify-center text-sm text-white/30">
                    Not enough data to chart
                </div>
            )}
        </div>
    );
}

interface SparklineProps {
    points: number[];
    positive: boolean;
    width?: number;
    height?: number;
    className?: string;
}

export function Sparkline({ points, positive, width = 88, height = 28, className }: SparklineProps) {
    if (points.length < 2) return <div style={{ width, height }} className={className} />;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const d = points
        .map((v, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((v - min) / span) * height;
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    return (
        <svg width={width} height={height} className={className} aria-hidden="true">
            <path
                d={d}
                fill="none"
                stroke={positive ? "#34d399" : "#fb7185"}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}
