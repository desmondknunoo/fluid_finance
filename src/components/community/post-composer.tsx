import { useState, type FormEvent } from "react";
import { LogIn, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { openLogin } from "@/lib/navigation";
import { inputClass, Notice, PrimaryButton, SecondaryButton } from "@/components/ui/form";
import { Avatar } from "@/components/community/user-chip";
import { cn } from "@/lib/utils";

/**
 * One text box for comments and replies. Signed-out visitors see the prompt to join instead of a
 * disabled field, so the invitation is explicit.
 */
export function PostComposer({ onSubmit, placeholder, submitLabel = "Post", onCancel, autoFocus, compact = false, maxLength = 2000 }: {
    onSubmit: (body: string) => Promise<void>;
    placeholder: string;
    submitLabel?: string;
    onCancel?: () => void;
    autoFocus?: boolean;
    compact?: boolean;
    maxLength?: number;
}) {
    const { user, profile, loading } = useAuth();
    const [body, setBody] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    if (loading) return null;

    if (!user) {
        return (
            <div className={cn("flex flex-col items-start gap-3 rounded-2xl border border-dashed border-ink/[0.14] p-5 sm:flex-row sm:items-center sm:justify-between", compact && "p-4")}>
                <p className="text-sm text-ink/60">Join the conversation — sign in or create a free Fluid Finance account.</p>
                <SecondaryButton onClick={() => openLogin()} className="shrink-0"><LogIn size={16} /> Sign in to post</SecondaryButton>
            </div>
        );
    }

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (busy || !body.trim()) return;
        setBusy(true);
        setError("");
        try {
            await onSubmit(body);
            setBody("");
            onCancel?.();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not post. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className={cn("flex gap-3", compact ? "items-start" : "items-start")}>
            {profile && !compact && <Avatar author={profile} className="mt-1 hidden sm:grid" />}
            <div className="min-w-0 flex-1">
                <textarea
                    value={body}
                    onChange={(event) => { setBody(event.target.value); setError(""); }}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    rows={compact ? 2 : 3}
                    aria-label={placeholder}
                    className={cn(inputClass, "resize-y leading-relaxed", compact ? "min-h-[4.5rem]" : "min-h-[6rem]")}
                />
                {error && <Notice tone="error" className="mt-3">{error}</Notice>}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-ink/40 tabular-nums">{body.length.toLocaleString()} / {maxLength.toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                        {onCancel && <SecondaryButton onClick={onCancel} className="min-h-[2.5rem]">Cancel</SecondaryButton>}
                        <PrimaryButton type="submit" loading={busy} disabled={!body.trim()} className="min-h-[2.5rem]"><Send size={15} /> {submitLabel}</PrimaryButton>
                    </div>
                </div>
            </div>
        </form>
    );
}
