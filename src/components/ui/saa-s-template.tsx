"use client";

import { memo, useState } from "react";
import {
    Menu,
    X,
} from "lucide-react";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { MarketSnapshot } from "@/components/sections/market-snapshot";
import { AllStocks } from "@/components/sections/all-stocks";
import { openStock } from "@/lib/navigation";
import { FeatureHighlights, EducationalSection } from "@/components/sections/features";
import { SocialProof } from "@/components/sections/pricing";
import { EnhancedFooter } from "@/components/sections/footer";

// Navigation Component
const Navigation = memo(() => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <a href="#" className="text-xl font-bold text-white tracking-widest font-poppins">FLUID FINANCE</a>

                    <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <a href="#market-snapshot" className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-poppins">
                            Market
                        </a>
                        <a href="#all-stocks" className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-poppins">
                            Stocks
                        </a>
                        <a href="#features" className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-poppins">
                            Features
                        </a>
                        {/* TODO: Add pricing plans later */}
                        {/* <a href="#pricing" className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-poppins">
                            Pricing
                        </a> */}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button className="text-xs font-semibold uppercase tracking-widest text-white/60 hover:text-white transition-colors px-4 py-2 font-poppins">
                            Sign in
                        </button>
                        <button
                            onClick={() => window.location.href = "/legacy/index.html"}
                            className="bg-white text-black text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full hover:bg-gray-200 transition-colors font-poppins"
                        >
                            Open App
                        </button>
                    </div>

                    <button
                        type="button"
                        className="md:hidden text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {mobileMenuOpen && (
                <div className="md:hidden bg-black border-t border-white/[0.08] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-6 py-8 flex flex-col gap-6">
                        <a href="#market-snapshot" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-white/60 font-poppins">Market</a>
                        <a href="#all-stocks" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-white/60 font-poppins">Stocks</a>
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-white/60 font-poppins">Features</a>
                        {/* <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-white/60 font-poppins">Pricing</a> */}
                        <hr className="border-white/10" />
                        <button className="w-full py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest text-xs font-poppins" onClick={() => window.location.href = "/legacy/index.html"}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
});


// Main Landing Page Component
export default function LandingPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <Navigation />

            <HeroGeometric
                badge="The Future of GSE Investing"
                title1="Ghana's Premier"
                title2="Stock Aggregator"
                description="Harness the power of real-time market data and AI insights. Track your portfolio, discover winning stocks, and trade with Mobile Money integration."
            />

            <MarketSnapshot />

            <AllStocks onSelect={openStock} />

            <FeatureHighlights />

            <EducationalSection />

            <SocialProof />

            {/* <PricingPlans /> */}

            <EnhancedFooter />
        </main>
    );
}
