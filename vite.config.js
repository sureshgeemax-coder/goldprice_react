import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const apiRoutes = {
  '/api/rates': '/api/rates.js',
  '/api/history': '/api/history.js',
  '/api/refresh': '/api/refresh.js'
};

function localApi() {
  return {
    name: 'local-gold-rates-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname;
        const modulePath = apiRoutes[pathname];
        if (!modulePath) return next();

        try {
          const { default: handler } = await server.ssrLoadModule(modulePath);
          await handler(request, response);
        } catch (error) {
          console.error('Local API request failed:', error);
          if (!response.headersSent) response.statusCode = 500;
          if (!response.writableEnded) response.end(JSON.stringify({ error: 'Local API request failed.' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(environment)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [react(), localApi()]
  };
});