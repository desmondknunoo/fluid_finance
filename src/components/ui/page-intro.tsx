import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The heading block every secondary page opens with, in the editorial system: a small-caps
 * kicker, a Barlow display headline, one standfirst line and any page actions, closed by the
 * same heavy rule the front page uses under its topic bar.
 */
export function PageIntro({ eyebrow, title, description, action, align = "left", className }: {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    align?: "left" | "center";
    className?: string;
}) {
    return (
        <header className={cn("news-page-intro", align === "center" && "news-page-intro--center", className)}>
            <div>
                {eyebrow && <p className="news-kicker">{eyebrow}</p>}
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {action && <div className="news-page-actions">{action}</div>}
        </header>
    );
}
