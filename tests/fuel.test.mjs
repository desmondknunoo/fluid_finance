import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { access } from 'node:fs/promises';

async function bundle(path) {
  const result = await build({ entryPoints: [path], bundle: true, write: false, platform: 'node', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const { validateFuelReport, averageFuelPrice, fuelReportPages, OMC_LOGO_BASE, DEFAULT_SUPPLIERS, DEFAULT_OMCS, blankFuelRow, mergeOmcLibrary, validOmcLogo, sortFuelRows, POPULAR_OMCS } = await bundle('src/lib/fuel-prices.ts');
const { onRequest } = await bundle('functions/api/fuel-reports.ts');
const { onRequest: omcRequest } = await bundle('functions/api/fuel-omcs.ts');
// Editor credentials are intentionally not imported: sign-in is disabled and the suite must run
// without the gitignored server/fuel-editor-credentials.ts present.
const row = { name: 'Goil PLC', logo_url: `${OMC_LOGO_BASE}1234-abcd.png`, petrol: '16.64', diesel: '18.46', premium: '' };
const env = { SUPABASE_SERVICE_ROLE_KEY: 'test-only-server-key' };
test('arrangements preserve full rows, exact popularity and global pagination order', () => {
  const rows = DEFAULT_SUPPLIERS.map((name, index) => ({ ...blankFuelRow(name), petrol: String(index + 1) }));
  const original = structuredClone(rows);
  const popular = sortFuelRows(rows, 'popular');
  assert.deepEqual(popular.map(row => row.name), POPULAR_OMCS);
  assert.deepEqual(POPULAR_OMCS, ['Goil', 'StarOil', 'Shell', 'TotalEnergies', 'Zen', 'Benab', 'Frimps', 'Petrosol', 'Allied Oil', 'Puma Energy', 'So Energy', 'MISA Energy', 'Pacific', 'Top Oil', 'JP', 'Frontier', 'Power Fuels', 'ICON']);
  assert.deepEqual(rows, original);
  for (const item of popular) assert.equal(item, rows.find(row => row.name === item.name));
  const pages = fuelReportPages(validateFuelReport('2026-10-07', popular, true));
  assert.deepEqual(pages.flat().map(row => row.name), POPULAR_OMCS);
  assert.equal(pages[1][0].name, 'So Energy');
  const extras = [blankFuelRow('Zebra'), blankFuelRow('Alpha'), blankFuelRow(' goil ')];
  assert.deepEqual(sortFuelRows(extras, 'popular').map(row => row.name), [' goil ', 'Alpha', 'Zebra']);
  assert.deepEqual(sortFuelRows(extras, 'az').map(row => row.name), ['Alpha', ' goil ', 'Zebra']);
  assert.deepEqual(sortFuelRows(extras, 'za').map(row => row.name), ['Zebra', ' goil ', 'Alpha']);
});
test('price sorting is numeric, supports each fuel, and puts missing prices last in both directions', () => {
  for (const fuel of ['petrol', 'diesel', 'premium']) {
    const rows = [['B', '9.5'], ['A', '9.50'], ['C', '100'], ['Missing', ''], ['Invalid', 'NaN']].map(([name, value]) => ({ ...blankFuelRow(name), [fuel]: value }));
    assert.deepEqual(sortFuelRows(rows, 'price-asc', fuel).map(row => row.name), ['A', 'B', 'C', 'Invalid', 'Missing']);
    assert.deepEqual(sortFuelRows(rows, 'price-desc', fuel).map(row => row.name), ['C', 'A', 'B', 'Invalid', 'Missing']);
  }
});
const request = (body, auth = '') => new Request('https://finance.fluidterra.com/api/fuel-reports', { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

test('all 18 supplied logos exist, validate, and paginate as 10 + 8', async () => {
  assert.equal(DEFAULT_OMCS.length, 18);
  assert.equal(new Set(DEFAULT_OMCS.map(omc => omc.logo_url)).size, 18);
  for (const omc of DEFAULT_OMCS) {
    await access(`public${omc.logo_url}`);
    assert.ok(validOmcLogo(omc.logo_url));
    assert.equal(blankFuelRow(` ${omc.name.toUpperCase()} `).logo_url, omc.logo_url);
  }
  const rows = validateFuelReport('2026-10-07', DEFAULT_SUPPLIERS.map(name => ({ ...blankFuelRow(name), petrol: '12.50' })), true);
  assert.deepEqual(fuelReportPages(rows).map(page => page.length), [10, 8]);
  for (const url of ['/fuel/unknown.webp', '/fuel/../logo.png', `https://evil.example${DEFAULT_OMCS[0].logo_url}`, `${DEFAULT_OMCS[0].logo_url}?x=1`]) assert.equal(validOmcLogo(url), false);
});
test('uploaded replacements override bundled defaults without losing other companies', () => {
  const replacement = { name: 'shell', logo_url: row.logo_url };
  const extra = { name: 'New OMC', logo_url: row.logo_url };
  const library = mergeOmcLibrary([replacement, extra]);
  assert.equal(library.length, 19);
  assert.deepEqual(library.find(omc => omc.name.toLowerCase() === 'shell'), replacement);
  assert.deepEqual(library.find(omc => omc.name === 'Benab'), DEFAULT_OMCS[17]);
  assert.deepEqual(library.at(-1), extra);
});

test('fuel averages exclude unavailable values and preserve valid decimals', () => {
  const rows = validateFuelReport('2026-10-02', [row, { name: 'Other', petrol: '16.00', diesel: '', premium: '' }]);
  assert.equal(averageFuelPrice(rows, 'petrol'), 16.32);
  assert.equal(averageFuelPrice(rows, 'diesel'), 18.46);
  assert.equal(averageFuelPrice(rows, 'premium'), null);
});
test('invalid dates, duplicates, empty reports and invalid prices cannot be saved', () => {
  for (const price of ['-1', '0', 'NaN', '1.234', '1e2', '10000']) assert.throws(() => validateFuelReport('2026-10-02', [{ ...row, petrol: price }]));
  assert.throws(() => validateFuelReport('2026-02-30', [row]));
  assert.throws(() => validateFuelReport('2026-10-02', [row, { ...row, name: ' goil plc ' }]));
  assert.throws(() => validateFuelReport('2026-10-02', []));
  assert.throws(() => validateFuelReport('2026-10-02', [{ name: 'Blank', petrol: '', diesel: '', premium: '' }]));
});
test('pump report reads are public: no credentials are checked', async () => {
  // No credentials and no storage key: a 503 (not 401) proves reads pass no auth gate.
  assert.equal((await onRequest({ request: request(undefined, ''), env: {} })).status, 503);
});
test('server rejects malformed reports and cross-origin writes', async () => {
  for (const body of [null, {}, { report_date: '2026-10-02', rows: [{ ...row, petrol: 16 }] }, { report_date: '2026-10-02', rows: [{ ...row, petrol: '-1' }] }]) assert.equal((await onRequest({ request: request(body), env })).status, 400);
  const req = request({ report_date: '2026-10-02', rows: [row] });
  req.headers.set('Origin', 'https://other.example');
  assert.equal((await onRequest({ request: req, env })).status, 403);
});
test('saving inserts a complete immutable edition using only the server key', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.match(url, /agzazndvqrencvgpovyh\.supabase\.co\/rest\/v1\/fuel_reports/);
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
      assert.deepEqual(JSON.parse(options.body), { report_date: '2026-10-02', prices: [{ name: 'Goil PLC', logo_url: row.logo_url, petrol: 16.64, diesel: 18.46, premium: null }] });
      return Response.json([{ id: 'saved-edition', ...JSON.parse(options.body) }]);
    };
    const response = await onRequest({ request: request({ report_date: '2026-10-02', rows: [row] }), env });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).id, 'saved-edition');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  } finally { globalThis.fetch = originalFetch; }
});

