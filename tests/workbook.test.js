import assert from 'node:assert/strict';
import test from 'node:test';
import { readWorkbookHistory } from '../server/storage.js';

test('imports the existing GoldRates worksheet without inventing observations', async () => {
  const rows = await readWorkbookHistory();
  const sources = Object.groupBy(rows, (row) => row.Source);

  assert.equal(rows.length, 490);
  assert.deepEqual(Object.fromEntries(Object.entries(sources).map(([source, items]) => [source, items.length])), {
    Mustafa: 248,
    Malabar: 4,
    'GRT Jewellers': 234,
    Joyalukkas: 4
  });
  assert.ok(rows.every((row) => row.Status === 'Success' && row.RatePerGram > 0));
  assert.equal(rows[0].Date, '2026-09-27');
  assert.match(rows[0].LastUpdated, /^2026-09-27T13:00:06\+08:00$/);
});