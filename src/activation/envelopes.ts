import { isValidIsoDate } from '../common/utils.js';
import type { ValidationIssue, ValidationResult } from '../common/types.js';
import { ActivationValidator } from './validators.js';
import {
  ACTIVATION_FORMAT_VERSION,
  ACTIVATION_REQUEST_FORMAT,
  ACTIVATION_RESPONSE_FORMAT,
  DEACTIVATION_REQUEST_FORMAT,
  DEACTIVATION_RESPONSE_FORMAT,
  VALIDATION_REQUEST_FORMAT,
  VALIDATION_RESPONSE_FORMAT,
  type ActivationRequest,
  type ActivationRequestEnvelope,
  type ActivationResponse,
  type ActivationResponseEnvelope,
  type LicenseDeactivationRequest,
  type LicenseDeactivationRequestEnvelope,
  type LicenseDeactivationResponse,
  type LicenseDeactivationResponseEnvelope,
  type LicenseValidationRequest,
  type LicenseValidationRequestEnvelope,
  type LicenseValidationResponse,
  type LicenseValidationResponseEnvelope,
} from './types.js';

// Helper to generate simple fallback UUID if non-browser/crypto random is used
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// --- Activation Request Envelope ---

export function createActivationRequestEnvelope(
  requestInput: unknown,
  requestId?: string,
  createdAt?: string
): ValidationResult<ActivationRequestEnvelope> {
  const reqVal = ActivationValidator.validateActivationRequest(requestInput);
  if (!reqVal.isValid || !reqVal.value) {
    return { isValid: false, value: null, issues: reqVal.issues };
  }

  const finalRequestId = requestId && requestId.trim().length > 0 ? requestId.trim() : generateRequestId();
  const finalCreatedAt = createdAt || new Date().toISOString();

  if (!isValidIsoDate(finalCreatedAt)) {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'createdAt',
          code: 'INVALID_FORMAT',
          message: 'createdAt deve essere una data ISO 8601 valida',
        },
      ],
    };
  }

  return {
    isValid: true,
    value: {
      format: ACTIVATION_REQUEST_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: finalRequestId,
      createdAt: finalCreatedAt,
      request: reqVal.value,
    },
    issues: [],
  };
}

export function validateActivationRequestEnvelope(
  input: unknown
): ValidationResult<ActivationRequestEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [{ field: 'envelope', code: 'INVALID_FORMAT', message: 'L\'envelope deve essere un oggetto non nullo' }],
    };
  }

  const raw = input as Record<string, unknown>;

  if (raw.format !== ACTIVATION_REQUEST_FORMAT) {
    issues.push({
      field: 'format',
      code: 'INVALID_FORMAT',
      message: `Formato non valido: atteso "${ACTIVATION_REQUEST_FORMAT}"`,
    });
  }

  if (raw.formatVersion !== ACTIVATION_FORMAT_VERSION) {
    issues.push({
      field: 'formatVersion',
      code: 'UNSUPPORTED_VERSION',
      message: `Versione formato non supportata: attesa ${ACTIVATION_FORMAT_VERSION}`,
    });
  }

  if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
    issues.push({
      field: 'requestId',
      code: 'INVALID_FORMAT',
      message: 'requestId deve essere una stringa non vuota',
    });
  }

  if (typeof raw.createdAt !== 'string' || !isValidIsoDate(raw.createdAt)) {
    issues.push({
      field: 'createdAt',
      code: 'INVALID_FORMAT',
      message: 'createdAt deve essere una data ISO 8601 valida',
    });
  }

  const reqVal = ActivationValidator.validateActivationRequest(raw.request);
  if (!reqVal.isValid) {
    for (const issue of reqVal.issues) {
      issues.push({
        field: `request.${issue.field}`,
        code: issue.code,
        message: issue.message,
      });
    }
  }

  if (issues.length > 0) {
    return { isValid: false, value: null, issues };
  }

  return {
    isValid: true,
    value: {
      format: ACTIVATION_REQUEST_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: (raw.requestId as string).trim(),
      createdAt: raw.createdAt as string,
      request: reqVal.value!,
    },
    issues: [],
  };
}

// --- Activation Response Envelope ---

