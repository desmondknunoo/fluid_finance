import { useMemo, useState } from "react";
import { CornerDownRight, Flag, MessageSquare, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { editOwnPost, formatRelative, reportContent, type Post } from "@/lib/community";
import { PostText } from "@/lib/markdown";
import { inputClass, Notice, PrimaryButton, SecondaryButton } from "@/components/ui/form";
import { PostComposer } from "@/components/community/post-composer";
import { UserChip } from "@/components/community/user-chip";
import { cn } from "@/lib/utils";

type PostTable = "article_comments" | "forum_replies";
type ReportTarget = "article_comment" | "forum_reply";

/**
 * Threaded posts: top-level entries with one level of replies beneath them. Shared by article
 * comments and forum threads so both read the same way.
 */
export function PostList<T extends Post>({ posts, table, reportTarget, onReply, onEdited, replyPlaceholder, emptyTitle, locked = false }: {
    posts: T[];
    table: PostTable;
    reportTarget: ReportTarget;
    onReply: (body: string, parentId: string) => Promise<void>;
    onEdited: (id: string, body: string) => void;
    replyPlaceholder: string;
    emptyTitle: string;
    locked?: boolean;
}) {
    const tree = useMemo(() => {
        const replies = new Map<string, T[]>();
        const roots: T[] = [];
        for (const post of posts) {
            if (post.parent_id) {
                const list = replies.get(post.parent_id) ?? [];
                list.push(post);
                replies.set(post.parent_id, list);
            } else {
                roots.push(post);
            }
        }
        // A reply whose parent was removed still shows, attached to the top level.
        for (const [parentId, list] of replies) {
            if (!posts.some((post) => post.id === parentId)) roots.push(...list);
        }
        return { roots, replies };
    }, [posts]);

    if (!posts.length) {
        return (
            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] px-6 py-10 text-center">
                <MessageSquare size={22} className="mx-auto mb-3 text-ink/30" aria-hidden="true" />
                <p className="font-semibold text-ink">{emptyTitle}</p>
                <p className="mt-1 text-sm text-ink/50">Be the first to share a view.</p>
            </div>
        );
    }

    return (
        <ol className="divide-y divide-ink/[0.06]">
            {tree.roots.map((post) => (
                <li key={post.id} className="py-5 first:pt-0">
                    <PostItem post={post} table={table} reportTarget={reportTarget} onReply={onReply} onEdited={onEdited} replyPlaceholder={replyPlaceholder} locked={locked} />
                    {(tree.replies.get(post.id)?.length ?? 0) > 0 && (
                        <ol className="mt-4 space-y-4 border-l border-ink/[0.08] pl-4 sm:ml-11 sm:pl-5">
                            {tree.replies.get(post.id)!.map((reply) => (
                                <li key={reply.id}>
                                    <PostItem post={reply} table={table} reportTarget={reportTarget} onEdited={onEdited} replyPlaceholder={replyPlaceholder} locked={locked} isReply />
                                </li>
                            ))}
                        </ol>
                    )}
                </li>
            ))}
        </ol>
    );
}

