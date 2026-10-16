import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Lock, Pin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addReply, formatRelative, getThread, listReplies, type ForumReply, type ForumThread } from "@/lib/community";
import { PostText } from "@/lib/markdown";
import { forumCategoryHref } from "@/lib/navigation";
import { Notice, panelClass } from "@/components/ui/form";
import { PostComposer } from "@/components/community/post-composer";
import { PostList, ReportForm } from "@/components/community/post-list";
import { UserChip } from "@/components/community/user-chip";
import { reportContent } from "@/lib/community";

export default function ThreadPage({ id }: { id: string }) {
    const { user } = useAuth();
    const [thread, setThread] = useState<ForumThread | null | undefined>(undefined);
    const [replies, setReplies] = useState<ForumReply[]>([]);
    const [error, setError] = useState("");
    const [reporting, setReporting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setThread(undefined);
        setReplies([]);
        setError("");
        getThread(id)
            .then(async (found) => {
                if (cancelled) return;
                setThread(found);
                document.title = found ? `${found.title} · Fluid Finance forum` : "Discussion not found · Fluid Finance";
                if (found) setReplies(await listReplies(found.id));
            })
            .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load this discussion."); });
        return () => { cancelled = true; };
    }, [id]);

    const reply = useCallback(async (body: string, parentId: string | null = null) => {
        if (!user || !thread) throw new Error("Sign in to reply.");
        const created = await addReply({ threadId: thread.id, authorId: user.id, body, parentId });
        setReplies((current) => [...current, created]);
        setThread((current) => current ? { ...current, reply_count: current.reply_count + 1, last_reply_at: created.created_at } : current);
    }, [user, thread]);

    if (error) return <main className="page-container py-16"><Notice tone="error">{error}</Notice></main>;
    if (thread === undefined) return <main className="page-container py-16 text-ink/50">Loading discussion…</main>;
    if (thread === null || thread.deleted_at) {
        return (
            <main className="page-container py-16 text-center">
                <h1 className="text-3xl font-bold text-ink font-poppins">Discussion not available</h1>
                <p className="mt-3 text-ink/60">It may have been removed. <a href="#/forum" className="text-fluid-cyan-ink underline">Back to the forum</a>.</p>
            </main>
        );
    }

    const visibleReplies = replies.filter((item) => !item.deleted_at).length;

    return (
        <main className="page-container py-8 sm:py-12">
            <div className="mx-auto max-w-3xl">
                <a href={forumCategoryHref(thread.category?.slug ?? null)} className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink"><ArrowLeft size={15} aria-hidden="true" /> {thread.category?.name ?? "Forum"}</a>

                <article className={`${panelClass} mt-6 p-6 sm:p-8`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
                        {thread.category && <a href={forumCategoryHref(thread.category.slug)} className="font-semibold uppercase tracking-widest text-fluid-cyan-ink">{thread.category.name}</a>}
                        {thread.pinned && <span className="inline-flex items-center gap-1"><Pin size={12} aria-hidden="true" /> Pinned</span>}
                        {thread.locked && <span className="inline-flex items-center gap-1"><Lock size={12} aria-hidden="true" /> Locked</span>}
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink font-poppins sm:text-3xl [text-wrap:balance]">{thread.title}</h1>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.08] pb-5">
                        <UserChip author={thread.author} meta={`Started ${formatRelative(thread.created_at)}`} />
                        {user && user.id !== thread.author_id && (
                            <button type="button" onClick={() => setReporting((value) => !value)} className="text-xs font-medium text-ink/50 hover:text-ink">Report</button>
                        )}
                    </div>
                    {reporting && user && <ReportForm onSubmit={(reason) => reportContent({ targetType: "forum_thread", targetId: thread.id, reporterId: user.id, reason })} onDone={() => setReporting(false)} />}
                    <PostText source={thread.body} className="mt-5 text-[15px] sm:text-base" />
                </article>

                <section className="mt-10" aria-labelledby="replies-heading">
                    <h2 id="replies-heading" className="mb-6 text-xl font-bold text-ink font-poppins">{visibleReplies} {visibleReplies === 1 ? "reply" : "replies"}</h2>
                    <PostList
                        posts={replies}
                        table="forum_replies"
                        reportTarget="forum_reply"
                        onReply={(body, parentId) => reply(body, parentId)}
                        onEdited={(replyId, body) => setReplies((current) => current.map((item) => item.id === replyId ? { ...item, body, edited_at: new Date().toISOString() } : item))}
                        replyPlaceholder="Write a reply…"
                        emptyTitle="No replies yet"
                        locked={thread.locked}
                    />
                    <div className="mt-8 border-t border-ink/[0.08] pt-8">
                        {thread.locked ? (
                            <Notice>This discussion is locked. New replies are closed.</Notice>
                        ) : (
                            <PostComposer placeholder="Add to the discussion…" submitLabel="Reply" onSubmit={(body) => reply(body)} maxLength={5000} />
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
