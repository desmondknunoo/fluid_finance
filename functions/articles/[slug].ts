import { apiJson, dynamicPage, param, type Env } from "../../server/edge-seo";
import { articleMeta, type ArticleLike } from "../../src/lib/seo-routes";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** /articles/<slug>: the article's title, excerpt, cover and NewsArticle JSON-LD in the HTML. */
export const onRequest: PagesFunction<Env, "slug"> = (context) => {
    const slug = param(context.params.slug);
    if (!SLUG.test(slug)) return context.next();
    return dynamicPage(context, `/articles/${slug}`, "Article", async () => articleMeta(await apiJson<ArticleLike>(context.env, `/editorial/articles/${encodeURIComponent(slug)}`)));
};
