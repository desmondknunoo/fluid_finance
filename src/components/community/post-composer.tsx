import { useState, type FormEvent } from "react";
import { LogIn, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { openLogin } from "@/lib/navigation";
import { Notice, PrimaryButton, QuietButton, SecondaryButton, TextArea } from "@/components/ui/form";
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
            <div className={cn("flex flex-col items-start gap-3 border-y border-ink/[0.19] py-4 sm:flex-row sm:items-center sm:justify-between", compact && "py-3")}>
                <p className="text-sm text-ink/[0.68]">Join the conversation — sign in or create a free Fluid Finance account.</p>
                <SecondaryButton size="sm" onClick={() => openLogin()} className="shrink-0"><LogIn size={15} aria-hidden="true" /> Sign in to post</SecondaryButton>
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
        <form onSubmit={submit} className="flex items-start gap-3">
            {profile && !compact && <Avatar author={profile} className="mt-6 hidden sm:grid" />}
            <div className="min-w-0 flex-1">
                <TextArea
                    label={`Your ${submitLabel.toLowerCase()}`}
                    value={body}
                    onChange={(event) => { setBody(event.target.value); setError(""); }}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    rows={compact ? 2 : 3}
                    hint={<span className="news-mono">{body.length.toLocaleString()} / {maxLength.toLocaleString()}</span>}
                />
                {error && <Notice tone="error" className="mt-3">{error}</Notice>}
                <div className="news-form-actions mt-3">
                    {onCancel && <QuietButton size="sm" onClick={onCancel}>Cancel</QuietButton>}
                    <PrimaryButton type="submit" size="sm" loading={busy} disabled={!body.trim()}><Send size={14} aria-hidden="true" /> {submitLabel}</PrimaryButton>
                </div>
            </div>
        </form>
    );
}
