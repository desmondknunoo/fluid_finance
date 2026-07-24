import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/lib/theme";

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { mode: "light", label: "Light", Icon: Sun },
    { mode: "system", label: "System", Icon: Monitor },
    { mode: "dark", label: "Dark", Icon: Moon },
];

/** Three-way segmented control: light, system (the default), dark. */
export function ThemeToggle({ className }: { className?: string }) {
    const { mode, setMode } = useTheme();

    return (
        <div
            role="radiogroup"
            aria-label="Colour scheme"
            className={cn(
                "inline-flex items-center gap-0.5 rounded-full border border-ink/[0.08] bg-ink/[0.03] p-0.5",
                className,
            )}
        >
            {OPTIONS.map(({ mode: value, label, Icon }) => (
                <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={mode === value}
                    aria-label={`${label} theme`}
                    title={`${label} theme`}
                    onClick={() => setMode(value)}
                    className={cn(
                        "rounded-full p-1.5 transition-colors",
                        mode === value
                            ? "bg-ink/[0.12] text-ink"
                            : "text-ink/40 hover:text-ink/70",
                    )}
                >
                    <Icon size={15} />
                </button>
            ))}
        </div>
    );
}

/** Compact single-button variant for tight headers. */
export function ThemeToggleButton({ className }: { className?: string }) {
    const { resolved, toggle } = useTheme();

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className={cn(
                "rounded-full p-2 text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink",
                className,
            )}
        >
            {resolved === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
