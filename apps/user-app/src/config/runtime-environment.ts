import { loadUserAppEnvironment } from './environment';

export const userAppEnvironment = loadUserAppEnvironment({
  TARO_APP_API_BASE_URL: process.env.TARO_APP_API_BASE_URL,
  TARO_APP_CLOUDBASE_ENV_ID: process.env.TARO_APP_CLOUDBASE_ENV_ID,
  TARO_APP_ENVIRONMENT: process.env.TARO_APP_ENVIRONMENT,
});
