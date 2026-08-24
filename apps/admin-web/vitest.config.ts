import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    outputFile: '../../test-results/admin-web-unit.xml',
    reporters: ['default', 'junit'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
