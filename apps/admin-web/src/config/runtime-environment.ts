import { loadAdminEnvironment } from './environment';

export const adminEnvironment = loadAdminEnvironment({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT,
  VITE_CLOUDBASE_ENV_ID: import.meta.env.VITE_CLOUDBASE_ENV_ID,
});
