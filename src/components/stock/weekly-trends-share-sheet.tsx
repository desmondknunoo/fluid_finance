"use client";

import { type ComponentType, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Copy,
    Facebook,
    ImageDown,
    Linkedin,
    Loader2,
    Share2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { renderWeeklyTrendCard, type WeeklyTrendCardInput } from "@/lib/weekly-trends-share-card";
import { InstagramIcon, XIcon } from "@/components/ui/social-icons";

type IconType = ComponentType<{ size?: number }>;

type Status = "rendering" | "ready" | "error";

interface WeeklyTrendsShareSheetProps {
    open: boolean;
    onClose: () => void;
    card: WeeklyTrendCardInput;
}

function shareText(card: WeeklyTrendCardInput): string {
    const type = card.type === "gainers" ? "Top Gainers" : "Top Losers";
    const stocks = card.weeklyChanges
        .map((item) => {
            const sign = item.weeklyChangePercent >= 0 ? "+" : "";
            return `${item.stock.symbol}: ${sign}${item.weeklyChangePercent.toFixed(2)}%`;
        })
        .join(", ");
    return `WEEK IN REVIEW - ${type} (${card.startDate} to ${card.endDate}): ${stocks}`;
}

interface Network {
    key: string;
    label: string;
    Icon: IconType;
    composer: ((text: string, url: string) => string) | null;
}

const NETWORKS: Network[] = [
    {
        key: "x",
        label: "X",
        Icon: XIcon,
        composer: (text, url) =>
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
        key: "facebook",
        label: "Facebook",
        Icon: Facebook,
        composer: (_text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        key: "instagram",
        label: "Instagram",
        Icon: InstagramIcon,
        composer: null,
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        Icon: Linkedin,
        composer: (_text, url) =>
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
];

export function WeeklyTrendsShareSheet({ open, onClose, card }: WeeklyTrendsShareSheetProps) {
    const { resolved } = useTheme();
    const [status, setStatus] = useState<Status>("rendering");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const blobRef = useRef<Blob | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setStatus("rendering");

        (async () => {
            try {
                const blob = await renderWeeklyTrendCard({ ...card, theme: resolved });
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
    }, [open, card.type, card.startDate, card.endDate, resolved]);

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
    const fileName = `weekly-${card.type}-fluid-finance-${ts}.png`;

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
        if (navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], text: shareText(card), title: `Weekly ${card.type}` });
                return;
            } catch {
                return;
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

    const shareToNetwork = useCallback(
        async (network: Network) => {
            const blob = blobRef.current;
            const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;

            if (file && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], text: shareText(card), title: `Weekly ${card.type}` });
                } catch {
                    /* dismissed by the user */
                }
                return;
            }

            const copied = await copyImage();
            if (network.composer) {
                window.open(network.composer(shareText(card), window.location.href), "_blank", "noopener,noreferrer");
                flash(copied ? "Image copied — paste it into your post" : "Image saved — attach it to your post");
                if (!copied) download();
            } else {
                download();
                flash("Image saved — open Instagram to share it");
            }
        },
        [card, copyImage, download, fileName, flash],
    );

    const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;
    const title = card.type === "gainers" ? "Top Gainers" : "Top Losers";

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
                    aria-label={`Share weekly ${title}`}
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
                            <h2 className="text-base font-bold text-ink">Share {title}</h2>
                            <button
                                onClick={onClose}
                                aria-label="Close share sheet"
                                className="rounded-full p-2 text-ink/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="mb-5 flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl border border-ink/[0.08] bg-canvas">
                            {status === "rendering" && <Loader2 className="h-7 w-7 animate-spin text-ink/40" />}
                            {status === "error" && (
                                <p className="px-6 text-center text-sm text-ink/40">
                                    Could not generate the share image.
                                </p>
                            )}
                            {status === "ready" && previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt={`Weekly ${title} share card`}
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
                                const Icon = network.Icon;
                                return (
                                    <button
                                        key={network.key}
                                        disabled={status !== "ready"}
                                        onClick={() => shareToNetwork(network)}
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
                                ? "Sharing to a network opens your device's share sheet with the image attached — pick the app to post to."
                                : "The image is copied for you to paste (or saved) when you open a network. Nothing is posted until you publish it yourself."}
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
