import { defineConfig } from 'vite';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikVite } from '@builder.io/qwik/optimizer';

export default defineConfig({
  plugins: [qwikCity(), qwikVite()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3014',
        changeOrigin: true,
      },
    },
  },
});
