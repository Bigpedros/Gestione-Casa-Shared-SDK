import { isValidIsoDate } from '../common/utils.js';
import type { ValidationIssue, ValidationResult } from '../common/types.js';
import { LicenseValidator } from '../licensing/LicenseValidator.js';
import type {
  ActivationRequest,
  ActivationResponse,
  ActivationStatus,
  LicenseDeactivationRequest,
  LicenseDeactivationResponse,
  LicenseDeactivationStatus,
  LicenseValidationRequest,
  LicenseValidationResponse,
  LicenseValidationStatus,
  SignedLicenseDocument,
} from './types.js';

const ACTIVATION_STATUSES: Set<ActivationStatus> = new Set([
  'ACTIVATED',
  'ALREADY_ACTIVE',
  'LICENSE_NOT_FOUND',
  'LICENSE_REVOKED',
  'LICENSE_EXPIRED',
  'ACTIVATION_LIMIT_REACHED',
  'INVALID_DEVICE',
  'INVALID_PRODUCT',
  'INVALID_REQUEST',
  'SERVER_ERROR',
]);

const VALIDATION_STATUSES: Set<LicenseValidationStatus> = new Set([
  'VALID',
  'LICENSE_NOT_FOUND',
  'LICENSE_REVOKED',
  'LICENSE_EXPIRED',
  'DEVICE_MISMATCH',
  'INVALID_PRODUCT',
  'INVALID_REQUEST',
  'SERVER_ERROR',
]);

const DEACTIVATION_STATUSES: Set<LicenseDeactivationStatus> = new Set([
  'DEACTIVATED',
  'NOT_ACTIVE',
  'LICENSE_NOT_FOUND',
  'INVALID_DEVICE',
  'INVALID_PRODUCT',
  'INVALID_REQUEST',
  'SERVER_ERROR',
]);

const PROHIBITED_CLIENT_FIELDS = [
  'maxActivations',
  'activationCount',
  'privateKey',
  'signature',
  'customerId',
  'licenseStatus',
  'secret',
  'token',
  'password',
  'adminFields',
];