test('pagination preserves every OMC in order, ten per image', () => {
  for (const count of [1, 10, 11, 18, 20, 21, 500]) {
    const rows = validateFuelReport('2026-10-07', Array.from({ length: count }, (_, i) => ({ ...row, name: `OMC ${i + 1}` })), true);
    const pages = fuelReportPages(rows);
    assert.equal(pages.length, Math.ceil(count / 10));
    assert.deepEqual(pages.flat(), rows);
    assert.ok(pages.every(page => page.length <= 10));
  }
  assert.equal(DEFAULT_SUPPLIERS.length, 18);
  assert.equal(DEFAULT_SUPPLIERS[0], 'MISA Energy');
  assert.equal(DEFAULT_SUPPLIERS[17], 'Benab');
});
test('missing and untrusted logos block save and sharing, even on later pages', async () => {
  assert.throws(() => validateFuelReport('2026-10-07', [{ ...row, logo_url: undefined }], true), /logo/);
  assert.throws(() => validateFuelReport('2026-10-07', [{ ...row, logo_url: 'https://example.com/logo.png' }], true), /logo/);
  const rows = Array.from({ length: 11 }, (_, i) => ({ ...row, name: `OMC ${i}` }));
  const prices = validateFuelReport('2026-10-07', rows, true);
  delete prices[10].logo_url;
  assert.throws(() => fuelReportPages(prices), /OMC 10/);
  assert.equal((await onRequest({ request: request({ report_date: '2026-10-07', rows: [{ ...row, logo_url: '' }] }), env })).status, 400);
});

