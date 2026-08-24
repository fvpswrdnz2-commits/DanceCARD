import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    outputFile: '../../test-results/domain-unit.xml',
    reporters: ['default', 'junit'],
  },
});
