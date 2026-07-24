"use client";

import { memo, useState } from "react";
import {
    ChevronDown,
    Grid2X2,
    LayoutGrid,
    Menu,
    Rows3,
    X,
} from "lucide-react";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { MarketSnapshot } from "@/components/sections/market-snapshot";
import { AllStocks } from "@/components/sections/all-stocks";
import { openStock } from "@/lib/navigation";
import { GSE_LIVE_HREF, GSE_LIVE_VIEWS } from "@/lib/links";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandLogo } from "@/components/ui/brand-logo";
import { FeatureHighlights, EducationalSection } from "@/components/sections/features";
import { SocialProof } from "@/components/sections/pricing";
import { EnhancedFooter } from "@/components/sections/footer";

const VIEW_ICONS = {
    table: Rows3,
    grid: LayoutGrid,
    heatmap: Grid2X2,
} as const;

const NAV_LINK =
    "text-xs font-semibold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors font-poppins";

// Navigation Component
const Navigation = memo(() => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 border-b border-ink/[0.08] bg-canvas/80 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <a href="#" aria-label="Fluid Finance home" className="shrink-0">
                        <BrandLogo variant="horizontal" className="h-7 lg:h-8" />
                    </a>

                    <div className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
                        <a href="#market-snapshot" className={NAV_LINK}>
                            Market
                        </a>
                        <a href="#all-stocks" className={NAV_LINK}>
                            Stocks
                        </a>

                        {/* GSE Live opens the live dashboard, deep-linked per view */}
                        <div className="relative group">
                            <a href={GSE_LIVE_HREF} className={`${NAV_LINK} inline-flex items-center gap-1`}>
                                GSE Live
                                <ChevronDown size={12} className="transition-transform group-hover:rotate-180" />
                            </a>
                            <div className="invisible absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                                <div className="overflow-hidden rounded-xl border border-ink/[0.08] bg-canvas/95 shadow-xl backdrop-blur-md">
                                    {GSE_LIVE_VIEWS.map((view) => {
                                        const Icon = VIEW_ICONS[view.key];
                                        return (
                                            <a
                                                key={view.key}
                                                href={view.href}
                                                className="flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink/50 transition-colors hover:bg-ink/[0.06] hover:text-ink font-poppins"
                                            >
                                                <Icon size={14} />
                                                {view.label}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <a href="#features" className={NAV_LINK}>
                            Features
                        </a>
                    </div>

                    <div className="hidden md:flex shrink-0 items-center gap-3">
                        <ThemeToggle />
                        <a
                            href={GSE_LIVE_HREF}
                            className="bg-ink text-canvas text-xs font-bold uppercase tracking-widest px-5 lg:px-6 py-2 rounded-full hover:opacity-85 transition-opacity font-poppins whitespace-nowrap"
                        >
                            GSE Live
                        </a>
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
                        <a href="#market-snapshot" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins">Market</a>
                        <a href="#all-stocks" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins">Stocks</a>
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins">Features</a>

                        <hr className="border-ink/10" />

                        <div>
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-ink/30 font-poppins">GSE Live</p>
                            <div className="flex flex-col gap-4">
                                {GSE_LIVE_VIEWS.map((view) => {
                                    const Icon = VIEW_ICONS[view.key];
                                    return (
                                        <a
                                            key={view.key}
                                            href={view.href}
                                            className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins"
                                        >
                                            <Icon size={16} />
                                            {view.label}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        <a
                            href={GSE_LIVE_HREF}
                            className="w-full py-4 text-center rounded-full bg-ink text-canvas font-bold uppercase tracking-widest text-xs font-poppins"
                        >
                            Open GSE Live
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
});


// Main Landing Page Component
export default function LandingPage() {
    return (
        <main className="min-h-screen bg-canvas text-ink selection:bg-ink selection:text-canvas">
            <Navigation />

            <HeroGeometric
                badge="Financial literacy for the Ghana Stock Exchange"
                title1="Ghana's Market"
                title2="Information Hub"
                description="Live GSE prices, full company histories, and market education in one place. Fluid Finance publishes information and analysis — never trade execution."
            />

            <MarketSnapshot />

            <AllStocks onSelect={openStock} />

            <FeatureHighlights />

            <EducationalSection />

            <SocialProof />

            <EnhancedFooter />
        </main>
    );
}
