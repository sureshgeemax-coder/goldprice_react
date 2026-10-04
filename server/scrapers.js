import { SHOPS } from './domain.js';
import { getSingaporeTimestamp, parsePublishedTimestamp } from './time.js';

const requestTimeout = 25000;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function configuredUrl(variable, fallback) {
  return process.env[variable] || fallback;
}

async function requestText(url, accept, extraHeaders = {}) {
  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent, Accept: accept, 'Accept-Language': 'en-US,en;q=0.5', ...extraHeaders },
    signal: AbortSignal.timeout(requestTimeout)
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
  return response.text();
}

function extractMustafaRate(html, label) {
  const marker = new RegExp(`${label}\\s*(?:Jewellery)?`, 'i').exec(html);
  if (!marker) return null;
  const nearby = html.slice(marker.index + marker[0].length + 1, marker.index + marker[0].length + 201);
  const match = /([\d]{2,3}\.\d{2})/.exec(nearby);
  const rate = match ? Number(match[1]) : NaN;
  return rate > 0 && rate < 10000 ? rate : null;
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)));
}

function parseRate(value) {
  const rate = Number(String(value || '').replace(/,/g, '').trim());
  return rate > 0 && rate < 10000 ? rate : null;
}

async function scrapeMustafa(shop) {
  const url = configuredUrl('MUSTAFA_GOLD_URL', shop.url);
  const html = await requestText(url, 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
  const rate916 = extractMustafaRate(html, '22k[-\\s]?916');
  const rate999 = extractMustafaRate(html, '24k[-\\s]?999');
  const updatedMatch = /Last Updated on[:\s]*(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}\s*(?:AM|PM)?)\s*(?:\(SGT\))?/i.exec(html);
  const updated = updatedMatch ? parsePublishedTimestamp(updatedMatch[1], 'dmy') : null;
  if (rate916 == null || rate999 == null) throw new Error('Unable to parse gold rates from Mustafa page.');
  return { rate916, rate999, updated: updated || getSingaporeTimestamp(), url };
}

async function scrapeMalabar(shop) {
  const url = configuredUrl('MALABAR_GOLD_URL', shop.url);
  const html = await requestText(url, 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  const extract = (cellId) => {
    const pattern = new RegExp(`<td\\b(?=[^>]*\\bid\\s*=\\s*["']${cellId}["'])[^>]*>(.*?)<\\/td>`, 'is');
    const cell = pattern.exec(html);
    const value = cell && /([\d,]+(?:\.\d+)?)/.exec(cell[1]);
    return value ? parseRate(value[1]) : null;
  };
  const rate916 = extract('price22kt_85');
  const rate999 = extract('price24kt_85');
  const updatedMatch = /<[^>]*\bid\s*=\s*["']updatedtime_85["'][^>]*>(.*?)<\/[^>]+>/is.exec(html);
  const updatedText = updatedMatch ? updatedMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  const updated = parsePublishedTimestamp(updatedText, 'dmY');
  if (rate916 == null || rate999 == null) throw new Error('Unable to parse Singapore gold rates from Malabar page.');
  return { rate916, rate999, updated: updated || getSingaporeTimestamp(), url };
}

async function scrapeGRT(shop) {
  const url = configuredUrl('GRT_GOLD_URL', shop.url);
  const html = await requestText(url, 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  const text = decodeHtml(html);
  const extract = (purity) => {
    const pattern = new RegExp(`GOLD\\s*-\\s*${purity}\\s*KT\\s*-\\s*1\\s*\\.?\\s*g\\s*-\\s*SGD\\s*\\$?\\s*([\\d,]+(?:\\.\\d{1,2})?)`, 'i');
    const match = pattern.exec(text);
    return match ? parseRate(match[1]) : null;
  };
  const rate916 = extract(22);
  const rate999 = extract(24);
  if (rate916 == null || rate999 == null) throw new Error("Unable to parse 22KT and 24KT rates from the GRT Today's Rate menu.");
  return { rate916, rate999, updated: getSingaporeTimestamp(), url };
}

async function scrapeJoyalukkas(shop) {
  const url = configuredUrl('JOYALUKKAS_GOLD_URL', 'https://www.joyalukkas.com/graphql');
  const query = 'query getgoldrates{getgoldrates{Status metal_rate_time Data{GOLD_22KT_RATE GOLD_24KT_RATE}}}';
  const endpoint = new URL(url);
  endpoint.searchParams.set('query', query);
  endpoint.searchParams.set('operationName', 'getgoldrates');
  endpoint.searchParams.set('variables', '{}');
  const text = await requestText(endpoint.toString(), 'application/json', { Store: 'sg' });
  const payload = JSON.parse(text);
  const data = payload.data?.getgoldrates;
  const rates = data?.Data?.[0];
  const rate916 = parseRate(rates?.GOLD_22KT_RATE);
  const rate999 = parseRate(rates?.GOLD_24KT_RATE);
  const updated = parsePublishedTimestamp(data?.metal_rate_time, 'iso');
  if (rate916 == null || rate999 == null) throw new Error('Unable to parse Singapore 22KT and 24KT rates from Joyalukkas.');
  return { rate916, rate999, updated: updated || getSingaporeTimestamp(), url: shop.url };
}

const scrapers = {
  mustafa: scrapeMustafa,
  malabar: scrapeMalabar,
  grt: scrapeGRT,
  joyalukkas: scrapeJoyalukkas
};

export async function scrapeShop(shop) {
  try {
    const result = await scrapers[shop.key](shop);
    return {
      key: shop.key,
      success: true,
      rate916: result.rate916,
      rate999: result.rate999,
      lastUpdated: result.updated,
      sourceUrl: result.url,
      errorMessage: null
    };
  } catch (error) {
    return { key: shop.key, success: false, errorMessage: `Failed to retrieve ${shop.name} rates: ${error.message}` };
  }
}

export function scrapeAllShops() {
  return Promise.all(SHOPS.map(scrapeShop));
}