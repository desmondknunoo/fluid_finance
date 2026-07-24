"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { MarketSnapshot } from "@/components/sections/market-snapshot";
import { GseLive } from "@/components/sections/gse-live";
import { FeatureHighlights, EducationalSection } from "@/components/sections/features";
import { SocialProof } from "@/components/sections/social-proof";
import type { ViewMode } from "@/lib/navigation";

// Main Landing Page Component
export default function LandingPage({ liveView }: { liveView: ViewMode | null }) {
    return (
        <>
            <HeroGeometric
                badge="Decisions that Build Wealth"
                title1="Ghana's Market"
                title2="Information Hub"
                description="Live GSE prices, full company histories, and market education in one place."
            />

            <GseLive view={liveView} />

            <MarketSnapshot />

            <FeatureHighlights />

            <EducationalSection />

            <SocialProof />
        </>
    );
}