const putRequest = (body) => new Request('https://finance.fluidterra.com/api/fuel-reports', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const deleteRequest = (id) => new Request(`https://finance.fluidterra.com/api/fuel-reports${id === undefined ? '' : `?id=${encodeURIComponent(id)}`}`, { method: 'DELETE' });

test('updating overwrites one edition in place and reports a missing one', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.match(url, /fuel_reports\?id=eq\.edition-1$/);
      assert.equal(options.method, 'PATCH');
      assert.equal(options.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
      assert.deepEqual(JSON.parse(options.body), { report_date: '2026-10-03', prices: [{ name: 'Goil PLC', logo_url: row.logo_url, petrol: 17.0, diesel: 18.46, premium: null }] });
      return Response.json([{ id: 'edition-1', report_date: '2026-10-03' }]);
    };
    const response = await onRequest({ request: putRequest({ id: 'edition-1', report_date: '2026-10-03', rows: [{ ...row, petrol: '17.00' }] }), env });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id, 'edition-1');
  } finally { globalThis.fetch = originalFetch; }
});

test('updating needs an id, a valid report, and an existing edition', async () => {
  assert.equal((await onRequest({ request: putRequest({ report_date: '2026-10-03', rows: [row] }), env })).status, 400);
  assert.equal((await onRequest({ request: putRequest({ id: 'edition-1', report_date: '2026-10-03', rows: [{ ...row, petrol: '-1' }] }), env })).status, 400);
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json([]);
    assert.equal((await onRequest({ request: putRequest({ id: 'edition-gone', report_date: '2026-10-03', rows: [row] }), env })).status, 404);
  } finally { globalThis.fetch = originalFetch; }
});

test('deleting removes one edition and reports a missing one', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      calls += 1;
      assert.equal(options.method, 'DELETE');
      return Response.json(calls === 1 ? [{ id: 'edition-1' }] : []);
    };
    const deleted = await onRequest({ request: deleteRequest('edition-1'), env });
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), { deleted: true });
    assert.equal((await onRequest({ request: deleteRequest('edition-gone'), env })).status, 404);
    assert.equal((await onRequest({ request: deleteRequest(undefined), env })).status, 400);
  } finally { globalThis.fetch = originalFetch; }
});

test('OMC library reads openly while uploads validate name and image', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json([{ name: 'Shell', logo_url: '/fuel/shell.webp' }]);
    const response = await omcRequest({ request: request(undefined, ''), env });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{ name: 'Shell', logo_url: '/fuel/shell.webp' }]);
  } finally { globalThis.fetch = originalFetch; }
  assert.equal((await omcRequest({ request: request({ name: '', image: 'data:image/png;base64,AA==' }), env })).status, 400);
  assert.equal((await omcRequest({ request: request({ name: 'Shell', image: 'data:image/svg+xml,<svg/>' }), env })).status, 400);
  assert.equal((await omcRequest({ request: request({ name: 'Shell', image: 'data:image/png;base64,AA==' }), env })).status, 400);
});

test('OMC upload stores an immutable PNG and persists the company in the library', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      assert.equal(options.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
      return Response.json({});
    };
    const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII=';
    const response = await omcRequest({ request: request({ name: ' Shell ', image }), env });
    assert.equal(response.status, 201);
    const omc = await response.json();
    assert.equal(omc.name, 'Shell');
    assert.ok(omc.logo_url.startsWith(OMC_LOGO_BASE));
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /storage\/v1\/object\/omc-logos\/[a-f0-9-]+\.png$/);
    assert.match(calls[1].url, /fuel_omcs\?on_conflict=name_key/);
    assert.equal(JSON.parse(calls[1].options.body).logo_url, omc.logo_url);
  } finally { globalThis.fetch = originalFetch; }
});
