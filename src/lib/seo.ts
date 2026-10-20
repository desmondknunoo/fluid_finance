import { useEffect } from "react";
import { headTags, type PageMeta } from "@/lib/seo-routes";

/**
 * Fluid Finance - head manager
 *
 * Writes a page's title, description, canonical, robots, Open Graph, Twitter and JSON-LD tags
 * into <head>. Every managed element carries `data-seo`; each update replaces the whole set, so
 * nothing from the previous page lingers. The prerendered HTML and the Pages Functions emit the
 * same tags (src/lib/seo-routes.ts), so the first paint already matches.
 */

let applied = "";

export function applyMeta(meta: PageMeta): void {
    const key = JSON.stringify(meta);
    if (key === applied) return;
    applied = key;
    const head = document.head;
    head.querySelectorAll("[data-seo]:not(title)").forEach((node) => node.remove());
    const fragment = document.createDocumentFragment();
    for (const { tag, attrs, text } of headTags(meta)) {
        if (tag === "title") {
            document.title = text ?? "";
            continue;
        }
        const element = document.createElement(tag);
        element.setAttribute("data-seo", "");
        for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
        if (text !== undefined) element.textContent = text;
        fragment.appendChild(element);
    }
    head.appendChild(fragment);
}

/** Apply page metadata whenever it changes. Pass null while the page has nothing better to say. */
export function useSeo(meta: PageMeta | null | undefined): void {
    const key = meta ? JSON.stringify(meta) : "";
    useEffect(() => {
        if (meta) applyMeta(meta);
        // `key` captures every field of `meta`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
}
