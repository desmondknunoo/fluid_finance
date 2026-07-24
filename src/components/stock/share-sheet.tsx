import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Copy,
    Facebook,
    ImageDown,
    Linkedin,
    Loader2,
    MessageCircle,
    Share2,
    Twitter,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { renderShareCard, type ShareCardInput } from "@/lib/share-card";

type Status = "rendering" | "ready" | "error";

interface ShareSheetProps {
    open: boolean;
    onClose: () => void;
    card: ShareCardInput;
}

function shareText(card: ShareCardInput): string {
    const sign = card.change >= 0 ? "+" : "";
    return `LIVE: ${card.symbol} is currently trading at ₵${card.price.toFixed(2)} (${sign}${card.changePercent.toFixed(
        2,
    )}%) on the Ghana Stock Exchange. Via finance.fluidterra.com/#/stock/${card.symbol}`;
}

/**
 * Each destination opens a pre-filled composer — nothing is ever posted without
 * the person pressing publish in that network's own UI.
 */
const NETWORKS = [
    {
        key: "x",
        label: "X",
        icon: Twitter,
        href: (text: string, url: string) =>
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
        key: "whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        href: (text: string, url: string) =>
            `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        icon: Linkedin,
        href: (_text: string, url: string) =>
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
        key: "facebook",
        label: "Facebook",
        icon: Facebook,
        href: (_text: string, url: string) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
] as const;

export function ShareSheet({ open, onClose, card }: ShareSheetProps) {
    const { resolved } = useTheme();
    const [status, setStatus] = useState<Status>("rendering");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const blobRef = useRef<Blob | null>(null);

    // Render once per open, against the ranges and prices showing at that moment.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setStatus("rendering");

        (async () => {
            try {
                const blob = await renderShareCard({ ...card, theme: resolved });
                if (cancelled) return;
                blobRef.current = blob;
                setPreviewUrl((old) => {
                    if (old) URL.revokeObjectURL(old);
                    return URL.createObjectURL(blob);
                });
                setStatus("ready");
            } catch {
                if (!cancelled) setStatus("error");
            }
        })();

        return () => {
            cancelled = true;
        };
        // `card` is rebuilt each render; the open transition is the real trigger.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, card.symbol, card.range, card.price, resolved]);

    useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        },
        [previewUrl],
    );

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    const flash = useCallback((message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(null), 2600);
    }, []);

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `${card.symbol.toLowerCase()}-fluid-finance-${ts}.png`;

    const download = useCallback(() => {
        if (!blobRef.current) return;
        const url = URL.createObjectURL(blobRef.current);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        flash("Image saved");
    }, [fileName, flash]);

    const copyImage = useCallback(async (): Promise<boolean> => {
        if (!blobRef.current || typeof ClipboardItem === "undefined") return false;
        try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blobRef.current })]);
            return true;
        } catch {
            return false;
        }
    }, []);

    const nativeShare = useCallback(async () => {
        if (!blobRef.current) return;
        const file = new File([blobRef.current], fileName, { type: "image/png" });
        // Level 2 Web Share carries the image itself; text-only is the fallback.
        if (navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], text: shareText(card), title: card.symbol });
                return;
            } catch {
                return; // dismissed by the user
            }
        }
        if (navigator.share) {
            try {
                await navigator.share({ text: shareText(card), url: window.location.href });
                return;
            } catch {
                return;
            }
        }
        download();
    }, [card, download, fileName]);

    const openNetwork = useCallback(
        async (href: string) => {
            const copied = await copyImage();
            window.open(href, "_blank", "noopener,noreferrer");
            flash(
                copied
                    ? "Image copied — paste it into the post"
                    : "Post opened — attach the downloaded image",
            );
            if (!copied) download();
        },
        [copyImage, download, flash],
    );

    const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Share ${card.symbol}`}
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-canvas/80 backdrop-blur-sm sm:items-center"
                >
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 24, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-ink/[0.08] bg-canvas p-5 sm:rounded-3xl"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-bold text-ink">Share {card.symbol}</h2>
                            <button
                                onClick={onClose}
                                aria-label="Close share sheet"
                                className="rounded-full p-2 text-ink/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="mb-5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-ink/[0.08] bg-canvas">
                            {status === "rendering" && <Loader2 className="h-7 w-7 animate-spin text-ink/40" />}
                            {status === "error" && (
                                <p className="px-6 text-center text-sm text-ink/40">
                                    Could not generate the share image.
                                </p>
                            )}
                            {status === "ready" && previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt={`${card.symbol} share card`}
                                    className="h-full w-full object-contain"
                                />
                            )}
                        </div>

                        {/* Primary actions */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                disabled={status !== "ready"}
                                onClick={nativeShare}
                                className="col-span-1 flex items-center justify-center gap-2 rounded-xl bg-fluid-cyan py-3.5 text-sm font-bold text-fluid-action-ink shadow-glow transition-all hover:bg-fluid-cyan-hover hover:shadow-glow-lg disabled:opacity-40 disabled:shadow-none"
                            >
                                <Share2 size={16} />
                                Share
                            </button>
                            <button
                                disabled={status !== "ready"}
                                onClick={async () =>
                                    flash((await copyImage()) ? "Image copied" : "Clipboard unavailable")
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-ink/[0.08] bg-ink/[0.03] py-3.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink/20 hover:text-ink disabled:opacity-40"
                            >
                                <Copy size={16} />
                                Copy
                            </button>
                            <button
                                disabled={status !== "ready"}
                                onClick={download}
                                className="flex items-center justify-center gap-2 rounded-xl border border-ink/[0.08] bg-ink/[0.03] py-3.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink/20 hover:text-ink disabled:opacity-40"
                            >
                                <ImageDown size={16} />
                                Save
                            </button>
                        </div>

                        {/* Networks */}
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            {NETWORKS.map((network) => {
                                const Icon = network.icon;
                                return (
                                    <button
                                        key={network.key}
                                        disabled={status !== "ready"}
                                        onClick={() =>
                                            openNetwork(network.href(shareText(card), window.location.href))
                                        }
                                        className="flex flex-col items-center gap-2 rounded-xl border border-ink/[0.08] bg-ink/[0.03] py-3 text-xs font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink disabled:opacity-40"
                                    >
                                        <Icon size={18} />
                                        {network.label}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="mt-4 text-[11px] leading-relaxed text-ink/30">
                            {canNativeShare
                                ? "Share opens your device's share sheet with the image attached."
                                : "Save or copy the image, then attach it to your post."}{" "}
                            Network buttons open a pre-filled composer — nothing is posted until you publish it
                            yourself.
                        </p>

                        <AnimatePresence>
                            {toast && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className={cn(
                                        "mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 py-2.5 text-xs font-medium text-emerald-300",
                                    )}
                                >
                                    <Check size={14} />
                                    {toast}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
