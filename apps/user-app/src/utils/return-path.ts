const MINE_PATH = '/pages/mine/index';
const PUBLISH_PATH = '/pages/publish/index';

export function safeReturnPath(value: string | undefined) {
  if (!value) return MINE_PATH;
  if (value === MINE_PATH || value.startsWith(`${PUBLISH_PATH}?`)) return value;
  return MINE_PATH;
}

export function isTabReturnPath(value: string) {
  return value === MINE_PATH;
}
