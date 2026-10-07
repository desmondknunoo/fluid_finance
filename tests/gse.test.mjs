import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAllStocks, getStock, getEquityDetail } from '../src/lib/gse.ts';

const snapshot = [
  { symbol: 'GCB', price: '43.00', change: '2.40', changePercent: '5.91', volume: 123 },
  { symbol: 'TBL', price: '0.50', change: '0', changePercent: '0', volume: 0 },
  { symbol: 'CAL', price: '0.75', change: '-0.01', changePercent: '-1.32', volume: 7 },
];

async function withFetch(fn, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fn;
  try { await run(); } finally { globalThis.fetch = original; }
}

test('uses the shared backend snapshot and preserves full coverage, decimal prices and changes', async () => {
  await withFetch(async (url) => {
    assert.equal(url, 'https://api.fluidterra.com/api/v1/market/stocks');
    return Response.json({ items: snapshot });
  }, async () => {
    const stocks = await getAllStocks(true);
    assert.deepEqual(stocks.map(s => s.symbol), ['CAL', 'GCB', 'TBL']);
    assert.equal(stocks.find(s => s.symbol === 'GCB').price, 43);
    assert.equal(stocks.find(s => s.symbol === 'GCB').changePercent, 5.91);
    assert.equal(stocks.filter(s => s.change > 0).length, 1);
    assert.equal(stocks.filter(s => s.change < 0).length, 1);
    assert.equal(stocks.filter(s => s.change === 0).length, 1);
  });
});

test('individual stock prices come from the backend while company metadata keeps its existing source', async () => {
  await withFetch(async (url) => {
    if (url === 'https://api.fluidterra.com/api/v1/market/stocks/GCB') return Response.json(snapshot[0]);
    assert.equal(url, 'https://dev.kwayisi.org/apis/gse/equities/gcb');
    return Response.json({ name: 'GCB', company: { name: 'GCB Bank Limited' } });
  }, async () => {
    assert.equal((await getStock('gcb')).price, 43);
    assert.equal((await getEquityDetail('GCB')).company.name, 'GCB Bank Limited');
  });
});

test('does not silently substitute another source or partial data when the backend fails', async () => {
  await withFetch(async () => new Response('unavailable', { status: 503 }), async () => {
    await assert.rejects(getAllStocks(true), /503/);
  });
  await withFetch(async () => Response.json({ items: [] }), async () => {
    await assert.rejects(getAllStocks(true), /snapshot is empty/);
  });
  await withFetch(async () => Response.json({ items: [{ ...snapshot[0], price: 'bad' }] }), async () => {
    await assert.rejects(getAllStocks(true), /Invalid Fluid market quote/);
  });
});
