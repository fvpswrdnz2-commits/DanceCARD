import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    outputFile: '../../test-results/user-app-unit.xml',
    reporters: ['default', 'junit'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