export function createActivationResponseEnvelope(
  responseInput: unknown,
  requestId?: string,
  createdAt?: string
): ValidationResult<ActivationResponseEnvelope> {
  const resVal = ActivationValidator.validateActivationResponse(responseInput);
  if (!resVal.isValid || !resVal.value) {
    return { isValid: false, value: null, issues: resVal.issues };
  }

  const finalRequestId = requestId && requestId.trim().length > 0 ? requestId.trim() : resVal.value.requestId;
  const finalCreatedAt = createdAt || new Date().toISOString();

  if (!isValidIsoDate(finalCreatedAt)) {
    return {
      isValid: false,
      value: null,
      issues: [{ field: 'createdAt', code: 'INVALID_FORMAT', message: 'createdAt deve essere una data ISO 8601 valida' }],
    };
  }

  return {
    isValid: true,
    value: {
      format: ACTIVATION_RESPONSE_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: finalRequestId,
      createdAt: finalCreatedAt,
      response: resVal.value,
    },
    issues: [],
  };
}

export function validateActivationResponseEnvelope(
  input: unknown
): ValidationResult<ActivationResponseEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [{ field: 'envelope', code: 'INVALID_FORMAT', message: 'L\'envelope deve essere un oggetto non nullo' }],
    };
  }

  const raw = input as Record<string, unknown>;

  if (raw.format !== ACTIVATION_RESPONSE_FORMAT) {
    issues.push({
      field: 'format',
      code: 'INVALID_FORMAT',
      message: `Formato non valido: atteso "${ACTIVATION_RESPONSE_FORMAT}"`,
    });
  }

  if (raw.formatVersion !== ACTIVATION_FORMAT_VERSION) {
    issues.push({
      field: 'formatVersion',
      code: 'UNSUPPORTED_VERSION',
      message: `Versione formato non supportata: attesa ${ACTIVATION_FORMAT_VERSION}`,
    });
  }

  if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
    issues.push({
      field: 'requestId',
      code: 'INVALID_FORMAT',
      message: 'requestId deve essere una stringa non vuota',
    });
  }

  if (typeof raw.createdAt !== 'string' || !isValidIsoDate(raw.createdAt)) {
    issues.push({
      field: 'createdAt',
      code: 'INVALID_FORMAT',
      message: 'createdAt deve essere una data ISO 8601 valida',
    });
  }

  const resVal = ActivationValidator.validateActivationResponse(raw.response);
  if (!resVal.isValid) {
    for (const issue of resVal.issues) {
      issues.push({
        field: `response.${issue.field}`,
        code: issue.code,
        message: issue.message,
      });
    }
  }

  if (issues.length > 0) {
    return { isValid: false, value: null, issues };
  }

  return {
    isValid: true,
    value: {
      format: ACTIVATION_RESPONSE_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: (raw.requestId as string).trim(),
      createdAt: raw.createdAt as string,
      response: resVal.value!,
    },
    issues: [],
  };
}

// --- Validation Request/Response Envelopes ---

export function createLicenseValidationRequestEnvelope(
  requestInput: unknown,
  requestId?: string,
  createdAt?: string
): ValidationResult<LicenseValidationRequestEnvelope> {
  const reqVal = ActivationValidator.validateLicenseValidationRequest(requestInput);
  if (!reqVal.isValid || !reqVal.value) {
    return { isValid: false, value: null, issues: reqVal.issues };
  }

  const finalRequestId = requestId && requestId.trim().length > 0 ? requestId.trim() : generateRequestId();
  const finalCreatedAt = createdAt || new Date().toISOString();

  return {
    isValid: true,
    value: {
      format: VALIDATION_REQUEST_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: finalRequestId,
      createdAt: finalCreatedAt,
      request: reqVal.value,
    },
    issues: [],
  };
}

export function validateLicenseValidationRequestEnvelope(
  input: unknown
): ValidationResult<LicenseValidationRequestEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [{ field: 'envelope', code: 'INVALID_FORMAT', message: 'L\'envelope deve essere un oggetto non nullo' }],
    };
  }

  const raw = input as Record<string, unknown>;

  if (raw.format !== VALIDATION_REQUEST_FORMAT) {
    issues.push({
      field: 'format',
      code: 'INVALID_FORMAT',
      message: `Formato non valido: atteso "${VALIDATION_REQUEST_FORMAT}"`,
    });
  }

  if (raw.formatVersion !== ACTIVATION_FORMAT_VERSION) {
    issues.push({
      field: 'formatVersion',
      code: 'UNSUPPORTED_VERSION',
      message: `Versione formato non supportata: attesa ${ACTIVATION_FORMAT_VERSION}`,
    });
  }

  if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
    issues.push({
      field: 'requestId',
      code: 'INVALID_FORMAT',
      message: 'requestId deve essere una stringa non vuota',
    });
  }

  if (typeof raw.createdAt !== 'string' || !isValidIsoDate(raw.createdAt)) {
    issues.push({
      field: 'createdAt',
      code: 'INVALID_FORMAT',
      message: 'createdAt deve essere una data ISO 8601 valida',
    });
  }

  const reqVal = ActivationValidator.validateLicenseValidationRequest(raw.request);
  if (!reqVal.isValid) {
    for (const issue of reqVal.issues) {
      issues.push({
        field: `request.${issue.field}`,
        code: issue.code,
        message: issue.message,
      });
    }
  }

  if (issues.length > 0) {
    return { isValid: false, value: null, issues };
  }

  return {
    isValid: true,
    value: {
      format: VALIDATION_REQUEST_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: (raw.requestId as string).trim(),
      createdAt: raw.createdAt as string,
      request: reqVal.value!,
    },
    issues: [],
  };
}

