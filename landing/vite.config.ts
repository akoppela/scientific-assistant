import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/scientific-assistant/',
  plugins: [tailwindcss()],
  resolve: {
    dedupe: ['echarts'],
  },
  server: {
    fs: {
      allow: ['.', '../infra/design-system'],
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        'design-system': 'design-system.html',
      },
    },
  },
});
