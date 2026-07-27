"use client";

import { GseLive } from "@/components/sections/gse-live";
import type { ViewMode } from "@/lib/navigation";

export default function GseLivePage({ view }: { view: ViewMode | null }) {
    return (
        <div className="min-h-screen bg-canvas">
            <div className="pt-20 md:pt-28">
                <div className="page-container mb-6">
                    <h1 className="text-3xl md:text-5xl font-bold text-ink font-poppins">
                        Live Market Data
                    </h1>
                </div>
                <GseLive view={view} />
            </div>
        </div>
    );
}
