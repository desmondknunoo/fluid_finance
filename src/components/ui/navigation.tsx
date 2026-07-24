"use client";

import { memo, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandLogo } from "@/components/ui/brand-logo";

const NAV_LINK =
    "text-xs font-semibold uppercase tracking-widest transition-colors font-poppins";

/** Landing-page sections. */
const SECTIONS = [
    { label: "Market", href: "#market-snapshot" },
    { label: "Features", href: "#features" },
] as const;

interface NavigationProps {
    active?: "home" | "gse-live";
}

/**
 * The single site header. Shared by the landing page and GSE Live so both
 * surfaces read as one product.
 */
export const Navigation = memo(({ active = "home" }: NavigationProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 border-b border-ink/[0.08] bg-canvas/80 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <a href="#" aria-label="Fluid Finance home" className="shrink-0">
                        <BrandLogo variant="stacked" className="h-9 lg:h-11" />
                    </a>

                    <div className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
                        {SECTIONS.map((section) => (
                            <a
                                key={section.href}
                                href={section.href}
                                className={cn(NAV_LINK, "text-ink/40 hover:text-ink")}
                            >
                                {section.label}
                            </a>
                        ))}


                    </div>

                    <div className="hidden md:flex shrink-0 items-center gap-3">
                        <ThemeToggle />
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            type="button"
                            className="text-ink"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {mobileMenuOpen && (
                <div className="md:hidden bg-canvas border-t border-ink/[0.08] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-6 py-8 flex flex-col gap-6">
                        {SECTIONS.map((section) => (
                            <a
                                key={section.href}
                                href={section.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins"
                            >
                                {section.label}
                            </a>
                        ))}

                        <hr className="border-ink/10" />
                    </div>
                </div>
            )}
        </header>
    );
});
