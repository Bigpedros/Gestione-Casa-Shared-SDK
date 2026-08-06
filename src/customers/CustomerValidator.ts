import {
  normalizeText,
  normalizeEmail,
  isValidEmail,
  isValidPhone,
  isValidIsoDate,
  isChronological,
} from '../common/utils.js';
import type { ValidationIssue, ValidationResult, SyncStatus } from '../common/types.js';
import {
  CUSTOMER_SCHEMA_VERSION,
  type CustomerDocument,
  type CustomerKind,
  type CustomerStatus,
} from './types.js';

export class CustomerValidator {
  /**
   * Normalizes input data for CustomerDocument.
   */
  public static normalize(input: Partial<CustomerDocument>): CustomerDocument {
    const id = (input.id || '').trim();
    const kind: CustomerKind = input.kind === 'organization' ? 'organization' : 'individual';

    const firstName = normalizeText(input.firstName);
    const lastName = normalizeText(input.lastName);
    const companyName = normalizeText(input.companyName);
    const rawDisplayName = normalizeText(input.displayName);

    let displayName = rawDisplayName || '';
    if (!displayName) {
      if (kind === 'organization' && companyName) {
        displayName = companyName;
      } else if (firstName || lastName) {
        displayName = [firstName, lastName].filter(Boolean).join(' ');
      }
    }

    const email = normalizeEmail(input.email) || '';
    const phone = normalizeText(input.phone);
    const notes = normalizeText(input.notes);
    const sourceDeviceId = normalizeText(input.sourceDeviceId);

    const validStatuses: CustomerStatus[] = ['pending', 'active', 'suspended', 'archived'];
    const status: CustomerStatus = validStatuses.includes(input.status as CustomerStatus)
      ? (input.status as CustomerStatus)
      : 'pending';

    const validSyncStatuses: SyncStatus[] = ['pending', 'synced', 'conflict'];
    const syncStatus: SyncStatus = validSyncStatuses.includes(input.syncStatus as SyncStatus)
      ? (input.syncStatus as SyncStatus)
      : 'pending';

    const createdAt = isValidIsoDate(input.createdAt)
      ? input.createdAt!
      : new Date().toISOString();
    const updatedAt = isValidIsoDate(input.updatedAt)
      ? input.updatedAt!
      : createdAt;

    const version = typeof input.version === 'number' && Number.isInteger(input.version) && input.version >= 1
      ? input.version
      : 1;

    const metadata = input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {};

    return {
      id,
      kind,
      displayName,
      firstName,
      lastName,
      companyName,
      email,
      phone,
      status,
      notes,
      createdAt,
      updatedAt,
      version,
      sourceDeviceId,
      syncStatus,
      schemaVersion: CUSTOMER_SCHEMA_VERSION,
      metadata,
    };
  }

  /**
   * Validates a CustomerDocument or partial input.
   */
  public static validate(input: unknown): ValidationResult<CustomerDocument> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [{ field: 'root', code: 'INVALID_TYPE', message: 'L\'input deve essere un oggetto' }],
      };
    }

    const raw = input as Partial<CustomerDocument>;
    const normalized = this.normalize(raw);

    if (!normalized.id) {
      issues.push({ field: 'id', code: 'REQUIRED_FIELD', message: 'L\'ID del cliente è obbligatorio' });
    }

    const validKinds: CustomerKind[] = ['individual', 'organization'];
    if (!validKinds.includes(raw.kind as CustomerKind)) {
      issues.push({ field: 'kind', code: 'INVALID_ENUM', message: 'Tipo cliente (kind) non valido' });
    }

    if (!normalized.displayName) {
      issues.push({ field: 'displayName', code: 'REQUIRED_FIELD', message: 'Il nome visualizzato (displayName) è obbligatorio' });
    }

    if (!normalized.email) {
      issues.push({ field: 'email', code: 'REQUIRED_FIELD', message: 'L\'email è obbligatoria' });
    } else if (!isValidEmail(normalized.email)) {
      issues.push({ field: 'email', code: 'INVALID_FORMAT', message: 'L\'indirizzo email non è formalmente valido' });
    }

    if (normalized.phone && !isValidPhone(normalized.phone)) {
      issues.push({ field: 'phone', code: 'INVALID_FORMAT', message: 'Il numero di telefono non è formalmente valido' });
    }

    const validStatuses: CustomerStatus[] = ['pending', 'active', 'suspended', 'archived'];
    if (!validStatuses.includes(raw.status as CustomerStatus)) {
      issues.push({ field: 'status', code: 'INVALID_ENUM', message: 'Stato cliente non valido' });
    }

    if (!isValidIsoDate(raw.createdAt)) {
      issues.push({ field: 'createdAt', code: 'INVALID_DATE', message: 'La data di creazione (createdAt) deve essere una data ISO valida' });
    }

    if (!isValidIsoDate(raw.updatedAt)) {
      issues.push({ field: 'updatedAt', code: 'INVALID_DATE', message: 'La data di aggiornamento (updatedAt) deve essere una data ISO valida' });
    } else if (isValidIsoDate(raw.createdAt) && !isChronological(normalized.createdAt, normalized.updatedAt)) {
      issues.push({ field: 'updatedAt', code: 'CHRONOLOGY_ERROR', message: 'updatedAt non può essere precedente a createdAt' });
    }

    if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) {
      issues.push({ field: 'version', code: 'INVALID_VERSION', message: 'La versione deve essere un numero intero >= 1' });
    }

    if (raw.schemaVersion !== CUSTOMER_SCHEMA_VERSION) {
      issues.push({ field: 'schemaVersion', code: 'UNSUPPORTED_SCHEMA', message: `Versione dello schema non supportata: attesa ${CUSTOMER_SCHEMA_VERSION}` });
    }

    if (normalized.kind === 'individual') {
      if (!normalized.firstName && !normalized.lastName && !normalized.displayName) {
        issues.push({ field: 'kind', code: 'INDIVIDUAL_NAME_MISSING', message: 'Per i clienti individuali occorre almeno uno tra nome, cognome o nome visualizzato' });
      }
    } else if (normalized.kind === 'organization') {
      if (!normalized.companyName && !normalized.displayName) {
        issues.push({ field: 'kind', code: 'ORGANIZATION_NAME_MISSING', message: 'Per le organizzazioni occorre almeno il nome azienda o nome visualizzato' });
      }
    }

    return {
      isValid: issues.length === 0,
      value: issues.length === 0 ? normalized : null,
      issues,
    };
  }

  /**
   * Fast boolean check for CustomerDocument validity.
   */
  public static isValid(input: unknown): boolean {
    return this.validate(input).isValid;
  }
}
