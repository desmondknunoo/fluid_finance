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
    /** False when an admin has deactivated the account (soft delete). Defaults to active. */
    active?: boolean;
    deactivated_at?: string | null;
}

export type InviteStatus = "pending" | "accepted";

/** A staff seat offered to an email: pending until that person first signs in, then accepted. */
export interface Invite {
    id: string;
    email: string;
    role: MemberRole;
    department_head: boolean;
    /** Missing from older API builds; derive it from `consumed_at`. */
    status?: InviteStatus;
    consumed_at: string | null;
    created_at: string;
    /** Only on the response to sending: whether the invite email reached the mail server. */
    email_sent?: boolean;
}

/** The author columns embedded in posts and comments. */
export type Author = Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "role">;

export type ArticleStatus = "draft" | "review" | "head_review" | "changes_requested" | "published" | "archived";
export type ArticleCategory = "markets" | "stocks" | "economy" | "fuel" | "fx" | "crypto" | "personal-finance" | "education" | "company-news";

export const ARTICLE_CATEGORIES: { id: ArticleCategory; label: string }[] = [
    { id: "markets", label: "Markets" },
    { id: "stocks", label: "Stocks" },
    { id: "economy", label: "Economy" },
    { id: "fuel", label: "Fuel" },
    { id: "fx", label: "FX" },
    { id: "crypto", label: "Crypto" },
    { id: "personal-finance", label: "Personal finance" },
    { id: "education", label: "Education" },
    { id: "company-news", label: "Company news" },
];

/** The public section a story is filed under: News (reporting) or Research (analysis). */
export type ArticleDesk = "news" | "research";

export const ARTICLE_DESKS: { id: ArticleDesk; label: string }[] = [
    { id: "news", label: "News" },
    { id: "research", label: "Research" },
];

/** Stories saved before desks existed have no desk and read as News. */
export function articleDesk(article: { desk?: ArticleDesk | null }): ArticleDesk {
    return article.desk === "research" ? "research" : "news";
}

export function deskLabel(desk: ArticleDesk): string {
    return desk === "research" ? "Research" : "News";
}

/** Industries an editor can tag; the ids match the API's places.INDUSTRIES. */
export const ARTICLE_INDUSTRIES: { id: string; label: string }[] = [
    { id: "banking", label: "Banking & finance" },
    { id: "insurance", label: "Insurance" },
    { id: "fintech", label: "Fintech & payments" },
    { id: "crypto", label: "Crypto & digital assets" },
    { id: "energy", label: "Energy, oil & gas" },
    { id: "mining", label: "Mining" },
    { id: "agriculture", label: "Agriculture & cocoa" },
    { id: "manufacturing", label: "Manufacturing" },
    { id: "construction", label: "Construction & infrastructure" },
    { id: "telecoms", label: "Telecoms" },
    { id: "technology", label: "Technology" },
    { id: "media", label: "Media & entertainment" },
    { id: "real-estate", label: "Real estate" },
    { id: "consumer", label: "Consumer & retail" },
    { id: "tourism", label: "Tourism & hospitality" },
    { id: "transport", label: "Transport & logistics" },
    { id: "health", label: "Health" },
    { id: "education", label: "Education" },
];

/** Narrower views of the Technology and Industries home sections, each gathering related industry tags. */
export interface IndustrySubsection { id: string; label: string; section: "technology" | "industries"; industries: string[] }

export const INDUSTRY_SUBSECTIONS: IndustrySubsection[] = [
    { id: "tech-telecoms", label: "Tech & telecoms", section: "technology", industries: ["technology", "telecoms"] },
    { id: "fintech", label: "Fintech & payments", section: "technology", industries: ["fintech"] },
    { id: "crypto", label: "Crypto", section: "technology", industries: ["crypto"] },
    { id: "banking-insurance", label: "Banking & insurance", section: "industries", industries: ["banking", "insurance"] },
    { id: "energy-mining", label: "Energy & mining", section: "industries", industries: ["energy", "mining"] },
    { id: "agriculture", label: "Agriculture", section: "industries", industries: ["agriculture"] },
    { id: "manufacturing-property", label: "Manufacturing & property", section: "industries", industries: ["manufacturing", "construction", "real-estate"] },
    { id: "consumer-services", label: "Consumer & services", section: "industries", industries: ["consumer", "tourism", "transport", "media", "health", "education"] },
];

export function subsectionsOf(section: HomeSection | null | undefined): IndustrySubsection[] {
    return INDUSTRY_SUBSECTIONS.filter((item) => item.section === section);
}

