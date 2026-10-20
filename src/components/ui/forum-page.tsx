import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatRelative, listForumCategories, listThreads, type ForumCategory, type ForumThread } from "@/lib/community";
import { forumCategoryHref, newThreadHref, openLogin, threadHref } from "@/lib/navigation";
import { EmptyState, Notice, PrimaryButton, QuietButton } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";

export default function ForumPage({ categorySlug }: { categorySlug: string | null }) {
    const { user } = useAuth();
    const [categories, setCategories] = useState<ForumCategory[] | null>(null);
    const [threads, setThreads] = useState<ForumThread[] | null>(null);
    const [page, setPage] = useState(0);
    const [exhausted, setExhausted] = useState(false);
    const [error, setError] = useState("");

    const category = useMemo(() => categories?.find((item) => item.slug === categorySlug) ?? null, [categories, categorySlug]);

    useEffect(() => {
        document.title = `${category ? `${category.name} · ` : ""}Forum · Fluid Finance`;
    }, [category]);

    useEffect(() => {
        listForumCategories().then(setCategories).catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load the forum."));
    }, []);

    useEffect(() => {
        if (categorySlug && !categories) return;
        if (categorySlug && !category) { setThreads([]); return; }
        let cancelled = false;
        setThreads(null);
        setPage(0);
        setExhausted(false);
        listThreads({ categoryId: category?.id ?? null, page: 0 })
            .then((data) => { if (!cancelled) { setThreads(data); setExhausted(data.length < 20); } })
            .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load discussions."); });
        return () => { cancelled = true; };
    }, [categorySlug, category, categories]);

    const loadMore = async () => {
        const next = page + 1;
        const more = await listThreads({ categoryId: category?.id ?? null, page: next });
        setThreads((current) => [...(current ?? []), ...more]);
        setPage(next);
        if (more.length < 20) setExhausted(true);
    };

    const startThread = () => {
        if (!user) { openLogin(newThreadHref(categorySlug)); return; }
        window.location.hash = newThreadHref(categorySlug);
    };

    return (
        <main className="page-container news-page">
            <PageIntro
                eyebrow="Community"
                title={category ? category.name : "Finance forum"}
                description={category?.description ?? "Discuss the GSE, the cedi, fuel prices and personal finance with other Fluid Finance members. Keep it civil and factual."}
                action={<PrimaryButton onClick={startThread}><Plus size={16} aria-hidden="true" /> Start a discussion</PrimaryButton>}
            />

            {error && <Notice tone="error" className="mb-6">{error}</Notice>}

            <nav aria-label="Forum categories" className="news-tabs">
                <CategoryLink href="#/forum" active={!categorySlug} name="All discussions" />
                {(categories ?? []).map((item) => <CategoryLink key={item.id} href={forumCategoryHref(item.slug)} active={categorySlug === item.slug} name={item.name} />)}
            </nav>

            <section aria-live="polite">
                {threads === null ? (
                    <div className="space-y-3" aria-hidden="true">{[0, 1, 2, 3].map((index) => <div key={index} className="news-skeleton h-16" />)}</div>
                ) : categorySlug && !category ? (
                    <Notice tone="error">That category does not exist. <a href="#/forum" className="underline">See all discussions</a>.</Notice>
                ) : threads.length === 0 ? (
                    <EmptyState title="No discussions here yet" action={<PrimaryButton onClick={startThread} className="mt-4"><Plus size={16} aria-hidden="true" /> Start the first one</PrimaryButton>}>
                        Ask a question or share a view to get things going.
                    </EmptyState>
                ) : (
                    <>
                        <ol className="news-list">
                            {threads.map((thread) => <ThreadRow key={thread.id} thread={thread} showCategory={!category} />)}
                        </ol>
                        {!exhausted && (
                            <div className="mt-6 flex justify-center">
                                <QuietButton onClick={() => void loadMore()}>Load older discussions</QuietButton>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

function CategoryLink({ href, active, name }: { href: string; active: boolean; name: string }) {
    return (
        <a href={href} aria-current={active ? "page" : undefined} className="news-tab">
            {name}
        </a>
    );
}

function ThreadRow({ thread, showCategory }: { thread: ForumThread; showCategory: boolean }) {
    const author = thread.author;
    return (
        <li>
            <a href={threadHref(thread.id)} className="group flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    {(thread.pinned || thread.locked) && (
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            {thread.pinned && <span className="news-pill news-pill--neutral">Pinned</span>}
                            {thread.locked && <span className="news-pill news-pill--neutral">Locked</span>}
                        </div>
                    )}
                    <h2 className="news-headline-sm text-ink group-hover:underline underline-offset-4">{thread.title}</h2>
                    <p className="news-byline mt-1">
                        <strong>{author?.display_name ?? "Former member"}</strong>
                        {showCategory && thread.category && <> · <span className="text-fluid-cyan-ink">{thread.category.name}</span></>}
                        {" · "}{thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
                        {" · "}{formatRelative(thread.last_reply_at ?? thread.created_at)}{thread.last_reply_at ? " (last reply)" : ""}
                    </p>
                </div>
                <span className="news-mono inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink/[0.68]"><MessageSquare size={12} aria-hidden="true" /> {thread.reply_count}</span>
            </a>
        </li>
    );
}
