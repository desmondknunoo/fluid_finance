import { apiJson, dynamicPage, NotFound, param, type Env } from "../../../server/edge-seo";
import { forumCategoryMeta, type CategoryLike } from "../../../src/lib/seo-routes";

const SLUG = /^[a-z0-9-]+$/;

/** /forum/c/<category>: the category's name and description in the HTML. */
export const onRequest: PagesFunction<Env, "slug"> = (context) => {
    const slug = param(context.params.slug);
    if (!SLUG.test(slug)) return context.next();
    return dynamicPage(context, `/forum/c/${slug}`, "Forum category", async () => {
        const { items } = await apiJson<{ items: CategoryLike[] }>(context.env, "/editorial/forum/categories");
        const category = items.find((item) => item.slug === slug);
        if (!category) throw new NotFound(slug);
        return forumCategoryMeta(category);
    });
};
