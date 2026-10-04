import { refreshDashboard } from '../server/dashboard-service.js';
import { sendJson, sendMethodNotAllowed } from '../server/http.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendMethodNotAllowed(response, ['POST']);

  try {
    const dashboard = await refreshDashboard();
    return sendJson(response, 200, { success: true, data: dashboard });
  } catch (error) {
    console.error('Gold rate refresh failed:', error);
    const status = error.message.includes('BLOB_READ_WRITE_TOKEN') || error.message.includes('Vercel Blob') ? 503 : 500;
    return sendJson(response, status, { success: false, message: error.message || 'Gold rate refresh failed.' });
  }
}