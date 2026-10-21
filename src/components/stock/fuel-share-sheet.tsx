import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Download, Loader2, Share2, X } from "lucide-react";
import { Notice, PrimaryButton, QuietButton } from "@/components/ui/form";
import { renderFuelCards } from "@/lib/fuel-share-card";
import { formatFuelDate, type FuelReport } from "@/lib/fuel-prices";

export function FuelShareSheet({ report, previous = null, onClose }: { report: FuelReport; previous?: FuelReport | null; onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [images, setImages] = useState<{ blob: Blob; url: string }[]>([]);
    const [page, setPage] = useState(0);
    const image = images[page];
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        dialog.current?.showModal();
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = overflow; previous?.focus(); };
    }, []);
    useEffect(() => {
        let cancelled = false;
        let urls: string[] = [];
        setImages([]); setPage(0); setMessage("");
        setError("");
        renderFuelCards(report, previous).then(blobs => {
            if (cancelled) return;
            const rendered = blobs.map(blob => ({ blob, url: URL.createObjectURL(blob) }));
            urls = rendered.map(item => item.url);
            setImages(rendered);
        }).catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not generate the image."); });
        return () => { cancelled = true; urls.forEach(url => URL.revokeObjectURL(url)); };
    }, [report, previous, attempt]);
    const filename = `fluid-pump-report-${report.report_date}-${report.id.slice(0, 8)}-page-${page + 1}-of-${images.length}.png`;
    const download = () => {
        if (!image) return;
        const link = document.createElement("a");
        link.href = image.url;
        link.download = filename;
        link.click();
        setMessage(`Page ${page + 1} downloaded.${images.length > 1 ? " Use Next to download the remaining pages." : " You can attach it to your post."}`);
    };
    const copy = async () => {
        if (!image) return false;
        try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": image.blob })]);
            setMessage("Image copied. Paste it into your post.");
            return true;
        } catch { setMessage("Image copying is unavailable. Download the image instead."); return false; }
    };
    const share = async () => {
        if (!image) return;
        const file = new File([image.blob], filename, { type: "image/png" });
        if (!navigator.canShare?.({ files: [file] })) { download(); return; }
        try { await navigator.share({ files: [file], title: "Fluid Pump Report", text: `Fluid Pump Report · ${formatFuelDate(report.report_date)}` }); }
        catch (err) { if (!(err instanceof DOMException && err.name === "AbortError")) setMessage("Sharing failed. Download the image and attach it to your post."); }
    };
    return <dialog ref={dialog} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby="fuel-share-title" className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto border border-ink/[0.12] bg-canvas p-5 text-ink shadow-lg backdrop:bg-black/70 sm:p-6 rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-ink pb-3">
            <div className="min-w-0">
                <p className="news-kicker">Fuel prices</p>
                <h2 id="fuel-share-title" className="mt-1 font-poppins text-[22px] font-bold leading-[1.1] tracking-[-0.02em]">Share Fluid Pump Report</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close share preview" className="news-icon-button h-10 w-10 shrink-0"><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="mt-5 border border-ink/[0.12] bg-canvas rounded-xl">
            {image
                ? <img src={image.url} alt={`Fluid Pump Report for ${formatFuelDate(report.report_date)}, page ${page + 1} of ${images.length}`} className="block w-full" />
                : error
                    ? <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-6"><Notice tone="error" className="w-full">{error}</Notice><QuietButton size="sm" onClick={() => setAttempt(n => n + 1)}>Retry image generation</QuietButton></div>
                    : <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center text-sm text-ink/[0.68]" role="status"><Loader2 size={22} className="animate-spin" aria-hidden="true" />Checking every OMC logo and generating your report images…</div>}
        </div>
        {images.length > 1 && <div className="mt-3 flex items-center justify-between gap-3">
            <button type="button" disabled={page === 0} onClick={() => { setPage(n => n - 1); setMessage(""); }} className="news-icon-button grid-flow-col gap-1 pl-2 pr-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45"><ChevronLeft size={16} aria-hidden="true" />Previous</button>
            <span aria-live="polite" className="text-xs font-semibold tabular-nums text-ink/[0.68]"><span className="sr-only">Page {page + 1} of {images.length}</span><span aria-hidden="true">{page + 1} / {images.length}</span></span>
            <button type="button" disabled={page === images.length - 1} onClick={() => { setPage(n => n + 1); setMessage(""); }} className="news-icon-button grid-flow-col gap-1 pl-3 pr-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45">Next<ChevronRight size={16} aria-hidden="true" /></button>
        </div>}
        <div className="mt-5 flex flex-wrap gap-2">
            <PrimaryButton disabled={!image} onClick={share} className="grow basis-24"><Share2 size={16} aria-hidden="true" />Share</PrimaryButton>
            <QuietButton disabled={!image} onClick={copy} className="grow basis-24"><Copy size={16} aria-hidden="true" />Copy</QuietButton>
            <QuietButton disabled={!image} onClick={download} className="grow basis-28"><Download size={16} aria-hidden="true" />Save image</QuietButton>
        </div>
        <p className="mt-4 border-t border-ink/[0.12] pt-3 text-xs leading-relaxed text-ink/[0.68]">Share, copy or download the selected page. Each image includes up to 10 OMCs with their logos. Use Previous and Next to export every page.</p>
        <p role="status" className={message ? "news-notice mt-3" : "sr-only"}>{message}</p>
    </dialog>;
}
