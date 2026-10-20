import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { access } from 'node:fs/promises';
// Fuel report storage lives in the Fluid backend (fluid-backend/app/domains/editorial); these tests
// cover the browser-side validation, sorting and pagination shared by the site and the portal.

async function bundle(path) {
  const result = await build({ entryPoints: [path], bundle: true, write: false, platform: 'node', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const { validateFuelReport, averageFuelPrice, fuelReportPages, OMC_LOGO_BASE, DEFAULT_SUPPLIERS, DEFAULT_OMCS, blankFuelRow, mergeOmcLibrary, validOmcLogo, sortFuelRows, POPULAR_OMCS, FUEL_TYPES, fuelPriceChange, formatFuelChange, previousFuelReport, fuelRowChange, draftPrice, formatFuelDate, ordinalDay } = await bundle('src/lib/fuel-prices.ts');
// Logos the backend stores are served from its media endpoint; only those URLs (or bundled files) validate.
const row = { name: 'Goil PLC', logo_url: `https://api.finance.fluidterra.com/api/v1${OMC_LOGO_BASE}1234-abcd.png`, petrol: '16.64', diesel: '18.46' };
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
  for (const fuel of ['petrol', 'diesel']) {
    const rows = [['B', '9.5'], ['A', '9.50'], ['C', '100'], ['Missing', ''], ['Invalid', 'NaN']].map(([name, value]) => ({ ...blankFuelRow(name), [fuel]: value }));
    assert.deepEqual(sortFuelRows(rows, 'price-asc', fuel).map(row => row.name), ['A', 'B', 'C', 'Invalid', 'Missing']);
    assert.deepEqual(sortFuelRows(rows, 'price-desc', fuel).map(row => row.name), ['C', 'A', 'B', 'Invalid', 'Missing']);
  }
});

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
  const rows = validateFuelReport('2026-10-02', [row, { name: 'Other', petrol: '16.00', diesel: '' }]);
  assert.equal(averageFuelPrice(rows, 'petrol'), 16.32);
  assert.equal(averageFuelPrice(rows, 'diesel'), 18.46);
  assert.deepEqual(FUEL_TYPES, ['petrol', 'diesel']);
  assert.equal('premium' in rows[0], false);
});
test('invalid dates, duplicates, empty reports and invalid prices cannot be saved', () => {
  for (const price of ['-1', '0', 'NaN', '1.234', '1e2', '10000']) assert.throws(() => validateFuelReport('2026-10-02', [{ ...row, petrol: price }]));
  assert.throws(() => validateFuelReport('2026-02-30', [row]));
  assert.throws(() => validateFuelReport('2026-10-02', [row, { ...row, name: ' goil plc ' }]));
  assert.throws(() => validateFuelReport('2026-10-02', []));
  assert.throws(() => validateFuelReport('2026-10-02', [{ name: 'Blank', petrol: '', diesel: '' }]));
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
});


test('percentage change compares each OMC with the previous saved edition by name', () => {
  assert.equal(fuelPriceChange(16.64, 16.00), 4);
  assert.equal(fuelPriceChange(15.84, 16.00), -1);
  assert.equal(fuelPriceChange(16.643, 16.00), 4);
  assert.equal(fuelPriceChange(null, 16), null);
  assert.equal(fuelPriceChange(16, null), null);
  assert.equal(fuelPriceChange(16, 0), null);
  assert.equal(formatFuelChange(4), '+4.0%');
  assert.equal(formatFuelChange(-1.25), '−1.3%');
  assert.equal(formatFuelChange(0), '0.0%');
  assert.equal(formatFuelChange(null), '—');
  assert.equal(draftPrice(' 16.64 '), 16.64);
  assert.equal(draftPrice('1.234'), null);
  assert.equal(draftPrice(''), null);
  const edition = (id, report_date, created_at, prices) => ({ id, report_date, created_at, prices });
  const older = edition('a', '2026-10-01', '2026-10-01T08:00:00Z', [{ name: 'Goil', petrol: 16.00, diesel: 18.00 }, { name: 'Shell', petrol: 16.50, diesel: null }]);
  const sameDayEarly = edition('b', '2026-10-08', '2026-10-08T08:00:00Z', [{ name: 'goil ', petrol: 16.40, diesel: 18.90 }]);
  const latest = edition('c', '2026-10-08', '2026-10-08T12:00:00Z', [{ name: 'Goil', petrol: 16.64, diesel: 18.46 }, { name: 'Shell', petrol: 16.50, diesel: 19.00 }, { name: 'New OMC', petrol: 17.00, diesel: 19.00 }]);
  const reports = [latest, sameDayEarly, older];
  // The latest edition compares with the earlier save that day; a new draft compares with the latest; the first edition has nothing before it.
  assert.equal(previousFuelReport(reports, latest), sameDayEarly);
  assert.equal(previousFuelReport(reports, { id: null, report_date: '2026-10-09' }), latest);
  assert.equal(previousFuelReport(reports, sameDayEarly), older);
  assert.equal(previousFuelReport(reports, older), null);
  assert.equal(previousFuelReport(reports, { id: null, report_date: '2026-09-30' }), null);
  assert.deepEqual(fuelRowChange(latest.prices[0], sameDayEarly), { petrol: 1.5, diesel: -2.3 });
  assert.deepEqual(fuelRowChange(latest.prices[1], older), { petrol: 0, diesel: null });
  assert.deepEqual(fuelRowChange(latest.prices[2], older), { petrol: null, diesel: null });
  assert.deepEqual(fuelRowChange(latest.prices[0], null), { petrol: null, diesel: null });
});

test('report dates use ordinal days', () => {
  assert.equal(formatFuelDate('2026-10-27'), '27th October 2026');
  assert.equal(formatFuelDate('2026-10-01'), '1st October 2026');
  assert.equal(formatFuelDate('2026-10-02'), '2nd October 2026');
  assert.equal(formatFuelDate('2026-10-03'), '3rd October 2026');
  assert.equal(formatFuelDate('2026-10-31'), '31st October 2026');
  assert.deepEqual([11, 12, 13, 21, 22, 23, 111].map(ordinalDay), ['11th', '12th', '13th', '21st', '22nd', '23rd', '111th']);
});
