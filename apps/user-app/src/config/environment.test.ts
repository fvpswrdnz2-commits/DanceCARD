import { describe, expect, it } from 'vitest';
import { loadUserAppEnvironment } from './environment';

describe('loadUserAppEnvironment', () => {
  it('loads complete public configuration', () => {
    expect(
      loadUserAppEnvironment({
        TARO_APP_API_BASE_URL: 'https://api.example.test',
        TARO_APP_CLOUDBASE_ENV_ID: 'test-environment',
        TARO_APP_ENVIRONMENT: 'test',
      }),
    ).toEqual({
      apiBaseUrl: 'https://api.example.test',
      cloudbaseEnvironmentId: 'test-environment',
      name: 'test',
    });
  });

  it('reports every missing required key clearly', () => {
    expect(() => loadUserAppEnvironment({})).toThrowError(
      /TARO_APP_ENVIRONMENT.*TARO_APP_API_BASE_URL.*TARO_APP_CLOUDBASE_ENV_ID/,
    );
  });
});
