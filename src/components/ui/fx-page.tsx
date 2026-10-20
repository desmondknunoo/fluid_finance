import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { formatLongDate, listFxHistory, listLatestFxRates, type FxRate } from "@/lib/community";
import { EmptyState, Notice, SelectField, TextField } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { cn } from "@/lib/utils";

const CURRENCY_NAMES: Record<string, string> = {
    GHS: "Ghana cedi", USD: "US dollar", EUR: "Euro", GBP: "British pound", NGN: "Nigerian naira",
    XOF: "West African CFA franc", CNY: "Chinese yuan", ZAR: "South African rand", CAD: "Canadian dollar",
    AED: "UAE dirham", JPY: "Japanese yen", CHF: "Swiss franc", INR: "Indian rupee",
};

const formatRate = (value: number | null, digits = 4) => value === null ? "—" : value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: digits });
const formatShortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Public exchange rates and a converter driven by the latest mid rates the operations team enters. */
export default function FxPage() {
    const [rates, setRates] = useState<FxRate[] | null>(null);
    const [error, setError] = useState("");
    const [amount, setAmount] = useState("100");
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("GHS");
    const [history, setHistory] = useState<FxRate[]>([]);

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
        <main className="page-container news-page">
            <PageIntro eyebrow="Currency desk" title="Exchange rates" description="Indicative cedi exchange rates recorded by the Fluid Finance operations team. Bank and forex bureau rates differ; confirm before you transact." />

            {error ? <Notice tone="error">{error}</Notice> : rates === null ? (
                <div className="news-skeleton h-72" aria-busy="true" />
            ) : rates.length === 0 ? (
                <EmptyState title="No rates published yet">Rates will appear here once the team records them.</EmptyState>
            ) : (
                <>
                    <div className="news-columns news-columns--main">
                        <section aria-labelledby="converter-heading">
                            <h2 id="converter-heading" className="news-subhead flex items-center gap-2"><ArrowLeftRight size={16} className="text-fluid-cyan-ink" aria-hidden="true" /> Convert</h2>
                            <div className="news-form">
                                <TextField label="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="news-mono" />
                                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                                    <SelectField label="From" value={from} onChange={(event) => setFrom(event.target.value)}>
                                        {currencies.map((code) => <option key={code} value={code}>{code}</option>)}
                                    </SelectField>
                                    <button type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap currencies" title="Swap currencies" className="news-icon-button h-[42px] w-[42px]"><ArrowLeftRight size={15} aria-hidden="true" /></button>
                                    <SelectField label="To" value={to} onChange={(event) => setTo(event.target.value)}>
                                        {currencies.map((code) => <option key={code} value={code}>{code}</option>)}
                                    </SelectField>
                                </div>
                            </div>
                            <div className="mt-6 border-t border-ink/[0.19] pt-4" aria-live="polite">
                                {converted === null ? (
                                    <p className="text-sm text-ink/[0.68]">No rate available for {from}/{to} yet.</p>
                                ) : (
                                    <>
                                        <div className="news-stat">
                                            <span>{amount || "0"} {from} in {to}</span>
                                            <strong>{converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-semibold text-ink/[0.68]">{to}</span></strong>
                                        </div>
                                        <p className="news-byline mt-3">1 {from} = <strong className="news-mono">{formatRate(conversion!.rate, 6)} {to}</strong>{conversion!.via ? ` via ${conversion!.via}` : ""}{conversion!.date ? ` · ${formatLongDate(conversion!.date)}` : ""}</p>
                                    </>
                                )}
                            </div>
                        </section>

                        <aside aria-labelledby="history-heading">
                            <h2 id="history-heading" className="news-subhead">
                                {history.length > 1 ? `${history[0].base_currency}/${history[0].quote_currency} · last ${history.length} entries` : `${from}/${to} history`}
                            </h2>
                            {history.length > 1 ? (
                                <div className="news-table-wrap">
                                    <table className="news-table">
                                        <thead>
                                            <tr><th scope="col">Date</th><th scope="col" className="num">Mid</th></tr>
                                        </thead>
                                        <tbody>
                                            {history.map((rate) => (
                                                <tr key={rate.id}>
                                                    <td className="text-ink/[0.68]">{formatShortDate(rate.rate_date)}</td>
                                                    <td className="num text-ink">{formatRate(Number(rate.mid))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="news-byline">Earlier entries for this pair appear here once the desk records more than one rate.</p>
                            )}
                        </aside>
                    </div>

                    <section className="news-section" aria-labelledby="rates-heading">
                        <header className="news-section-header">
                            <h2 id="rates-heading">Latest rates</h2>
                            <span>Most recent entry per currency pair. Select a row to convert it.</span>
                        </header>
                        <div className="news-table-wrap">
                            <table className="news-table min-w-[34rem]">
                                <thead>
                                    <tr>
                                        <th scope="col">Pair</th><th scope="col" className="num">Buy</th><th scope="col" className="num">Sell</th><th scope="col" className="num">Mid</th><th scope="col" className="num">As of</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rates.map((rate) => {
                                        const selected = rate.base_currency === from && rate.quote_currency === to;
                                        return (
                                            <tr key={rate.id} onClick={() => { setFrom(rate.base_currency); setTo(rate.quote_currency); }} className={cn("cursor-pointer", selected && "bg-fluid-cyan/10")}>
                                                <th scope="row" className="font-medium text-ink">
                                                    <span className={cn("news-mono font-bold", selected && "text-fluid-cyan-ink")}>{rate.base_currency}/{rate.quote_currency}</span>
                                                    <span className="block text-xs font-normal text-ink/[0.68]">{CURRENCY_NAMES[rate.base_currency] ?? rate.base_currency} → {CURRENCY_NAMES[rate.quote_currency] ?? rate.quote_currency}</span>
                                                </th>
                                                <td className="num text-ink/[0.68]">{formatRate(rate.buy === null ? null : Number(rate.buy))}</td>
                                                <td className="num text-ink/[0.68]">{formatRate(rate.sell === null ? null : Number(rate.sell))}</td>
                                                <td className="num font-semibold text-ink">{formatRate(Number(rate.mid))}</td>
                                                <td className="num text-xs text-ink/[0.68]">{formatShortDate(rate.rate_date)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}
