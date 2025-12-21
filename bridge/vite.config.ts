import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  clearScreen: false,
  publicDir: 'public',
  resolve: {
    dedupe: ['echarts'],
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['.', '../infra/design-system'],
    },
    watch: {
      ignored: ['**/platform/**', '**/*.elm'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: 'dist',
    rollupOptions: {
      external: id => id.endsWith('.elm'),
    },
  },
});
