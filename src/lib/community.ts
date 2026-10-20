import { api, ApiError } from "@/lib/api";
import type { Distribution, HomeSection, MediaKind } from "@/lib/content-media";
import type { FuelReport } from "@/lib/fuel-prices";

/**
 * Fluid Finance - community data
 *
 * Typed reads and member writes against the Fluid backend's editorial API. The API decides what
 * each caller may see and do; this module only shapes the requests. Staff-only writes live in
 * the portal's data modules.
 */

export type MemberRole = "member" | "research" | "social" | "operations" | "admin";

export const ROLE_LABELS: Record<MemberRole, string> = {
    member: "Member",
    research: "Research team",
    social: "Social media team",
    operations: "Operations team",
    admin: "Administrator",
};

export interface Profile {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    role: MemberRole;
    /** Heads approve their department's content for publication. Only admins set this. */
    department_head?: boolean;
    email?: string;
    created_at: string;
}

/** The author columns embedded in posts and comments. */
export type Author = Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "role">;

export type ArticleStatus = "draft" | "review" | "head_review" | "changes_requested" | "published" | "archived";
export type ArticleCategory = "markets" | "stocks" | "economy" | "fuel" | "fx" | "personal-finance" | "education" | "company-news";

export const ARTICLE_CATEGORIES: { id: ArticleCategory; label: string }[] = [
    { id: "markets", label: "Markets" },
    { id: "stocks", label: "Stocks" },
    { id: "economy", label: "Economy" },
    { id: "fuel", label: "Fuel" },
    { id: "fx", label: "FX" },
    { id: "personal-finance", label: "Personal finance" },
    { id: "education", label: "Education" },
    { id: "company-news", label: "Company news" },
];

export function categoryLabel(category: string): string {
    return ARTICLE_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

export interface Article {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body: string;
    cover_url: string | null;
    category: ArticleCategory;
    tags: string[];
    status: ArticleStatus;
    author_id: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author: Author | null;
    /** Multimedia CMS: what kind of story this is, where it sits on the front page and where it goes. */
    media_kind: MediaKind;
    external_url: string | null;
    homepage_section: HomeSection;
    distribution: Distribution;
    social_channels: string[];
    social_caption: string;
}

export interface Post {
    id: string;
    author_id: string;
    parent_id: string | null;
    body: string;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
    author: Author | null;
}

export interface ArticleComment extends Post {
    article_id: string;
}

export interface ForumCategory {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    position: number;
}

export interface ForumThread {
    id: string;
    category_id: string;
    author_id: string;
    title: string;
    body: string;
    pinned: boolean;
    locked: boolean;
    reply_count: number;
    last_reply_at: string | null;
    created_at: string;
    deleted_at: string | null;
    author: Author | null;
    category: Pick<ForumCategory, "id" | "slug" | "name"> | null;
}

export interface ForumReply extends Post {
    thread_id: string;
}

export interface FxRate {
    id: string;
    base_currency: string;
    quote_currency: string;
    buy: number | null;
    sell: number | null;
    mid: number;
    rate_date: string;
    source: string;
    note: string | null;
    created_at: string;
}

/** The API sends rates as exact decimal strings; screens work in numbers. */
export function fxFromApi(raw: Omit<FxRate, "buy" | "sell" | "mid"> & { buy: string | null; sell: string | null; mid: string }): FxRate {
    return { ...raw, buy: raw.buy === null ? null : Number(raw.buy), sell: raw.sell === null ? null : Number(raw.sell), mid: Number(raw.mid) };
}
type ApiFxRate = Parameters<typeof fxFromApi>[0];

type Items<T> = { items: T[] };

/* ------------------------------------------------------------------ */
/* profiles                                                            */
/* ------------------------------------------------------------------ */

/** The signed-in member's own profile; the API creates it on first contact. */
export async function getMyProfile(): Promise<Profile> {
    return api<Profile>("/editorial/me");
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
    try {
        return await api<Profile>(`/editorial/profiles/${encodeURIComponent(username.toLowerCase())}`, { auth: false });
    } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) return null;
        throw caught;
    }
}

export async function updateOwnProfile(_id: string, patch: { display_name: string; bio: string; avatar_url: string; username: string }): Promise<Profile> {
    return api<Profile>("/editorial/me", { method: "PATCH", body: patch });
}

/* ------------------------------------------------------------------ */
/* articles                                                            */
/* ------------------------------------------------------------------ */

export async function listPublishedArticles(options: { category?: ArticleCategory | null; section?: HomeSection | null; limit?: number } = {}): Promise<Article[]> {
    return (await api<Items<Article>>("/editorial/articles", { auth: false, query: { category: options.category ?? undefined, section: options.section ?? undefined, limit: options.limit ?? 30 } })).items;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        return await api<Article>(`/editorial/articles/${encodeURIComponent(slug)}`);
    } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) return null;
        throw caught;
    }
}

export async function listArticleComments(articleId: string): Promise<ArticleComment[]> {
    return (await api<Items<ArticleComment>>(`/editorial/articles/${articleId}/comments`)).items;
}

export async function addArticleComment(input: { articleId: string; authorId?: string; body: string; parentId?: string | null }): Promise<ArticleComment> {
    const body = input.body.trim();
    if (!body) throw new Error("Write a comment first.");
    if (body.length > 2000) throw new Error("Comments are limited to 2,000 characters.");
    return api<ArticleComment>(`/editorial/articles/${input.articleId}/comments`, { method: "POST", body: { body, parent_id: input.parentId ?? null } });
}

