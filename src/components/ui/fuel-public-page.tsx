import { useEffect, useMemo, useState } from "react";
import { Fuel, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { averageFuelPrice, formatFuelDate, formatFuelPrice, FUEL_TYPES, type FuelReport, type FuelType } from "@/lib/fuel-prices";
import { listPublicFuelReports } from "@/lib/community";
import { FuelShareSheet } from "@/components/stock/fuel-share-sheet";
import { Notice, panelClass } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { cn } from "@/lib/utils";

/** The public, read-only pump report. Editing lives in the team portal. */
export default function FuelPublicPage() {
    const [reports, setReports] = useState<FuelReport[] | null>(null);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sharing, setSharing] = useState<FuelReport | null>(null);
    const [sortBy, setSortBy] = useState<FuelType | "name">("petrol");

    useEffect(() => { document.title = "Fuel prices in Ghana · Fluid Finance"; }, []);
    useEffect(() => {
        listPublicFuelReports(12)
            .then((data) => { setReports(data); setSelectedId(data[0]?.id ?? null); })
            .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load fuel prices."));
    }, []);

    const report = useMemo(() => reports?.find((item) => item.id === selectedId) ?? reports?.[0] ?? null, [reports, selectedId]);
    const previous = useMemo(() => {
        if (!reports || !report) return null;
        const index = reports.findIndex((item) => item.id === report.id);
        return reports[index + 1] ?? null;
    }, [reports, report]);

    const rows = useMemo(() => {
        if (!report) return [];
        return [...report.prices].sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            const left = a[sortBy], right = b[sortBy];
            if (left === null) return right === null ? a.name.localeCompare(b.name) : 1;
            if (right === null) return -1;
            return left - right || a.name.localeCompare(b.name);
        });
    }, [report, sortBy]);

    return (
        <main className="page-container py-10 sm:py-16">
            <PageIntro
                eyebrow="Fluid Pump Report"
                title="Fuel prices across Ghana"
                description="Pump prices by oil marketing company, recorded by the Fluid Finance team. Prices are in GHS per litre and may change at the pump."
                action={report && <button type="button" onClick={() => setSharing(report)} className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-ink/[0.14] px-4 text-sm font-medium text-ink/80 hover:bg-ink/[0.05]"><Share2 size={15} aria-hidden="true" /> Share report</button>}
            />

            {error ? <Notice tone="error">{error}</Notice> : reports === null ? (
                <div className="h-72 animate-pulse rounded-2xl bg-ink/[0.04]" />
            ) : !report ? (
                <div className={`${panelClass} px-6 py-16 text-center`}>
                    <Fuel size={24} className="mx-auto mb-3 text-ink/30" aria-hidden="true" />
                    <p className="text-lg font-semibold text-ink">No pump report published yet</p>
                    <p className="mt-2 text-sm text-ink/50">The first report will appear here as soon as the team records it.</p>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
                    <section className={`${panelClass} overflow-hidden`} aria-labelledby="report-heading">
                        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/[0.08] px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">Report date</p>
                                <h2 id="report-heading" className="mt-1 text-xl font-bold text-ink font-poppins">{formatFuelDate(report.report_date)}</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-right">
                                {FUEL_TYPES.map((type) => <Average key={type} label={type} value={averageFuelPrice(report.prices, type)} prior={previous ? averageFuelPrice(previous.prices, type) : null} />)}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[32rem] text-left text-sm">
                                <caption className="sr-only">Fuel prices in GHS per litre for {formatFuelDate(report.report_date)}</caption>
                                <thead>
                                    <tr className="border-b border-ink/[0.08] text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                                        <SortHeader active={sortBy === "name"} onClick={() => setSortBy("name")} className="px-5 py-3 sm:px-6">OMC</SortHeader>
                                        {FUEL_TYPES.map((type) => <SortHeader key={type} active={sortBy === type} onClick={() => setSortBy(type)} className="px-4 py-3 text-right">{type}</SortHeader>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.name} className="border-b border-ink/[0.05] last:border-0">
                                            <th scope="row" className="px-5 py-3 font-medium text-ink sm:px-6">
                                                <span className="flex items-center gap-3">
                                                    {row.logo_url ? <img src={row.logo_url} alt="" className="h-8 w-8 rounded-md bg-white object-contain" /> : <span className="grid h-8 w-8 place-items-center rounded-md bg-ink/[0.06] text-xs font-bold text-ink/50">{row.name.slice(0, 2).toUpperCase()}</span>}
                                                    {row.name}
                                                </span>
                                            </th>
                                            {FUEL_TYPES.map((type) => <td key={type} className={cn("px-4 py-3 text-right font-mono tabular-nums", row[type] === null ? "text-ink/30" : "text-ink")}>{formatFuelPrice(row[type])}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="border-t border-ink/[0.08] px-5 py-3 text-xs text-ink/40 sm:px-6">Recorded {new Date(report.created_at).toLocaleString("en-GB", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" })} GMT · {report.prices.length} OMCs · Click a column to sort.</p>
                    </section>

                    <aside className={`${panelClass} p-5`} aria-labelledby="history-heading">
                        <h2 id="history-heading" className="text-sm font-semibold uppercase tracking-wider text-ink/50">Earlier reports</h2>
                        <ul className="mt-3 divide-y divide-ink/[0.06]">
                            {reports.map((item) => (
                                <li key={item.id}>
                                    <button type="button" onClick={() => setSelectedId(item.id)} aria-current={item.id === report.id ? "true" : undefined} className={cn("flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm transition-colors", item.id === report.id ? "text-fluid-cyan-ink" : "text-ink/70 hover:text-ink")}>
                                        <span>{formatFuelDate(item.report_date)}</span>
                                        <span className="font-mono text-xs text-ink/40">{formatFuelPrice(averageFuelPrice(item.prices, "petrol"))}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-xs leading-relaxed text-ink/40">Average petrol price shown. Prices are gathered from OMC published boards and may differ at individual stations.</p>
                    </aside>
                </div>
            )}
            {sharing && <FuelShareSheet report={sharing} onClose={() => setSharing(null)} />}
        </main>
    );
}

function Average({ label, value, prior }: { label: string; value: number | null; prior: number | null }) {
    const delta = value !== null && prior !== null ? value - prior : null;
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">Avg {label}</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-ink">{formatFuelPrice(value)}</p>
            {delta !== null && Math.abs(delta) >= 0.005 && (
                <p className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", delta > 0 ? "text-rose-400" : "text-emerald-400")}>
                    {delta > 0 ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}{delta > 0 ? "+" : ""}{delta.toFixed(2)}
                </p>
            )}
        </div>
    );
}

function SortHeader({ active, onClick, className, children }: { active: boolean; onClick: () => void; className?: string; children: string }) {
    return (
        <th scope="col" className={className} aria-sort={active ? "ascending" : "none"}>
            <button type="button" onClick={onClick} className={cn("uppercase transition-colors hover:text-ink", active && "text-fluid-cyan-ink")}>{children}</button>
        </th>
    );
}
