import { createCloudBaseClient } from '@dancecard/api-client';
import { adminEnvironment } from '../config/runtime-environment';

const client = createCloudBaseClient(adminEnvironment.cloudbaseEnvironmentId);

export const adminApi = client.adminApi;
export const authApi = client.authApi;
