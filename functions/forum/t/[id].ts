import { apiJson, dynamicPage, param, type Env } from "../../../server/edge-seo";
import { threadMeta, type ThreadLike } from "../../../src/lib/seo-routes";

const ID = /^[0-9a-f-]{36}$/i;

/** /forum/t/<id>: the discussion's title, opening post and DiscussionForumPosting JSON-LD in the HTML. */
export const onRequest: PagesFunction<Env, "id"> = (context) => {
    const id = param(context.params.id).toLowerCase();
    if (!ID.test(id)) return context.next();
    return dynamicPage(context, `/forum/t/${id}`, "Discussion", async () => {
        const thread = await apiJson<ThreadLike & { deleted_at?: string | null }>(context.env, `/editorial/forum/threads/${id}`);
        if (thread.deleted_at) throw new Error("removed discussion");
        return threadMeta(thread);
    });
};