export class ActivationValidator {
  /**
   * Validates deviceId string.
   */
  static validateDeviceId(deviceId: unknown): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (typeof deviceId !== 'string' || deviceId.trim().length === 0) {
      issues.push({
        field: 'deviceId',
        code: 'INVALID_DEVICE',
        message: 'deviceId deve essere una stringa non vuota',
      });
    } else if (deviceId.length > 256) {
      issues.push({
        field: 'deviceId',
        code: 'INVALID_DEVICE',
        message: 'deviceId non può superare 256 caratteri',
      });
    }
    return issues;
  }

  /**
   * Validates productId string.
   */
  static validateProductId(productId: unknown): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (typeof productId !== 'string' || productId.trim().length === 0) {
      issues.push({
        field: 'productId',
        code: 'INVALID_PRODUCT',
        message: 'productId deve essere una stringa non vuota',
      });
    } else if (productId.length > 128) {
      issues.push({
        field: 'productId',
        code: 'INVALID_PRODUCT',
        message: 'productId non può superare 128 caratteri',
      });
    }
    return issues;
  }

  /**
   * Validates a SignedLicenseDocument structure.
   */
  static validateSignedLicenseDocument(
    input: unknown
  ): ValidationResult<SignedLicenseDocument> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [
          {
            field: 'signedLicense',
            code: 'INVALID_FORMAT',
            message: 'SignedLicenseDocument deve essere un oggetto non nullo',
          },
        ],
      };
    }

    const raw = input as Record<string, unknown>;

    if (raw.signatureAlgorithm !== 'Ed25519') {
      issues.push({
        field: 'signatureAlgorithm',
        code: 'INVALID_FORMAT',
        message: 'signatureAlgorithm deve essere "Ed25519"',
      });
    }

    if (raw.signatureVersion !== 1) {
      issues.push({
        field: 'signatureVersion',
        code: 'UNSUPPORTED_VERSION',
        message: 'signatureVersion non supportata: attesa versione 1',
      });
    }

    if (typeof raw.keyId !== 'string' || raw.keyId.trim().length === 0) {
      issues.push({
        field: 'keyId',
        code: 'INVALID_FORMAT',
        message: 'keyId deve essere una stringa non vuota',
      });
    }

    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (
      typeof raw.signature !== 'string' ||
      raw.signature.trim().length === 0 ||
      !base64Regex.test(raw.signature)
    ) {
      issues.push({
        field: 'signature',
        code: 'INVALID_SIGNATURE',
        message: 'signature deve essere una stringa base64 valida e non vuota',
      });
    }

    if (!raw.license || typeof raw.license !== 'object') {
      issues.push({
        field: 'license',
        code: 'INVALID_FORMAT',
        message: 'license deve essere un oggetto documento di licenza valido',
      });
    } else {
      const rawLicense = raw.license as Record<string, unknown>;
      if (
        typeof rawLicense.licenseCode !== 'string' ||
        !LicenseValidator.isValid(rawLicense.licenseCode)
      ) {
        issues.push({
          field: 'license.licenseCode',
          code: 'INVALID_FORMAT',
          message: 'Il codice licenza all\'interno del documento non è valido',
        });
      }
    }

    if (issues.length > 0) {
      return { isValid: false, value: null, issues };
    }

    return {
      isValid: true,
      value: raw as unknown as SignedLicenseDocument,
      issues: [],
    };
  }

  /**
   * Validates an ActivationRequest object from client.
   */
  static validateActivationRequest(
    input: unknown
  ): ValidationResult<ActivationRequest> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [
          {
            field: 'request',
            code: 'INVALID_REQUEST',
            message: 'La richiesta di attivazione deve essere un oggetto non nullo',
          },
        ],
      };
    }

    const raw = input as Record<string, unknown>;

    for (const forbiddenField of PROHIBITED_CLIENT_FIELDS) {
      if (raw[forbiddenField] !== undefined) {
        issues.push({
          field: forbiddenField,
          code: 'PROHIBITED_FIELD',
          message: `Il campo "${forbiddenField}" non è consentito nella richiesta client`,
        });
      }
    }

    if (
      typeof raw.licenseCode !== 'string' ||
      !LicenseValidator.isValid(raw.licenseCode)
    ) {
      issues.push({
        field: 'licenseCode',
        code: 'LICENSE_NOT_FOUND',
        message: 'licenseCode non è un codice licenza valido',
      });
    }

    issues.push(...this.validateDeviceId(raw.deviceId));
    issues.push(...this.validateProductId(raw.productId));

    if (typeof raw.appVersion !== 'string' || raw.appVersion.trim().length === 0) {
      issues.push({
        field: 'appVersion',
        code: 'INVALID_REQUEST',
        message: 'appVersion deve essere una stringa non vuota',
      });
    }

    if (issues.length > 0) {
      return { isValid: false, value: null, issues };
    }

    return {
      isValid: true,
      value: {
        licenseCode: LicenseValidator.normalize(raw.licenseCode as string),
        deviceId: (raw.deviceId as string).trim(),
        productId: (raw.productId as string).trim(),
        appVersion: (raw.appVersion as string).trim(),
      },
      issues: [],
    };
  }

  /**
   * Validates an ActivationResponse object.
   */
  static validateActivationResponse(
    input: unknown
  ): ValidationResult<ActivationResponse> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [
          {
            field: 'response',
            code: 'INVALID_REQUEST',
            message: 'La risposta di attivazione deve essere un oggetto non nullo',
          },
        ],
      };
    }

    const raw = input as Record<string, unknown>;

    if (!raw.status || !ACTIVATION_STATUSES.has(raw.status as ActivationStatus)) {
      issues.push({
        field: 'status',
        code: 'INVALID_REQUEST',
        message: `Stato di attivazione non valido: "${raw.status}"`,
      });
    }

    if (!raw.serverTime || !isValidIsoDate(raw.serverTime as string)) {
      issues.push({
        field: 'serverTime',
        code: 'INVALID_REQUEST',
        message: 'serverTime deve essere una data ISO 8601 valida',
      });
    }

    if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
      issues.push({
        field: 'requestId',
        code: 'INVALID_REQUEST',
        message: 'requestId deve essere una stringa di correlazione non vuota',
      });
    }

    if (raw.signedLicense !== undefined && raw.signedLicense !== null) {
      const signedVal = this.validateSignedLicenseDocument(raw.signedLicense);
      if (!signedVal.isValid) {
        for (const issue of signedVal.issues) {
          issues.push({
            field: `signedLicense.${issue.field}`,
            code: issue.code,
            message: issue.message,
          });
        }
      }
    }

    if (issues.length > 0) {
      return { isValid: false, value: null, issues };
    }

    return {
      isValid: true,
      value: raw as unknown as ActivationResponse,
      issues: [],
    };
  }

  /**
   * Validates a LicenseValidationRequest object.
   */
  static validateLicenseValidationRequest(
    input: unknown
  ): ValidationResult<LicenseValidationRequest> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [
          {
            field: 'request',
            code: 'INVALID_REQUEST',
            message: 'La richiesta di validazione deve essere un oggetto non nullo',
          },
        ],
      };
    }

    const raw = input as Record<string, unknown>;

    for (const forbiddenField of PROHIBITED_CLIENT_FIELDS) {
      if (raw[forbiddenField] !== undefined) {
        issues.push({
          field: forbiddenField,
          code: 'PROHIBITED_FIELD',
          message: `Il campo "${forbiddenField}" non è consentito nella richiesta client`,
        });
      }
    }

    if (
      typeof raw.licenseCode !== 'string' ||
      !LicenseValidator.isValid(raw.licenseCode)
    ) {
      issues.push({
        field: 'licenseCode',
        code: 'LICENSE_NOT_FOUND',
        message: 'licenseCode non è un codice licenza valido',
      });
    }

    issues.push(...this.validateDeviceId(raw.deviceId));
    issues.push(...this.validateProductId(raw.productId));

    if (issues.length > 0) {
      return { isValid: false, value: null, issues };
    }

    return {
      isValid: true,
      value: {
        licenseCode: LicenseValidator.normalize(raw.licenseCode as string),
        deviceId: (raw.deviceId as string).trim(),
        productId: (raw.productId as string).trim(),
        appVersion: typeof raw.appVersion === 'string' ? raw.appVersion.trim() : null,
      },
      issues: [],
    };
  }

  /**
   * Validates a LicenseValidationResponse object.
   */
  static validateLicenseValidationResponse(
    input: unknown
  ): ValidationResult<LicenseValidationResponse> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [
          {
            field: 'response',
            code: 'INVALID_REQUEST',
            message: 'La risposta di validazione deve essere un oggetto non nullo',
          },
        ],
      };
    }

    const raw = input as Record<string, unknown>;

    if (
      !raw.status ||
      !VALIDATION_STATUSES.has(raw.status as LicenseValidationStatus)
    ) {
      issues.push({
        field: 'status',
        code: 'INVALID_REQUEST',
        message: `Stato di validazione non valido: "${raw.status}"`,
      });
    }

    if (!raw.lastValidatedAt || !isValidIsoDate(raw.lastValidatedAt as string)) {
      issues.push({
        field: 'lastValidatedAt',
        code: 'INVALID_REQUEST',
        message: 'lastValidatedAt deve essere una data ISO 8601 valida',
      });
    }

    if (!raw.serverTime || !isValidIsoDate(raw.serverTime as string)) {
      issues.push({
        field: 'serverTime',
        code: 'INVALID_REQUEST',
        message: 'serverTime deve essere una data ISO 8601 valida',
      });
    }

    if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
      issues.push({
        field: 'requestId',
        code: 'INVALID_REQUEST',
        message: 'requestId deve essere una stringa di correlazione non vuota',
      });
    }

    if (raw.signedLicense !== undefined && raw.signedLicense !== null) {
      const signedVal = this.validateSignedLicenseDocument(raw.signedLicense);
      if (!signedVal.isValid) {
        for (const issue of signedVal.issues) {
          issues.push({
            field: `signedLicense.${issue.field}`,
            code: issue.code,
            message: issue.message,
          });
        }
      }
    }

    if (issues.length > 0) {
      return { isValid: false, value: null, issues };
    }

    return {
      isValid: true,
      value: raw as unknown as LicenseValidationResponse,
      issues: [],
    };
  }

  /**
   * Validates a LicenseDeactivationRequest object.
   */
  static validateLicenseDeactivationRequest(
    input: unknown
  ): ValidationResult<LicenseDeactivationRequest> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [
          {
            field: 'request',
            code: 'INVALID_REQUEST',
            message: 'La richiesta di disattivazione deve essere un oggetto non nullo',
          },
        ],
      };
    }

    const raw = input as Record<string, unknown>;

    for (const forbiddenField of PROHIBITED_CLIENT_FIELDS) {
      if (raw[forbiddenField] !== undefined) {
        issues.push({
          field: forbiddenField,
          code: 'PROHIBITED_FIELD',
          message: `Il campo "${forbiddenField}" non è consentito nella richiesta client`,
        });
      }
    }

    if (
      typeof raw.licenseCode !== 'string' ||
      !LicenseValidator.isValid(raw.licenseCode)
    ) {
      issues.push({
        field: 'licenseCode',
        code: 'LICENSE_NOT_FOUND',
        message: 'licenseCode non è un codice licenza valido',
      });
    }

    issues.push(...this.validateDeviceId(raw.deviceId));
    issues.push(...this.validateProductId(raw.productId));

    if (issues.length > 0) {
      return { isValid: false, value: null, issues };
    }

    return {
      isValid: true,
      value: {
        licenseCode: LicenseValidator.normalize(raw.licenseCode as string),
        deviceId: (raw.deviceId as string).trim(),
        productId: (raw.productId as string).trim(),
      },
      issues: [],
    };
  }

  /**
   * Validates a LicenseDeactivationResponse object.
   */
  static validateLicenseDeactivationResponse(
    input: unknown
  ): ValidationResult<LicenseDeactivationResponse> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [
          {
            field: 'response',
            code: 'INVALID_REQUEST',
            message: 'La risposta di disattivazione deve essere un oggetto non nullo',
          },
        ],
      };
    }

    const raw = input as Record<string, unknown>;

    if (
      !raw.status ||
      !DEACTIVATION_STATUSES.has(raw.status as LicenseDeactivationStatus)
    ) {
      issues.push({
        field: 'status',
        code: 'INVALID_REQUEST',
        message: `Stato di disattivazione non valido: "${raw.status}"`,
      });
    }

    if (!raw.serverTime || !isValidIsoDate(raw.serverTime as string)) {
      issues.push({
        field: 'serverTime',
        code: 'INVALID_REQUEST',
        message: 'serverTime deve essere una data ISO 8601 valida',
      });
    }

    if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
      issues.push({
        field: 'requestId',
        code: 'INVALID_REQUEST',
        message: 'requestId deve essere una stringa di correlazione non vuota',
      });
    }

    if (raw.deactivatedAt !== undefined && raw.deactivatedAt !== null) {
      if (!isValidIsoDate(raw.deactivatedAt as string)) {
        issues.push({
          field: 'deactivatedAt',
          code: 'INVALID_REQUEST',
          message: 'deactivatedAt deve essere una data ISO 8601 valida se presente',
        });
      }
    }

    if (issues.length > 0) {
      return { isValid: false, value: null, issues };
    }

    return {
      isValid: true,
      value: raw as unknown as LicenseDeactivationResponse,
      issues: [],
    };
  }
}
