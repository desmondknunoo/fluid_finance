import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
    default: "border-transparent bg-ink text-canvas hover:bg-ink/80",
    secondary: "border-transparent bg-ink/10 text-ink hover:bg-ink/20",
    outline: "border-ink/[0.19] text-ink",
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof badgeVariants
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] transition-colors",
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
