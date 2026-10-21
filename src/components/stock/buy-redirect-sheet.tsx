import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, ShoppingCart, X } from "lucide-react";
import { APP_FT_URL } from "@/lib/links";

interface BuyRedirectSheetProps {
    open: boolean;
    onClose: () => void;
    symbol: string;
    company: string;
}

/**
 * Fluid Finance is information/education only — there is no in-app trade
 * facility. This sheet tells the user where the actual trading happens
 * (the Fluid Terra app) instead of pretending a "Buy" button can execute
 * an order here.
 */
export function BuyRedirectSheet({ open, onClose, symbol, company }: BuyRedirectSheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
            if (event.key !== "Tab") return;
            const controls = panelRef.current?.querySelectorAll<HTMLElement>("button, a[href]");
            if (!controls?.length) return;
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus();
        };
    }, [open, onClose]);
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Buy ${symbol}`}
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgb(var(--news-black)/0.7)] sm:items-center sm:p-4"
                >
                    <motion.div
                        ref={panelRef}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 8, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm border border-ink/[0.12] bg-canvas p-5 text-ink sm:p-6 rounded-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between gap-4 border-b-2 border-ink pb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={18} className="text-ink/[0.68]" aria-hidden="true" />
                                <h2 className="font-poppins text-xl font-bold leading-tight tracking-[-0.01em] text-ink">
                                    Buy {symbol}
                                </h2>
                            </div>
                            <button onClick={onClose} aria-label="Close" className="news-icon-button">
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <p className="text-sm leading-relaxed text-ink/[0.68]">
                            Fluid Finance shows you {company} ({symbol}) prices for information and education
                            only — there's no trading here. To actually buy shares, head to the Fluid Finance
                            trading app.
                        </p>

                        <a
                            href={APP_FT_URL}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="news-button mt-5 w-full"
                        >
                            <ExternalLink size={16} aria-hidden="true" />
                            Continue to app.fluidterra.com
                        </a>

                        <p className="news-byline mt-4 border-t border-ink/[0.12] pt-3">
                            You'll leave fluidfinance.com — trades are placed and settled entirely within the
                            Fluid Finance app.
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
