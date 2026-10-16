import { useEffect, useMemo, useState } from "react";
import { Lock, MessageSquare, Pin, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatRelative, listForumCategories, listThreads, type ForumCategory, type ForumThread } from "@/lib/community";
import { forumCategoryHref, newThreadHref, openLogin, threadHref } from "@/lib/navigation";
import { Notice, panelClass, PrimaryButton } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { Avatar } from "@/components/community/user-chip";
import { cn } from "@/lib/utils";

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
        <main className="page-container py-10 sm:py-16">
            <PageIntro
                eyebrow="Community"
                title={category ? category.name : "Finance forum"}
                description={category?.description ?? "Discuss the GSE, the cedi, fuel prices and personal finance with other Fluid Finance members. Keep it civil and factual."}
                action={<PrimaryButton onClick={startThread} className="min-h-[3rem]"><Plus size={16} aria-hidden="true" /> Start a discussion</PrimaryButton>}
            />

            {error && <Notice tone="error" className="mb-6">{error}</Notice>}

            <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
                <nav aria-label="Forum categories" className="lg:sticky lg:top-36 lg:self-start">
                    <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                        <li><CategoryLink href="#/forum" active={!categorySlug} name="All discussions" /></li>
                        {(categories ?? []).map((item) => <li key={item.id}><CategoryLink href={forumCategoryHref(item.slug)} active={categorySlug === item.slug} name={item.name} /></li>)}
                    </ul>
                </nav>

                <section aria-live="polite">
                    {threads === null ? (
                        <div className="space-y-3">{[0, 1, 2, 3].map((index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-ink/[0.04]" />)}</div>
                    ) : categorySlug && !category ? (
                        <Notice tone="error">That category does not exist. <a href="#/forum" className="underline">See all discussions</a>.</Notice>
                    ) : threads.length === 0 ? (
                        <div className={`${panelClass} px-6 py-16 text-center`}>
                            <MessageSquare size={24} className="mx-auto mb-3 text-ink/30" aria-hidden="true" />
                            <p className="text-lg font-semibold text-ink">No discussions here yet</p>
                            <p className="mt-2 text-sm text-ink/50">Ask a question or share a view to get things going.</p>
                            <PrimaryButton onClick={startThread} className="mt-6"><Plus size={16} aria-hidden="true" /> Start the first one</PrimaryButton>
                        </div>
                    ) : (
                        <>
                            <ol className={`${panelClass} divide-y divide-ink/[0.06] overflow-hidden`}>
                                {threads.map((thread) => <ThreadRow key={thread.id} thread={thread} showCategory={!category} />)}
                            </ol>
                            {!exhausted && (
                                <div className="mt-6 flex justify-center">
                                    <button type="button" onClick={() => void loadMore()} className="min-h-[2.75rem] rounded-xl border border-ink/[0.14] px-5 text-sm font-medium text-ink/80 hover:bg-ink/[0.05]">Load older discussions</button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}

function CategoryLink({ href, active, name }: { href: string; active: boolean; name: string }) {
    return (
        <a href={href} aria-current={active ? "page" : undefined} className={cn("block whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors", active ? "bg-fluid-cyan/10 text-fluid-cyan-ink" : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink")}>
            {name}
        </a>
    );
}

function ThreadRow({ thread, showCategory }: { thread: ForumThread; showCategory: boolean }) {
    const author = thread.author;
    return (
        <li>
            <a href={threadHref(thread.id)} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-ink/[0.03] sm:items-center">
                <Avatar author={{ display_name: author?.display_name ?? "Former member", avatar_url: author?.avatar_url ?? null }} className="mt-0.5 hidden sm:grid" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {thread.pinned && <Pin size={13} className="text-fluid-cyan-ink" aria-label="Pinned" />}
                        {thread.locked && <Lock size={13} className="text-ink/40" aria-label="Locked" />}
                        <h2 className="truncate text-base font-semibold text-ink">{thread.title}</h2>
                    </div>
                    <p className="mt-1 truncate text-xs text-ink/45">
                        {author?.display_name ?? "Former member"}
                        {showCategory && thread.category && <> · <span className="text-fluid-cyan-ink">{thread.category.name}</span></>}
                        {" · "}{formatRelative(thread.last_reply_at ?? thread.created_at)}{thread.last_reply_at ? " (last reply)" : ""}
                    </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink/[0.05] px-2.5 py-1 text-xs font-semibold tabular-nums text-ink/60"><MessageSquare size={12} aria-hidden="true" /> {thread.reply_count}</span>
            </a>
        </li>
    );
}
