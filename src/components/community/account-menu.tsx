import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/community";
import { navigate, onLocationChange, openLogin, profileHref } from "@/lib/navigation";
import { Avatar } from "@/components/community/user-chip";
import { cn } from "@/lib/utils";

/** Sign-in controls for the masthead, and a flat list for the phone menu. */
export function AccountMenu({ variant = "desktop", onNavigate }: { variant?: "desktop" | "mobile"; onNavigate?: () => void }) {
    const { user, profile, loading, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const close = useCallback((event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }, []);
    useEffect(() => {
        if (open) document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open, close]);
    useEffect(() => onLocationChange(() => setOpen(false)), []);

    const leave = async () => {
        await signOut();
        onNavigate?.();
        navigate("/");
    };

    if (loading) return <span className={cn("news-skeleton inline-block", variant === "desktop" ? "h-9 w-24" : "h-10 w-32")} aria-hidden="true" />;

    if (!user) {
        if (variant === "mobile") {
            return (
                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => { onNavigate?.(); openLogin(); }} className="news-button-quiet">Sign in</button>
                    <a href="/register" onClick={onNavigate} className="news-button">Join free</a>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => openLogin()} className="news-button-quiet news-button-quiet--sm">Sign in</button>
                <a href="/register" className="news-button news-button--sm">Join</a>
            </div>
        );
    }

    const name = profile?.display_name ?? user.email ?? "Member";
    const items = [
        ...(profile ? [{ href: profileHref(profile.username), label: "Your profile", icon: UserRound }] : []),
        { href: "/settings", label: "Settings", icon: Settings },
    ];

    if (variant === "mobile") {
        return (
            <div>
                <div className="flex items-center gap-3">
                    <Avatar author={{ display_name: name, avatar_url: profile?.avatar_url ?? null }} />
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{name}</p>{profile && <p className="news-byline">@{profile.username}</p>}</div>
                </div>
                <div className="mt-4 flex flex-col">
                    {items.map((item) => <a key={item.href} href={item.href} onClick={onNavigate} className="flex items-center gap-2.5 border-t border-ink/[0.19] py-3 text-sm font-semibold text-ink"><item.icon size={16} className="text-ink/[0.68]" aria-hidden="true" /> {item.label}</a>)}
                    <button type="button" onClick={() => void leave()} className="flex items-center gap-2.5 border-y border-ink/[0.19] py-3 text-left text-sm font-semibold text-ink"><LogOut size={16} className="text-ink/[0.68]" aria-hidden="true" /> Sign out</button>
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="flex items-center gap-1.5 border border-ink/[0.19] p-1 pr-2 transition-colors hover:border-ink">
                <Avatar author={{ display_name: name, avatar_url: profile?.avatar_url ?? null }} size="sm" />
                <ChevronDown size={13} className={cn("text-ink/[0.68] transition-transform", open && "rotate-180")} aria-hidden="true" />
            </button>
            {open && (
                <div role="menu" className="news-menu">
                    <div className="news-menu-head">
                        <p className="truncate text-sm font-semibold text-ink">{name}</p>
                        <p className="news-byline truncate">{profile ? `@${profile.username} · ${ROLE_LABELS[profile.role]}` : user.email}</p>
                    </div>
                    {items.map((item) => (
                        <a key={item.href} href={item.href} role="menuitem" className="font-medium text-ink first-of-type:border-t-0">
                            <item.icon size={16} className="text-ink/[0.68]" aria-hidden="true" /> {item.label}
                        </a>
                    ))}
                    <button type="button" role="menuitem" onClick={() => void leave()} className="font-medium text-ink">
                        <LogOut size={16} className="text-ink/[0.68]" aria-hidden="true" /> Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
