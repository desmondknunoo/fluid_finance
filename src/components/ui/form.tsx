import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useId } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form recipe for the member-facing pages in the editorial system: square fields with a hairline
 * border, small-caps labels, a cyan primary action and an ink-outlined secondary one, and notices
 * drawn as a rule down the left edge rather than a tinted card.
 */

export const panelClass = "news-panel";
export const inputClass = "news-input";
export const selectClass = "news-select";

function Caption({ hint, error }: { hint?: ReactNode; error?: string | null }) {
    if (error) return <p className="news-field-error" role="alert">{error}</p>;
    return hint ? <p className="news-hint">{hint}</p> : null;
}

export function TextField({ label, hint, error, className, ...props }: {
    label: string;
    hint?: ReactNode;
    error?: string | null;
    className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="news-label">{label}</label>
            <input id={id} aria-invalid={error ? true : undefined} className={inputClass} {...props} />
            <Caption hint={hint} error={error} />
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
            <label htmlFor={id} className="news-label">{label}</label>
            <textarea id={id} aria-invalid={error ? true : undefined} className="news-textarea" {...props} />
            <Caption hint={hint} error={error} />
        </div>
    );
}

export function SelectField({ label, hint, error, className, children, ...props }: {
    label: string;
    hint?: ReactNode;
    error?: string | null;
    className?: string;
    children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="news-label">{label}</label>
            <select id={id} aria-invalid={error ? true : undefined} className={selectClass} {...props}>{children}</select>
            <Caption hint={hint} error={error} />
        </div>
    );
}

export function PrimaryButton({ children, loading, className, disabled, size, ...props }: { children: ReactNode; loading?: boolean; size?: "sm" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button type="button" className={cn("news-button", size === "sm" && "news-button--sm", className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {children}
        </button>
    );
}

export function SecondaryButton({ children, className, size, ...props }: { children: ReactNode; size?: "sm" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button type="button" className={cn("news-button-secondary", size === "sm" && "news-button-secondary--sm", className)} {...props}>
            {children}
        </button>
    );
}

export function QuietButton({ children, className, size, ...props }: { children: ReactNode; size?: "sm" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button type="button" className={cn("news-button-quiet", size === "sm" && "news-button-quiet--sm", className)} {...props}>
            {children}
        </button>
    );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "error" | "success"; children: ReactNode; className?: string }) {
    return (
        <p role={tone === "error" ? "alert" : "status"} className={cn("news-notice", tone === "error" && "news-notice--error", tone === "success" && "news-notice--success", className)}>
            {children}
        </p>
    );
}

/** Honest quiet state for a list with nothing in it yet. */
export function EmptyState({ title, children, action, className }: { title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
    return (
        <div className={cn("news-empty", className)}>
            <h3>{title}</h3>
            {children && <p>{children}</p>}
            {action}
        </div>
    );
}
