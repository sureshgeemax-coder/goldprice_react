export function requestUrl(request) {
  return new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
}

export function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

export function sendMethodNotAllowed(response, allowed) {
  response.setHeader('Allow', allowed.join(', '));
  sendJson(response, 405, { error: `Use ${allowed.join(' or ')} for this endpoint.` });
}