/** The sub-section a story is listed under within a home section: the one holding its first matching tag. */
export function storySubsection(article: Pick<Article, "industries">, section: HomeSection): IndustrySubsection | undefined {
    const options = subsectionsOf(section);
    for (const tag of article.industries ?? []) {
        const match = options.find((item) => item.industries.includes(tag));
        if (match) return match;
    }
    return undefined;
}

/** Whether a story belongs in a home section: its main section, or one its tags add it to. */
export function inHomeSection(article: Pick<Article, "homepage_section" | "home_sections">, section: HomeSection): boolean {
    return (article.home_sections ?? [article.homepage_section]).includes(section);
}

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
    desk?: ArticleDesk;
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
    /** Countries, continents or "World" the story is about; they add it to home sections. */
    places?: string[];
    /** Industry ids from ARTICLE_INDUSTRIES; technology, telecoms, fintech and crypto add it to Technology, every other industry to Industries. */
    industries?: string[];
    /** Every home section the story appears in, worked out by the API from the three fields above. */
    home_sections?: HomeSection[];
    /** Distinct readers: each browser counts once per story. */
    read_count?: number;
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

/** The API accepts images up to 4 MB; a base64 data URL is about a third larger than the file. */
const MAX_UPLOAD_DATA_URL = Math.floor(4 * 1024 * 1024 * 4 / 3);

/**
 * Upload an image picked from the device (gallery, camera or files) and get back its public link.
 * Phone photos are often HEIC or larger than 4 MB, and Instagram only takes JPEG, so every image is
 * resized to at most `maxEdge` pixels on its longest side and re-encoded as JPEG before it is sent.
 * Avatars may be uploaded by any member; covers and post images by the team.
 */
export async function uploadImage(file: File, kind: "avatar" | "cover" | "asset", maxEdge = kind === "avatar" ? 800 : 2400): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file (JPEG, PNG or WebP).");
    let bitmap: ImageBitmap;
    try { bitmap = await createImageBitmap(file); }
    catch { throw new Error("That image could not be read. Choose a JPEG, PNG or WebP."); }
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the image.");
    // JPEG has no transparency: transparent PNG areas become white instead of black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    let dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    for (const quality of [0.78, 0.66]) if (dataUrl.length > MAX_UPLOAD_DATA_URL) dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length > MAX_UPLOAD_DATA_URL) throw new Error("That image is too large to upload. Choose a smaller one.");
    const { url } = await api<{ url: string }>("/editorial/media", { method: "POST", body: { image: dataUrl, kind } });
    return url;
}

/* ------------------------------------------------------------------ */
/* articles                                                            */
/* ------------------------------------------------------------------ */

export async function listPublishedArticles(options: { category?: ArticleCategory | null; section?: HomeSection | null; desk?: ArticleDesk | null; industries?: string[] | null; limit?: number } = {}): Promise<Article[]> {
    const items = (await api<Items<Article>>("/editorial/articles", { auth: false, query: { category: options.category ?? undefined, section: options.section ?? undefined, desk: options.desk ?? undefined, industries: options.industries?.length ? options.industries.join(",") : undefined, limit: options.limit ?? 30 } })).items;
    // Filter here too, so a desk page stays correct against an API that predates desks.
    return options.desk ? items.filter((item) => articleDesk(item) === options.desk) : items;
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

const READER_ID_KEY = "fluid-finance-reader";

/** A random id for this browser, so a story counts each reader once; it identifies nobody. */
function readerId(): string {
    try {
        const stored = window.localStorage.getItem(READER_ID_KEY);
        if (stored && /^[A-Za-z0-9-]{8,64}$/.test(stored)) return stored;
        const fresh = crypto.randomUUID();
        window.localStorage.setItem(READER_ID_KEY, fresh);
        return fresh;
    } catch {
        return crypto.randomUUID();
    }
}

/** Count this browser as a reader of a published story; returns the new count, or null on failure. */
export async function recordArticleRead(articleId: string): Promise<number | null> {
    try {
        const result = await api<{ read_count: number }>(`/editorial/articles/${encodeURIComponent(articleId)}/reads`, { method: "POST", auth: false, body: { visitor: readerId() } });
        return result.read_count;
    } catch {
        return null;
    }
}

/** "1 reader", "1,240 readers"; empty until someone has read the story. */
export function readersLabel(count: number | null | undefined): string {
    if (!count) return "";
    return `${count.toLocaleString("en-GB")} ${count === 1 ? "reader" : "readers"}`;
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
