import type { LicenseDocument } from '../licensing/types.js';

export type SignatureAlgorithm = 'Ed25519';
export type SignatureVersion = 1;

export const SIGNATURE_ALGORITHM_ED25519: SignatureAlgorithm = 'Ed25519';
export const SIGNATURE_VERSION_V1: SignatureVersion = 1;

export type CryptographicStatus =
  | 'VALID'
  | 'INVALID_SIGNATURE'
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_VERSION'
  | 'UNKNOWN_KEY';

export type BusinessValidityStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'SUSPENDED'
  | 'DEVICE_MISMATCH'
  | 'PRODUCT_MISMATCH';

export type ProductId = 'gestione-casa-ocr' | (string & {});

export interface SignedLicenseDocument {
  license: LicenseDocument;
  signature: string;
  signatureAlgorithm: SignatureAlgorithm;
  keyId: string;
  signatureVersion: SignatureVersion;
  canonicalPayload?: string;
}

export type ActivationStatus =
  | 'ACTIVATED'
  | 'ALREADY_ACTIVE'
  | 'LICENSE_NOT_FOUND'
  | 'LICENSE_REVOKED'
  | 'LICENSE_EXPIRED'
  | 'ACTIVATION_LIMIT_REACHED'
  | 'INVALID_DEVICE'
  | 'INVALID_PRODUCT'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR';

export interface ActivationRequest {
  licenseCode: string;
  deviceId: string;
  productId: ProductId;
  appVersion: string;
}

export interface ActivationResponse {
  status: ActivationStatus;
  signedLicense?: SignedLicenseDocument | null;
  activationId?: string | null;
  message?: string | null;
  serverTime: string;
  requestId: string;
}

export type LicenseValidationStatus =
  | 'VALID'
  | 'LICENSE_NOT_FOUND'
  | 'LICENSE_REVOKED'
  | 'LICENSE_EXPIRED'
  | 'DEVICE_MISMATCH'
  | 'INVALID_PRODUCT'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR';

export interface LicenseValidationRequest {
  licenseCode: string;
  deviceId: string;
  productId: ProductId;
  appVersion?: string | null;
}

export interface LicenseValidationResponse {
  status: LicenseValidationStatus;
  signedLicense?: SignedLicenseDocument | null;
  lastValidatedAt: string;
  serverTime: string;
  message?: string | null;
  requestId: string;
}

export type LicenseDeactivationStatus =
  | 'DEACTIVATED'
  | 'NOT_ACTIVE'
  | 'LICENSE_NOT_FOUND'
  | 'INVALID_DEVICE'
  | 'INVALID_PRODUCT'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR';

export interface LicenseDeactivationRequest {
  licenseCode: string;
  deviceId: string;
  productId: ProductId;
}

export interface LicenseDeactivationResponse {
  status: LicenseDeactivationStatus;
  deactivatedAt?: string | null;
  serverTime: string;
  message?: string | null;
  requestId: string;
}

export interface ActivationPolicy {
  policyId: string;
  licenseType: string;
  maxActivations: number;
  allowDeactivation: boolean;
}

export interface LicenseActivation {
  id: string;
  licenseId: string;
  deviceId: string;
  productId: ProductId;
  activatedAt: string;
  lastValidatedAt: string;
  deactivatedAt: string | null;
  status: 'active' | 'deactivated' | 'revoked';
}

export interface CanonicalLicensePayloadV1 {
  checksum: string;
  customerId: string | null;
  deviceId: string | null;
  engineVersion: number | string;
  expiresAt: string | null;
  generatedAt: string;
  id: string;
  licenseCode: string;
  licenseType: string;
  schemaVersion: number | string;
  status: string;
}

// Envelope Format Constants
export const ACTIVATION_REQUEST_FORMAT = 'gestione-casa-license-activation-request';
export const ACTIVATION_RESPONSE_FORMAT = 'gestione-casa-license-activation-response';
export const VALIDATION_REQUEST_FORMAT = 'gestione-casa-license-validation-request';
export const VALIDATION_RESPONSE_FORMAT = 'gestione-casa-license-validation-response';
export const DEACTIVATION_REQUEST_FORMAT = 'gestione-casa-license-deactivation-request';
export const DEACTIVATION_RESPONSE_FORMAT = 'gestione-casa-license-deactivation-response';

export const ACTIVATION_FORMAT_VERSION = 1;

export interface ActivationRequestEnvelope {
  format: typeof ACTIVATION_REQUEST_FORMAT;
  formatVersion: typeof ACTIVATION_FORMAT_VERSION;
  requestId: string;
  createdAt: string;
  request: ActivationRequest;
}

export interface ActivationResponseEnvelope {
  format: typeof ACTIVATION_RESPONSE_FORMAT;
  formatVersion: typeof ACTIVATION_FORMAT_VERSION;
  requestId: string;
  createdAt: string;
  response: ActivationResponse;
}

export interface LicenseValidationRequestEnvelope {
  format: typeof VALIDATION_REQUEST_FORMAT;
  formatVersion: typeof ACTIVATION_FORMAT_VERSION;
  requestId: string;
  createdAt: string;
  request: LicenseValidationRequest;
}

export interface LicenseValidationResponseEnvelope {
  format: typeof VALIDATION_RESPONSE_FORMAT;
  formatVersion: typeof ACTIVATION_FORMAT_VERSION;
  requestId: string;
  createdAt: string;
  response: LicenseValidationResponse;
}

export interface LicenseDeactivationRequestEnvelope {
  format: typeof DEACTIVATION_REQUEST_FORMAT;
  formatVersion: typeof ACTIVATION_FORMAT_VERSION;
  requestId: string;
  createdAt: string;
  request: LicenseDeactivationRequest;
}

export interface LicenseDeactivationResponseEnvelope {
  format: typeof DEACTIVATION_RESPONSE_FORMAT;
  formatVersion: typeof ACTIVATION_FORMAT_VERSION;
  requestId: string;
  createdAt: string;
  response: LicenseDeactivationResponse;
}
