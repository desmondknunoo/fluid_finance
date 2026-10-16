import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/community";
import { openLogin, profileHref } from "@/lib/navigation";
import { Avatar } from "@/components/community/user-chip";
import { cn } from "@/lib/utils";

const NAV_LINK = "text-xs font-semibold uppercase tracking-widest transition-colors font-poppins";

/** Sign-in controls for the top bar, and a flat list for the phone menu. */
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
    useEffect(() => {
        const onHash = () => setOpen(false);
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);

    const leave = async () => {
        await signOut();
        onNavigate?.();
        window.location.hash = "#/";
    };

    if (loading) return <span className={cn("inline-block rounded-full bg-ink/[0.06]", variant === "desktop" ? "h-9 w-24 animate-pulse" : "h-10 w-32 animate-pulse")} aria-hidden="true" />;

    if (!user) {
        if (variant === "mobile") {
            return (
                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => { onNavigate?.(); openLogin(); }} className="min-h-[2.75rem] rounded-xl border border-ink/[0.14] text-sm font-semibold text-ink">Sign in</button>
                    <a href="#/register" onClick={onNavigate} className="grid min-h-[2.75rem] place-items-center rounded-xl bg-fluid-cyan text-sm font-semibold text-fluid-action-ink">Join free</a>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => openLogin()} className={cn(NAV_LINK, "text-ink/50 hover:text-ink")}>Sign in</button>
                <a href="#/register" className={cn(NAV_LINK, "rounded-full bg-fluid-cyan px-4 py-2 text-fluid-action-ink hover:bg-fluid-cyan-hover")}>Join</a>
            </div>
        );
    }

    const name = profile?.display_name ?? user.email ?? "Member";
    const items = [
        ...(profile ? [{ href: profileHref(profile.username), label: "Your profile", icon: UserRound }] : []),
        { href: "#/settings", label: "Settings", icon: Settings },
    ];

    if (variant === "mobile") {
        return (
            <div>
                <div className="flex items-center gap-3">
                    <Avatar author={{ display_name: name, avatar_url: profile?.avatar_url ?? null }} />
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{name}</p>{profile && <p className="text-xs text-ink/50">@{profile.username}</p>}</div>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                    {items.map((item) => <a key={item.href} href={item.href} onClick={onNavigate} className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins"><item.icon size={16} aria-hidden="true" /> {item.label}</a>)}
                    <button type="button" onClick={() => void leave()} className="inline-flex items-center gap-2 text-left text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins"><LogOut size={16} aria-hidden="true" /> Sign out</button>
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="flex items-center gap-2 rounded-full border border-ink/[0.08] py-1 pl-1 pr-2.5 transition-colors hover:border-ink/20">
                <Avatar author={{ display_name: name, avatar_url: profile?.avatar_url ?? null }} size="sm" />
                <ChevronDown size={13} className={cn("text-ink/50 transition-transform", open && "rotate-180")} aria-hidden="true" />
            </button>
            {open && (
                <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-ink/[0.08] bg-canvas shadow-lg">
                    <div className="border-b border-ink/[0.08] px-4 py-3">
                        <p className="truncate text-sm font-semibold text-ink">{name}</p>
                        <p className="truncate text-xs text-ink/50">{profile ? `@${profile.username} · ${ROLE_LABELS[profile.role]}` : user.email}</p>
                    </div>
                    {items.map((item) => (
                        <a key={item.href} href={item.href} role="menuitem" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink/80 transition-colors hover:bg-ink/[0.04] hover:text-ink">
                            <item.icon size={16} className="text-ink/50" aria-hidden="true" /> {item.label}
                        </a>
                    ))}
                    <button type="button" role="menuitem" onClick={() => void leave()} className="flex w-full items-center gap-3 border-t border-ink/[0.08] px-4 py-3 text-left text-sm font-medium text-ink/80 transition-colors hover:bg-ink/[0.04] hover:text-ink">
                        <LogOut size={16} className="text-ink/50" aria-hidden="true" /> Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
