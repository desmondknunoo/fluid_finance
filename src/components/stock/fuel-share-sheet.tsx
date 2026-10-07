import { useEffect, useRef, useState } from "react";
import { Copy, Download, Share2, X } from "lucide-react";
import { renderFuelCards } from "@/lib/fuel-share-card";
import { formatFuelDate, type FuelReport } from "@/lib/fuel-prices";

export function FuelShareSheet({ report, onClose }: { report: FuelReport; onClose: () => void }) {
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
        renderFuelCards(report).then(blobs => {
            if (cancelled) return;
            const rendered = blobs.map(blob => ({ blob, url: URL.createObjectURL(blob) }));
            urls = rendered.map(item => item.url);
            setImages(rendered);
        }).catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not generate the image."); });
        return () => { cancelled = true; urls.forEach(url => URL.revokeObjectURL(url)); };
    }, [report, attempt]);
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
    return <dialog ref={dialog} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-labelledby="fuel-share-title" className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-ink/15 bg-canvas p-5 text-ink backdrop:bg-black/75">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 id="fuel-share-title" className="text-lg font-semibold">Share Fluid Pump Report</h2><button type="button" onClick={onClose} aria-label="Close share preview" className="rounded-lg p-3 hover:bg-ink/10 focus-visible:outline-fluid-cyan"><X size={20} /></button></div>
        {image ? <img src={image.url} alt={`Fluid Pump Report for ${formatFuelDate(report.report_date)}, page ${page + 1} of ${images.length}`} className="w-full rounded-lg" /> : <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center" role="status">{error || "Checking every OMC logo and generating your report images…"}{error && <button onClick={() => setAttempt(n => n + 1)} className="underline">Retry image generation</button>}</div>}
        {images.length > 1 && <div className="mt-4 flex items-center justify-between gap-3"><button disabled={page === 0} onClick={() => { setPage(n => n - 1); setMessage(""); }} className="rounded-lg border border-ink/20 px-3 py-2 disabled:opacity-40">Previous</button><span aria-live="polite" className="text-sm">Page {page + 1} of {images.length}</span><button disabled={page === images.length - 1} onClick={() => { setPage(n => n + 1); setMessage(""); }} className="rounded-lg border border-ink/20 px-3 py-2 disabled:opacity-40">Next</button></div>}
        <div className="mt-5 grid grid-cols-3 gap-2">
            <button disabled={!image} onClick={share} className="flex items-center justify-center gap-2 rounded-xl bg-fluid-cyan px-2 py-3 text-sm font-semibold text-fluid-action-ink disabled:opacity-40"><Share2 size={16} />Share</button>
            <button disabled={!image} onClick={copy} className="flex items-center justify-center gap-2 rounded-xl border border-ink/20 px-2 py-3 text-sm disabled:opacity-40"><Copy size={16} />Copy</button>
            <button disabled={!image} onClick={download} className="flex items-center justify-center gap-2 rounded-xl border border-ink/20 px-2 py-3 text-sm disabled:opacity-40"><Download size={16} />Save image</button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink/60">Share, copy or download the selected page. Each image includes up to 10 OMCs with their logos. Use Previous and Next to export every page.</p>
        <p role="status" className="mt-3 text-sm text-fluid-cyan-ink">{message}</p>
    </dialog>;
}
