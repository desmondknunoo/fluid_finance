/**
 * /sitemap.xml, built at request time: every indexable static page, every GSE stock page, every
 * published article (as far as the API lists them), the forum categories and forum threads.
 * `lastmod` is included only where the API gives a real date. A section whose API call fails is
 * left out rather than failing the whole sitemap.
 */
import { ARTICLE_CATEGORY_IDS, INDEXABLE_STATIC_PATHS, SITE_URL, STOCK_SYMBOLS } from "../src/lib/seo-routes";

export type FetchJson = <T>(path: string) => Promise<T>;

interface Entry {
    loc: string;
    lastmod?: string | null;
}

interface ArticleRow { slug: string; published_at: string | null; updated_at?: string | null }
interface ThreadRow { id: string; created_at: string; updated_at?: string | null; last_reply_at: string | null; deleted_at?: string | null }
interface CategoryRow { slug: string }

/** The articles endpoint caps `limit` at 100 and has no pages; per-category reads widen coverage. */
export const ARTICLE_LIMIT = 100;
/** Threads come 20 to a page. */
export const THREAD_PAGE_SIZE = 20;
export const MAX_THREAD_PAGES = 100;

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function isoDate(value: string | null | undefined): string | null {
    if (!value) return null;
    const time = Date.parse(value);
    return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function latest(...values: (string | null | undefined)[]): string | null {
    const dates = values.map(isoDate).filter((value): value is string => value !== null).sort();
    return dates.length ? dates[dates.length - 1] : null;
}

async function settle<T>(work: () => Promise<T>, fallback: T): Promise<T> {
    try { return await work(); } catch { return fallback; }
}

export async function articleEntries(fetchJson: FetchJson): Promise<Entry[]> {
    const bySlug = new Map<string, ArticleRow>();
    const add = (rows: ArticleRow[]) => { for (const row of rows) if (row?.slug && !bySlug.has(row.slug)) bySlug.set(row.slug, row); };
    const first = await fetchJson<{ items: ArticleRow[] }>(`/editorial/articles?limit=${ARTICLE_LIMIT}`);
    add(first.items ?? []);
    if ((first.items ?? []).length >= ARTICLE_LIMIT) {
        const more = await Promise.all(ARTICLE_CATEGORY_IDS.map((category) => settle(() => fetchJson<{ items: ArticleRow[] }>(`/editorial/articles?limit=${ARTICLE_LIMIT}&category=${encodeURIComponent(category)}`), { items: [] })));
        for (const page of more) add(page.items ?? []);
    }
    return [...bySlug.values()].map((row) => ({ loc: `/articles/${encodeURIComponent(row.slug)}`, lastmod: latest(row.updated_at, row.published_at) }));
}

export async function threadEntries(fetchJson: FetchJson): Promise<Entry[]> {
    const entries: Entry[] = [];
    const seen = new Set<string>();
    for (let page = 0; page < MAX_THREAD_PAGES; page++) {
        const { items = [] } = await fetchJson<{ items: ThreadRow[] }>(`/editorial/forum/threads?page=${page}`);
        for (const thread of items) {
            if (!thread?.id || thread.deleted_at || seen.has(thread.id)) continue;
            seen.add(thread.id);
            entries.push({ loc: `/forum/t/${thread.id}`, lastmod: latest(thread.last_reply_at, thread.updated_at, thread.created_at) });
        }
        if (items.length < THREAD_PAGE_SIZE) break;
    }
    return entries;
}

export async function categoryEntries(fetchJson: FetchJson): Promise<Entry[]> {
    const { items = [] } = await fetchJson<{ items: CategoryRow[] }>("/editorial/forum/categories");
    return items.filter((item) => item?.slug).map((item) => ({ loc: `/forum/c/${encodeURIComponent(item.slug)}` }));
}

export function renderSitemap(entries: Entry[]): string {
    const seen = new Set<string>();
    const urls = entries.filter((entry) => !seen.has(entry.loc) && seen.add(entry.loc)).map((entry) => {
        const loc = `${SITE_URL}${entry.loc === "/" ? "/" : entry.loc}`;
        return `  <url><loc>${escapeXml(loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export async function buildSitemap(fetchJson: FetchJson): Promise<string> {
    const [articles, categories, threads] = await Promise.all([
        settle(() => articleEntries(fetchJson), []),
        settle(() => categoryEntries(fetchJson), []),
        settle(() => threadEntries(fetchJson), []),
    ]);
    return renderSitemap([
        ...INDEXABLE_STATIC_PATHS.map((loc) => ({ loc })),
        ...STOCK_SYMBOLS.map((symbol) => ({ loc: `/stock/${symbol}` })),
        ...articles,
        ...categories,
        ...threads,
    ]);
}
