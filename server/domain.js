export const SHOPS = [
  { key: 'mustafa', name: 'Mustafa', source: 'Mustafa', title: 'MUSTAFA JEWELLERY', url: 'https://mustafajewellery.com/', color: '#b58b35' },
  { key: 'malabar', name: 'Malabar', source: 'Malabar', title: 'MALABAR GOLD & DIAMONDS', url: 'https://www.malabargoldanddiamonds.com/ae/stores/singapore', color: '#a64b42' },
  { key: 'grt', name: 'GRT Jewellers', source: 'GRT Jewellers', title: 'GRT JEWELLERS', url: 'https://www.grtjewels.com/asia/', color: '#176b66' },
  { key: 'joyalukkas', name: 'Joyalukkas', source: 'Joyalukkas', title: 'JOYALUKKAS', url: 'https://www.joyalukkas.com/sg/goldrate', color: '#496c8c' }
];

export const PURITIES = [916, 999];

export function calculateMovement(current, previous) {
  if (current == null || previous == null) return null;

  const difference = Number(current) - Number(previous);
  if (difference === 0) return '→ No Change';

  const percentage = previous === 0 ? 0 : (difference / Number(previous)) * 100;
  const amount = Math.abs(difference).toFixed(2);
  const percent = percentage > 0 ? `+${percentage.toFixed(2)}` : percentage.toFixed(2);
  return difference > 0
    ? `▲ S$${amount} (+${percent.replace(/^\+/, '')}%)`
    : `▼ S$${amount} (${percent}%)`;
}

export function compareRates(shops, purity) {
  const available = shops
    .map((shop) => ({ name: shop.name, value: shop.rates[purity] }))
    .filter((rate) => Number.isFinite(rate.value) && rate.value > 0)
    .sort((left, right) => left.value - right.value);

  if (available.length < 2) {
    return { difference: null, percentageDifference: null, higherRate: null, lowerRate: null };
  }

  const lowest = available[0];
  const highest = available.at(-1);
  const difference = highest.value - lowest.value;

  return {
    difference,
    percentageDifference: lowest.value === 0 ? null : (difference / lowest.value) * 100,
    higherRate: highest.name,
    lowerRate: lowest.name
  };
}

export function getTimestamp(value) {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function latestSuccessfulRate(history, source, purity, before = Infinity) {
  return history
    .filter((row) => row.Source === source && Number(row.Purity) === purity && row.Status === 'Success' && getTimestamp(row.LastUpdated) < before)
    .sort((left, right) => getTimestamp(right.LastUpdated) - getTimestamp(left.LastUpdated))[0] || null;
}

export function buildDashboard(history, liveResults = [], lastRefresh = null) {
  const shops = SHOPS.map((shop) => {
    const result = liveResults.find((item) => item.key === shop.key);
    const rates = {};
    const movements = {};
    const latestRows = {};

    for (const purity of PURITIES) {
      const latest = latestSuccessfulRate(history, shop.source, purity);
      latestRows[purity] = latest;
      const before = result?.success ? getTimestamp(result.lastUpdated) : getTimestamp(latest?.LastUpdated);
      const previous = latestSuccessfulRate(history, shop.source, purity, before);
      const currentValue = result?.success ? result[`rate${purity}`] : latest?.RatePerGram;

      rates[purity] = currentValue == null ? null : Number(currentValue);
      movements[purity] = calculateMovement(currentValue, previous?.RatePerGram);
    }

    const timestamps = PURITIES.map((purity) => latestRows[purity]?.LastUpdated).filter(Boolean);
    const fallbackUpdated = timestamps.sort((left, right) => getTimestamp(right) - getTimestamp(left))[0] || null;
    const hasRate = PURITIES.some((purity) => rates[purity] != null);

    return {
      ...shop,
      rates,
      movements,
      status: result?.success ? 'Available' : hasRate ? 'Last available rate' : 'Failed to retrieve',
      errorMessage: result?.errorMessage || null,
      updated: result?.success ? result.lastUpdated : fallbackUpdated
    };
  });

  return {
    shops,
    comparisons: Object.fromEntries(PURITIES.map((purity) => [purity, compareRates(shops, purity)])),
    lastRefresh
  };
}