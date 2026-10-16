import { HOME_SECTIONS, type HomeSection } from '@/lib/content-media';
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock3 } from "lucide-react";
import { ARTICLE_CATEGORIES, categoryLabel, formatLongDate, listPublishedArticles, type Article, type ArticleCategory } from "@/lib/community";
import { articleHref } from "@/lib/navigation";
import { Notice } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { UserChip } from "@/components/community/user-chip";
import { cn } from "@/lib/utils";

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
        <main className="page-container py-10 sm:py-16">
            <PageIntro eyebrow={opinion ? "Independent perspectives" : "Research desk"} title={opinion ? "Fluid Finance Opinion" : section ? HOME_SECTIONS.find(([id])=>id===section)?.[1] : "Articles & market notes"} description={opinion ? "Commentary, arguments and perspectives on markets, business and the economy. Each piece reflects its author’s views and passes editorial review before publication." : "Analysis from the Fluid Finance research team on the GSE, the cedi, fuel and the wider economy. Sign in to join the discussion under each piece."} />

            <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Article categories">
                <FilterChip active={category === null} onClick={() => setCategory(null)}>All</FilterChip>
                {ARTICLE_CATEGORIES.map((item) => <FilterChip key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</FilterChip>)}
            </div>

            {error ? <Notice tone="error">{error}</Notice> : articles === null ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-ink/[0.04]" />)}</div>
            ) : articles.length === 0 ? (
                <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] px-6 py-16 text-center">
                    <p className="text-lg font-semibold text-ink">Nothing published here yet</p>
                    <p className="mt-2 text-sm text-ink/50">The research team is writing. Check back soon or <a href="#/forum" className="text-fluid-cyan-ink underline">start a discussion</a>.</p>
                </div>
            ) : (
                <>
                    {lead && <LeadCard article={lead} />}
                    {rest.length > 0 && (
                        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {rest.map((article, index) => <ArticleCard key={article.id} article={article} delay={index * 0.04} />)}
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
    return (
        <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("min-h-[2.5rem] rounded-full border px-4 text-xs font-semibold uppercase tracking-wider transition-colors", active ? "border-fluid-cyan/40 bg-fluid-cyan/10 text-fluid-cyan-ink" : "border-ink/[0.1] text-ink/50 hover:border-ink/25 hover:text-ink")}>
            {children}
        </button>
    );
}

function Meta({ article }: { article: Article }) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/40">
            <span className="font-semibold uppercase tracking-widest text-fluid-cyan-ink">{categoryLabel(article.category)}</span>
            <span>{formatLongDate(article.published_at)}</span>
        </div>
    );
}

function LeadCard({ article }: { article: Article }) {
    return (
        <motion.a
            href={articleHref(article.slug)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group grid overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.02] transition-colors hover:border-ink/20 md:grid-cols-[1.2fr_1fr]"
        >
            <div className="order-2 flex flex-col justify-between p-6 sm:p-8 md:order-1">
                <div>
                    <Meta article={article} />
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink font-poppins sm:text-3xl group-hover:text-fluid-cyan-ink transition-colors">{article.title}</h2>
                    {article.excerpt && <p className="mt-4 line-clamp-3 leading-relaxed text-ink/60">{article.excerpt}</p>}
                </div>
                <div className="mt-6 flex items-center justify-between gap-4">
                    <UserChip author={article.author} size="sm" />
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-fluid-cyan-ink">Read <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
                </div>
            </div>
            <div className="order-1 min-h-48 bg-gradient-to-br from-fluid-cyan/20 via-fluid-teal/10 to-fluid-violet/20 md:order-2">
                {article.cover_url && <img src={article.cover_url} alt="" className="h-full w-full object-cover" />}
            </div>
        </motion.a>
    );
}

function ArticleCard({ article, delay }: { article: Article; delay: number }) {
    return (
        <motion.a
            href={articleHref(article.slug)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.02] transition-colors hover:border-ink/20"
        >
            <div className="h-36 bg-gradient-to-br from-fluid-cyan/15 via-transparent to-fluid-violet/15">
                {article.cover_url && <img src={article.cover_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col p-5">
                <Meta article={article} />
                <h3 className="mt-3 text-lg font-bold leading-snug text-ink font-poppins group-hover:text-fluid-cyan-ink transition-colors">{article.title}</h3>
                {article.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/55">{article.excerpt}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <UserChip author={article.author} size="sm" />
                    <span className="inline-flex items-center gap-1 text-xs text-ink/40"><Clock3 size={12} aria-hidden="true" /> Read</span>
                </div>
            </div>
        </motion.a>
    );
}
