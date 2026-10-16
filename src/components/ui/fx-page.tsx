import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Landmark } from "lucide-react";
import { formatLongDate, listFxHistory, listLatestFxRates, type FxRate } from "@/lib/community";
import { inputClass, Notice, panelClass } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { cn } from "@/lib/utils";

const CURRENCY_NAMES: Record<string, string> = {
    GHS: "Ghana cedi", USD: "US dollar", EUR: "Euro", GBP: "British pound", NGN: "Nigerian naira",
    XOF: "West African CFA franc", CNY: "Chinese yuan", ZAR: "South African rand", CAD: "Canadian dollar",
    AED: "UAE dirham", JPY: "Japanese yen", CHF: "Swiss franc", INR: "Indian rupee",
};

const formatRate = (value: number | null, digits = 4) => value === null ? "—" : value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: digits });

/** Public exchange rates and a converter driven by the latest mid rates the operations team enters. */
export default function FxPage() {
    const [rates, setRates] = useState<FxRate[] | null>(null);
    const [error, setError] = useState("");
    const [amount, setAmount] = useState("100");
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("GHS");
    const [history, setHistory] = useState<FxRate[]>([]);

    useEffect(() => { document.title = "Exchange rates · Fluid Finance"; }, []);
    useEffect(() => {
        listLatestFxRates()
            .then((data) => {
                setRates(data);
                if (data.length && !data.some((rate) => rate.base_currency === from && rate.quote_currency === to)) {
                    setFrom(data[0].base_currency);
                    setTo(data[0].quote_currency);
                }
            })
            .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load exchange rates."));
        // Only on first load: later selections should not snap back to the first pair.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currencies = useMemo(() => {
        const set = new Set<string>();
        for (const rate of rates ?? []) { set.add(rate.base_currency); set.add(rate.quote_currency); }
        return [...set].sort();
    }, [rates]);

    // Mid rates against GHS let any pair convert through the cedi when a direct quote is missing.
    const conversion = useMemo(() => {
        if (!rates) return null;
        const direct = rates.find((rate) => rate.base_currency === from && rate.quote_currency === to);
        if (direct) return { rate: Number(direct.mid), via: null as string | null, date: direct.rate_date };
        const inverse = rates.find((rate) => rate.base_currency === to && rate.quote_currency === from);
        if (inverse) return { rate: 1 / Number(inverse.mid), via: null, date: inverse.rate_date };
        const toGhs = (code: string) => code === "GHS" ? 1 : Number(rates.find((rate) => rate.base_currency === code && rate.quote_currency === "GHS")?.mid ?? NaN);
        const fromRate = toGhs(from), targetRate = toGhs(to);
        if (Number.isFinite(fromRate) && Number.isFinite(targetRate)) return { rate: fromRate / targetRate, via: "GHS", date: null };
        return null;
    }, [rates, from, to]);

    useEffect(() => {
        if (!rates?.length) return;
        const pair = rates.find((rate) => rate.base_currency === from && rate.quote_currency === to) ?? rates.find((rate) => rate.base_currency === to && rate.quote_currency === from);
        if (!pair) { setHistory([]); return; }
        listFxHistory(pair.base_currency, pair.quote_currency, 30).then(setHistory).catch(() => setHistory([]));
    }, [rates, from, to]);

    const parsedAmount = Number(amount.replace(/,/g, ""));
    const converted = conversion && Number.isFinite(parsedAmount) ? parsedAmount * conversion.rate : null;

    return (
        <main className="page-container py-10 sm:py-16">
            <PageIntro eyebrow="Currency desk" title="Exchange rates" description="Indicative cedi exchange rates recorded by the Fluid Finance operations team. Bank and forex bureau rates differ; confirm before you transact." />

            {error ? <Notice tone="error">{error}</Notice> : rates === null ? (
                <div className="h-72 animate-pulse rounded-2xl bg-ink/[0.04]" />
            ) : rates.length === 0 ? (
                <div className={`${panelClass} px-6 py-16 text-center`}>
                    <Landmark size={24} className="mx-auto mb-3 text-ink/30" aria-hidden="true" />
                    <p className="text-lg font-semibold text-ink">No rates published yet</p>
                    <p className="mt-2 text-sm text-ink/50">Rates will appear here once the team records them.</p>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                    <section className={`${panelClass} overflow-hidden`} aria-labelledby="rates-heading">
                        <div className="border-b border-ink/[0.08] px-5 py-4 sm:px-6">
                            <h2 id="rates-heading" className="text-lg font-bold text-ink font-poppins">Latest rates</h2>
                            <p className="mt-1 text-xs text-ink/40">Most recent entry per currency pair.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[34rem] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-ink/[0.08] text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                                        <th className="px-5 py-3 sm:px-6">Pair</th><th className="px-4 py-3 text-right">Buy</th><th className="px-4 py-3 text-right">Sell</th><th className="px-4 py-3 text-right">Mid</th><th className="px-4 py-3 text-right">As of</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rates.map((rate) => (
                                        <tr key={rate.id} onClick={() => { setFrom(rate.base_currency); setTo(rate.quote_currency); }} className={cn("cursor-pointer border-b border-ink/[0.05] transition-colors last:border-0 hover:bg-ink/[0.03]", rate.base_currency === from && rate.quote_currency === to && "bg-fluid-cyan/[0.06]")}>
                                            <th scope="row" className="px-5 py-3 font-medium text-ink sm:px-6">
                                                <span className="font-mono">{rate.base_currency}/{rate.quote_currency}</span>
                                                <span className="block text-xs font-normal text-ink/40">{CURRENCY_NAMES[rate.base_currency] ?? rate.base_currency} → {CURRENCY_NAMES[rate.quote_currency] ?? rate.quote_currency}</span>
                                            </th>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-ink/70">{formatRate(rate.buy === null ? null : Number(rate.buy))}</td>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-ink/70">{formatRate(rate.sell === null ? null : Number(rate.sell))}</td>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-ink">{formatRate(Number(rate.mid))}</td>
                                            <td className="px-4 py-3 text-right text-xs text-ink/50">{new Date(`${rate.rate_date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="space-y-6">
                        <section className={`${panelClass} p-5`} aria-labelledby="converter-heading">
                            <h2 id="converter-heading" className="flex items-center gap-2 text-lg font-bold text-ink font-poppins"><ArrowLeftRight size={18} className="text-fluid-cyan-ink" aria-hidden="true" /> Convert</h2>
                            <label className="mt-4 block text-sm font-medium text-ink/70">Amount
                                <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className={`${inputClass} mt-1.5 font-mono`} />
                            </label>
                            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                                <label className="block text-sm font-medium text-ink/70">From
                                    <select value={from} onChange={(event) => setFrom(event.target.value)} className={`${inputClass} mt-1.5`}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select>
                                </label>
                                <button type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap currencies" className="mb-1 grid h-10 w-10 place-items-center rounded-xl border border-ink/[0.14] text-ink/60 hover:bg-ink/[0.05]"><ArrowLeftRight size={15} /></button>
                                <label className="block text-sm font-medium text-ink/70">To
                                    <select value={to} onChange={(event) => setTo(event.target.value)} className={`${inputClass} mt-1.5`}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select>
                                </label>
                            </div>
                            <div className="mt-5 rounded-xl bg-ink/[0.04] p-4" aria-live="polite">
                                {converted === null ? (
                                    <p className="text-sm text-ink/50">No rate available for {from}/{to} yet.</p>
                                ) : (
                                    <>
                                        <p className="font-mono text-2xl font-bold text-ink">{converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base text-ink/50">{to}</span></p>
                                        <p className="mt-1 text-xs text-ink/50">1 {from} = {formatRate(conversion!.rate, 6)} {to}{conversion!.via ? ` via ${conversion!.via}` : ""}{conversion!.date ? ` · ${formatLongDate(conversion!.date)}` : ""}</p>
                                    </>
                                )}
                            </div>
                        </section>

                        {history.length > 1 && (
                            <section className={`${panelClass} p-5`} aria-labelledby="history-heading">
                                <h2 id="history-heading" className="text-sm font-semibold uppercase tracking-wider text-ink/50">{history[0].base_currency}/{history[0].quote_currency} · last {history.length} entries</h2>
                                <ul className="mt-3 divide-y divide-ink/[0.06]">
                                    {history.map((rate) => (
                                        <li key={rate.id} className="flex items-center justify-between py-2 text-sm"><span className="text-ink/60">{new Date(`${rate.rate_date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span><span className="font-mono tabular-nums text-ink">{formatRate(Number(rate.mid))}</span></li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
