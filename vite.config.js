import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills(), // Подключаем полифиллы
  ],
  resolve: {
    alias: {
      // Заменяем процесс и Buffer для браузера
      buffer: 'buffer',
      process: 'process/browser',
    },
  },
  define: {
    global: 'globalThis', // Устанавливаем global как globalThis для браузеров
  },
  build: {
    rollupOptions: {
      external: [], 
    },
  },
});
