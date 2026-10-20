"use client";

import { GseLive } from "@/components/sections/gse-live";
import { PageIntro } from "@/components/ui/page-intro";
import type { ViewMode } from "@/lib/navigation";

export default function GseLivePage({ view }: { view: ViewMode | null }) {
    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Markets · Ghana Stock Exchange"
                title="Live Market Data"
                description="Every listed equity on the Ghana Stock Exchange, as a sortable board or a heatmap. Select any ticker for its full price history."
            />
            <GseLive view={view} />
        </main>
    );
}
