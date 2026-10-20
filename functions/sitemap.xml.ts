import { apiBase, type Env } from "../server/edge-seo";
import { buildSitemap } from "../server/sitemap";

/** /sitemap.xml: static pages, stock pages, published articles and forum threads. */
export const onRequest: PagesFunction<Env> = async (context) => {
    if (context.request.method !== "GET" && context.request.method !== "HEAD") return context.next();
    const base = apiBase(context.env);
    const xml = await buildSitemap(async <T>(path: string) => {
        const response = await fetch(`${base}${path}`, { headers: { Accept: "application/json" }, cf: { cacheTtl: 900, cacheEverything: true } } as RequestInit);
        if (!response.ok) throw new Error(`API ${response.status} for ${path}`);
        return (await response.json()) as T;
    });
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" } });
};
