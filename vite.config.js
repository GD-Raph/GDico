import { defineConfig } from 'vite';

export default defineConfig({
  base: '/GDico/',
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
