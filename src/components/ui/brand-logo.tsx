import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/**
 * Fluid Finance lockups from `public/logo/`, trimmed to their artwork so a
 * height class sizes the mark itself rather than the transparent margin the
 * source files ship with.
 *
 * The wordmark is baked into the artwork, so each lockup exists as a light-ink
 * and a dark-ink variant and the active theme picks one:
 *   04 / 01 — horizontal, single-line wordmark (fits a nav bar)
 *   04 / 01 — stacked mark over wordmark (fits a footer column)
 *   05      — mark only, no wordmark (favicon and app icon)
 */
const LOCKUPS = {
    horizontal: { dark: "/logo/fluidfinance-01.png", light: "/logo/fluidfinance-04.png" },
    stacked: { dark: "/logo/fluidfinance-01.png", light: "/logo/fluidfinance-04.png" },
} as const;

const MARK_ONLY = "/logo/mark-512.png";

interface BrandLogoProps {
    /** `horizontal` for the nav bar, `stacked` for the footer, `mark` for the glyph alone. */
    variant?: "horizontal" | "stacked" | "mark";
    className?: string;
}

export function BrandLogo({ variant = "horizontal", className }: BrandLogoProps) {
    const { resolved } = useTheme();

    // "dark" names the theme, and the dark-theme artwork carries a white wordmark.
    const src = variant === "mark" ? MARK_ONLY : LOCKUPS[variant][resolved];

    return (
        <img
            src={src}
            alt="Fluid Finance"
            className={cn("w-auto object-contain", className)}
            draggable={false}
        />
    );
}
