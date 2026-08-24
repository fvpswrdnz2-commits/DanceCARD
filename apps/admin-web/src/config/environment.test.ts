import { describe, expect, it } from 'vitest';
import { loadAdminEnvironment } from './environment';

describe('loadAdminEnvironment', () => {
  it('loads complete public configuration', () => {
    expect(
      loadAdminEnvironment({
        VITE_API_BASE_URL: 'https://api.example.test',
        VITE_APP_ENVIRONMENT: 'test',
        VITE_CLOUDBASE_ENV_ID: 'test-environment',
      }),
    ).toEqual({
      apiBaseUrl: 'https://api.example.test',
      cloudbaseEnvironmentId: 'test-environment',
      name: 'test',
    });
  });

  it('reports every missing required key clearly', () => {
    expect(() => loadAdminEnvironment({})).toThrowError(
      /VITE_APP_ENVIRONMENT.*VITE_API_BASE_URL.*VITE_CLOUDBASE_ENV_ID/,
    );
  });
});