function PostItem({ post, table, reportTarget, onReply, onEdited, replyPlaceholder, locked, isReply = false }: {
    post: Post;
    table: PostTable;
    reportTarget: ReportTarget;
    onReply?: (body: string, parentId: string) => Promise<void>;
    onEdited: (id: string, body: string) => void;
    replyPlaceholder: string;
    locked: boolean;
    isReply?: boolean;
}) {
    const { user } = useAuth();
    const [mode, setMode] = useState<"idle" | "reply" | "edit" | "report">("idle");
    const own = !!user && user.id === post.author_id;
    const removed = Boolean(post.deleted_at);

    return (
        <article className={cn(removed && "opacity-60")} aria-label={`Post by ${post.author?.display_name ?? "a former member"}`}>
            <header className="flex flex-wrap items-center justify-between gap-2">
                <UserChip author={post.author} size={isReply ? "sm" : "md"} meta={`${formatRelative(post.created_at)}${post.edited_at ? " · edited" : ""}`} />
                {isReply && <CornerDownRight size={14} className="text-ink/25 sm:hidden" aria-hidden="true" />}
            </header>
            <div className={cn("mt-2.5 text-sm sm:text-[15px]", !isReply && "sm:pl-11")}>
                {removed ? (
                    <p className="italic text-ink/40">This post was removed by a moderator.</p>
                ) : mode === "edit" ? (
                    <EditForm post={post} table={table} onDone={(body) => { onEdited(post.id, body); setMode("idle"); }} onCancel={() => setMode("idle")} />
                ) : (
                    <PostText source={post.body} />
                )}
                {!removed && mode !== "edit" && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1">
                        {onReply && !locked && <ActionButton icon={CornerDownRight} label="Reply" active={mode === "reply"} onClick={() => setMode(mode === "reply" ? "idle" : "reply")} />}
                        {own && <ActionButton icon={Pencil} label="Edit" onClick={() => setMode("edit")} />}
                        {user && !own && <ActionButton icon={Flag} label="Report" active={mode === "report"} onClick={() => setMode(mode === "report" ? "idle" : "report")} />}
                    </div>
                )}
                {mode === "reply" && onReply && (
                    <div className="mt-3">
                        <PostComposer compact autoFocus placeholder={replyPlaceholder} submitLabel="Reply" onSubmit={(body) => onReply(body, post.id)} onCancel={() => setMode("idle")} />
                    </div>
                )}
                {mode === "report" && user && (
                    <ReportForm onSubmit={(reason) => reportContent({ targetType: reportTarget, targetId: post.id, reporterId: user.id, reason })} onDone={() => setMode("idle")} />
                )}
            </div>
        </article>
    );
}

function ActionButton({ icon: Icon, label, onClick, active = false }: { icon: typeof Pencil; label: string; onClick: () => void; active?: boolean }) {
    return (
        <button type="button" onClick={onClick} className={cn("inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors hover:bg-ink/[0.05] hover:text-ink", active ? "text-fluid-cyan-ink" : "text-ink/50")}>
            <Icon size={13} aria-hidden="true" /> {label}
        </button>
    );
}

function EditForm({ post, table, onDone, onCancel }: { post: Post; table: PostTable; onDone: (body: string) => void; onCancel: () => void }) {
    const [body, setBody] = useState(post.body);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const save = async () => {
        setBusy(true);
        setError("");
        try {
            await editOwnPost(table, post.id, body);
            onDone(body.trim());
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not save.");
        } finally {
            setBusy(false);
        }
    };
    return (
        <div>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} aria-label="Edit your post" className={cn(inputClass, "min-h-[5rem] resize-y")} autoFocus />
            {error && <Notice tone="error" className="mt-2">{error}</Notice>}
            <div className="mt-2 flex justify-end gap-2">
                <SecondaryButton onClick={onCancel} className="min-h-[2.5rem]">Cancel</SecondaryButton>
                <PrimaryButton onClick={() => void save()} loading={busy} disabled={!body.trim()} className="min-h-[2.5rem]">Save</PrimaryButton>
            </div>
        </div>
    );
}

export function ReportForm({ onSubmit, onDone }: { onSubmit: (reason: string) => Promise<void>; onDone: () => void }) {
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [state, setState] = useState<{ error?: string; sent?: boolean }>({});
    const send = async () => {
        setBusy(true);
        setState({});
        try {
            await onSubmit(reason);
            setState({ sent: true });
            setTimeout(onDone, 1800);
        } catch (caught) {
            setState({ error: caught instanceof Error ? caught.message : "Could not send the report." });
        } finally {
            setBusy(false);
        }
    };
    if (state.sent) return <Notice tone="success" className="mt-3">Thanks — the moderation team will review this.</Notice>;
    return (
        <div className="mt-3 rounded-xl border border-ink/[0.08] bg-ink/[0.02] p-3">
            <label className="block text-xs font-medium text-ink/60">Why are you reporting this?
                <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Spam, abuse, misleading financial claims…" className={cn(inputClass, "mt-1.5 py-2.5")} autoFocus />
            </label>
            {state.error && <Notice tone="error" className="mt-2">{state.error}</Notice>}
            <div className="mt-2 flex justify-end gap-2">
                <SecondaryButton onClick={onDone} className="min-h-[2.25rem]">Cancel</SecondaryButton>
                <PrimaryButton onClick={() => void send()} loading={busy} disabled={reason.trim().length < 3} className="min-h-[2.25rem]">Send report</PrimaryButton>
            </div>
        </div>
    );
}
