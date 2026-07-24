"use client";

import { Navigation } from "@/components/ui/navigation";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { MarketSnapshot } from "@/components/sections/market-snapshot";
import { GseLive } from "@/components/sections/gse-live";
import { FeatureHighlights, EducationalSection } from "@/components/sections/features";
import { SocialProof } from "@/components/sections/pricing";
import { EnhancedFooter } from "@/components/sections/footer";
import type { ViewMode } from "@/lib/navigation";

// Main Landing Page Component
export default function LandingPage({ liveView }: { liveView: ViewMode | null }) {
    return (
        <main className="min-h-screen bg-canvas text-ink selection:bg-ink selection:text-canvas">
            <Navigation />

            <HeroGeometric
                badge="Financial literacy for the Ghana Stock Exchange"
                title1="Ghana's Market"
                title2="Information Hub"
                description="Live GSE prices, full company histories, and market education in one place."
            />

            <GseLive view={liveView} />

            <MarketSnapshot />

            <FeatureHighlights />

            <EducationalSection />

            <SocialProof />

            <EnhancedFooter />
        </main>
    );
}
