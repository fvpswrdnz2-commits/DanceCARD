export type AppEnvironmentName = 'development' | 'test' | 'production';

export interface AdminEnvironment {
  apiBaseUrl: string;
  cloudbaseEnvironmentId: string;
  name: AppEnvironmentName;
}

interface AdminEnvironmentSource {
  VITE_API_BASE_URL?: string;
  VITE_APP_ENVIRONMENT?: string;
  VITE_CLOUDBASE_ENV_ID?: string;
}

const VALID_ENVIRONMENTS: AppEnvironmentName[] = ['development', 'test', 'production'];

export function loadAdminEnvironment(source: AdminEnvironmentSource): AdminEnvironment {
  const requiredKeys: Array<keyof AdminEnvironmentSource> = [
    'VITE_APP_ENVIRONMENT',
    'VITE_API_BASE_URL',
    'VITE_CLOUDBASE_ENV_ID',
  ];
  const missingKeys = requiredKeys.filter((key) => !source[key]?.trim());

  if (missingKeys.length > 0) {
    throw new Error(
      `DanceCARD 管理端配置缺失：${missingKeys.join('、')}。请根据 apps/admin-web/.env.example 配置当前环境。`,
    );
  }

  const name = source.VITE_APP_ENVIRONMENT as AppEnvironmentName;
  if (!VALID_ENVIRONMENTS.includes(name)) {
    throw new Error(
      `DanceCARD 管理端环境无效：${source.VITE_APP_ENVIRONMENT}。仅支持 development、test、production。`,
    );
  }

  return {
    apiBaseUrl: source.VITE_API_BASE_URL as string,
    cloudbaseEnvironmentId: source.VITE_CLOUDBASE_ENV_ID as string,
    name,
  };
}
