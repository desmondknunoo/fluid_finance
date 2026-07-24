import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Fluid Finance - colour scheme
 *
 * Three settings, defaulting to `system` so a first visit matches the device.
 * The resolved scheme is written to `<html>` as a `dark` / `light` class, which
 * is what Tailwind's class-based dark mode and the CSS variables key off.
 */

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "fluidfinance:theme";

interface ThemeContextValue {
    mode: ThemeMode;
    resolved: ResolvedTheme;
    setMode: (mode: ThemeMode) => void;
    /** Flips between light and dark, leaving `system` behind. */
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredMode(): ThemeMode {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {
        /* private mode — fall through to system */
    }
    return "system";
}

export function applyTheme(resolved: ResolvedTheme): void {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.classList.toggle("light", resolved === "light");
    root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
    const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

    // Track the device setting for as long as the app is open, so a system-level
    // switch is reflected live while mode is `system`.
    useEffect(() => {
        const query = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);

    const resolved: ResolvedTheme = mode === "system" ? (systemDark ? "dark" : "light") : mode;

    useEffect(() => {
        applyTheme(resolved);
    }, [resolved]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        try {
            if (next === "system") localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, next);
        } catch {
            /* preference simply won't persist */
        }
    }, []);

    const toggle = useCallback(() => {
        setMode(resolved === "dark" ? "light" : "dark");
    }, [resolved, setMode]);

    const value = useMemo(
        () => ({ mode, resolved, setMode, toggle }),
        [mode, resolved, setMode, toggle],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside a ThemeProvider");
    return context;
}
