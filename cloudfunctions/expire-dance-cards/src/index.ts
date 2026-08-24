import cloudbase from '@cloudbase/js-sdk';

interface TimerEvent {
  Message?: string;
  Time?: string;
  TriggerName?: string;
  Type?: string;
}

export async function main(event: TimerEvent = {}) {
  const environmentId = process.env.TCB_ENV ?? process.env.CLOUDBASE_ENV_ID;
  const maintenanceToken = process.env.DANCECARD_MAINTENANCE_TOKEN;

  if (!environmentId) {
    throw new Error('Missing TCB_ENV or CLOUDBASE_ENV_ID for expiration task');
  }

  if (!maintenanceToken) {
    throw new Error('Missing DANCECARD_MAINTENANCE_TOKEN for expiration task');
  }

  const app = cloudbase.init({ env: environmentId });
  const result = await app.rdb().rpc('expire_dance_cards', {
    maintenance_token: maintenanceToken,
    reference_time: new Date().toISOString(),
  });

  if (result.error) {
    throw new Error(`Expiration RPC failed: ${result.error.message}`);
  }

  const firstValue = Array.isArray(result.data) ? result.data[0] : result.data;
  const rawAffected =
    typeof firstValue === 'object' && firstValue !== null
      ? Object.values(firstValue)[0]
      : firstValue;
  const affected = Number(rawAffected ?? 0);

  if (!Number.isFinite(affected)) {
    throw new Error('Expiration RPC returned an invalid affected-row count');
  }

  return {
    affected,
    ok: true,
    trigger: event.TriggerName ?? 'manual',
  };
}
