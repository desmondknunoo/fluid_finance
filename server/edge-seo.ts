/**
 * Request-time metadata for Pages Functions.
 *
 * Articles, forum threads, forum categories and member profiles are not known at build time, so
 * their Functions fetch the record from the Fluid Finance API and return the app shell with that
 * page's <head> (title, description, canonical, robots, Open Graph, Twitter, JSON-LD) and a short
 * crawler summary injected by HTMLRewriter. Any failure falls back to the plain shell, so the
 * page always loads; the app then renders it client-side as before.
 */
import { notFoundMeta, renderHeadTags, renderSummary, SITE_NAME, type PageMeta } from "../src/lib/seo-routes";

export interface Env {
    ASSETS: PagesAssets;
    /** Optional override of the editorial API base, e.g. for a staging backend. */
    API_BASE_URL?: string;
}

export const DEFAULT_API_BASE = "https://api.finance.fluidterra.com/api/v1";
/**
 * Browsers revalidate every time, like Pages' own HTML: a page cached for minutes would keep
 * pointing at hashed assets that the next deployment removes. The API reads behind it are cached
 * at the edge for five minutes (apiJson), so revalidating stays cheap.
 */
export const PAGE_CACHE = "public, max-age=0, must-revalidate";

export const apiBase = (env: Env) => (env.API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, "");

export class NotFound extends Error {}

/** GET a public API resource with a short edge cache; 404 becomes NotFound, other errors throw. */
export async function apiJson<T>(env: Env, path: string): Promise<T> {
    const response = await fetch(`${apiBase(env)}${path}`, {
        headers: { Accept: "application/json" },
        // Cloudflare's subrequest cache: repeated crawls within five minutes reuse the response.
        cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit);
    if (response.status === 404) throw new NotFound(path);
    if (!response.ok) throw new Error(`API ${response.status} for ${path}`);
    return (await response.json()) as T;
}

/** The neutral app shell built by scripts/prerender.mjs, or the front page if it is missing. */
async function shell(context: PagesEventContext<Env, string>): Promise<Response> {
    const response = await context.env.ASSETS.fetch(new URL("/shell", context.request.url));
    if (response.ok && (response.headers.get("Content-Type") ?? "").includes("text/html")) return response;
    return context.env.ASSETS.fetch(new URL("/", context.request.url));
}

/** The shell with `meta` written into <head> and the summary into #root. */
export function withMeta(response: Response, meta: PageMeta, status = 200): Response {
    const head = renderHeadTags(meta);
    const summary = renderSummary(meta);
    const rewritten = new HTMLRewriter()
        .on("[data-seo]", { element: (element) => { element.remove(); } })
        .on("head", { element: (element) => { element.append(`${head}\n`, { html: true }); } })
        .on("#root", { element: (element) => { element.setInnerContent(summary, { html: true }); } })
        .transform(response);
    const headers = new Headers(rewritten.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Cache-Control", PAGE_CACHE);
    // The body changed, so the asset's validators no longer describe it.
    headers.delete("ETag");
    headers.delete("Content-Length");
    headers.delete("Last-Modified");
    return new Response(rewritten.body, { status, headers });
}

/**
 * Serve a dynamic page: `load` returns its metadata, throws NotFound for a missing record, or
 * throws anything else to fall back to the plain shell (still a 200, with a self canonical).
 */
export async function dynamicPage(context: PagesEventContext<Env, string>, path: string, label: string, load: () => Promise<PageMeta>): Promise<Response> {
    if (context.request.method !== "GET" && context.request.method !== "HEAD") return context.next();
    let base: Response;
    try {
        base = await shell(context);
    } catch {
        return context.next();
    }
    try {
        return withMeta(base, await load());
    } catch (error) {
        if (error instanceof NotFound) return withMeta(base, notFoundMeta(path, label), 404);
        try {
            return withMeta(base, { title: SITE_NAME, description: `${label} on Fluid Finance: Ghana's markets, in focus.`, path });
        } catch {
            return base;
        }
    }
}

export const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value.join("/") : value ?? "");
