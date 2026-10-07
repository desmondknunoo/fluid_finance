import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Save, Share2, Trash2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { averageFuelPrice, blankFuelRow, DEFAULT_SUPPLIERS, FUEL_TYPES, MAX_OMCS, formatFuelDate, formatFuelPrice, validateFuelReport, mergeOmcLibrary, type FuelDraftRow, type FuelReport, type Omc } from "@/lib/fuel-prices";
import { deleteFuelReport, listFuelReports, saveFuelReport, listOmcs, updateFuelReport, uploadOmcLogo } from "@/lib/fuel-reports";
import { FuelShareSheet } from "@/components/stock/fuel-share-sheet";
import { sortFuelRows, type FuelSort, type FuelType } from "@/lib/fuel-prices";

const inputClass = "w-full min-w-0 rounded-lg border border-ink/20 bg-canvas px-3 py-3 text-sm text-ink placeholder:text-ink/50 focus:border-fluid-cyan focus:outline-none focus:ring-1 focus:ring-fluid-cyan";
const buttonClass = "rounded-lg border border-ink/20 px-4 py-3 text-sm font-medium hover:bg-ink/5 focus-visible:outline-fluid-cyan disabled:opacity-40";
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";

// No sign-in: anyone with the link can record, update and delete reports.
export default function FuelPricesPage() {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [rows, setRows] = useState<FuelDraftRow[]>(DEFAULT_SUPPLIERS.map(blankFuelRow));
    const [reports, setReports] = useState<FuelReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<FuelReport | null>(null);
    const [sharing, setSharing] = useState<FuelReport | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [omcs, setOmcs] = useState<Omc[]>([]);
    const [uploading, setUploading] = useState(false);
    const [bulkNames, setBulkNames] = useState("");
    const [selectedOmc, setSelectedOmc] = useState("");
    const [sortOrder, setSortOrder] = useState<FuelSort>("popular");
    const [sortFuel, setSortFuel] = useState<FuelType>("petrol");
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
        void (async () => {
            try {
                const [initialReports, uploaded] = await Promise.all([listFuelReports(""), listOmcs("")]);
                const library = mergeOmcLibrary(uploaded);
                setOmcs(library);
                const names = [...DEFAULT_SUPPLIERS, ...library.filter(omc => !DEFAULT_SUPPLIERS.some(name => name.toLowerCase() === omc.name.toLowerCase())).map(omc => omc.name)];
                setRows(names.slice(0, MAX_OMCS).map(name => ({ ...blankFuelRow(name), logo_url: library.find(omc => omc.name.toLowerCase() === name.toLowerCase())?.logo_url })));
                setReports(initialReports);
            } catch (err) { setLoadError(errorText(err)); }
            finally { setLoading(false); }
        })();
        return () => { document.title = previousTitle; robots.remove(); };
    }, []);
    const changed = () => { setSaved(null); setSuccess(""); setError(""); };
    const update = (index: number, field: keyof FuelDraftRow, value: string) => { changed(); setRows(current => current.map((row, i) => i === index ? { ...row, [field]: value, ...(field === "name" ? { logo_url: omcs.find(omc => omc.name.toLowerCase() === value.trim().toLowerCase())?.logo_url } : {}) } : row)); };
    const addNames = (names: string[]) => {
        const existing = new Set(rows.map(row => row.name.trim().toLowerCase()));
        const added: FuelDraftRow[] = [];
        for (const raw of names) {
            const name = raw.trim();
            if (!name || existing.has(name.toLowerCase())) continue;
            if (name.length > 60) { setError(`OMC names must be at most 60 characters: ${name}`); return; }
            existing.add(name.toLowerCase());
            added.push({ ...blankFuelRow(name), logo_url: omcs.find(omc => omc.name.toLowerCase() === name.toLowerCase())?.logo_url });
        }
        if (rows.length + added.length > MAX_OMCS) { setError(`A report can include up to ${MAX_OMCS} OMCs.`); return; }
        changed(); setRows(current => [...current, ...added]); setBulkNames(""); setSelectedOmc("");
    };
    const uploadLogo = async (index: number, file: File) => {
        changed(); setUploading(true);
        try {
            const omc = await uploadOmcLogo("", rows[index].name, file);
            setOmcs(current => [...current.filter(item => item.name.toLowerCase() !== omc.name.toLowerCase()), omc].sort((a, b) => a.name.localeCompare(b.name)));
            setRows(current => current.map((row, i) => i === index ? { ...row, name: omc.name, logo_url: omc.logo_url } : row));
        } catch (err) { setError(errorText(err)); }
        finally { setUploading(false); }
    };
    const editReport = (report: FuelReport) => {
        if (saved === null && rows.some(row => FUEL_TYPES.some(type => row[type] !== "")) && !window.confirm("Replace the current unsaved draft with this report?")) return;
        changed(); setEditingId(report.id); setDate(report.report_date);
        setRows(report.prices.map(row => ({ name: row.name, logo_url: row.logo_url || omcs.find(omc => omc.name.toLowerCase() === row.name.toLowerCase())?.logo_url, petrol: row.petrol?.toFixed(2) ?? "", diesel: row.diesel?.toFixed(2) ?? "", premium: row.premium?.toFixed(2) ?? "" })));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const startNew = () => { setEditingId(null); setSaved(null); setSuccess(""); setError(""); setDate(new Date().toISOString().slice(0, 10)); setRows(DEFAULT_SUPPLIERS.map(blankFuelRow)); };
    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (saving || uploading) return;
        setError(""); setSuccess("");
        try {
            validateFuelReport(date, rows, true);
            setSaving(true);
            const report = editingId ? await updateFuelReport(editingId, date, rows) : await saveFuelReport("", date, rows);
            setSaved(report);
            setReports(current => [report, ...current.filter(item => item.id !== report.id)].sort((a, b) => b.report_date.localeCompare(a.report_date) || b.created_at.localeCompare(a.created_at)).slice(0, 100));
            setLoadError("");
            setSuccess(editingId ? "Report updated." : `Report saved. ${Math.ceil(report.prices.length / 10)} share image(s), with up to 10 OMCs each, are ready to generate.`);
        } catch (err) { setError(errorText(err)); }
        finally { setSaving(false); }
    };
    const removeReport = async (report: FuelReport) => {
        if (deletingId) return;
        if (!window.confirm(`Delete the report for ${formatFuelDate(report.report_date)}? This cannot be undone.`)) return;
        setDeletingId(report.id); setError("");
        try {
            await deleteFuelReport(report.id);
            setReports(current => current.filter(item => item.id !== report.id));
            if (editingId === report.id) startNew();
            if (saved?.id === report.id) { setSaved(null); setSharing(null); }
        } catch (err) { setError(errorText(err)); }
        finally { setDeletingId(null); }
    };
    let draftPrices: ReturnType<typeof validateFuelReport> = [];
    try { draftPrices = validateFuelReport(date, rows); } catch { /* Averages appear when the draft is valid. */ }

    return <main className="page-container py-10 sm:py-16">
        <div className="mx-auto max-w-5xl">
            <BrandLogo className="mb-10 h-12" />
            <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
                <div><h1 className="text-3xl font-bold sm:text-5xl">Fluid Pump Report</h1><p className="mt-4 max-w-2xl text-ink/60">Fuel prices across Ghana. Record a dated report and share it with the Fluid Finance community.</p></div>
            </div>
            {error && <p role="alert" className="mb-6 rounded-lg border border-rose-400/40 p-4 text-rose-400">{error}</p>}
            <form onSubmit={save} className="mb-14">
                <fieldset disabled={saving || uploading}>
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><label className="block max-w-xs text-sm font-medium">Report date<input required type="date" value={date} onChange={e => { changed(); setDate(e.target.value); }} className={`${inputClass} mt-2`} /></label><p className="text-sm text-ink/60">GHS per litre · Leave unavailable prices blank.</p></div>
                    {editingId && <p className="mb-6 rounded-lg bg-fluid-cyan/10 px-4 py-3 text-sm text-fluid-cyan-ink">Updating the saved report for {formatFuelDate(date)}. Saving overwrites that edition. <button type="button" onClick={startNew} className="font-semibold underline underline-offset-4">Start a new report instead</button></p>}
                    <details className="mb-6 border-y border-ink/15 py-4">
                        <summary className="cursor-pointer font-medium">Add OMCs from your list or library</summary>
                        <p className="mt-3 text-sm text-ink/60">Paste one company name per line. Upload a logo for every new OMC. Names and logos are saved to your library for future reports.</p>
                        <label className="mt-4 block text-sm">OMC list<textarea rows={5} value={bulkNames} onChange={e => setBulkNames(e.target.value)} placeholder="One OMC name per line" className={`${inputClass} mt-2`} /></label>
                        <button type="button" disabled={!bulkNames.trim()} onClick={() => addNames(bulkNames.split(/\r?\n/))} className={`${buttonClass} mt-3`}>Add names to report</button>
                        {omcs.length > 0 && <div className="mt-5 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm">Saved OMC library<select value={selectedOmc} onChange={e => setSelectedOmc(e.target.value)} className={`${inputClass} mt-2`}><option value="">Choose an OMC</option>{omcs.filter(omc => !rows.some(row => row.name.trim().toLowerCase() === omc.name.toLowerCase())).map(omc => <option key={omc.name} value={omc.name}>{omc.name}</option>)}</select></label><button type="button" disabled={!selectedOmc} onClick={() => addNames([selectedOmc])} className={buttonClass}>Add selected OMC</button></div>}
                    </details>
                    <div className="mb-6">
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="min-w-0 flex-1 text-sm font-medium">Arrangement<select value={sortOrder} onChange={e => setSortOrder(e.target.value as FuelSort)} className={`${inputClass} mt-2`}>
                                <option value="az">A to Z</option><option value="za">Z to A</option><option value="price-asc">Lowest price to highest</option><option value="price-desc">Highest price to lowest</option><option value="popular">Popular</option>
                            </select></label>
                            {sortOrder.startsWith("price-") && <label className="text-sm font-medium">Price to compare<select value={sortFuel} onChange={e => setSortFuel(e.target.value as FuelType)} className={`${inputClass} mt-2`}><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="premium">Premium</option></select></label>}
                            <button type="button" className={buttonClass} onClick={() => { changed(); setRows(current => sortFuelRows(current, sortOrder, sortFuel)); }}>Apply arrangement</button>
                        </div>
                        <p className="mt-2 text-xs text-ink/60">Apply after entering prices, then save. This row order is used across all share pages. Missing prices sort last; unranked OMCs follow the popularity list alphabetically.</p>
                    </div>
                    <p className="mb-4 text-sm text-ink/60">{rows.length} OMCs · {Math.ceil(rows.length / 10)} share image(s) · {rows.filter(row => !row.logo_url).length} logos needed</p>
                    <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_44px] gap-3 border-b border-ink/15 pb-3 text-sm font-semibold md:grid"><span>OMC and logo</span><span>Petrol</span><span>Diesel</span><span>Premium</span><span className="sr-only">Actions</span></div>
                    <div>{rows.map((row, index) => <div key={index} className="grid grid-cols-3 gap-3 border-b border-ink/15 py-4 md:grid-cols-[2fr_1fr_1fr_1fr_44px] md:items-end">
                        <div className="col-span-2 min-w-0 md:col-span-1"><label className="text-xs text-ink/60"><span className="md:sr-only">Supplier {index + 1}</span><input aria-label={`Supplier ${index + 1}`} required maxLength={60} value={row.name} onChange={e => update(index, "name", e.target.value)} className={`${inputClass} mt-1 md:mt-0`} /></label><div className="mt-2 flex min-w-0 items-center gap-2">{row.logo_url && <img key={row.logo_url} src={row.logo_url} alt={`${row.name} logo`} className="h-10 w-10 rounded-md bg-white object-contain" onError={() => { setRows(current => current.map((item, i) => i === index && item.logo_url === row.logo_url ? { ...item, logo_url: undefined } : item)); setSaved(null); setError(`The logo for ${row.name} could not load. Upload it again before sharing.`); }} />}<label className="min-w-0 flex-1 text-xs text-ink/70">{row.logo_url ? "Replace logo" : "Logo required"}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label={`${row.name || `Supplier ${index + 1}`} logo upload`} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void uploadLogo(index, file); }} className="mt-1 block w-full min-w-0 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-ink/10 file:px-2 file:py-2 file:text-ink" /></label></div></div>
                        <button type="button" aria-label={`Remove ${row.name || `supplier ${index + 1}`}`} disabled={rows.length === 1} onClick={() => { changed(); setRows(current => current.filter((_row, i) => i !== index)); }} className="justify-self-end rounded-lg p-3 text-ink/60 hover:bg-rose-400/10 hover:text-rose-400 disabled:opacity-30 md:order-last"><Trash2 size={18} /></button>
                        {FUEL_TYPES.map(type => <label key={type} className="text-xs capitalize text-ink/60"><span className="md:sr-only">{type}</span><input aria-label={`${row.name || `Supplier ${index + 1}`} ${type}`} inputMode="decimal" type="number" min="0.01" max="9999.99" step="0.01" placeholder="—" value={row[type]} onChange={e => update(index, type, e.target.value)} className={`${inputClass} mt-1 tabular-nums md:mt-0`} /></label>)}
                    </div>)}</div>
                    <button type="button" disabled={rows.length >= MAX_OMCS} onClick={() => { changed(); setRows(current => [...current, blankFuelRow()]); }} className={`${buttonClass} mt-4 inline-flex items-center gap-2`}><Plus size={16} />Add OMC</button>
                    {draftPrices.length > 0 && <p className="mt-6 text-sm text-ink/70">Average petrol: <strong className="text-fluid-cyan-ink">GHS {formatFuelPrice(averageFuelPrice(draftPrices, "petrol"))}</strong> / litre · Average diesel: <strong className="text-fluid-cyan-ink">GHS {formatFuelPrice(averageFuelPrice(draftPrices, "diesel"))}</strong> / litre</p>}
                    <p className="mt-3 text-xs text-ink/60">Remove OMCs without prices from this report; their library entries remain available. Saving without an open edition creates a new one; saving while one is open overwrites it. All OMC logos must load before any share image is generated.</p>
                    <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving || !!saved} className="inline-flex items-center gap-2 rounded-lg bg-fluid-cyan px-5 py-3 font-semibold text-fluid-action-ink hover:bg-fluid-cyan-hover disabled:opacity-50"><Save size={18} />{saving ? "Saving…" : saved ? "Saved" : editingId ? "Update report" : "Save report"}</button><button type="button" disabled={!saved} onClick={() => saved && setSharing(saved)} className={`${buttonClass} inline-flex items-center gap-2`}><Share2 size={18} />Share saved report</button></div>
                </fieldset><p role="status" className="mt-4 text-sm text-fluid-cyan-ink">{uploading ? "Uploading and saving the OMC logo…" : success}</p>
            </form>
            <section aria-labelledby="saved-fuel-reports"><div className="mb-5 flex items-center justify-between gap-3"><h2 id="saved-fuel-reports" className="text-2xl font-semibold">Saved reports</h2><button disabled={loading} className={buttonClass} onClick={load}>{loading ? "Loading…" : "Refresh"}</button></div>
                {loadError ? <p role="alert" className="py-5 text-rose-400">{loadError}</p> : loading ? <p role="status" className="py-8 text-ink/60">Loading fuel reports…</p> : !reports.length ? <p className="border-y border-ink/15 py-10 text-ink/60">No fuel reports yet. Record the first report above.</p> : reports.map(report => <article key={report.id} className="border-t border-ink/15 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">{formatFuelDate(report.report_date)}</h3><p className="mt-1 text-xs text-ink/60">{report.prices.length} suppliers · Saved {new Date(report.created_at).toLocaleString("en-GB", { timeZone: "Africa/Accra" })} GMT</p></div><button onClick={() => setSharing(report)} className={`${buttonClass} inline-flex items-center gap-2`}><Share2 size={16} />Share report</button></div>
                    <div className="mt-3 flex flex-wrap gap-4"><button type="button" disabled={saving || uploading} onClick={() => editReport(report)} className="text-sm text-fluid-cyan-ink underline underline-offset-4">Open in editor / add missing logos</button><button type="button" disabled={deletingId === report.id} onClick={() => void removeReport(report)} className="text-sm text-rose-400 underline underline-offset-4 disabled:opacity-40">{deletingId === report.id ? "Deleting…" : "Delete report"}</button></div>
                    <details className="mt-4"><summary className="cursor-pointer text-sm text-fluid-cyan-ink">View prices</summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[430px] text-left text-sm"><caption className="sr-only">Fuel prices in GHS per litre for {formatFuelDate(report.report_date)}</caption><thead><tr><th scope="col" className="py-3">Supplier</th>{FUEL_TYPES.map(type => <th key={type} scope="col" className="py-3 text-right capitalize">{type}</th>)}</tr></thead><tbody>{report.prices.map(row => <tr key={row.name} className="border-t border-ink/10"><th scope="row" className="py-3 font-medium"><span className="flex items-center gap-2">{row.logo_url && <img src={row.logo_url} alt="" className="h-8 w-8 rounded bg-white object-contain" />}{row.name}</span></th>{FUEL_TYPES.map(type => <td key={type} className="py-3 text-right tabular-nums">{formatFuelPrice(row[type])}</td>)}</tr>)}</tbody></table></div></details>
                </article>)}
            </section>
        </div>
        {sharing && <FuelShareSheet report={sharing} onClose={() => setSharing(null)} />}
    </main>;
}
