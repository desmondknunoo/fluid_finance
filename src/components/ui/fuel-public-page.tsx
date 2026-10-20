import { useEffect, useMemo, useState } from "react";
import { Share2, TrendingDown, TrendingUp } from "lucide-react";
import { averageFuelPrice, formatFuelChange, formatFuelDate, formatFuelPrice, fuelPriceChange, fuelRowChange, FUEL_TYPES, type FuelReport, type FuelType } from "@/lib/fuel-prices";
import { listPublicFuelReports } from "@/lib/community";
import { FuelShareSheet } from "@/components/stock/fuel-share-sheet";
import { EmptyState, Notice } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { cn } from "@/lib/utils";

/** The public, read-only pump report. Editing lives in the team portal. */
export default function FuelPublicPage() {
    const [reports, setReports] = useState<FuelReport[] | null>(null);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sharing, setSharing] = useState<FuelReport | null>(null);
    const [sortBy, setSortBy] = useState<FuelType | "name">("petrol");

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
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Fluid Pump Report"
                title="Fuel prices across Ghana"
                description="Pump prices by oil marketing company, recorded by the Fluid Finance team. Prices are in GHS per litre and may change at the pump."
                action={report && <button type="button" onClick={() => setSharing(report)} aria-label="Share report" title="Share report" className="news-icon-button h-10 w-10"><Share2 size={16} aria-hidden="true" /></button>}
            />

            {error ? <Notice tone="error">{error}</Notice> : reports === null ? (
                <div className="news-skeleton h-72" aria-busy="true" />
            ) : !report ? (
                <EmptyState title="No pump report published yet">The first report will appear here as soon as the team records it.</EmptyState>
            ) : (
                <>
                    {/* Edition picker: every published report, newest first. */}
                    <div className="news-tabs" role="tablist" aria-label="Report edition">
                        {reports.map((item) => (
                            <button key={item.id} type="button" role="tab" onClick={() => setSelectedId(item.id)} aria-selected={item.id === report.id} aria-current={item.id === report.id ? "true" : undefined} className="news-tab">
                                {formatFuelDate(item.report_date)}
                            </button>
                        ))}
                    </div>

                    <section aria-labelledby="report-heading">
                        <p className="news-kicker">Report date</p>
                        <h2 id="report-heading" className="news-headline mt-2">{formatFuelDate(report.report_date)}</h2>

                        <div className="news-stats mt-6">
                            {FUEL_TYPES.map((type) => <Average key={type} label={type} value={averageFuelPrice(report.prices, type)} prior={previous ? averageFuelPrice(previous.prices, type) : null} />)}
                            <div className="news-stat">
                                <span>Companies</span>
                                <strong>{report.prices.length}</strong>
                            </div>
                        </div>

                        <div className="news-table-wrap mt-6">
                            <table className="news-table min-w-[40rem]">
                                <caption className="sr-only">Fuel prices in GHS per litre for {formatFuelDate(report.report_date)}</caption>
                                <thead>
                                    <tr>
                                        <SortHeader active={sortBy === "name"} onClick={() => setSortBy("name")}>OMC</SortHeader>
                                        {FUEL_TYPES.map((type) => <SortHeader key={type} active={sortBy === type} onClick={() => setSortBy(type)} className="num">{type}</SortHeader>)}
                                        {FUEL_TYPES.map((type) => <th key={`${type}-change`} scope="col" className="num" title={previous ? `Compared with ${formatFuelDate(previous.report_date)}` : undefined}>{type} %</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.name}>
                                            <th scope="row" className="font-medium text-ink">
                                                <span className="flex items-center gap-3">
                                                    {row.logo_url ? <img src={row.logo_url} alt="" className="h-6 w-6 shrink-0 border border-ink/[0.19] bg-white object-contain" /> : <span className="grid h-6 w-6 shrink-0 place-items-center border border-ink/[0.19] bg-ink/[0.055] text-[10px] font-bold text-ink/[0.68]">{row.name.slice(0, 2).toUpperCase()}</span>}
                                                    {row.name}
                                                </span>
                                            </th>
                                            {FUEL_TYPES.map((type) => <td key={type} className={cn("num", row[type] === null ? "text-ink/40" : "font-semibold text-ink")}>{formatFuelPrice(row[type])}</td>)}
                                            {(() => { const change = fuelRowChange(row, previous); return FUEL_TYPES.map((type) => <td key={`${type}-change`} className="num"><ChangeValue value={change[type]} /></td>); })()}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="news-byline mt-3">Recorded {new Date(report.created_at).toLocaleString("en-GB", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" })} GMT · {report.prices.length} OMCs · {previous ? `Petrol % and diesel % compare with ${formatFuelDate(previous.report_date)}` : "No earlier report to compare"} · Click a column to sort.</p>
                    </section>

                    <section className="news-section" aria-labelledby="history-heading">
                        <header className="news-section-header">
                            <h2 id="history-heading">Earlier reports</h2>
                            <span>Average petrol price shown. Prices are gathered from OMC published boards and may differ at individual stations.</span>
                        </header>
                        <div className="news-table-wrap">
                            <table className="news-table">
                                <thead>
                                    <tr><th scope="col">Report</th><th scope="col" className="num">Avg petrol</th><th scope="col" className="num">Avg diesel</th><th scope="col" className="num">OMCs</th></tr>
                                </thead>
                                <tbody>
                                    {reports.map((item) => (
                                        <tr key={item.id} className={cn(item.id === report.id && "bg-fluid-cyan/10")}>
                                            <th scope="row" className="font-medium">
                                                <button type="button" onClick={() => setSelectedId(item.id)} aria-current={item.id === report.id ? "true" : undefined} className={cn("text-left hover:underline", item.id === report.id ? "text-fluid-cyan-ink" : "text-ink")}>
                                                    {formatFuelDate(item.report_date)}
                                                </button>
                                            </th>
                                            <td className="num text-ink">{formatFuelPrice(averageFuelPrice(item.prices, "petrol"))}</td>
                                            <td className="num text-ink">{formatFuelPrice(averageFuelPrice(item.prices, "diesel"))}</td>
                                            <td className="num text-ink/[0.68]">{item.prices.length}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
            {sharing && <FuelShareSheet report={sharing} previous={reports?.[reports.findIndex((item) => item.id === sharing.id) + 1] ?? null} onClose={() => setSharing(null)} />}
        </main>
    );
}

/**
 * Pump prices read the opposite way to equities: a rise costs the motorist, so increases take the
 * rose pill and decreases the green one.
 */
const changePill = (value: number | null) => value === null || value === 0 ? "news-pill--neutral" : value > 0 ? "news-pill--down" : "news-pill--up";

/** One fuel's % change for an OMC against the previous report. */
function ChangeValue({ value }: { value: number | null }) {
    return <span className={cn("news-pill news-mono", changePill(value))}>{formatFuelChange(value)}</span>;
}

function Average({ label, value, prior }: { label: string; value: number | null; prior: number | null }) {
    const delta = fuelPriceChange(value, prior);
    return (
        <div className="news-stat">
            <span>Avg {label} · GHS/L</span>
            <strong>{formatFuelPrice(value)}</strong>
            {delta !== null && delta !== 0 && (
                <p className={cn("mt-2 inline-flex items-center gap-1 text-xs font-semibold news-mono", delta > 0 ? "news-down" : "news-up")}>
                    {delta > 0 ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}{formatFuelChange(delta)}
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
