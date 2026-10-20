import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const built = await build({
    entryPoints: ['src/lib/closes.ts'], bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: [{ name: 'api-fixture', setup(builder) {
        builder.onResolve({ filter: /^@\/lib\/api$/ }, () => ({ path: 'api', namespace: 'fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const api = (...args) => globalThis.closesApiFixture(...args);' }));
    } }],
});
let version = 0;
const freshModule = () => import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}#${version++}`);
const row = (symbol, trading_date, price = 1) => ({ symbol, trading_date, price, recorded_at: null });

test('history reads the public Finance API and retains more than one legacy page', async () => {
    const rows = Array.from({ length: 1200 }, (_, i) => row(`S${i}`, '2026-10-15'));
    let calls = 0;
    globalThis.closesApiFixture = async (path, options) => {
        calls++;
        assert.equal(path, '/editorial/closes');
        assert.deepEqual(options, { auth: false });
        return { items: rows };
    };
    const closes = await freshModule();
    assert.equal((await closes.listCloses()).length, 1200);
    assert.deepEqual(await closes.listCloseDates(), ['2026-10-15']);
    assert.equal(calls, 1);
});

test('historical date and symbol filters preserve export values and date ordering', async () => {
    globalThis.closesApiFixture = async () => ({ items: [row('MTNGH', '2026-10-15', 6.5), row('GCB', '2026-08-10', 20), row('MTNGH', '2026-08-10', 5.5)] });
    const closes = await freshModule();
    assert.deepEqual(await closes.listCloses({ symbol: 'MTNGH', start: '2026-08-10', end: '2026-10-15' }), [row('MTNGH', '2026-10-15', 6.5), row('MTNGH', '2026-08-10', 5.5)]);
    assert.deepEqual(await closes.getStockPriceHistory('2026-08-10', '2026-08-10'), [row('GCB', '2026-08-10', 20), row('MTNGH', '2026-08-10', 5.5)]);
    assert.deepEqual(await closes.listCloseDates(), ['2026-08-10', '2026-10-15']);
});

test('failed or malformed responses are not cached and a later retry can succeed', async () => {
    const closes = await freshModule();
    globalThis.closesApiFixture = async () => { throw Error('Unavailable'); };
    await assert.rejects(closes.listCloses(), /Unavailable/);
    globalThis.closesApiFixture = async () => ({ items: null });
    await assert.rejects(closes.listCloses(), /response is invalid/);
    globalThis.closesApiFixture = async () => ({ items: [row('MTNGH', '2026-10-15', 6.5)] });
    assert.equal((await closes.listCloses()).length, 1);
});
