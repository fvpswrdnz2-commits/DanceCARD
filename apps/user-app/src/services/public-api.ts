import { createCloudBaseClient } from '@dancecard/api-client';
import { userAppEnvironment } from '../config/runtime-environment';

const cloudBaseClient = createCloudBaseClient(userAppEnvironment.cloudbaseEnvironmentId);

export const authApi = cloudBaseClient.authApi;
export const publicApi = cloudBaseClient.publicApi;
export const sellerApi = cloudBaseClient.sellerApi;