export function createLicenseValidationResponseEnvelope(
  responseInput: unknown,
  requestId?: string,
  createdAt?: string
): ValidationResult<LicenseValidationResponseEnvelope> {
  const resVal = ActivationValidator.validateLicenseValidationResponse(responseInput);
  if (!resVal.isValid || !resVal.value) {
    return { isValid: false, value: null, issues: resVal.issues };
  }

  const finalRequestId = requestId && requestId.trim().length > 0 ? requestId.trim() : resVal.value.requestId;
  const finalCreatedAt = createdAt || new Date().toISOString();

  return {
    isValid: true,
    value: {
      format: VALIDATION_RESPONSE_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: finalRequestId,
      createdAt: finalCreatedAt,
      response: resVal.value,
    },
    issues: [],
  };
}

export function validateLicenseValidationResponseEnvelope(
  input: unknown
): ValidationResult<LicenseValidationResponseEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [{ field: 'envelope', code: 'INVALID_FORMAT', message: 'L\'envelope deve essere un oggetto non nullo' }],
    };
  }

  const raw = input as Record<string, unknown>;

  if (raw.format !== VALIDATION_RESPONSE_FORMAT) {
    issues.push({
      field: 'format',
      code: 'INVALID_FORMAT',
      message: `Formato non valido: atteso "${VALIDATION_RESPONSE_FORMAT}"`,
    });
  }

  if (raw.formatVersion !== ACTIVATION_FORMAT_VERSION) {
    issues.push({
      field: 'formatVersion',
      code: 'UNSUPPORTED_VERSION',
      message: `Versione formato non supportata: attesa ${ACTIVATION_FORMAT_VERSION}`,
    });
  }

  if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
    issues.push({
      field: 'requestId',
      code: 'INVALID_FORMAT',
      message: 'requestId deve essere una stringa non vuota',
    });
  }

  if (typeof raw.createdAt !== 'string' || !isValidIsoDate(raw.createdAt)) {
    issues.push({
      field: 'createdAt',
      code: 'INVALID_FORMAT',
      message: 'createdAt deve essere una data ISO 8601 valida',
    });
  }

  const resVal = ActivationValidator.validateLicenseValidationResponse(raw.response);
  if (!resVal.isValid) {
    for (const issue of resVal.issues) {
      issues.push({
        field: `response.${issue.field}`,
        code: issue.code,
        message: issue.message,
      });
    }
  }

  if (issues.length > 0) {
    return { isValid: false, value: null, issues };
  }

  return {
    isValid: true,
    value: {
      format: VALIDATION_RESPONSE_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: (raw.requestId as string).trim(),
      createdAt: raw.createdAt as string,
      response: resVal.value!,
    },
    issues: [],
  };
}

// --- Deactivation Request/Response Envelopes ---

export function createLicenseDeactivationRequestEnvelope(
  requestInput: unknown,
  requestId?: string,
  createdAt?: string
): ValidationResult<LicenseDeactivationRequestEnvelope> {
  const reqVal = ActivationValidator.validateLicenseDeactivationRequest(requestInput);
  if (!reqVal.isValid || !reqVal.value) {
    return { isValid: false, value: null, issues: reqVal.issues };
  }

  const finalRequestId = requestId && requestId.trim().length > 0 ? requestId.trim() : generateRequestId();
  const finalCreatedAt = createdAt || new Date().toISOString();

  return {
    isValid: true,
    value: {
      format: DEACTIVATION_REQUEST_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: finalRequestId,
      createdAt: finalCreatedAt,
      request: reqVal.value,
    },
    issues: [],
  };
}

