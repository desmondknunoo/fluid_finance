import { type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, useId } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form recipe for the member-facing pages: one input shape, one set of buttons, one notice style,
 * matching the fuel editor and the Fluid dashboard primitives (12px corners, cyan focus).
 */

export const panelClass = "rounded-2xl border border-ink/[0.08] bg-ink/[0.02]";
export const inputClass = "w-full min-w-0 rounded-xl border border-ink/[0.14] bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink/40 transition-colors focus:border-fluid-cyan/70 focus:bg-ink/[0.02] focus:outline-none md:text-sm";

export function TextField({ label, hint, error, className, ...props }: {
    label: string;
    hint?: ReactNode;
    error?: string | null;
    className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink/70">{label}</label>
            <input id={id} aria-invalid={error ? true : undefined} className={cn(inputClass, error && "border-rose-400/70")} {...props} />
            {error ? <p className="mt-1.5 text-sm text-rose-400" role="alert">{error}</p> : hint ? <p className="mt-1.5 text-xs text-ink/50">{hint}</p> : null}
        </div>
    );
}

export function TextArea({ label, hint, error, className, ...props }: {
    label: string;
    hint?: ReactNode;
    error?: string | null;
    className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink/70">{label}</label>
            <textarea id={id} aria-invalid={error ? true : undefined} className={cn(inputClass, "min-h-[7rem] resize-y leading-relaxed", error && "border-rose-400/70")} {...props} />
            {error ? <p className="mt-1.5 text-sm text-rose-400" role="alert">{error}</p> : hint ? <p className="mt-1.5 text-xs text-ink/50">{hint}</p> : null}
        </div>
    );
}

export function PrimaryButton({ children, loading, className, disabled, ...props }: { children: ReactNode; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn("inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl bg-fluid-cyan px-5 text-sm font-semibold text-fluid-action-ink transition-colors hover:bg-fluid-cyan-hover disabled:cursor-not-allowed disabled:opacity-50", className)}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {children}
        </button>
    );
}

export function SecondaryButton({ children, className, ...props }: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn("inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-ink/[0.14] px-4 text-sm font-medium text-ink/80 transition-colors hover:bg-ink/[0.05] hover:text-ink disabled:cursor-not-allowed disabled:opacity-50", className)}
            {...props}
        >
            {children}
        </button>
    );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "error" | "success"; children: ReactNode; className?: string }) {
    const tones = {
        info: "border-fluid-cyan/25 bg-fluid-cyan/[0.07] text-ink/80",
        error: "border-rose-400/35 bg-rose-400/[0.08] text-rose-400",
        success: "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-500",
    }[tone];
    return <p role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", tones, className)}>{children}</p>;
}
