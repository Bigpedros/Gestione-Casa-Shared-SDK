import type {
  LICENSE_ENGINE_VERSION,
  LICENSE_SCHEMA_VERSION,
} from './constants.js';

export type LicenseEdition = 'standard' | 'professional' | 'enterprise';
export type LicenseTerm = 'beta_60_days' | 'annual' | 'perpetual';

export type LicenseLifecycleStatus =
  | 'generated'
  | 'assigned'
  | 'sent'
  | 'activated'
  | 'suspended'
  | 'revoked'
  | 'expired'
  | 'invalid';

export type LicenseEngineVersion = typeof LICENSE_ENGINE_VERSION;
export type LicenseSchemaVersion = typeof LICENSE_SCHEMA_VERSION;

export interface LicenseDocument {
  id: string;
  licenseCode: string;
  checksum: string;
  edition: LicenseEdition;
  term: LicenseTerm;
  status: LicenseLifecycleStatus;
  owner: string;
  customerId: string | null;
  deviceId: string | null;
  generatedAt: string;
  assignedAt: string | null;
  sentAt: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  engineVersion: LicenseEngineVersion;
  schemaVersion: LicenseSchemaVersion;
  metadata: Record<string, unknown>;
}

export interface ClientLicenseSnapshot {
  licenseCode: string;
  edition: LicenseEdition;
  term: LicenseTerm;
  status: LicenseLifecycleStatus;
  owner: string;
  customerId: string | null;
  deviceId: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  engineVersion: LicenseEngineVersion;
  schemaVersion: LicenseSchemaVersion;
}

export interface LicenseParseResult {
  rawInput: string;
  normalizedCode: string;
  isFormatValid: boolean;
  isChecksumValid: boolean;
  isValid: boolean;
  groups: string[];
  payloadBase: string;
  checksumChar: string;
  error?: string;
}

export interface LicenseEvaluationResult {
  isCodeValid: boolean;
  isLifecycleValid: boolean;
  isUsable: boolean;
  effectiveStatus: LicenseLifecycleStatus;
  remainingDays: number | null;
  reason?: string;
}

export interface LicenseCodeRandomSource {
  fill(target: Uint32Array): void;
}

export interface DigitalSignatureEnvelope {
  algorithm: 'Ed25519';
  keyId: string;
  payload: string;
  signatureBase64: string;
}

export interface DigitalSignatureVerifier {
  verify(envelope: DigitalSignatureEnvelope): Promise<boolean>;
}
