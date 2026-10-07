import { useCallback, useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { FUEL_TYPES, formatFuelDate, formatFuelPrice, type FuelReport } from "@/lib/fuel-prices";
import { listFuelReports } from "@/lib/fuel-reports";
import { FuelShareSheet } from "@/components/stock/fuel-share-sheet";

const buttonClass = "rounded-lg border border-ink/20 px-4 py-3 text-sm font-medium hover:bg-ink/5 focus-visible:outline-fluid-cyan disabled:opacity-40";
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";

// Editor sign-in is disabled for now: this page is public and read-only. The sign-in form, draft
// editor and save flow were removed; git history has them for re-enabling.
export default function FuelPricesPage() {
    const [reports, setReports] = useState<FuelReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [sharing, setSharing] = useState<FuelReport | null>(null);
    const load = useCallback(async () => {
        setLoading(true); setLoadError("");
        try { setReports(await listFuelReports("")); }
        catch (err) { setLoadError(errorText(err)); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => {
        const previousTitle = document.title;
        document.title = "Fluid Pump Report";
        const robots = document.createElement("meta");
        robots.name = "robots"; robots.content = "noindex, nofollow";
        document.head.appendChild(robots);
        void load();
        return () => { document.title = previousTitle; robots.remove(); };
    }, [load]);

    return <main className="page-container py-10 sm:py-16">
        <div className="mx-auto max-w-5xl">
            <BrandLogo className="mb-10 h-12" />
            <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
                <div><h1 className="text-3xl font-bold sm:text-5xl">Fluid Pump Report</h1><p className="mt-4 max-w-2xl text-ink/60">Fuel prices across Ghana, published as dated reports you can share.</p></div>
            </div>
            <section aria-labelledby="saved-fuel-reports"><div className="mb-5 flex items-center justify-between gap-3"><h2 id="saved-fuel-reports" className="text-2xl font-semibold">Saved reports</h2><button disabled={loading} className={buttonClass} onClick={load}>{loading ? "Loading…" : "Refresh"}</button></div>
                {loadError ? <p role="alert" className="py-5 text-rose-400">{loadError}</p> : loading ? <p role="status" className="py-8 text-ink/60">Loading fuel reports…</p> : !reports.length ? <p className="border-y border-ink/15 py-10 text-ink/60">No fuel reports yet. Check back soon.</p> : reports.map(report => <article key={report.id} className="border-t border-ink/15 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">{formatFuelDate(report.report_date)}</h3><p className="mt-1 text-xs text-ink/60">{report.prices.length} suppliers · Saved {new Date(report.created_at).toLocaleString("en-GB", { timeZone: "Africa/Accra" })} GMT</p></div><button onClick={() => setSharing(report)} className={`${buttonClass} inline-flex items-center gap-2`}><Share2 size={16} />Share report</button></div>
                    <details className="mt-4"><summary className="cursor-pointer text-sm text-fluid-cyan-ink">View prices</summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[430px] text-left text-sm"><caption className="sr-only">Fuel prices in GHS per litre for {formatFuelDate(report.report_date)}</caption><thead><tr><th scope="col" className="py-3">Supplier</th>{FUEL_TYPES.map(type => <th key={type} scope="col" className="py-3 text-right capitalize">{type}</th>)}</tr></thead><tbody>{report.prices.map(row => <tr key={row.name} className="border-t border-ink/10"><th scope="row" className="py-3 font-medium"><span className="flex items-center gap-2">{row.logo_url && <img src={row.logo_url} alt="" className="h-8 w-8 rounded bg-white object-contain" />}{row.name}</span></th>{FUEL_TYPES.map(type => <td key={type} className="py-3 text-right tabular-nums">{formatFuelPrice(row[type])}</td>)}</tr>)}</tbody></table></div></details>
                </article>)}
            </section>
        </div>
        {sharing && <FuelShareSheet report={sharing} onClose={() => setSharing(null)} />}
    </main>;
}
