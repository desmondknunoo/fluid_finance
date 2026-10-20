import { memo, useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { AccountMenu } from "@/components/community/account-menu";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggleButton } from "@/components/ui/theme-toggle";
import { onLocationChange } from "@/lib/navigation";

const LINKS = [
    ["Markets", "/gse-live"],
    ["Research", "/articles"],
    ["Opinion", "/opinion"],
    ["Economy", "/business-news"],
    ["Currencies", "/fx"],
    ["Energy", "/fuel"],
    ["Community", "/forum"],
    ["Education", "/learning-center"],
] as const;
const MORE = [
    ["Watch & live", "/#watch"],
    ["Listen", "/#listen"],
    ["Saved for later", "/saved"],
    ["Market trends", "/market-trends"],
    ["Market education", "/market-education"],
    ["About Fluid", "/about-us"],
    ["Help center", "/help-center"],
    ["Contact support", "/contact-support"],
] as const;

/** The topic a path belongs to: `/articles/x` is under Research, `/forum/t/x` under Community. */
const isCurrent = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export const Navigation = memo(() => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const close = () => { setMobileOpen(false); setMoreOpen(false); setPath(window.location.pathname); };
        const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setMobileOpen(false); setMoreOpen(false); } };
        const stop = onLocationChange(close);
        window.addEventListener("keydown", escape);
        return () => { stop(); window.removeEventListener("keydown", escape); };
    }, []);

    return (
        <header className="news-header">
            <a href="#main-content" className="news-skip" onClick={(event) => { event.preventDefault(); const content = document.getElementById("main-content"); content?.focus(); content?.scrollIntoView({ behavior: "instant" }); }}>Skip to content</a>
            <div className="news-utility">
                <div className="page-container flex items-center justify-between gap-4">
                    <a href="/about-us" className="hover:underline">Fluid Finance · Ghana's markets, in focus</a>
                    <a href="/gse-live" className="inline-flex items-center gap-1.5 whitespace-nowrap">Explore market data <ArrowUpRight size={12} aria-hidden="true" /></a>
                </div>
            </div>
            <div className="page-container news-masthead">
                <a href="/" aria-label="Fluid Finance home" className="news-brand">
                    <BrandLogo variant="horizontal" className="h-12 sm:h-14" />
                </a>
                <div className="flex items-center gap-2 sm:gap-5">
                    <span className="news-edition hidden lg:block">Ghana edition <span aria-hidden="true">/</span> Accra, GMT</span>
                    <ThemeToggleButton />
                    <div className="hidden sm:block"><AccountMenu /></div>
                    <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="news-mobile-menu" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} className="grid h-11 w-11 place-items-center border border-ink/20 lg:hidden">
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
            <div className="news-topic-bar">
                <nav aria-label="Main navigation" className="page-container hidden items-center lg:flex">
                    <a href="/" className="news-nav-link" aria-current={path === "/" ? "page" : undefined}>Home</a>
                    {LINKS.map(([label, href]) => <a key={href} href={href} className="news-nav-link" aria-current={isCurrent(path, href) ? "page" : undefined}>{label}</a>)}
                    <div className="relative ml-auto" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMoreOpen(false); }}>
                        <button type="button" className="news-nav-link flex items-center gap-1.5" onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} aria-controls="news-more">More <ChevronDown size={13} aria-hidden="true" /></button>
                        {moreOpen && <div id="news-more" className="absolute right-0 top-full z-50 w-56 border border-ink/20 bg-canvas p-2 shadow-lg">{MORE.map(([label, href]) => <a key={href} href={href} className="block px-3 py-3 text-sm hover:bg-ink/[0.06]">{label}</a>)}</div>}
                    </div>
                </nav>
                <nav aria-label="Quick navigation" className="page-container flex overflow-x-auto lg:hidden">
                    {LINKS.slice(0, 5).map(([label, href]) => <a key={href} href={href} className="news-nav-link shrink-0" aria-current={isCurrent(path, href) ? "page" : undefined}>{label}</a>)}
                </nav>
            </div>
            {mobileOpen && <nav id="news-mobile-menu" aria-label="Expanded navigation" className="page-container border-b border-ink/20 py-5 lg:hidden">
                <div className="grid grid-cols-2 gap-x-6">{[["Home", "/"], ...LINKS, ...MORE].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileOpen(false)} className="border-b border-ink/10 py-3 text-sm font-semibold">{label}</a>)}</div>
                <div className="mt-5"><AccountMenu variant="mobile" onNavigate={() => setMobileOpen(false)} /></div>
            </nav>}
        </header>
    );
});
