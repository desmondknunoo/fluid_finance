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
                    aria-label={`Buy ${symbol}`}
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-canvas/80 backdrop-blur-sm sm:items-center"
                >
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 24, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-t-3xl border border-ink/[0.08] bg-canvas p-6 sm:rounded-3xl"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-ink/70">
                                <ShoppingCart size={18} />
                                <h2 className="text-base font-bold text-ink">Buy {symbol}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close"
                                className="rounded-full p-2 text-ink/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm leading-relaxed text-ink/70">
                            Fluid Finance shows you {company} ({symbol}) prices for information and education
                            only — there's no trading here. To actually buy shares, head to the Fluid Finance
                            trading app.
                        </p>

                        <a
                            href={APP_FT_URL}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-fluid-cyan py-3.5 text-sm font-bold text-fluid-action-ink shadow-glow transition-all hover:bg-fluid-cyan-hover hover:shadow-glow-lg"
                        >
                            <ExternalLink size={16} />
                            Continue to app.fluidterra.com
                        </a>

                        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink/30">
                            You'll leave fluidfinance.com — trades are placed and settled entirely within the
                            Fluid Finance app.
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
