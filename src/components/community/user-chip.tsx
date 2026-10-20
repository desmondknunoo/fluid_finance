import { cn } from "@/lib/utils";
import { initialsFor, ROLE_LABELS, type Author } from "@/lib/community";
import { profileHref } from "@/lib/navigation";

/** Square editorial avatars: a photo when the member has one, otherwise Barlow initials on paper. */
export function Avatar({ author, size = "md", className }: { author: Pick<Author, "display_name" | "avatar_url">; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
    const dimension = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm", xl: "h-24 w-24 text-2xl" }[size];
    if (author.avatar_url) {
        return <img src={author.avatar_url} alt="" className={cn("news-avatar", dimension, className)} />;
    }
    return (
        <span aria-hidden="true" className={cn("news-avatar", dimension, className)}>
            {initialsFor(author.display_name)}
        </span>
    );
}

/** Staff roles are shown so readers know when the research or operations team is speaking. */
export function RolePill({ role, className }: { role: Author["role"]; className?: string }) {
    if (role === "member") return null;
    return <span className={cn("news-pill", className)}>{ROLE_LABELS[role].replace(" team", "")}</span>;
}

export function UserChip({ author, meta, size = "md", className }: { author: Author | null; meta?: string; size?: "sm" | "md"; className?: string }) {
    const name = author?.display_name ?? "Former member";
    const body = (
        <>
            <Avatar author={{ display_name: name, avatar_url: author?.avatar_url ?? null }} size={size === "sm" ? "sm" : "md"} />
            <span className="min-w-0">
                <span className="flex items-center gap-2">
                    <span className={cn("truncate font-semibold text-ink", size === "sm" ? "text-xs" : "text-sm")}>{name}</span>
                    {author && <RolePill role={author.role} />}
                </span>
                {meta && <span className="news-byline block truncate">{meta}</span>}
            </span>
        </>
    );
    if (!author) return <span className={cn("inline-flex items-center gap-2.5", className)}>{body}</span>;
    return (
        <a href={profileHref(author.username)} className={cn("group inline-flex min-w-0 items-center gap-2.5", className)}>
            {body}
        </a>
    );
}
