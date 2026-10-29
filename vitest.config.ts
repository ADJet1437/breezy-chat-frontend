import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * Tests run in their own config rather than inside vite.config.ts, which
 * carries dev-server and build concerns this does not need.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    // jsdom, not a browser: these are domain tests. Anything that needs real
    // layout, real pointer events or a real iframe does not belong here.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
