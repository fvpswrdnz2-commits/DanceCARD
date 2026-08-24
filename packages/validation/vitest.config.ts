import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    outputFile: '../../test-results/validation-unit.xml',
    reporters: ['default', 'junit'],
  },
});
