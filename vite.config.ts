import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function escapeForRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // load ALL env vars
  const PROXY_PATH = (env.VITE_OLLAMA_PROXY_PATH || '/ollama').replace(/\/+$/, ''); // strip trailing slash
  const TARGET = env.OLLAMA_INTERNAL_URL || 'http://ollama:11434';

  // Debug mapping at startup
  console.log(`[vite proxy] ${PROXY_PATH} -> ${TARGET}`);

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      watch: { usePolling: true },
      hmr: { host: 'localhost', port: 5173 },
      proxy: {
        // Browser calls /ollama/...; Vite forwards to http://ollama:11434/...
        [PROXY_PATH]: {
          target: TARGET,
          changeOrigin: true,
          // Strip the prefix so /ollama/api/... -> /api/...
          rewrite: (path) => path.replace(
            new RegExp(`^${escapeForRegExp(PROXY_PATH)}(?=/|$)`),
            ''
          ),
        },
      },
    },
    optimizeDeps: { exclude: ['lucide-react'] },
  };
});
