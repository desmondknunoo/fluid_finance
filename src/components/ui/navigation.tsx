"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandLogo } from "@/components/ui/brand-logo";

const NAV_LINK =
    "text-xs font-semibold uppercase tracking-widest transition-colors font-poppins";

interface DropdownItem {
    label: string;
    href: string;
}

interface DropdownGroup {
    label: string;
    items: DropdownItem[];
}

const DROPDOWN_GROUPS: DropdownGroup[] = [
    {
        label: "Education",
        items: [
            { label: "Learning Center", href: "#/learning-center" },
            { label: "Market Education", href: "#/market-education" },
        ],
    },
    {
        label: "Market Data",
        items: [
            { label: "Market Snapshot", href: "#market-snapshot" },
            { label: "Business & News", href: "#/business-news" },
        ],
    },
    {
        label: "Support",
        items: [
            { label: "Help Center", href: "#/help-center" },
            { label: "Contact Support", href: "#/contact-support" },
        ],
    },
];

const SECTIONS = [
    { label: "Features", href: "#features" },
    { label: "About", href: "#/about-us" },
] as const;

function DesktopDropdown({ group }: { group: DropdownGroup }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }, []);

    useEffect(() => {
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, handleClickOutside]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                }}
                className={cn(
                    NAV_LINK,
                    "flex items-center gap-1 text-ink/40 hover:text-ink transition-colors"
                )}
                aria-expanded={open}
                aria-haspopup="true"
            >
                {group.label}
                <ChevronDown
                    size={12}
                    className={cn("transition-transform duration-200", open && "rotate-180")}
                />
            </button>
            {open && (
                <div
                    className="absolute top-full left-0 mt-2 w-64 bg-canvas border border-ink/[0.08] rounded-xl shadow-lg overflow-hidden z-50"
                    role="menu"
                >
                    {group.items.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={(e) => {
                                e.preventDefault();
                                window.location.hash = item.href;
                                setOpen(false);
                            }}
                            className="block px-4 py-3 hover:bg-ink/[0.03] transition-colors"
                        >
                            <span className="text-sm font-semibold text-ink font-poppins block">
                                {item.label}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

function MobileAccordion({ group }: { group: DropdownGroup }) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins py-2"
            >
                {group.label}
                <ChevronDown
                    size={16}
                    className={cn("transition-transform duration-200", open && "rotate-180")}
                />
            </button>
            {open && (
                <div className="pl-4 flex flex-col gap-3 mt-1">
                    {group.items.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="text-xs font-semibold uppercase tracking-widest text-ink/40 hover:text-ink font-poppins"
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

export const Navigation = memo(() => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 border-b border-ink/[0.08] bg-canvas/90 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <a href="#" aria-label="Fluid Finance home" className="shrink-0">
                        <BrandLogo variant="horizontal" className="h-12 sm:h-[6rem] lg:h-[7rem]" />
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
                        {SECTIONS.map((section) => (
                            <a
                                key={section.href}
                                href={section.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    window.location.hash = section.href;
                                }}
                                className={cn(NAV_LINK, "text-ink/40 hover:text-ink")}
                            >
                                {section.label}
                            </a>
                        ))}

                        {DROPDOWN_GROUPS.map((group) => (
                            <DesktopDropdown key={group.label} group={group} />
                        ))}

                        <a
                            href="#/gse-live"
                            onClick={(e) => {
                                e.preventDefault();
                                window.location.hash = "#/gse-live";
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={cn(NAV_LINK, "text-ink/40 hover:text-ink")}
                        >
                            GSE Live
                        </a>
                    </div>

                    <div className="hidden md:flex shrink-0 items-center gap-3">
                        <ThemeToggle />
                    </div>

                    {/* Mobile Toggle */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            type="button"
                            className="text-ink"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Bottom clickable area to return to top */}
            <div
                className="absolute bottom-0 left-0 right-0 h-8 cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Return to top of page"
            />

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-canvas border-t border-ink/[0.08] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-6 py-8 flex flex-col gap-5">
                {SECTIONS.map((section) => (
                    <a
                        key={section.href}
                        href={section.href}
                        onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            window.location.hash = section.href;
                        }}
                        className="text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins"
                    >
                                {section.label}
                            </a>
                        ))}

                    <a
                        href="#/gse-live"
                        onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            window.location.hash = "#/gse-live";
                        }}
                        className="text-sm font-bold uppercase tracking-widest text-ink/60 font-poppins"
                    >
                            GSE Live
                        </a>

                        <hr className="border-ink/10" />

                        {DROPDOWN_GROUPS.map((group) => (
                            <MobileAccordion key={group.label} group={group} />
                        ))}

                        <hr className="border-ink/10" />
                    </div>
                </div>
            )}
        </header>
    );
});
