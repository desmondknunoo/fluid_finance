"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * Floating control that fades in once the page is scrolled past `threshold`
 * pixels and smooth-scrolls back to the top when clicked. Styled with the Fluid
 * cyan accent and glow so it reads as an interactive control in either theme.
 */
export function ScrollToTop({ threshold = 400 }: { threshold?: number }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let frame = 0;
        const onScroll = () => {
            // Coalesce scroll bursts into one state check per frame.
            if (frame) return;
            frame = requestAnimationFrame(() => {
                setVisible(window.scrollY > threshold);
                frame = 0;
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [threshold]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    aria-label="Scroll to top"
                    initial={{ opacity: 0, y: 16, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-ink/[0.12] bg-fluid-panel/80 text-fluid-cyan-ink shadow-glow backdrop-blur-md transition-colors hover:border-fluid-cyan/40 hover:bg-fluid-panel hover:text-fluid-cyan hover:shadow-glow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-fluid-cyan/60"
                >
                    <ArrowUp size={20} strokeWidth={2.5} />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
