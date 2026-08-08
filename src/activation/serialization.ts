import type { ValidationResult } from '../common/types.js';
import {
  validateActivationRequestEnvelope,
  validateActivationResponseEnvelope,
  validateLicenseDeactivationRequestEnvelope,
  validateLicenseDeactivationResponseEnvelope,
  validateLicenseValidationRequestEnvelope,
  validateLicenseValidationResponseEnvelope,
} from './envelopes.js';

import { ActivationValidator } from './validators.js';

import type {
  ActivationRequestEnvelope,
  ActivationResponseEnvelope,
  LicenseDeactivationRequestEnvelope,
  LicenseDeactivationResponseEnvelope,
  LicenseValidationRequestEnvelope,
  LicenseValidationResponseEnvelope,
  SignedLicenseDocument,
} from './types.js';

// Helper for generic JSON parsing
function parseJsonInput(json: string): ValidationResult<unknown> {
  if (typeof json !== 'string' || json.trim().length === 0) {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'json',
          code: 'INVALID_FORMAT',
          message: 'La stringa JSON fornita è vuota o non valida',
        },
      ],
    };
  }

  try {
    const parsed: unknown = JSON.parse(json);
    return { isValid: true, value: parsed, issues: [] };
  } catch (_err) {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'json',
          code: 'INVALID_FORMAT',
          message: 'Errore di sintassi durante il parsing del JSON',
        },
      ],
    };
  }
}

// --- Activation Request Envelope Serialization ---

export function serializeActivationRequestEnvelope(
  input: unknown
): ValidationResult<string> {
  const val = validateActivationRequestEnvelope(input);
  if (!val.isValid || !val.value) {
    return { isValid: false, value: null, issues: val.issues };
  }
  return { isValid: true, value: JSON.stringify(val.value, null, 2), issues: [] };
}

export function deserializeActivationRequestEnvelope(
  json: string
): ValidationResult<ActivationRequestEnvelope> {
  const parseRes = parseJsonInput(json);
  if (!parseRes.isValid) {
    return { isValid: false, value: null, issues: parseRes.issues };
  }
  return validateActivationRequestEnvelope(parseRes.value);
}

// --- Activation Response Envelope Serialization ---

export function serializeActivationResponseEnvelope(
  input: unknown
): ValidationResult<string> {
  const val = validateActivationResponseEnvelope(input);
  if (!val.isValid || !val.value) {
    return { isValid: false, value: null, issues: val.issues };
  }
  return { isValid: true, value: JSON.stringify(val.value, null, 2), issues: [] };
}

export function deserializeActivationResponseEnvelope(
  json: string
): ValidationResult<ActivationResponseEnvelope> {
  const parseRes = parseJsonInput(json);
  if (!parseRes.isValid) {
    return { isValid: false, value: null, issues: parseRes.issues };
  }
  return validateActivationResponseEnvelope(parseRes.value);
}

// --- License Validation Request Envelope Serialization ---

export function serializeLicenseValidationRequestEnvelope(
  input: unknown
): ValidationResult<string> {
  const val = validateLicenseValidationRequestEnvelope(input);
  if (!val.isValid || !val.value) {
    return { isValid: false, value: null, issues: val.issues };
  }
  return { isValid: true, value: JSON.stringify(val.value, null, 2), issues: [] };
}

export function deserializeLicenseValidationRequestEnvelope(
  json: string
): ValidationResult<LicenseValidationRequestEnvelope> {
  const parseRes = parseJsonInput(json);
  if (!parseRes.isValid) {
    return { isValid: false, value: null, issues: parseRes.issues };
  }
  return validateLicenseValidationRequestEnvelope(parseRes.value);
}

// --- License Validation Response Envelope Serialization ---

export function serializeLicenseValidationResponseEnvelope(
  input: unknown
): ValidationResult<string> {
  const val = validateLicenseValidationResponseEnvelope(input);
  if (!val.isValid || !val.value) {
    return { isValid: false, value: null, issues: val.issues };
  }
  return { isValid: true, value: JSON.stringify(val.value, null, 2), issues: [] };
}

export function deserializeLicenseValidationResponseEnvelope(
  json: string
): ValidationResult<LicenseValidationResponseEnvelope> {
  const parseRes = parseJsonInput(json);
  if (!parseRes.isValid) {
    return { isValid: false, value: null, issues: parseRes.issues };
  }
  return validateLicenseValidationResponseEnvelope(parseRes.value);
}

// --- License Deactivation Request Envelope Serialization ---

export function serializeLicenseDeactivationRequestEnvelope(
  input: unknown
): ValidationResult<string> {
  const val = validateLicenseDeactivationRequestEnvelope(input);
  if (!val.isValid || !val.value) {
    return { isValid: false, value: null, issues: val.issues };
  }
  return { isValid: true, value: JSON.stringify(val.value, null, 2), issues: [] };
}

export function deserializeLicenseDeactivationRequestEnvelope(
  json: string
): ValidationResult<LicenseDeactivationRequestEnvelope> {
  const parseRes = parseJsonInput(json);
  if (!parseRes.isValid) {
    return { isValid: false, value: null, issues: parseRes.issues };
  }
  return validateLicenseDeactivationRequestEnvelope(parseRes.value);
}

// --- License Deactivation Response Envelope Serialization ---

export function serializeLicenseDeactivationResponseEnvelope(
  input: unknown
): ValidationResult<string> {
  const val = validateLicenseDeactivationResponseEnvelope(input);
  if (!val.isValid || !val.value) {
    return { isValid: false, value: null, issues: val.issues };
  }
  return { isValid: true, value: JSON.stringify(val.value, null, 2), issues: [] };
}

export function deserializeLicenseDeactivationResponseEnvelope(
  json: string
): ValidationResult<LicenseDeactivationResponseEnvelope> {
  const parseRes = parseJsonInput(json);
  if (!parseRes.isValid) {
    return { isValid: false, value: null, issues: parseRes.issues };
  }
  return validateLicenseDeactivationResponseEnvelope(parseRes.value);
}

// --- Signed License Document Serialization ---

export function serializeSignedLicenseDocument(
  input: unknown
): ValidationResult<string> {
  const val = ActivationValidator.validateSignedLicenseDocument(input);
  if (!val.isValid || !val.value) {
    return { isValid: false, value: null, issues: val.issues };
  }
  return { isValid: true, value: JSON.stringify(val.value, null, 2), issues: [] };
}

export function deserializeSignedLicenseDocument(
  json: string
): ValidationResult<SignedLicenseDocument> {
  const parseRes = parseJsonInput(json);
  if (!parseRes.isValid) {
    return { isValid: false, value: null, issues: parseRes.issues };
  }
  return ActivationValidator.validateSignedLicenseDocument(parseRes.value);
}
