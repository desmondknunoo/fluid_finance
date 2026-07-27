"use client";

import { GseLive } from "@/components/sections/gse-live";
import type { ViewMode } from "@/lib/navigation";

export default function GseLivePage({ view }: { view: ViewMode | null }) {
    return (
        <div className="min-h-screen bg-canvas">
            <div className="pt-20 md:pt-28">
                <GseLive view={view} />
            </div>
        </div>
    );
}
