import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** The heading block every secondary page opens with: eyebrow, title, one line of context, actions. */
export function PageIntro({ eyebrow, title, description, action, align = "left", className }: {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    align?: "left" | "center";
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn("mb-10 flex flex-col gap-5 md:mb-14", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between", className)}
        >
            <div className={cn("min-w-0", align === "center" && "max-w-2xl")}>
                {eyebrow && <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">{eyebrow}</p>}
                <h1 className="text-3xl font-bold tracking-tight text-ink font-poppins sm:text-4xl md:text-5xl">{title}</h1>
                {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/60 md:text-lg">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </motion.div>
    );
}
