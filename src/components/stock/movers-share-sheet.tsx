"use client";

import { type ComponentType, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Facebook, ImageDown, Linkedin, Loader2, Share2, X } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { renderMoversCard, type MoversCardInput } from "@/lib/movers-share-card";
import { InstagramIcon, XIcon } from "@/components/ui/social-icons";
import { Notice, PrimaryButton, QuietButton } from "@/components/ui/form";

type IconType = ComponentType<{ size?: number }>;
type Status = "rendering" | "ready" | "error";

interface MoversShareSheetProps {
    open: boolean;
    onClose: () => void;
    card: MoversCardInput;
}

const CATEGORY_TITLE: Record<MoversCardInput["category"], string> = {
    gainers: "Top Gainers",
    losers: "Top Losers",
    active: "Most Active",
};

function shareText(card: MoversCardInput): string {
    const title = CATEGORY_TITLE[card.category];
    const list = card.stocks
        .map((s) =>
            card.category === "active"
                ? s.symbol
                : `${s.symbol}: ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%`,
        )
        .join(", ");
    return `MARKET MOVERS - ${title} on the Ghana Stock Exchange: ${list}`;
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
        composer: (_text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
];

export function MoversShareSheet({ open, onClose, card }: MoversShareSheetProps) {
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
                const blob = await renderMoversCard({ ...card, theme: resolved });
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
    }, [open, card.category, card.stocks, resolved]);

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
    const fileName = `movers-${card.category}-fluid-finance-${ts}.png`;

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
                await navigator.share({ files: [file], text: shareText(card), title: CATEGORY_TITLE[card.category] });
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
                    await navigator.share({ files: [file], text: shareText(card), title: CATEGORY_TITLE[card.category] });
                } catch {
                    /* dismissed */
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
    const title = CATEGORY_TITLE[card.category];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Share ${title}`}
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[92vh] w-full max-w-lg overflow-y-auto border border-ink/[0.12] bg-canvas p-5 text-ink shadow-lg sm:p-6 rounded-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b-[3px] border-ink pb-3">
                            <div className="min-w-0">
                                <p className="news-kicker">Market movers</p>
                                <h2 className="mt-1 font-poppins text-[22px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
                                    Share {title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close share sheet"
                                className="news-icon-button h-10 w-10 shrink-0"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="mt-5 flex aspect-[4/5] w-full items-center justify-center overflow-hidden border border-ink/[0.12] bg-canvas rounded-xl">
                            {status === "rendering" && (
                                <Loader2 className="h-7 w-7 animate-spin text-ink/[0.68]" aria-label="Generating share image" />
                            )}
                            {status === "error" && (
                                <Notice tone="error" className="mx-6">
                                    Could not generate the share image.
                                </Notice>
                            )}
                            {status === "ready" && previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt={`${title} share card`}
                                    className="block h-full w-full object-contain"
                                />
                            )}
                        </div>

                        {/* Primary actions */}
                        <div className="mt-5 flex flex-wrap gap-2">
                            <PrimaryButton disabled={status !== "ready"} onClick={nativeShare} className="grow basis-24">
                                <Share2 size={16} aria-hidden="true" />
                                Share
                            </PrimaryButton>
                            <QuietButton
                                disabled={status !== "ready"}
                                onClick={async () =>
                                    flash((await copyImage()) ? "Image copied" : "Clipboard unavailable")
                                }
                                className="grow basis-24"
                            >
                                <Copy size={16} aria-hidden="true" />
                                Copy
                            </QuietButton>
                            <QuietButton disabled={status !== "ready"} onClick={download} className="grow basis-24">
                                <ImageDown size={16} aria-hidden="true" />
                                Save
                            </QuietButton>
                        </div>

                        {/* Networks */}
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {NETWORKS.map((network) => {
                                const Icon = network.Icon;
                                return (
                                    <QuietButton
                                        key={network.key}
                                        size="sm"
                                        disabled={status !== "ready"}
                                        onClick={() => shareToNetwork(network)}
                                        className="w-full"
                                    >
                                        <Icon size={16} />
                                        {network.label}
                                    </QuietButton>
                                );
                            })}
                        </div>

                        <p className="mt-4 border-t border-ink/[0.12] pt-3 text-xs leading-relaxed text-ink/[0.68]">
                            {canNativeShare
                                ? "Sharing to a network opens your device's share sheet with the image attached — pick the app to post to."
                                : "The image is copied for you to paste (or saved) when you open a network. Nothing is posted until you publish it yourself."}
                        </p>

                        {toast && (
                            <Notice
                                tone={toast === "Clipboard unavailable" ? "info" : "success"}
                                className="mt-3 flex items-center gap-2"
                            >
                                {toast !== "Clipboard unavailable" && <Check size={14} aria-hidden="true" />}
                                {toast}
                            </Notice>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
