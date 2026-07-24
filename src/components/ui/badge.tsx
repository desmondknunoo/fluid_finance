import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
    default: "border-transparent bg-ink text-canvas hover:bg-ink/80",
    secondary: "border-transparent bg-ink/10 text-ink hover:bg-ink/20",
    outline: "text-ink",
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof badgeVariants
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-fluid-cyan focus:ring-offset-2",
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
