import {
  LICENSE_ENGINE_VERSION,
  LICENSE_SCHEMA_VERSION,
} from './constants.js';
import { LicenseValidator } from './LicenseValidator.js';
import type { ClientLicenseSnapshot, LicenseLifecycleStatus } from './types.js';

const STATUSES = new Set<LicenseLifecycleStatus>([
  'generated',
  'assigned',
  'sent',
  'activated',
  'suspended',
  'revoked',
  'expired',
  'invalid',
]);

export function serializeClientLicense(snapshot: ClientLicenseSnapshot): string {
  return JSON.stringify(snapshot);
}

export function deserializeClientLicense(serialized: string): ClientLicenseSnapshot {
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Payload licenza non valido.');
  }

  const value = parsed as Partial<ClientLicenseSnapshot>;
  if (
    typeof value.licenseCode !== 'string' ||
    !LicenseValidator.isValid(value.licenseCode) ||
    (value.edition !== 'standard' &&
      value.edition !== 'professional' &&
      value.edition !== 'enterprise') ||
    (value.term !== 'beta_60_days' &&
      value.term !== 'annual' &&
      value.term !== 'perpetual') ||
    !value.status ||
    !STATUSES.has(value.status) ||
    typeof value.owner !== 'string'
  ) {
    throw new Error('Campi licenza mancanti o non validi.');
  }

  return {
    licenseCode: LicenseValidator.normalize(value.licenseCode),
    edition: value.edition,
    term: value.term,
    status: value.status,
    owner: value.owner,
    customerId: typeof value.customerId === 'string' ? value.customerId : null,
    deviceId: typeof value.deviceId === 'string' ? value.deviceId : null,
    activatedAt: typeof value.activatedAt === 'string' ? value.activatedAt : null,
    expiresAt: typeof value.expiresAt === 'string' ? value.expiresAt : null,
    engineVersion: LICENSE_ENGINE_VERSION,
    schemaVersion: LICENSE_SCHEMA_VERSION,
  };
}
