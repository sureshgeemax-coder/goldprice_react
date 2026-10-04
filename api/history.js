import { getHistory } from '../server/dashboard-service.js';
import { requestUrl, sendJson, sendMethodNotAllowed } from '../server/http.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return sendMethodNotAllowed(response, ['GET']);

  try {
    const query = requestUrl(request).searchParams;
    const rows = await getHistory({
      filter: query.get('filter') || '7',
      source: query.get('source') || '',
      purity: query.get('purity') || '',
      fromDate: query.get('fromDate') || '',
      toDate: query.get('toDate') || ''
    });
    return sendJson(response, 200, rows);
  } catch (error) {
    console.error('Unable to load gold price history:', error);
    return sendJson(response, 500, { error: 'Gold price history could not be loaded.' });
  }
}

