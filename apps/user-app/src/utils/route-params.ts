export function readRouteParam(value: string | undefined, fallback = '') {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}
