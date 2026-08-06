import {
  LICENSE_ENGINE_VERSION,
  LICENSE_SCHEMA_VERSION,
} from './constants.js';
import { LicenseValidator } from './LicenseValidator.js';
import type {
  ClientLicenseSnapshot,
  LicenseDocument,
  LicenseEdition,
  LicenseLifecycleStatus,
  LicenseTerm,
} from './types.js';

export interface LegacyAppLicenseRecord {
  licenseId: string;
  licenseType: 'beta_60_days' | 'lifetime_perpetual' | 'annual' | 'enterprise';
  activationDate: string | null;
  expirationDate: string | null;
  status:
    | 'not_activated'
    | 'beta_active'
    | 'beta_expired'
    | 'perpetual_active'
    | 'suspended'
    | 'invalid';
  owner: string;
}

export interface ManagerLicenseEntityLike {
  id: string;
  licenseCode: string;
  checksum?: string;
  licenseType: 'Standard' | 'Professional' | 'Enterprise';
  status: 'generated' | 'assigned' | 'sent' | 'activated' | 'revoked' | 'expired';
  customerId?: string | null;
  customerName?: string | null;
  deviceId?: string | null;
  sourceDeviceId?: string | null;
  generatedAt: string;
  assignedAt?: string | null;
  sentAt?: string | null;
  activatedAt?: string | null;
  revokedAt?: string | null;
  expiresAt?: string | null;
  expirationDate?: string | null;
}

function mapEdition(value: ManagerLicenseEntityLike['licenseType']): LicenseEdition {
  switch (value) {
    case 'Standard':
      return 'standard';
    case 'Professional':
      return 'professional';
    case 'Enterprise':
      return 'enterprise';
  }
}

function mapLegacyStatus(
  status: LegacyAppLicenseRecord['status'],
): LicenseLifecycleStatus {
  switch (status) {
    case 'not_activated':
      return 'generated';
    case 'beta_active':
    case 'perpetual_active':
      return 'activated';
    case 'beta_expired':
      return 'expired';
    case 'suspended':
      return 'suspended';
    case 'invalid':
      return 'invalid';
  }
}

function mapLegacyTerm(
  type: LegacyAppLicenseRecord['licenseType'],
): LicenseTerm {
  switch (type) {
    case 'beta_60_days':
      return 'beta_60_days';
    case 'annual':
      return 'annual';
    case 'lifetime_perpetual':
      return 'perpetual';
    case 'enterprise':
      return 'annual';
  }
}

export function legacyAppRecordToSnapshot(
  record: LegacyAppLicenseRecord,
  edition: LicenseEdition = 'standard',
): ClientLicenseSnapshot {
  return {
    licenseCode: LicenseValidator.normalize(record.licenseId),
    edition,
    term: mapLegacyTerm(record.licenseType),
    status: mapLegacyStatus(record.status),
    owner: record.owner,
    customerId: null,
    deviceId: null,
    activatedAt: record.activationDate,
    expiresAt: record.expirationDate,
    engineVersion: LICENSE_ENGINE_VERSION,
    schemaVersion: LICENSE_SCHEMA_VERSION,
  };
}

export function managerEntityToDocument(
  record: ManagerLicenseEntityLike,
  term: LicenseTerm,
): LicenseDocument {
  const normalizedCode = LicenseValidator.normalize(record.licenseCode);
  const parsed = LicenseValidator.parse(normalizedCode);

  return {
    id: record.id,
    licenseCode: normalizedCode,
    checksum: record.checksum ?? parsed.checksumChar,
    edition: mapEdition(record.licenseType),
    term,
    status: record.status,
    owner: record.customerName ?? '',
    customerId: record.customerId ?? null,
    deviceId: record.deviceId ?? record.sourceDeviceId ?? null,
    generatedAt: record.generatedAt,
    assignedAt: record.assignedAt ?? null,
    sentAt: record.sentAt ?? null,
    activatedAt: record.activatedAt ?? null,
    suspendedAt: null,
    revokedAt: record.revokedAt ?? null,
    expiresAt: record.expiresAt ?? record.expirationDate ?? null,
    engineVersion: LICENSE_ENGINE_VERSION,
    schemaVersion: LICENSE_SCHEMA_VERSION,
    metadata: {},
  };
}

export function documentToClientSnapshot(
  document: LicenseDocument,
): ClientLicenseSnapshot {
  return {
    licenseCode: document.licenseCode,
    edition: document.edition,
    term: document.term,
    status: document.status,
    owner: document.owner,
    customerId: document.customerId,
    deviceId: document.deviceId,
    activatedAt: document.activatedAt,
    expiresAt: document.expiresAt,
    engineVersion: document.engineVersion,
    schemaVersion: document.schemaVersion,
  };
}
