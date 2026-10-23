import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAllStocks, getStock, getEquityDetail } from '../src/lib/gse.ts';

// Rows as kwayisi's `/live` ticker returns them: `change` is the day's move against the previous close.
const snapshot = [
  { name: 'GCB', price: '43.00', change: '2.40', volume: 123 },
  { name: 'TBL', price: '0.50', change: '0', volume: 0 },
  { name: 'CAL', price: '0.75', change: '-0.01', volume: 7 },
];

async function withFetch(fn, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fn;
  try { await run(); } finally { globalThis.fetch = original; }
}

test('reads the whole board from the live ticker and keeps decimal prices, moves and % change', async () => {
  await withFetch(async (url) => {
    assert.equal(url, 'https://dev.kwayisi.org/apis/gse/live');
    return Response.json(snapshot);
  }, async () => {
    const stocks = await getAllStocks(true);
    assert.deepEqual(stocks.map(s => s.symbol), ['CAL', 'GCB', 'TBL']);
    const gcb = stocks.find(s => s.symbol === 'GCB');
    assert.equal(gcb.price, 43);
    assert.equal(gcb.change, 2.4);
    // 2.40 on a previous close of 40.60
    assert.equal(gcb.changePercent.toFixed(2), '5.91');
    assert.equal(stocks.filter(s => s.change > 0).length, 1);
    assert.equal(stocks.filter(s => s.change < 0).length, 1);
    assert.equal(stocks.filter(s => s.change === 0).length, 1);
  });
});

test('a single quote comes from the live ticker and company detail from the equities endpoint', async () => {
  await withFetch(async (url) => {
    if (url === 'https://dev.kwayisi.org/apis/gse/live/GCB') return Response.json(snapshot[0]);
    assert.equal(url, 'https://dev.kwayisi.org/apis/gse/equities/gcb');
    return Response.json({ name: 'GCB', company: { name: 'GCB Bank Limited' } });
  }, async () => {
    assert.equal((await getStock('gcb')).price, 43);
    assert.equal((await getEquityDetail('GCB')).company.name, 'GCB Bank Limited');
  });
});

test('does not silently substitute another source or partial data when the ticker fails', async () => {
  await withFetch(async () => new Response('unavailable', { status: 503 }), async () => {
    await assert.rejects(getAllStocks(true), /503/);
  });
  await withFetch(async () => Response.json([]), async () => {
    await assert.rejects(getAllStocks(true), /snapshot is empty/);
  });
  await withFetch(async () => Response.json([{ ...snapshot[0], price: 'bad' }]), async () => {
    await assert.rejects(getAllStocks(true), /Invalid GSE live quote/);
  });
});
