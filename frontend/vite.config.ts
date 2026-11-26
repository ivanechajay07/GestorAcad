import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          // El backend de Docker se publica en 8094; puede cambiarse con VITE_BACKEND_URL.
          target: env.VITE_BACKEND_URL || 'http://localhost:8094',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
