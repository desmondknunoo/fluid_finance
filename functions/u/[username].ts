import { apiJson, dynamicPage, param, type Env } from "../../server/edge-seo";
import { profileMeta, type ProfileLike } from "../../src/lib/seo-routes";

const USERNAME = /^[a-z0-9_]{3,24}$/i;

/** /u/<username>: the member's name, bio and ProfilePage JSON-LD in the HTML. */
export const onRequest: PagesFunction<Env, "username"> = (context) => {
    const username = param(context.params.username).toLowerCase();
    if (!USERNAME.test(username)) return context.next();
    return dynamicPage(context, `/u/${username}`, "Member", async () => profileMeta(await apiJson<ProfileLike>(context.env, `/editorial/profiles/${encodeURIComponent(username)}`)));
};
