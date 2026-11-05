import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The backend the dev server forwards /api to. Inside the dev compose network it is http://code-quests-api:8080, the API's alias on app_net.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    host: true,
    strictPort: true,
    port: 3000,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: false,
        xfwd: true,
        // The API trusts X-Forwarded-For from this dev server, so the header must carry only the address of the browser connection. An inbound value is dropped, never extended, which keeps a client from choosing its own identity.
        configure: proxy => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const address = req.socket.remoteAddress;
            if (address) {
              proxyReq.setHeader('X-Forwarded-For', address);
            } else {
              proxyReq.removeHeader('X-Forwarded-For');
            }
          });
        },
      },
    },
  },
});
