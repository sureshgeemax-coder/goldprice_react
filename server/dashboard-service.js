import { buildDashboard, PURITIES, SHOPS } from './domain.js';
import { scrapeAllShops } from './scrapers.js';
import { readHistory, writeHistory } from './storage.js';
import { dateDaysAgo, getSingaporeParts, getSingaporeTimestamp } from './time.js';

let refreshInFlight = null;

export async function getDashboard() {
  const history = await readHistory();
  return buildDashboard(history);
}

export function refreshDashboard() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh() {
  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Persistent history is not configured. Add a Vercel Blob store before refreshing live rates.');
  }

  const history = await readHistory();
  const results = await scrapeAllShops();
  const now = new Date();
  const nowParts = getSingaporeParts(now);
  const newRows = [];

  for (const shop of SHOPS) {
    const result = results.find((item) => item.key === shop.key);
    if (!result?.success) continue;

    for (const purity of PURITIES) {
      const rate = result[`rate${purity}`];
      const duplicate = history.some((row) =>
        row.Source === shop.source &&
        Number(row.Purity) === purity &&
        Number(row.RatePerGram) === rate &&
        row.Date === nowParts.date &&
        row.LastUpdated === result.lastUpdated
      );
      if (duplicate) continue;

      newRows.push({
        Date: nowParts.date,
        Time: nowParts.time,
        Source: shop.source,
        GoldType: 'Jewellery',
        Purity: purity,
        RatePerGram: rate,
        Currency: 'SGD',
        SourceUrl: result.sourceUrl,
        LastUpdated: result.lastUpdated || getSingaporeTimestamp(now),
        Status: 'Success',
        ErrorMessage: ''
      });
    }
  }

  const updatedHistory = newRows.length ? [...history, ...newRows] : history;
  if (newRows.length) await writeHistory(updatedHistory);
  return buildDashboard(updatedHistory, results, getSingaporeTimestamp(now));
}

export async function getHistory({ filter = '7', source = '', purity = '', fromDate = '', toDate = '' } = {}) {
  const history = await readHistory();
  const today = getSingaporeParts().date;
  const days = { '7': 7, '30': 30, '90': 90, '180': 180, '365': 365 }[filter];
  const startDate = fromDate || (filter === 'today' ? today : days ? dateDaysAgo(today, days) : '');
  const endDate = toDate || today;
  const normalizedSource = source.trim().toLowerCase();
  const requestedPurity = purity ? Number(purity) : null;

  return history
    .filter((row) => !startDate || row.Date >= startDate)
    .filter((row) => !endDate || row.Date <= endDate)
    .filter((row) => !requestedPurity || Number(row.Purity) === requestedPurity)
    .filter((row) => !normalizedSource || row.Source.toLowerCase() === normalizedSource)
    .sort((left, right) => new Date(left.LastUpdated) - new Date(right.LastUpdated));
}