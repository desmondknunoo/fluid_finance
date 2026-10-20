import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Path routing: each page is cached under its own URL and never served for another one.
const script = await readFile('public/reading-sw.js', 'utf8');
const ORIGIN = 'https://finance.example';

function worker({ online = true } = {}) {
    const listeners = {};
    const store = new Map();
    const cache = {
        add: async (request) => { store.set(typeof request === 'string' ? request : request.url, new Response(`fetched ${request.url ?? request}`)); },
        put: async (key, response) => { store.set(typeof key === 'string' ? key : key.url, response); },
        keys: async () => [...store.keys()].map((url) => ({ url })),
        delete: async (request) => store.delete(request.url),
    };
    const context = {
        URL, Request, Response, Promise,
        self: { location: { origin: ORIGIN }, clients: { claim: async () => {} }, skipWaiting: async () => {}, addEventListener: (name, fn) => { listeners[name] = fn; } },
        caches: { open: async () => cache, match: async (key) => { const hit = store.get(typeof key === 'string' ? key.startsWith('/') ? ORIGIN + key : key : key.url); return hit ? hit.clone() : undefined; }, keys: async () => [] },
        fetch: async (request) => {
            if (!online) throw Error('offline');
            const response = new Response(`<html>${new URL(request.url).pathname}</html>`, { headers: { 'Content-Type': 'text/html' } });
            Object.defineProperty(response, 'type', { value: 'basic' });
            return response;
        },
    };
    vm.runInNewContext(script, context);
    return { listeners, store, setOnline: (value) => { online = value; } };
}

const navigation = (path) => ({ method: 'GET', url: ORIGIN + path, headers: new Headers(), mode: 'navigate' });

async function navigate(w, path) {
    let response; const work = [];
    w.listeners.fetch({ request: navigation(path), respondWith: (p) => { response = p; }, waitUntil: (p) => work.push(p) });
    const body = await (await response).text();
    await Promise.all(work);
    return body;
}

test('pages are cached under their own path and served offline only for that path', async () => {
    const w = worker();
    assert.equal(await navigate(w, '/stock/GCB'), '<html>/stock/GCB</html>');
    assert.equal(await navigate(w, '/fuel/'), '<html>/fuel/</html>');
    assert.ok(w.store.has(`${ORIGIN}/stock/GCB`) && w.store.has(`${ORIGIN}/fuel`));
    assert.ok(!w.store.has(`${ORIGIN}/`), 'a page response is never stored as the home page');
    w.setOnline(false);
    assert.equal(await navigate(w, '/stock/GCB'), '<html>/stock/GCB</html>');
    assert.equal(await navigate(w, '/fuel'), '<html>/fuel/</html>');
});

test('an uncached page offline gets the neutral shell, not another page', async () => {
    const w = worker();
    await navigate(w, '/stock/GCB');
    w.store.set(`${ORIGIN}/shell`, new Response('<html>shell</html>'));
    w.setOnline(false);
    assert.equal(await navigate(w, '/articles/never-visited'), '<html>shell</html>');
});

test('API paths, files and authorised requests are left to the network', () => {
    const w = worker();
    let captured = 0;
    for (const request of [navigation('/api/v1/editorial/me'), navigation('/sitemap.xml'), { ...navigation('/settings'), headers: new Headers({ Authorization: 'Bearer x' }) }, { ...navigation('/'), url: 'https://other.example/' }]) {
        w.listeners.fetch({ request, respondWith: () => { captured++; } });
    }
    assert.equal(captured, 0);
});

test('the cache name moved on so the hash-era shell cache is cleared', () => {
    assert.match(script, /const CACHE='fluid-reading-shell-v2'/);
});
