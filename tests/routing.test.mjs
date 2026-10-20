import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// The History API router (src/lib/navigation.ts): path parsing and the legacy `/#/…` redirect.
const built = await build({ entryPoints: ['src/lib/navigation.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral' });
const nav = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);

test('every legacy hash route maps to the equivalent path', () => {
    const cases = {
        '#/': '/',
        '#/stock/GCB': '/stock/GCB',
        '#/articles/cedi-outlook-2027': '/articles/cedi-outlook-2027',
        '#/articles?section=africa': '/articles?section=africa',
        '#/opinion': '/opinion',
        '#/gse-live': '/gse-live',
        '#/gse-live/heatmap': '/gse-live/heatmap',
        '#gse-live/heatmap': '/gse-live/heatmap',
        '#/forum/t/66567063-9603-49a4-a258-254222d1835d': '/forum/t/66567063-9603-49a4-a258-254222d1835d',
        '#/forum/c/gse-stocks': '/forum/c/gse-stocks',
        '#/forum/new/fuel-energy': '/forum/new/fuel-energy',
        '#/u/kofi_m': '/u/kofi_m',
        '#/fx': '/fx',
        '#/fuel': '/fuel',
        '#/login': '/login',
        '#/reset-password?mode=resetPassword&oobCode=abc': '/reset-password?mode=resetPassword&oobCode=abc',
        '#//double': '/double',
    };
    for (const [hash, path] of Object.entries(cases)) assert.equal(nav.legacyHashToPath(hash), path, hash);
});

test('ordinary in-page anchors are not treated as routes', () => {
    for (const hash of ['', '#', '#socials', '#listen', '#have-questions', '#main-content']) assert.equal(nav.legacyHashToPath(hash), null, hash);
    assert.equal(nav.toPath('#socials'), '#socials');
    assert.equal(nav.toPath('#/fx'), '/fx');
    assert.equal(nav.toPath('/fx'), '/fx');
});

test('the backend publication ledger and share links land on the same route as the new paths', () => {
    const fromLedger = new URL('https://finance.fluidterra.com/#/articles/q3-banking-results');
    const path = nav.legacyHashToPath(fromLedger.hash);
    assert.deepEqual(nav.parsePath(path), { kind: 'article', slug: 'q3-banking-results' });
    assert.deepEqual(nav.parsePath('/stock/gcb'), { kind: 'stock', symbol: 'GCB' });
});

test('paths parse to the same route set the hash router had', () => {
    const cases = [
        ['/', { kind: 'home', section: null, view: null }],
        ['/index.html', { kind: 'home', section: null, view: null }],
        ['/stock/MTNGH', { kind: 'stock', symbol: 'MTNGH' }],
        ['/about', { kind: 'about' }],
        ['/about-us', { kind: 'about' }],
        ['/contact-support', { kind: 'contact-support' }],
        ['/privacy-policy', { kind: 'privacy-policy' }],
        ['/terms-of-service', { kind: 'terms-of-service' }],
        ['/learning-center', { kind: 'learning-center' }],
        ['/help-center', { kind: 'help-center' }],
        ['/market-education', { kind: 'market-education' }],
        ['/market-trends', { kind: 'market-trends' }],
        ['/business-news', { kind: 'business-news' }],
        ['/gse-live', { kind: 'gse-live', view: null }],
        ['/gse-live/heatmap', { kind: 'gse-live', view: 'heatmap' }],
        ['/gse-live/table', { kind: 'gse-live', view: 'table' }],
        ['/gse-live/unknown', { kind: 'gse-live', view: null }],
        ['/fuel', { kind: 'fuel' }],
        ['/fuel/', { kind: 'fuel' }],
        ['/fuel.html', { kind: 'fuel' }],
        ['/fx', { kind: 'fx' }],
        ['/articles', { kind: 'articles' }],
        ['/opinion', { kind: 'articles' }],
        ['/articles/q3-results', { kind: 'article', slug: 'q3-results' }],
        ['/saved', { kind: 'saved' }],
        ['/forum', { kind: 'forum', category: null }],
        ['/forum/c/gse-stocks', { kind: 'forum', category: 'gse-stocks' }],
        ['/forum/t/66567063-9603-49A4-A258-254222D1835D', { kind: 'thread', id: '66567063-9603-49a4-a258-254222d1835d' }],
        ['/forum/new', { kind: 'new-thread', category: null }],
        ['/forum/new/fx-cedi', { kind: 'new-thread', category: 'fx-cedi' }],
        ['/login', { kind: 'auth', mode: 'login' }],
        ['/register', { kind: 'auth', mode: 'register' }],
        ['/reset-password', { kind: 'auth', mode: 'reset-password' }],
        ['/settings', { kind: 'settings' }],
        ['/u/Kofi_M', { kind: 'profile', username: 'kofi_m' }],
        ['/no/such/page', { kind: 'home', section: null, view: null }],
    ];
    for (const [path, route] of cases) assert.deepEqual(nav.parsePath(path), route, path);
    assert.deepEqual(nav.parsePath('/', '', '#socials'), { kind: 'home', section: 'socials', view: null });
    assert.deepEqual(nav.parsePath('/fuel', '', '#socials'), { kind: 'fuel' });
});

