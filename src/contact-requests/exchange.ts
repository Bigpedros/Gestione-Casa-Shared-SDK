import { isValidIsoDate } from '../common/utils.js';
import type { ValidationIssue, ValidationResult } from '../common/types.js';
import { ContactRequestValidator } from './ContactRequestValidator.js';
import type { ContactRequestDocument } from './types.js';
import {
  CONTACT_REQUEST_EXCHANGE_FORMAT,
  CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION,
  type ContactRequestExchangeEnvelope,
} from './exchange.types.js';

/**
 * Creates a valid ContactRequestExchangeEnvelope from a contact request.
 */
export function createContactRequestExchangeEnvelope(
  request: unknown,
  exportedAt?: string
): ValidationResult<ContactRequestExchangeEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!request || typeof request !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'request',
          code: 'exchange.invalid_request',
          message: 'La richiesta deve essere un oggetto non nullo',
        },
      ],
    };
  }

  const rawReq = request as Record<string, unknown>;
  if (
    rawReq.metadata === undefined ||
    rawReq.metadata === null ||
    typeof rawReq.metadata !== 'object' ||
    Array.isArray(rawReq.metadata)
  ) {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'request.metadata',
          code: 'exchange.invalid_request',
          message: 'I metadata della richiesta sono obbligatori e devono essere un oggetto',
        },
      ],
    };
  }

  const requestValidation = ContactRequestValidator.validate(request);
  if (!requestValidation.isValid || !requestValidation.value) {
    return {
      isValid: false,
      value: null,
      issues: requestValidation.issues.map((i) => ({
        field: `request.${i.field}`,
        code: i.code,
        message: i.message,
      })),
    };
  }

  let finalExportedAt = new Date().toISOString();
  if (exportedAt !== undefined && exportedAt !== null) {
    if (!isValidIsoDate(exportedAt)) {
      issues.push({
        field: 'exportedAt',
        code: 'exchange.invalid_exported_at',
        message: 'La data di esportazione (exportedAt) deve essere una data ISO 8601 valida',
      });
      return {
        isValid: false,
        value: null,
        issues,
      };
    } else {
      finalExportedAt = exportedAt;
    }
  }

  const envelope: ContactRequestExchangeEnvelope = {
    format: CONTACT_REQUEST_EXCHANGE_FORMAT,
    formatVersion: CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION,
    exportedAt: finalExportedAt,
    request: requestValidation.value,
  };

  return {
    isValid: true,
    value: envelope,
    issues: [],
  };
}

/**
 * Validates an unknown input as a ContactRequestExchangeEnvelope.
 */
export function validateContactRequestExchangeEnvelope(
  input: unknown
): ValidationResult<ContactRequestExchangeEnvelope> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'root',
          code: 'exchange.invalid_input',
          message: 'L\'input dell\'envelope deve essere un oggetto non nullo',
        },
      ],
    };
  }

  const raw = input as Partial<ContactRequestExchangeEnvelope>;

  if (raw.format !== CONTACT_REQUEST_EXCHANGE_FORMAT) {
    issues.push({
      field: 'format',
      code: 'exchange.invalid_format',
      message: `Formato non valido: atteso "${CONTACT_REQUEST_EXCHANGE_FORMAT}"`,
    });
  }

  if (raw.formatVersion !== CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION) {
    issues.push({
      field: 'formatVersion',
      code: 'exchange.unsupported_format_version',
      message: `Versione formato non supportata: attesa ${CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION}`,
    });
  }

  if (!raw.exportedAt || !isValidIsoDate(raw.exportedAt)) {
    issues.push({
      field: 'exportedAt',
      code: 'exchange.invalid_exported_at',
      message: 'La data di esportazione (exportedAt) deve essere una data ISO valida',
    });
  }

  if (!raw.request || typeof raw.request !== 'object') {
    issues.push({
      field: 'request',
      code: 'exchange.missing_request',
      message: 'La proprietà request è obbligatoria e deve essere un oggetto',
    });
  } else {
    const rawReq = raw.request as unknown as Record<string, unknown>;
    if (
      rawReq.metadata === undefined ||
      rawReq.metadata === null ||
      typeof rawReq.metadata !== 'object' ||
      Array.isArray(rawReq.metadata)
    ) {
      issues.push({
        field: 'request.metadata',
        code: 'exchange.invalid_request',
        message: 'I metadata della richiesta sono obbligatori e devono essere un oggetto',
      });
    }

    const requestValidation = ContactRequestValidator.validate(raw.request);
    if (!requestValidation.isValid || !requestValidation.value) {
      for (const reqIssue of requestValidation.issues) {
        issues.push({
          field: `request.${reqIssue.field}`,
          code: reqIssue.code === 'REQUIRED_FIELD' || reqIssue.code === 'INVALID_ENUM' ? 'exchange.invalid_request' : reqIssue.code,
          message: reqIssue.message,
        });
      }
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      value: null,
      issues,
    };
  }

  const requestValidation = ContactRequestValidator.validate(raw.request);
  const normalizedEnvelope: ContactRequestExchangeEnvelope = {
    format: CONTACT_REQUEST_EXCHANGE_FORMAT,
    formatVersion: CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION,
    exportedAt: raw.exportedAt!,
    request: requestValidation.value!,
  };

  return {
    isValid: true,
    value: normalizedEnvelope,
    issues: [],
  };
}

/**
 * Serializes an envelope to a formatted JSON string.
 */
export function serializeContactRequestExchangeEnvelope(
  input: unknown
): ValidationResult<string> {
  const validation = validateContactRequestExchangeEnvelope(input);
  if (!validation.isValid || !validation.value) {
    return {
      isValid: false,
      value: null,
      issues: validation.issues,
    };
  }

  const jsonString = JSON.stringify(validation.value, null, 2);
  return {
    isValid: true,
    value: jsonString,
    issues: [],
  };
}

/**
 * Deserializes a JSON string into a validated ContactRequestExchangeEnvelope.
 */
export function deserializeContactRequestExchangeEnvelope(
  json: string
): ValidationResult<ContactRequestExchangeEnvelope> {
  if (typeof json !== 'string' || json.trim().length === 0) {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'json',
          code: 'exchange.invalid_json',
          message: 'La stringa JSON fornita è vuota o non valida',
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (_err) {
    return {
      isValid: false,
      value: null,
      issues: [
        {
          field: 'json',
          code: 'exchange.invalid_json',
          message: 'Errore di sintassi durante il parsing del JSON',
        },
      ],
    };
  }

  return validateContactRequestExchangeEnvelope(parsed);
}

/**
 * Builds the canonical filename for a contact request exchange envelope.
 * Format: gestione-casa-contact-request_<ID>_<YYYYMMDD-HHmmss>.json
 */
export function buildContactRequestExchangeFileName(
  input: unknown
): ValidationResult<string> {
  const validation = validateContactRequestExchangeEnvelope(input);
  if (!validation.isValid || !validation.value) {
    return {
      isValid: false,
      value: null,
      issues: validation.issues,
    };
  }

  const envelope = validation.value;
  const requestId = envelope.request.id;
  const safeId = requestId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const d = new Date(envelope.exportedAt);
  const yyyy = d.getUTCFullYear().toString().padStart(4, '0');
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = d.getUTCDate().toString().padStart(2, '0');
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const min = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');

  const timestampStr = `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
  const fileName = `gestione-casa-contact-request_${safeId}_${timestampStr}.json`;

  return {
    isValid: true,
    value: fileName,
    issues: [],
  };
}