export async function editOwnPost(table: "article_comments" | "forum_replies", id: string, body: string): Promise<void> {
    const text = body.trim();
    if (!text) throw new Error("A post cannot be empty.");
    await api(table === "article_comments" ? `/editorial/comments/${id}` : `/editorial/forum/replies/${id}`, { method: "PATCH", body: { body: text } });
}

/* ------------------------------------------------------------------ */
/* forum                                                               */
/* ------------------------------------------------------------------ */

export async function listForumCategories(): Promise<ForumCategory[]> {
    return (await api<Items<ForumCategory>>("/editorial/forum/categories", { auth: false })).items;
}

export async function listThreads(options: { categoryId?: string | null; page?: number } = {}): Promise<ForumThread[]> {
    return (await api<Items<ForumThread>>("/editorial/forum/threads", { query: { category_id: options.categoryId ?? undefined, page: options.page ?? 0 } })).items;
}

export async function getThread(id: string): Promise<ForumThread | null> {
    try {
        return await api<ForumThread>(`/editorial/forum/threads/${id}`);
    } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) return null;
        throw caught;
    }
}

export async function listReplies(threadId: string): Promise<ForumReply[]> {
    return (await api<Items<ForumReply>>(`/editorial/forum/threads/${threadId}/replies`)).items;
}

export async function createThread(input: { categoryId: string; authorId?: string; title: string; body: string }): Promise<ForumThread> {
    const title = input.title.trim();
    const body = input.body.trim();
    if (title.length < 3 || title.length > 160) throw new Error("Give the discussion a title of 3–160 characters.");
    if (!body) throw new Error("Write the opening post.");
    if (body.length > 10000) throw new Error("Posts are limited to 10,000 characters.");
    return api<ForumThread>("/editorial/forum/threads", { method: "POST", body: { category_id: input.categoryId, title, body } });
}

export async function addReply(input: { threadId: string; authorId?: string; body: string; parentId?: string | null }): Promise<ForumReply> {
    const body = input.body.trim();
    if (!body) throw new Error("Write a reply first.");
    if (body.length > 5000) throw new Error("Replies are limited to 5,000 characters.");
    return api<ForumReply>(`/editorial/forum/threads/${input.threadId}/replies`, { method: "POST", body: { body, parent_id: input.parentId ?? null } });
}

export async function reportContent(input: { targetType: "article_comment" | "forum_thread" | "forum_reply" | "profile"; targetId: string; reporterId?: string; reason: string }): Promise<void> {
    const reason = input.reason.trim();
    if (reason.length < 3) throw new Error("Tell us briefly what is wrong.");
    await api("/editorial/reports", { method: "POST", body: { target_type: input.targetType, target_id: input.targetId, reason } });
}

/** Recent public activity for a profile page. */
export async function listMemberActivity(username: string): Promise<{ threads: ForumThread[]; comments: ArticleComment[] }> {
    return api<{ threads: ForumThread[]; comments: ArticleComment[] }>(`/editorial/profiles/${encodeURIComponent(username)}/activity`, { auth: false });
}

/* ------------------------------------------------------------------ */
/* market data entered by the team                                     */
/* ------------------------------------------------------------------ */

/** The latest rate per currency pair. */
export async function listLatestFxRates(): Promise<FxRate[]> {
    return (await api<Items<ApiFxRate>>("/editorial/fx", { auth: false })).items.map(fxFromApi);
}

export async function listFxHistory(base: string, quote: string, limit = 60): Promise<FxRate[]> {
    return (await api<Items<ApiFxRate>>(`/editorial/fx/${base}/${quote}`, { auth: false, query: { limit } })).items.map(fxFromApi);
}

/** Public, read-only view of the pump reports the team publishes. */
export async function listPublicFuelReports(limit = 12): Promise<FuelReport[]> {
    return (await api<Items<FuelReport>>("/editorial/fuel/reports", { auth: false, query: { limit } })).items;
}

/** A social-desk post that has gone live, as the public site may see it. */
export interface SocialFeedPost {
    id: string;
    title: string;
    platform: "x" | "instagram" | "tiktok" | "linkedin" | "facebook" | "whatsapp";
    caption: string;
    hashtags: string[];
    asset_url: string | null;
    source_url: string | null;
    published_url: string | null;
    external_url: string | null;
    media_kind: MediaKind;
    homepage_section: HomeSection;
    posted_at: string | null;
}

/** Posts the social desk has marked as posted, newest first. */
export async function listPublishedSocialPosts(limit = 8): Promise<SocialFeedPost[]> {
    return (await api<Items<SocialFeedPost>>("/editorial/social/posts", { auth: false, query: { limit } })).items;
}

/* ------------------------------------------------------------------ */
/* formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatRelative(value: string, now = Date.now()): string {
    const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: days > 300 ? "numeric" : undefined });
}

export function formatLongDate(value: string | null): string {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function initialsFor(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
    return letters.toUpperCase();
}

export function slugify(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}

/** Reading time at ~200 words a minute, never below one minute. */
export function readingMinutes(body: string): number {
    return Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 200));
}
