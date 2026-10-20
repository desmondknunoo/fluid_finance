import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Route metadata, JSON-LD and head rendering (src/lib/seo-routes.ts), bundled the way the
// prerenderer and the Pages Functions bundle it.
const built = await build({ entryPoints: ['src/lib/seo-routes.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral' });
const seo = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);

const SITE = 'https://finance.fluidterra.com';

test('every indexable static page has a specific title and a 140-160 character description', () => {
    const titles = new Set();
    for (const path of seo.INDEXABLE_STATIC_PATHS) {
        const meta = seo.staticPageMeta(path);
        assert.ok(meta.description.length >= 140 && meta.description.length <= 160, `${path} description is ${meta.description.length} characters: ${meta.description}`);
        assert.ok(meta.title.length <= 75, `${path} title is too long: ${meta.title}`);
        assert.ok(!titles.has(meta.title), `${path} repeats a title`);
        titles.add(meta.title);
        assert.equal(meta.path, path);
        assert.equal(meta.robots, 'index');
    }
    assert.equal(seo.staticPageMeta('/fuel').title, 'Fuel prices in Ghana today: petrol and diesel by OMC · Fluid Finance');
});

test('account, settings, saved-reading and composer pages are noindex and never in the sitemap list', () => {
    for (const path of ['/login', '/register', '/reset-password', '/settings', '/saved', '/forum/new']) {
        assert.equal(seo.staticPageMeta(path).robots, 'noindex', path);
        assert.ok(!seo.INDEXABLE_STATIC_PATHS.includes(path), path);
        const robots = seo.headTags(seo.staticPageMeta(path)).find((tag) => tag.attrs.name === 'robots');
        assert.match(robots.attrs.content, /^noindex/);
    }
});

test('every GSE symbol gets a stock page with ticker metadata and a 140-160 character description', () => {
    assert.ok(seo.STOCK_SYMBOLS.length >= 38, `only ${seo.STOCK_SYMBOLS.length} symbols`);
    for (const symbol of seo.STOCK_SYMBOLS) {
        const meta = seo.stockMeta(symbol);
        assert.ok(meta.description.length >= 140 && meta.description.length <= 160, `${symbol}: ${meta.description.length} ${meta.description}`);
        assert.equal(meta.path, `/stock/${symbol}`);
        const corporation = meta.jsonLd.find((block) => block['@type'] === 'Corporation');
        assert.equal(corporation.tickerSymbol, `GSE:${symbol}`);
        assert.ok(!('price' in corporation) && !('aggregateRating' in corporation));
    }
    assert.equal(seo.stockMeta('gcb').title, 'GCB Bank Limited (GCB) share price today · Fluid Finance');
});

test('route metadata maps paths, aliases and views to clean canonical URLs', () => {
    assert.equal(seo.metaForPath('/').path, '/');
    assert.equal(seo.metaForPath('/about').path, '/about-us');
    assert.equal(seo.metaForPath('/gse-live/table').path, '/gse-live');
    assert.equal(seo.metaForPath('/gse-live/heatmap').path, '/gse-live/heatmap');
    assert.equal(seo.metaForPath('/opinion').path, '/opinion');
    assert.equal(seo.metaForPath('/stock/mtngh').path, '/stock/MTNGH');
    assert.equal(seo.metaForPath('/articles?section=africa').path, '/articles?section=africa');
    assert.equal(seo.metaForPath('/no/such/page').path, '/');
    const canonical = seo.headTags(seo.metaForPath('/fuel/')).find((tag) => tag.attrs.rel === 'canonical');
    assert.equal(canonical.attrs.href, `${SITE}/fuel`);
});

test('JSON-LD blocks parse, use schema.org and carry real values only', () => {
    const metas = [
        ...seo.INDEXABLE_STATIC_PATHS.map((path) => seo.staticPageMeta(path)),
        ...seo.STOCK_SYMBOLS.map((symbol) => seo.stockMeta(symbol)),
        seo.articleMeta({ slug: 'cedi-week', title: 'The cedi this week', excerpt: 'Why the cedi moved.', body: '# Heading\n\nBody', cover_url: 'https://cdn.example/cover.png', category: 'fx', tags: ['cedi'], published_at: '2026-10-19T08:00:00Z', updated_at: '2026-10-20T08:00:00Z', author: { username: 'ama', display_name: 'Ama Mensah' } }),
        seo.threadMeta({ id: '66567063-9603-49a4-a258-254222d1835d', title: 'GCB dividend?', body: 'When is it paid?', reply_count: 3, created_at: '2026-10-18T08:00:00Z', last_reply_at: null, author: { username: 'kofi', display_name: 'Kofi' }, category: { slug: 'gse-stocks', name: 'GSE stocks' } }),
    ];
    const types = new Set();
    for (const meta of metas) {
        for (const tag of seo.headTags(meta).filter((item) => item.tag === 'script')) {
            assert.equal(tag.attrs.type, 'application/ld+json');
            assert.ok(!tag.text.includes('</'), 'script text cannot close its element');
            const data = JSON.parse(tag.text);
            assert.equal(data['@context'], 'https://schema.org');
            types.add(data['@type']);
            const text = JSON.stringify(data);
            assert.ok(!/aggregateRating|ratingValue|"price"/.test(text), `fabricated value in ${data['@type']}`);
            assert.ok(!/SearchAction/.test(text), 'no search URL exists, so no SearchAction');
        }
    }
    for (const type of ['NewsMediaOrganization', 'WebSite', 'BreadcrumbList', 'Corporation', 'NewsArticle', 'DiscussionForumPosting', 'FAQPage', 'ItemList', 'Dataset']) assert.ok(types.has(type), `missing ${type}`);
    const article = metas.at(-2).jsonLd[0];
    assert.equal(article.datePublished, '2026-10-19T08:00:00Z');
    assert.deepEqual(article.image, ['https://cdn.example/cover.png']);
    assert.equal(article.author[0].url, `${SITE}/u/ama`);
});

test('head tags use absolute og:image URLs and escape attribute values', () => {
    const meta = seo.articleMeta({ slug: 'a-b', title: 'Q3 "results" <b>&</b>', excerpt: null, body: 'Profits **rose** 12% at [GCB](/stock/GCB).', cover_url: null, category: 'stocks', published_at: null, author: null });
    const html = seo.renderHeadTags(meta);
    assert.match(html, /<meta data-seo property="og:image" content="https:\/\/finance\.fluidterra\.com\/og\/default\.png" \/>/);
    assert.ok(html.includes('Q3 &quot;results&quot; &lt;b&gt;&amp;&lt;/b&gt;'));
    assert.equal(meta.description, 'Profits rose 12% at GCB.');
    const summary = seo.renderSummary(seo.stockMeta('GCB'));
    assert.match(summary, /^<main class="page-container news-page" data-prerendered><h1>GCB Bank Limited \(GCB\)<\/h1>/);
    assert.match(summary, /Sector: Financials\. Industry: Banking\./);
});
