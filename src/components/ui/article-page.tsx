import { ApprovedMedia } from '@/components/media/approved-media';
import { safeExternalUrl } from '@/lib/content-media';
import { savedArticle, saveForReading, isSaved, cacheReadingShell } from '@/lib/saved-reading';
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Clock3, Link2, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addArticleComment, categoryLabel, formatLongDate, getArticleBySlug, listArticleComments, readingMinutes, type Article, type ArticleComment } from "@/lib/community";
import { RichText } from "@/lib/markdown";
import { Notice } from "@/components/ui/form";
import { PostComposer } from "@/components/community/post-composer";
import { PostList } from "@/components/community/post-list";
import { UserChip } from "@/components/community/user-chip";

export default function ArticlePage({ slug }: { slug: string }) {
    const { user } = useAuth();
    const [article, setArticle] = useState<Article | null | undefined>(undefined);
    const [comments, setComments] = useState<ArticleComment[]>([]);
    const [error, setError] = useState("");
    const [saved,setSaved] = useState(false);
    const [offlineCopy,setOfflineCopy] = useState(false);
    const [saveError,setSaveError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setArticle(undefined);
        setComments([]);
        setError("");setOfflineCopy(false);setSaved(isSaved(slug));
        getArticleBySlug(slug)
            .then(async (found) => {
                if (cancelled) return;
                setArticle(found);
                document.title = found ? `${found.title} · Fluid Finance` : "Article not found · Fluid Finance";
                if (found) { try { const loadedComments=await listArticleComments(found.id);if(!cancelled)setComments(loadedComments); } catch { /* article remains readable when comments cannot load */ } }
            })
            .catch((caught) => { if (!cancelled) { const stored=savedArticle(slug);if(stored){setArticle(stored);setOfflineCopy(true);}else setError(caught instanceof Error ? caught.message : "Could not load this article."); } });
        return () => { cancelled = true; };
    }, [slug]);

    const post = useCallback(async (body: string, parentId: string | null = null) => {
        if (!user || !article) throw new Error("Sign in to comment.");
        const created = await addArticleComment({ articleId: article.id, authorId: user.id, body, parentId });
        setComments((current) => [...current, created]);
    }, [user, article]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };

    if (error) return <main className="page-container py-16"><Notice tone="error">{error}</Notice></main>;
    if (article === undefined) return <main className="page-container py-16 text-ink/50">Loading article…</main>;
    if (article === null) {
        return (
            <main className="page-container py-16 text-center">
                <h1 className="text-3xl font-bold text-ink font-poppins">Article not found</h1>
                <p className="mt-3 text-ink/60">It may have been unpublished. <a href="#/articles" className="text-fluid-cyan-ink underline">See all articles</a>.</p>
            </main>
        );
    }

    const visibleComments = comments.filter((comment) => !comment.deleted_at).length;

    return (
        <main className="page-container py-8 sm:py-12">
            <article className="mx-auto max-w-3xl">
                <a href="#/articles" className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink"><ArrowLeft size={15} aria-hidden="true" /> All articles</a>
                <header className="mt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fluid-cyan-ink">{categoryLabel(article.category)}</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink font-poppins sm:text-4xl md:text-5xl [text-wrap:balance]">{article.title}</h1>
                    {article.excerpt && <p className="mt-5 text-lg leading-relaxed text-ink/60">{article.excerpt}</p>}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-ink/[0.08] py-4">
                        <UserChip author={article.author} meta={`${formatLongDate(article.published_at)} · ${readingMinutes(article.body)} min read`} />
                        <div className="flex items-center gap-2 text-xs text-ink/50">
                            <span className="inline-flex items-center gap-1"><Clock3 size={13} aria-hidden="true" /> Updated {formatLongDate(article.updated_at)}</span>
                            <button type="button" onClick={() => void copyLink()} className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-lg border border-ink/[0.1] px-2.5 font-medium text-ink/70 hover:bg-ink/[0.05]">
                                {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />} {copied ? "Copied" : "Copy link"}
                            </button>
                        </div>
                    </div>
                </header>

                {article.cover_url && <img src={article.cover_url} alt="" className="mt-8 w-full rounded-2xl border border-ink/[0.08] object-cover" />}

                {offlineCopy&&<p role="status" className="mt-6 border-y border-ink/20 py-4 text-sm">Showing the copy saved on this device. Connect to check the latest version.</p>}
                {article.media_kind && ['video','audio','live'].includes(article.media_kind) && <div className="mt-8"><ApprovedMedia url={article.external_url} title={article.title} cover={article.cover_url}/></div>}
                {safeExternalUrl(article.external_url) && <a href={safeExternalUrl(article.external_url)!} target="_blank" rel="noreferrer noopener" className="news-text-link mt-6">Open original source ↗</a>}
                <div className="mt-6"><button type="button" onClick={()=>{try{saveForReading(article);setSaved(true);setSaveError('');void cacheReadingShell().catch(()=>setSaveError('Article saved; offline app files could not be cached. Reconnect and try saving again.'));}catch(caught){setSaveError(caught instanceof Error?caught.message:'Could not save.');}}} className="min-h-11 border border-ink/20 px-4 text-sm font-semibold">{saved?'Saved on this device · save latest copy':'Save for offline'}</button>{saveError&&<p role="alert" className="mt-2 text-sm text-fluid-rose">{saveError}</p>}</div>
                <RichText source={article.body} className="mt-8 text-base sm:text-[17px]" />

                {article.tags.length > 0 && (
                    <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                        {article.tags.map((tag) => <li key={tag} className="rounded-full border border-ink/[0.1] px-3 py-1 text-xs text-ink/60">#{tag}</li>)}
                    </ul>
                )}

                <p className="mt-10 rounded-xl border border-ink/[0.08] bg-ink/[0.02] px-4 py-3 text-xs leading-relaxed text-ink/50">
                    Fluid Finance publishes market information and education. This article is not investment advice; investing carries risk of loss.
                </p>

                {!offlineCopy&&<section className="mt-14" aria-labelledby="comments-heading">
                    <div className="mb-6 flex items-center gap-3">
                        <MessageSquare size={20} className="text-fluid-cyan-ink" aria-hidden="true" />
                        <h2 id="comments-heading" className="text-2xl font-bold text-ink font-poppins">{visibleComments} {visibleComments === 1 ? "comment" : "comments"}</h2>
                    </div>
                    <div className="mb-8">
                        <PostComposer placeholder="Share your view on this article…" submitLabel="Comment" onSubmit={(body) => post(body)} />
                    </div>
                    <PostList
                        posts={comments}
                        table="article_comments"
                        reportTarget="article_comment"
                        onReply={(body, parentId) => post(body, parentId)}
                        onEdited={(id, body) => setComments((current) => current.map((comment) => comment.id === id ? { ...comment, body, edited_at: new Date().toISOString() } : comment))}
                        replyPlaceholder="Write a reply…"
                        emptyTitle="No comments yet"
                    />
                </section>}
            </article>
        </main>
    );
}
