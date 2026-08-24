export type AppEnvironmentName = 'development' | 'test' | 'production';

export interface UserAppEnvironment {
  apiBaseUrl: string;
  cloudbaseEnvironmentId: string;
  name: AppEnvironmentName;
}

interface UserAppEnvironmentSource {
  TARO_APP_API_BASE_URL?: string;
  TARO_APP_CLOUDBASE_ENV_ID?: string;
  TARO_APP_ENVIRONMENT?: string;
}

const VALID_ENVIRONMENTS: AppEnvironmentName[] = ['development', 'test', 'production'];

export function loadUserAppEnvironment(source: UserAppEnvironmentSource): UserAppEnvironment {
  const requiredKeys: Array<keyof UserAppEnvironmentSource> = [
    'TARO_APP_ENVIRONMENT',
    'TARO_APP_API_BASE_URL',
    'TARO_APP_CLOUDBASE_ENV_ID',
  ];
  const missingKeys = requiredKeys.filter((key) => !source[key]?.trim());

  if (missingKeys.length > 0) {
    throw new Error(
      `DanceCARD 用户端配置缺失：${missingKeys.join('、')}。请根据 apps/user-app/.env.example 配置当前环境。`,
    );
  }

  const name = source.TARO_APP_ENVIRONMENT as AppEnvironmentName;
  if (!VALID_ENVIRONMENTS.includes(name)) {
    throw new Error(
      `DanceCARD 用户端环境无效：${source.TARO_APP_ENVIRONMENT}。仅支持 development、test、production。`,
    );
  }

  return {
    apiBaseUrl: source.TARO_APP_API_BASE_URL as string,
    cloudbaseEnvironmentId: source.TARO_APP_CLOUDBASE_ENV_ID as string,
    name,
  };
}
