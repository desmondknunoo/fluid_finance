import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// The /sitemap.xml builder used by functions/sitemap.xml.ts.
const built = await build({ entryPoints: ['server/sitemap.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral' });
const sitemap = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);

const SITE = 'https://finance.fluidterra.com';
const thread = (n, extra = {}) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, created_at: '2026-10-01T10:00:00Z', last_reply_at: null, ...extra });

function api(routes) {
    const calls = [];
    const fetchJson = async (path) => {
        calls.push(path);
        for (const [pattern, reply] of routes) {
            const match = path.match(pattern);
            if (match) return typeof reply === 'function' ? reply(match) : reply;
        }
        throw new Error(`unexpected ${path}`);
    };
    return { calls, fetchJson };
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

test('lists static pages, every stock, articles, categories and paginated threads with real lastmod dates', async () => {
    const { calls, fetchJson } = api([
        [/^\/editorial\/articles\?limit=100$/, { items: [{ slug: 'q3-banks', published_at: '2026-10-10T08:00:00Z', updated_at: '2026-10-12T09:30:00.123456+00:00' }, { slug: 'no-date', published_at: null }] }],
        [/^\/editorial\/forum\/categories$/, { items: [{ slug: 'gse-stocks' }, { slug: 'fuel-energy' }] }],
        [/^\/editorial\/forum\/threads\?page=0$/, { items: Array.from({ length: 20 }, (_, i) => thread(i, i === 0 ? { last_reply_at: '2026-10-15T12:00:00Z' } : {})) }],
        [/^\/editorial\/forum\/threads\?page=1$/, { items: [thread(20), thread(21, { deleted_at: '2026-10-02T00:00:00Z' })] }],
    ]);
    const xml = await sitemap.buildSitemap(fetchJson);
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
    assert.ok(xml.trim().endsWith('</urlset>'));
    const urls = locs(xml);
    assert.equal(new Set(urls).size, urls.length, 'no duplicates');
    for (const path of ['/', '/gse-live', '/gse-live/heatmap', '/fuel', '/fx', '/articles', '/forum', '/learning-center', '/stock/GCB', '/stock/MTNGH', '/articles/q3-banks', '/forum/c/gse-stocks']) assert.ok(urls.includes(`${SITE}${path}`), path);
    for (const path of ['/login', '/register', '/reset-password', '/settings', '/saved', '/forum/new']) assert.ok(!urls.includes(`${SITE}${path}`), path);
    assert.equal(urls.filter((url) => url.includes('/stock/')).length, 39);
    assert.equal(urls.filter((url) => url.includes('/forum/t/')).length, 21, 'two pages of threads, deleted one skipped');
    assert.ok(calls.includes('/editorial/forum/threads?page=1') && !calls.includes('/editorial/forum/threads?page=2'));
    assert.match(xml, /<loc>https:\/\/finance\.fluidterra\.com\/articles\/q3-banks<\/loc><lastmod>2026-10-12T09:30:00.123Z<\/lastmod>/);
    assert.match(xml, /<loc>https:\/\/finance\.fluidterra\.com\/articles\/no-date<\/loc><\/url>/);
    assert.match(xml, /forum\/t\/00000000-0000-4000-8000-000000000000<\/loc><lastmod>2026-10-15T12:00:00.000Z/);
    assert.ok(!/<lastmod>/.test(xml.split('/articles/')[0]), 'static pages carry no invented lastmod');
});

test('a full first page of articles widens coverage through the category feeds', async () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ slug: `story-${i}`, published_at: '2026-10-01T00:00:00Z' }));
    const { calls, fetchJson } = api([
        [/^\/editorial\/articles\?limit=100$/, { items: many }],
        [/^\/editorial\/articles\?limit=100&category=fuel$/, { items: [{ slug: 'fuel-only', published_at: '2026-09-01T00:00:00Z' }, many[0]] }],
        [/^\/editorial\/articles\?limit=100&category=/, { items: [] }],
        [/^\/editorial\/forum\/categories$/, { items: [] }],
        [/^\/editorial\/forum\/threads/, { items: [] }],
    ]);
    const urls = locs(await sitemap.buildSitemap(fetchJson));
    assert.equal(urls.filter((url) => url.includes('/articles/')).length, 101);
    assert.equal(calls.filter((path) => path.includes('category=')).length, 8);
});

test('API failures leave a valid sitemap of static and stock pages', async () => {
    const xml = await sitemap.buildSitemap(async () => { throw new Error('down'); });
    const urls = locs(xml);
    assert.ok(urls.includes(`${SITE}/`) && urls.includes(`${SITE}/stock/GCB`));
    assert.ok(!urls.some((url) => url.includes('/articles/') || url.includes('/forum/t/')));
});

test('URLs are XML-escaped', () => {
    const xml = sitemap.renderSitemap([{ loc: '/articles?section=a&b' }]);
    assert.match(xml, /<loc>https:\/\/finance\.fluidterra\.com\/articles\?section=a&amp;b<\/loc>/);
});
