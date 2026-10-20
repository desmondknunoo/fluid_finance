import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addReply, formatRelative, getThread, listReplies, type ForumReply, type ForumThread } from "@/lib/community";
import { PostText } from "@/lib/markdown";
import { forumCategoryHref } from "@/lib/navigation";
import { Notice, QuietButton } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { PostComposer } from "@/components/community/post-composer";
import { PostList, ReportForm } from "@/components/community/post-list";
import { UserChip } from "@/components/community/user-chip";
import { reportContent } from "@/lib/community";
import { useSeo } from "@/lib/seo";
import { notFoundMeta, threadMeta } from "@/lib/seo-routes";

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

    useSeo(thread ? threadMeta(thread) : thread === null ? notFoundMeta(`/forum/t/${id}`, "Discussion") : null);

    if (error) return <main className="page-container news-page"><Notice tone="error" className="mt-8">{error}</Notice></main>;
    if (thread === undefined) return <main className="page-container news-page"><p className="news-loading">Loading discussion…</p></main>;
    if (thread === null || thread.deleted_at) {
        return (
            <main className="page-container news-page">
                <PageIntro eyebrow="Community" title="Discussion not available" description={<>It may have been removed. <a href="/forum" className="text-fluid-cyan-ink underline">Back to the forum</a>.</>} />
            </main>
        );
    }

    const visibleReplies = replies.filter((item) => !item.deleted_at).length;

    return (
        <main className="page-container news-page">
            <div className="mx-auto max-w-4xl pt-6">
                <a href={forumCategoryHref(thread.category?.slug ?? null)} className="news-text-link"><ArrowLeft size={14} aria-hidden="true" /> {thread.category?.name ?? "Forum"}</a>

                <article className="mt-6">
                    <p className="news-kicker flex-wrap">
                        {thread.category && <a href={forumCategoryHref(thread.category.slug)} className="text-fluid-cyan-ink hover:underline">{thread.category.name}</a>}
                        {thread.pinned && <span className="news-pill news-pill--neutral">Pinned</span>}
                        {thread.locked && <span className="news-pill news-pill--neutral">Locked</span>}
                    </p>
                    <h1 className="news-headline-lg mt-4 text-ink">{thread.title}</h1>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-ink/[0.19] py-4">
                        <UserChip author={thread.author} meta={`Started ${formatRelative(thread.created_at)}`} />
                        {user && user.id !== thread.author_id && (
                            <QuietButton size="sm" onClick={() => setReporting((value) => !value)}>Report</QuietButton>
                        )}
                    </div>
                    {reporting && user && <ReportForm onSubmit={(reason) => reportContent({ targetType: "forum_thread", targetId: thread.id, reporterId: user.id, reason })} onDone={() => setReporting(false)} />}
                    <PostText source={thread.body} className="news-prose mt-6" />
                </article>

                <section className="news-section" aria-labelledby="replies-heading">
                    <header className="news-section-header">
                        <h2 id="replies-heading">{visibleReplies} {visibleReplies === 1 ? "reply" : "replies"}</h2>
                    </header>
                    <div className="mt-6">
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
                    </div>
                    <div className="mt-8 border-t border-ink/[0.19] pt-8">
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
