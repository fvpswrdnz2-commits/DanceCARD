import { describe, expect, it } from 'vitest';
import { readRouteParam } from './route-params';

describe('readRouteParam', () => {
  it('decodes names passed through Taro H5 query strings', () => {
    expect(readRouteParam('%E4%B8%8A%E6%B5%B7')).toBe('上海');
    expect(readRouteParam('CASTER%E8%88%9E%E8%B9%88')).toBe('CASTER舞蹈');
  });

  it('returns safe fallbacks for absent or malformed values', () => {
    expect(readRouteParam(undefined, '舞室')).toBe('舞室');
    expect(readRouteParam('100%')).toBe('100%');
  });
});
