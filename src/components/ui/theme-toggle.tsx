import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/lib/theme";

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { mode: "light", label: "Light", Icon: Sun },
    { mode: "system", label: "System", Icon: Monitor },
    { mode: "dark", label: "Dark", Icon: Moon },
];

/** Three-way segmented control: light, system (the default), dark. Square cells behind one hairline. */
export function ThemeToggle({ className }: { className?: string }) {
    const { mode, setMode } = useTheme();

    return (
        <div
            role="radiogroup"
            aria-label="Colour scheme"
            className={cn("inline-flex items-stretch border border-ink/[0.12] divide-x divide-ink/[0.19] rounded-xl", className)}
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
                        "grid h-10 w-10 place-items-center transition-colors",
                        mode === value ? "bg-ink/[0.055] text-fluid-cyan-ink" : "text-ink/[0.68] hover:text-ink",
                    )}
                >
                    <Icon size={16} aria-hidden="true" />
                </button>
            ))}
        </div>
    );
}

/** Compact single-button variant for the masthead: a 40px square with a hairline border. */
export function ThemeToggleButton({ className }: { className?: string }) {
    const { resolved, toggle } = useTheme();

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className={cn("news-icon-button h-10 w-10 text-ink", className)}
        >
            {resolved === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
    );
}
