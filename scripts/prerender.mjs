#!/usr/bin/env node
/**
 * Post-build prerender for search engines and link previews.
 *
 * `vite build` emits one dist/index.html. This script copies it once per public route with that
 * route's <head> (title, description, canonical, robots, Open Graph, Twitter, JSON-LD) and a
 * short crawler-visible summary inside #root, which React replaces when it mounts (createRoot,
 * not hydrate, so the summary never has to match the app's markup).
 *
 * Files are written as dist/<route>.html, not dist/<route>/index.html: Cloudflare Pages serves
 * `fuel.html` at `/fuel` with a 200, whereas `fuel/index.html` is served at `/fuel/` and `/fuel`
 * would 308-redirect away from the canonical URL.
 *
 * No prices are fetched here: quotes are live data and stay client-side.
 */
import { build } from "esbuild";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const START = "<!-- seo:start -->";
const END = "<!-- seo:end -->";
const ROOT_DIV = '<div id="root"></div>';

const bundle = await build({ entryPoints: [path.join(root, "src/lib/seo-routes.ts")], bundle: true, write: false, format: "esm", platform: "neutral", logLevel: "silent" });
const seo = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

const template = await readFile(path.join(dist, "index.html"), "utf8");
for (const marker of [START, END, ROOT_DIV]) {
    if (!template.includes(marker)) throw new Error(`dist/index.html is missing ${marker}; keep it in index.html`);
}

function page(headBlock, body = "") {
    const start = template.indexOf(START) + START.length;
    const end = template.indexOf(END);
    return `${template.slice(0, start)}\n${headBlock}\n    ${template.slice(end)}`.replace(ROOT_DIV, `<div id="root">${body}</div>`);
}

const render = (meta) => page(seo.renderHeadTags(meta), seo.renderSummary(meta));

async function write(file, html) {
    const target = path.join(dist, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
}

const outputs = [];
for (const route of Object.keys(seo.STATIC_PAGES)) {
    const file = route === "/" ? "index.html" : `${route.slice(1)}.html`;
    await write(file, render(seo.staticPageMeta(route)));
    outputs.push(file);
}
for (const symbol of seo.STOCK_SYMBOLS) {
    const file = `stock/${symbol}.html`;
    await write(file, render(seo.stockMeta(symbol)));
    outputs.push(file);
}

// The neutral app shell: the service worker's offline fallback and the base the Pages Functions
// rewrite. It is never a page of its own, so it carries noindex and no canonical.
await write("shell.html", page('    <title data-seo>Fluid Finance</title>\n    <meta data-seo name="robots" content="noindex" />'));
outputs.push("shell.html");

// Pages only falls back to index.html for unknown paths (the SPA behaviour deep links rely on)
// when the build has no top-level 404.html.
const has404 = await access(path.join(dist, "404.html")).then(() => true, () => false);
if (has404) throw new Error("dist/404.html exists; Cloudflare Pages would stop serving the app shell for client routes");

console.log(`prerender: wrote ${outputs.length} pages (${Object.keys(seo.STATIC_PAGES).length} static, ${seo.STOCK_SYMBOLS.length} stocks, 1 shell)`);
