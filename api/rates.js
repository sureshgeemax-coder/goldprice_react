import { getDashboard } from '../server/dashboard-service.js';
import { requestUrl, sendJson, sendMethodNotAllowed } from '../server/http.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return sendMethodNotAllowed(response, ['GET']);

  try {
    const dashboard = await getDashboard();
    return sendJson(response, 200, dashboard);
  } catch (error) {
    console.error('Unable to load gold rate history:', error);
    return sendJson(response, 500, { error: 'Gold rate history could not be loaded.' });
  }
}