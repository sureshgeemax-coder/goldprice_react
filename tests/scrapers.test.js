import assert from 'node:assert/strict';
import test from 'node:test';
import { SHOPS } from '../server/domain.js';
import { scrapeShop } from '../server/scrapers.js';

test('Malabar reads Singapore rates and update time without fixed cell IDs', async (t) => {
  const html = `
    <table class="table_othercountry">
      <tr><td>Qatar</td><td>460.50 QAR</td><td>499.50 QAR</td></tr>
      <tr><td colspan="3" id="updatedtime_88">03/10/2026 12:41 PM</td></tr>
      <tr><td>Singapore</td><td id="price22kt_90">164.70 SGD</td><td id="price24kt_90">180.70 SGD</td></tr>
      <tr><td colspan="3" id="updatedtime_91">03/10/2026 6:28 PM</td></tr>
    </table>
  `;
  const previousUrl = process.env.MALABAR_GOLD_URL;
  process.env.MALABAR_GOLD_URL = 'https://malabar.test/singapore';
  t.after(() => {
    if (previousUrl === undefined) delete process.env.MALABAR_GOLD_URL;
    else process.env.MALABAR_GOLD_URL = previousUrl;
  });
  t.mock.method(globalThis, 'fetch', async () => new Response(html, { status: 200 }));

  const result = await scrapeShop(SHOPS.find((shop) => shop.key === 'malabar'));

  assert.equal(result.success, true, result.errorMessage);
  assert.equal(result.rate916, 164.7);
  assert.equal(result.rate999, 180.7);
  assert.equal(result.lastUpdated, '2026-10-03T18:28:00+08:00');
});