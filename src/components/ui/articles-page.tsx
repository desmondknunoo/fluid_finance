import { HOME_SECTIONS, type HomeSection } from '@/lib/content-media';
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ARTICLE_CATEGORIES, categoryLabel, formatLongDate, listPublishedArticles, type Article, type ArticleCategory } from "@/lib/community";
import { articleHref } from "@/lib/navigation";
import { EmptyState, Notice } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { UserChip } from "@/components/community/user-chip";

export default function ArticlesPage() {
    const opinion = window.location.hash.split("?")[0] === "#/opinion";
    const requested = opinion ? "opinion" : new URLSearchParams(window.location.hash.split("?")[1]).get("section");
    const section = HOME_SECTIONS.find(([id])=>id===requested)?.[0] as HomeSection | undefined;
    const [articles, setArticles] = useState<Article[] | null>(null);
    const [error, setError] = useState("");
    const [category, setCategory] = useState<ArticleCategory | null>(null);

    useEffect(() => { document.title = opinion ? "Fluid Finance Opinion" : "Articles & research · Fluid Finance"; }, [opinion]);
    useEffect(() => {
        let cancelled = false;
        setArticles(null);setError("");
        listPublishedArticles({ category, section, limit: 60 })
            .then((data) => { if (!cancelled) setArticles(data); })
            .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load articles."); });
        return () => { cancelled = true; };
    }, [category, section]);

    const [lead, ...rest] = useMemo(() => articles ?? [], [articles]);

    return (
        <main className="page-container news-page">
            <PageIntro eyebrow={opinion ? "Independent perspectives" : "Research desk"} title={opinion ? "Fluid Finance Opinion" : section ? HOME_SECTIONS.find(([id])=>id===section)?.[1] : "Articles & market notes"} description={opinion ? "Commentary, arguments and perspectives on markets, business and the economy. Each piece reflects its author’s views and passes editorial review before publication." : "Analysis from the Fluid Finance research team on the GSE, the cedi, fuel and the wider economy. Sign in to join the discussion under each piece."} />

            <div className="news-tabs" role="tablist" aria-label="Article categories">
                <FilterTab active={category === null} onClick={() => setCategory(null)}>All</FilterTab>
                {ARTICLE_CATEGORIES.map((item) => <FilterTab key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</FilterTab>)}
            </div>

            {error ? <Notice tone="error">{error}</Notice> : articles === null ? (
                <div className="news-tiles" aria-hidden="true">{[0, 1, 2].map((index) => <div key={index} className="news-skeleton h-56" />)}</div>
            ) : articles.length === 0 ? (
                <EmptyState title="Nothing published here yet">
                    The research team is writing. Check back soon or <a href="#/forum" className="text-fluid-cyan-ink underline">start a discussion</a>.
                </EmptyState>
            ) : (
                <>
                    {lead && <LeadStory article={lead} />}
                    {rest.length > 0 && (
                        <section className="news-section" aria-label="More research">
                            <header className="news-section-header">
                                <h2>More from the desk</h2>
                                <span>{rest.length} {rest.length === 1 ? "story" : "stories"}</span>
                            </header>
                            <div className="news-tiles mt-5">
                                {rest.map((article) => <StoryTile key={article.id} article={article} />)}
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
    return (
        <button type="button" role="tab" aria-selected={active} onClick={onClick} className="news-tab">
            {children}
        </button>
    );
}

function Kicker({ article }: { article: Article }) {
    return (
        <span className="news-kicker">
            <span className="text-fluid-cyan-ink">{categoryLabel(article.category)}</span>
            <span aria-hidden="true">·</span>
            {formatLongDate(article.published_at)}
        </span>
    );
}

function LeadStory({ article }: { article: Article }) {
    const body = (
        <div>
            <Kicker article={article} />
            <a href={articleHref(article.slug)} className="group mt-4 block">
                <h2 className="news-headline-lg text-ink group-hover:underline underline-offset-4">{article.title}</h2>
            </a>
            {article.excerpt && <p className="news-standfirst mt-4">{article.excerpt}</p>}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <UserChip author={article.author} size="sm" />
                <a href={articleHref(article.slug)} className="news-text-link">Read the story <ArrowRight size={14} aria-hidden="true" /></a>
            </div>
        </div>
    );
    if (!article.cover_url) return <article aria-label="Lead story">{body}</article>;
    return (
        <article className="news-columns news-columns--main" aria-label="Lead story">
            {body}
            <a href={articleHref(article.slug)} aria-hidden="true" tabIndex={-1} className="block">
                <div className="aspect-[16/10] overflow-hidden bg-ink/[0.055]">
                    <img src={article.cover_url} alt="" className="h-full w-full object-cover" />
                </div>
            </a>
        </article>
    );
}

function StoryTile({ article }: { article: Article }) {
    return (
        <article className="news-tile">
            <a href={articleHref(article.slug)} className="block">
                {article.cover_url && <div className="news-tile-image"><img src={article.cover_url} alt="" loading="lazy" /></div>}
                <Kicker article={article} />
                <h3 className="mt-2 text-ink">{article.title}</h3>
            </a>
            {article.excerpt && <p className="line-clamp-3">{article.excerpt}</p>}
            <div className="news-byline"><UserChip author={article.author} size="sm" /></div>
        </article>
    );
}
