import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDashboard, calculateMovement, compareRates } from '../server/domain.js';

test('movement retains the published increase and decrease formats', () => {
  assert.equal(calculateMovement(180, 175), '▲ S$5.00 (+2.86%)');
  assert.equal(calculateMovement(174, 175), '▼ S$1.00 (-0.57%)');
  assert.equal(calculateMovement(175, 175), '→ No Change');
  assert.equal(calculateMovement(null, 175), null);
});

test('comparison uses the high-low spread and percentage versus the low', () => {
  const result = compareRates([
    { name: 'Lower', rates: { 916: 170 } },
    { name: 'Higher', rates: { 916: 175 } },
    { name: 'Unavailable', rates: { 916: null } }
  ], 916);

  assert.equal(result.difference, 5);
  assert.equal(result.percentageDifference, (5 / 170) * 100);
  assert.equal(result.higherRate, 'Higher');
  assert.equal(result.lowerRate, 'Lower');
});

test('dashboard uses the latest actual successful observation when no live result exists', () => {
  const dashboard = buildDashboard([
    { Source: 'Mustafa', Purity: 916, RatePerGram: 169, Status: 'Success', LastUpdated: '2026-10-01T10:00:00+08:00' },
    { Source: 'Mustafa', Purity: 916, RatePerGram: 170, Status: 'Success', LastUpdated: '2026-10-02T10:00:00+08:00' },
    { Source: 'Mustafa', Purity: 999, RatePerGram: 0, Status: 'Failed', LastUpdated: '2026-10-02T10:00:00+08:00' }
  ]);

  assert.equal(dashboard.shops[0].rates[916], 170);
  assert.equal(dashboard.shops[0].rates[999], null);
  assert.equal(dashboard.shops[0].status, 'Last available rate');
  assert.equal(dashboard.shops[0].movements[916], '▲ S$1.00 (+0.59%)');
});