import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,            // écoute sur 0.0.0.0 (obligatoire en Docker)
    port: 5173,            // même port que dans docker-compose
    strictPort: true,      // évite qu’il choisisse un autre port si 5173 est pris
    watch: {
      usePolling: true,    // utile quand Docker n’envoie pas les événements inotify
    },
    hmr: {
      host: 'localhost',   // adresse que ton navigateur utilise
      port: 5173,          // port WebSocket pour le hot reload
    },
  },
});
