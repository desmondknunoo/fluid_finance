import { ApprovedMedia } from '@/components/media/approved-media';
import { safeExternalUrl } from '@/lib/content-media';
import { savedArticle, saveForReading, isSaved, cacheReadingShell } from '@/lib/saved-reading';
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Clock3, Link2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addArticleComment, categoryLabel, formatLongDate, getArticleBySlug, listArticleComments, readingMinutes, type Article, type ArticleComment } from "@/lib/community";
import { RichText } from "@/lib/markdown";
import { Notice, QuietButton } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
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

    if (error) return <main className="page-container news-page"><Notice tone="error" className="mt-8">{error}</Notice></main>;
    if (article === undefined) return <main className="page-container news-page"><p className="news-loading">Loading article…</p></main>;
    if (article === null) {
        return (
            <main className="page-container news-page">
                <PageIntro eyebrow="Research desk" title="Article not found" description={<>It may have been unpublished. <a href="#/articles" className="text-fluid-cyan-ink underline">See all articles</a>.</>} />
            </main>
        );
    }

    const visibleComments = comments.filter((comment) => !comment.deleted_at).length;

    return (
        <main className="page-container news-page">
            <article className="mx-auto max-w-4xl pt-6">
                <a href="#/articles" className="news-text-link"><ArrowLeft size={14} aria-hidden="true" /> All articles</a>
                <header className="mt-6 border-b-[3px] border-ink pb-5">
                    <p className="news-kicker">
                        <span className="text-fluid-cyan-ink">{categoryLabel(article.category)}</span>
                        <span aria-hidden="true">·</span>
                        {formatLongDate(article.published_at)}
                    </p>
                    <h1 className="news-headline-lg mt-4 text-ink">{article.title}</h1>
                    {article.excerpt && <p className="news-standfirst mt-5">{article.excerpt}</p>}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink/[0.19] pt-4">
                        <UserChip author={article.author} meta={`${formatLongDate(article.published_at)} · ${readingMinutes(article.body)} min read`} />
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="news-byline inline-flex items-center gap-1.5"><Clock3 size={12} aria-hidden="true" /> Updated {formatLongDate(article.updated_at)}</span>
                            <QuietButton size="sm" onClick={() => void copyLink()}>
                                {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />} {copied ? "Copied" : "Copy link"}
                            </QuietButton>
                        </div>
                    </div>
                </header>

                {article.cover_url && (
                    <figure className="mt-8 border border-ink/[0.19] bg-ink/[0.055]">
                        <img src={article.cover_url} alt="" className="block w-full object-cover" />
                    </figure>
                )}

                {offlineCopy&&<Notice className="mt-6">Showing the copy saved on this device. Connect to check the latest version.</Notice>}
                {article.media_kind && ['video','audio','live'].includes(article.media_kind) && <div className="mt-8"><ApprovedMedia url={article.external_url} title={article.title} cover={article.cover_url}/></div>}
                {safeExternalUrl(article.external_url) && <a href={safeExternalUrl(article.external_url)!} target="_blank" rel="noreferrer noopener" className="news-text-link mt-6">Open original source ↗</a>}
                <div className="mt-6">
                    <QuietButton onClick={()=>{try{saveForReading(article);setSaved(true);setSaveError('');void cacheReadingShell().catch(()=>setSaveError('Article saved; offline app files could not be cached. Reconnect and try saving again.'));}catch(caught){setSaveError(caught instanceof Error?caught.message:'Could not save.');}}}>{saved?'Saved on this device · save latest copy':'Save for offline'}</QuietButton>
                    {saveError&&<p role="alert" className="news-field-error">{saveError}</p>}
                </div>
                <RichText source={article.body} className="news-prose mt-8" />

                {article.tags.length > 0 && (
                    <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                        {article.tags.map((tag) => <li key={tag} className="news-pill news-pill--neutral">#{tag}</li>)}
                    </ul>
                )}

                <p className="news-byline mt-10 max-w-[70ch] border-t border-ink/[0.19] pt-4">
                    Fluid Finance publishes market information and education. This article is not investment advice; investing carries risk of loss.
                </p>

                {!offlineCopy&&<section className="news-section" aria-labelledby="comments-heading">
                    <header className="news-section-header">
                        <h2 id="comments-heading">{visibleComments} {visibleComments === 1 ? "comment" : "comments"}</h2>
                    </header>
                    <div className="mt-6">
                        <PostComposer placeholder="Share your view on this article…" submitLabel="Comment" onSubmit={(body) => post(body)} />
                    </div>
                    <div className="mt-8">
                        <PostList
                            posts={comments}
                            table="article_comments"
                            reportTarget="article_comment"
                            onReply={(body, parentId) => post(body, parentId)}
                            onEdited={(id, body) => setComments((current) => current.map((comment) => comment.id === id ? { ...comment, body, edited_at: new Date().toISOString() } : comment))}
                            replyPlaceholder="Write a reply…"
                            emptyTitle="No comments yet"
                        />
                    </div>
                </section>}
            </article>
        </main>
    );
}
