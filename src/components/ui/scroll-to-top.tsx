"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Square control that appears once the page is scrolled past `threshold`
 * pixels and smooth-scrolls back to the top when clicked. Drawn as an editorial
 * icon button: paper background, hairline border, no rounding or shadow.
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

    if (!visible) return null;

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center border border-ink/[0.12] bg-canvas text-ink transition-colors hover:bg-ink hover:text-canvas rounded-xl"
        >
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
    );
}