test('link helpers produce real paths, not hashes', () => {
    assert.equal(nav.articleHref('a-b'), '/articles/a-b');
    assert.equal(nav.threadHref('x'), '/forum/t/x');
    assert.equal(nav.profileHref('kofi'), '/u/kofi');
    assert.equal(nav.forumCategoryHref(null), '/forum');
    assert.equal(nav.forumCategoryHref('fuel-energy'), '/forum/c/fuel-energy');
    assert.equal(nav.newThreadHref('fx-cedi'), '/forum/new/fx-cedi');
    assert.equal(nav.stockHref('gcb'), '/stock/GCB');
});

function browser(href) {
    const url = new URL(href);
    const events = [];
    const listeners = {};
    const location = {
        get href() { return url.href; }, get origin() { return url.origin; }, get pathname() { return url.pathname; },
        get search() { return url.search; }, get hash() { return url.hash; }, assign: (next) => events.push(['assign', next]),
    };
    const history = {
        state: null,
        replaceState(state, _title, next) { this.state = state; Object.assign(url, { href: new URL(next, url).href }); events.push(['replace', next]); },
        pushState(state, _title, next) { this.state = state; Object.assign(url, { href: new URL(next, url).href }); events.push(['push', next]); },
    };
    const window = { location, scrollY: 0, dispatchEvent: (event) => events.push(['event', event.type]), addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener() {} };
    Object.assign(globalThis, { window, history });
    return { events, listeners, url };
}

test('an incoming /#/ URL is replaced in place, without a new history entry', () => {
    const page = browser('https://finance.fluidterra.com/#/stock/GCB');
    assert.equal(nav.normaliseLegacyUrl(), true);
    assert.deepEqual(page.events, [['replace', '/stock/GCB']]);
    assert.equal(page.url.href, 'https://finance.fluidterra.com/stock/GCB');
    const plain = browser('https://finance.fluidterra.com/#socials');
    assert.equal(nav.normaliseLegacyUrl(), false);
    assert.deepEqual(plain.events, []);
});

test('navigate pushes same-origin paths, ignores the current URL and hands other origins to the browser', () => {
    const page = browser('https://finance.fluidterra.com/');
    nav.navigate('/fuel');
    nav.navigate('/fuel');
    nav.navigate('#/fx');
    nav.navigate('https://app.fluidterra.com/');
    assert.deepEqual(page.events.filter(([kind]) => kind !== 'replace'), [['push', '/fuel'], ['event', 'fluid:navigate'], ['push', '/fx'], ['event', 'fluid:navigate'], ['assign', 'https://app.fluidterra.com/']]);
});