export function validateLicenseDeactivationRequestEnvelope(
  input: unknown
): ValidationResult<LicenseDeactivationRequestEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [{ field: 'envelope', code: 'INVALID_FORMAT', message: 'L\'envelope deve essere un oggetto non nullo' }],
    };
  }

  const raw = input as Record<string, unknown>;

  if (raw.format !== DEACTIVATION_REQUEST_FORMAT) {
    issues.push({
      field: 'format',
      code: 'INVALID_FORMAT',
      message: `Formato non valido: atteso "${DEACTIVATION_REQUEST_FORMAT}"`,
    });
  }

  if (raw.formatVersion !== ACTIVATION_FORMAT_VERSION) {
    issues.push({
      field: 'formatVersion',
      code: 'UNSUPPORTED_VERSION',
      message: `Versione formato non supportata: attesa ${ACTIVATION_FORMAT_VERSION}`,
    });
  }

  if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
    issues.push({
      field: 'requestId',
      code: 'INVALID_FORMAT',
      message: 'requestId deve essere una stringa non vuota',
    });
  }

  if (typeof raw.createdAt !== 'string' || !isValidIsoDate(raw.createdAt)) {
    issues.push({
      field: 'createdAt',
      code: 'INVALID_FORMAT',
      message: 'createdAt deve essere una data ISO 8601 valida',
    });
  }

  const reqVal = ActivationValidator.validateLicenseDeactivationRequest(raw.request);
  if (!reqVal.isValid) {
    for (const issue of reqVal.issues) {
      issues.push({
        field: `request.${issue.field}`,
        code: issue.code,
        message: issue.message,
      });
    }
  }

  if (issues.length > 0) {
    return { isValid: false, value: null, issues };
  }

  return {
    isValid: true,
    value: {
      format: DEACTIVATION_REQUEST_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: (raw.requestId as string).trim(),
      createdAt: raw.createdAt as string,
      request: reqVal.value!,
    },
    issues: [],
  };
}

export function createLicenseDeactivationResponseEnvelope(
  responseInput: unknown,
  requestId?: string,
  createdAt?: string
): ValidationResult<LicenseDeactivationResponseEnvelope> {
  const resVal = ActivationValidator.validateLicenseDeactivationResponse(responseInput);
  if (!resVal.isValid || !resVal.value) {
    return { isValid: false, value: null, issues: resVal.issues };
  }

  const finalRequestId = requestId && requestId.trim().length > 0 ? requestId.trim() : resVal.value.requestId;
  const finalCreatedAt = createdAt || new Date().toISOString();

  return {
    isValid: true,
    value: {
      format: DEACTIVATION_RESPONSE_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: finalRequestId,
      createdAt: finalCreatedAt,
      response: resVal.value,
    },
    issues: [],
  };
}

export function validateLicenseDeactivationResponseEnvelope(
  input: unknown
): ValidationResult<LicenseDeactivationResponseEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [{ field: 'envelope', code: 'INVALID_FORMAT', message: 'L\'envelope deve essere un oggetto non nullo' }],
    };
  }

  const raw = input as Record<string, unknown>;

  if (raw.format !== DEACTIVATION_RESPONSE_FORMAT) {
    issues.push({
      field: 'format',
      code: 'INVALID_FORMAT',
      message: `Formato non valido: atteso "${DEACTIVATION_RESPONSE_FORMAT}"`,
    });
  }

  if (raw.formatVersion !== ACTIVATION_FORMAT_VERSION) {
    issues.push({
      field: 'formatVersion',
      code: 'UNSUPPORTED_VERSION',
      message: `Versione formato non supportata: attesa ${ACTIVATION_FORMAT_VERSION}`,
    });
  }

  if (typeof raw.requestId !== 'string' || raw.requestId.trim().length === 0) {
    issues.push({
      field: 'requestId',
      code: 'INVALID_FORMAT',
      message: 'requestId deve essere una stringa non vuota',
    });
  }

  if (typeof raw.createdAt !== 'string' || !isValidIsoDate(raw.createdAt)) {
    issues.push({
      field: 'createdAt',
      code: 'INVALID_FORMAT',
      message: 'createdAt deve essere una data ISO 8601 valida',
    });
  }

  const resVal = ActivationValidator.validateLicenseDeactivationResponse(raw.response);
  if (!resVal.isValid) {
    for (const issue of resVal.issues) {
      issues.push({
        field: `response.${issue.field}`,
        code: issue.code,
        message: issue.message,
      });
    }
  }

  if (issues.length > 0) {
    return { isValid: false, value: null, issues };
  }

  return {
    isValid: true,
    value: {
      format: DEACTIVATION_RESPONSE_FORMAT,
      formatVersion: ACTIVATION_FORMAT_VERSION,
      requestId: (raw.requestId as string).trim(),
      createdAt: raw.createdAt as string,
      response: resVal.value!,
    },
    issues: [],
  };
}
