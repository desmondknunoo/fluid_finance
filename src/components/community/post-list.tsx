import { useMemo, useState } from "react";
import { CornerDownRight, Flag, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { editOwnPost, formatRelative, reportContent, type Post } from "@/lib/community";
import { PostText } from "@/lib/markdown";
import { EmptyState, Notice, PrimaryButton, QuietButton, TextArea, TextField } from "@/components/ui/form";
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
        return <EmptyState title={emptyTitle}>Be the first to share a view.</EmptyState>;
    }

    return (
        <ol className="news-list">
            {tree.roots.map((post) => (
                <li key={post.id}>
                    <PostItem post={post} table={table} reportTarget={reportTarget} onReply={onReply} onEdited={onEdited} replyPlaceholder={replyPlaceholder} locked={locked} />
                    {(tree.replies.get(post.id)?.length ?? 0) > 0 && (
                        <ol className="mt-4 space-y-4 border-l border-ink/[0.12] pl-4 sm:ml-11">
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
                {isReply && <CornerDownRight size={14} className="text-ink/[0.4] sm:hidden" aria-hidden="true" />}
            </header>
            <div className={cn("mt-2.5 text-sm sm:text-[15px]", !isReply && "sm:pl-11")}>
                {removed ? (
                    <p className="italic text-ink/[0.4]">This post was removed by a moderator.</p>
                ) : mode === "edit" ? (
                    <EditForm post={post} table={table} onDone={(body) => { onEdited(post.id, body); setMode("idle"); }} onCancel={() => setMode("idle")} />
                ) : (
                    <PostText source={post.body} />
                )}
                {!removed && mode !== "edit" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {onReply && !locked && <ActionButton icon={CornerDownRight} label="Reply" active={mode === "reply"} onClick={() => setMode(mode === "reply" ? "idle" : "reply")} />}
                        {own && <ActionButton icon={Pencil} label="Edit" onClick={() => setMode("edit")} />}
                        {user && !own && <ActionButton icon={Flag} label="Report" active={mode === "report"} onClick={() => setMode(mode === "report" ? "idle" : "report")} />}
                    </div>
                )}
                {mode === "reply" && onReply && (
                    <div className="mt-4">
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
        <button type="button" onClick={onClick} aria-pressed={active} className={cn("news-button-quiet news-button-quiet--sm", active && "!border-ink !text-fluid-cyan-ink")}>
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
            <TextArea label="Edit your post" value={body} onChange={(event) => setBody(event.target.value)} rows={3} autoFocus />
            {error && <Notice tone="error" className="mt-2">{error}</Notice>}
            <div className="news-form-actions mt-3">
                <QuietButton size="sm" onClick={onCancel}>Cancel</QuietButton>
                <PrimaryButton size="sm" onClick={() => void save()} loading={busy} disabled={!body.trim()}>Save</PrimaryButton>
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
        <div className="mt-3 border-l-[3px] border-ink pl-4">
            <TextField label="Why are you reporting this?" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Spam, abuse, misleading financial claims…" autoFocus />
            {state.error && <Notice tone="error" className="mt-2">{state.error}</Notice>}
            <div className="news-form-actions mt-3">
                <QuietButton size="sm" onClick={onDone}>Cancel</QuietButton>
                <PrimaryButton size="sm" onClick={() => void send()} loading={busy} disabled={reason.trim().length < 3}>Send report</PrimaryButton>
            </div>
        </div>
    );
}
