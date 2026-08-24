import { describe, expect, it } from 'vitest';
import { isTabReturnPath, safeReturnPath } from './return-path';

describe('safeReturnPath', () => {
  it('allows only approved internal seller destinations', () => {
    expect(safeReturnPath('/pages/mine/index')).toBe('/pages/mine/index');
    expect(safeReturnPath('/pages/publish/index?studioId=abc')).toBe(
      '/pages/publish/index?studioId=abc',
    );
  });

  it('rejects external and unexpected destinations', () => {
    expect(safeReturnPath('https://example.com')).toBe('/pages/mine/index');
    expect(safeReturnPath('//example.com')).toBe('/pages/mine/index');
    expect(safeReturnPath('/pages/index/index')).toBe('/pages/mine/index');
  });
});

describe('isTabReturnPath', () => {
  it('recognizes the mine tab', () => {
    expect(isTabReturnPath('/pages/mine/index')).toBe(true);
    expect(isTabReturnPath('/pages/publish/index?studioId=abc')).toBe(false);
  });
});
