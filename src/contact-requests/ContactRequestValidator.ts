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
  CONTACT_REQUEST_SCHEMA_VERSION,
  type ContactRequestDocument,
  type ContactRequestType,
  type ContactRequestStatus,
  type ContactRequestSource,
  type PreferredContactChannel,
} from './types.js';

export class ContactRequestValidator {
  /**
   * Normalizes input data for ContactRequestDocument.
   */
  public static normalize(input: Partial<ContactRequestDocument>): ContactRequestDocument {
    const id = (input.id || '').trim();

    const validRequestTypes: ContactRequestType[] = [
      'information',
      'support',
      'license_request',
      'activation_request',
      'renewal_request',
      'other',
    ];
    const requestType: ContactRequestType = validRequestTypes.includes(input.requestType as ContactRequestType)
      ? (input.requestType as ContactRequestType)
      : 'information';

    const validStatuses: ContactRequestStatus[] = [
      'new',
      'in_review',
      'converted_to_customer',
      'rejected',
      'closed',
    ];
    const status: ContactRequestStatus = validStatuses.includes(input.status as ContactRequestStatus)
      ? (input.status as ContactRequestStatus)
      : 'new';

    const validSources: ContactRequestSource[] = ['gestione_casa_ocr', 'license_manager', 'manual'];
    const source: ContactRequestSource = validSources.includes(input.source as ContactRequestSource)
      ? (input.source as ContactRequestSource)
      : 'manual';

    const validChannels: PreferredContactChannel[] = ['email', 'phone'];
    const preferredContactChannel: PreferredContactChannel = validChannels.includes(input.preferredContactChannel as PreferredContactChannel)
      ? (input.preferredContactChannel as PreferredContactChannel)
      : 'email';

    const firstName = normalizeText(input.firstName);
    const lastName = normalizeText(input.lastName);
    const companyName = normalizeText(input.companyName);
    const rawDisplayName = normalizeText(input.displayName);

    let displayName = rawDisplayName || '';
    if (!displayName) {
      if (firstName || lastName) {
        displayName = [firstName, lastName].filter(Boolean).join(' ');
      } else if (companyName) {
        displayName = companyName;
      }
    }

    const email = normalizeEmail(input.email) || '';
    const phone = normalizeText(input.phone);
    const subject = normalizeText(input.subject) || '';
    const message = normalizeText(input.message) || '';

    const privacyAcceptedAt = isValidIsoDate(input.privacyAcceptedAt)
      ? input.privacyAcceptedAt!
      : '';

    const linkedCustomerId = normalizeText(input.linkedCustomerId);
    const linkedLicenseId = normalizeText(input.linkedLicenseId);

    const createdAt = isValidIsoDate(input.createdAt)
      ? input.createdAt!
      : new Date().toISOString();
    const updatedAt = isValidIsoDate(input.updatedAt)
      ? input.updatedAt!
      : createdAt;

    const reviewedAt = isValidIsoDate(input.reviewedAt) ? input.reviewedAt! : null;
    const closedAt = isValidIsoDate(input.closedAt) ? input.closedAt! : null;

    const sourceDeviceId = normalizeText(input.sourceDeviceId);
    const sourceAppVersion = normalizeText(input.sourceAppVersion);

    const validSyncStatuses: SyncStatus[] = ['pending', 'synced', 'conflict'];
    const syncStatus: SyncStatus = validSyncStatuses.includes(input.syncStatus as SyncStatus)
      ? (input.syncStatus as SyncStatus)
      : 'pending';

    const metadata = input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {};

    return {
      id,
      requestType,
      status,
      source,
      displayName,
      firstName,
      lastName,
      companyName,
      email,
      phone,
      preferredContactChannel,
      subject,
      message,
      privacyAcceptedAt,
      linkedCustomerId,
      linkedLicenseId,
      createdAt,
      updatedAt,
      reviewedAt,
      closedAt,
      sourceDeviceId,
      sourceAppVersion,
      syncStatus,
      schemaVersion: CONTACT_REQUEST_SCHEMA_VERSION,
      metadata,
    };
  }

  /**
   * Validates a ContactRequestDocument or partial input.
   */
  public static validate(input: unknown): ValidationResult<ContactRequestDocument> {
    const issues: ValidationIssue[] = [];

    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        value: null,
        issues: [{ field: 'root', code: 'INVALID_TYPE', message: 'L\'input deve essere un oggetto' }],
      };
    }

    const raw = input as Partial<ContactRequestDocument>;
    const normalized = this.normalize(raw);

    if (!normalized.id) {
      issues.push({ field: 'id', code: 'REQUIRED_FIELD', message: 'L\'ID della richiesta è obbligatorio' });
    }

    const validRequestTypes: ContactRequestType[] = [
      'information',
      'support',
      'license_request',
      'activation_request',
      'renewal_request',
      'other',
    ];
    if (!validRequestTypes.includes(raw.requestType as ContactRequestType)) {
      issues.push({ field: 'requestType', code: 'INVALID_ENUM', message: 'Tipo di richiesta non valido' });
    }

    const validStatuses: ContactRequestStatus[] = [
      'new',
      'in_review',
      'converted_to_customer',
      'rejected',
      'closed',
    ];
    if (!validStatuses.includes(raw.status as ContactRequestStatus)) {
      issues.push({ field: 'status', code: 'INVALID_ENUM', message: 'Stato richiesta non valido' });
    }

    const validSources: ContactRequestSource[] = ['gestione_casa_ocr', 'license_manager', 'manual'];
    if (!validSources.includes(raw.source as ContactRequestSource)) {
      issues.push({ field: 'source', code: 'INVALID_ENUM', message: 'Sorgente richiesta non valida' });
    }

    const validChannels: PreferredContactChannel[] = ['email', 'phone'];
    if (!validChannels.includes(raw.preferredContactChannel as PreferredContactChannel)) {
      issues.push({ field: 'preferredContactChannel', code: 'INVALID_ENUM', message: 'Canale di contatto preferito non valido' });
    }

    if (!normalized.displayName) {
      issues.push({ field: 'displayName', code: 'REQUIRED_FIELD', message: 'Il nome del contatto (displayName) è obbligatorio' });
    }

    if (!normalized.email) {
      issues.push({ field: 'email', code: 'REQUIRED_FIELD', message: 'L\'email del contatto è obbligatoria' });
    } else if (!isValidEmail(normalized.email)) {
      issues.push({ field: 'email', code: 'INVALID_FORMAT', message: 'L\'email del contatto non è formalmente valida' });
    }

    if (normalized.phone && !isValidPhone(normalized.phone)) {
      issues.push({ field: 'phone', code: 'INVALID_FORMAT', message: 'Il numero di telefono non è formalmente valido' });
    }

    if (normalized.preferredContactChannel === 'phone') {
      if (!normalized.phone) {
        issues.push({ field: 'phone', code: 'REQUIRED_FOR_PHONE_CHANNEL', message: 'Il telefono è obbligatorio se il canale preferito è "phone"' });
      }
    }

    if (!normalized.subject) {
      issues.push({ field: 'subject', code: 'REQUIRED_FIELD', message: 'L\'oggetto della richiesta è obbligatorio' });
    }

    if (!normalized.message) {
      issues.push({ field: 'message', code: 'REQUIRED_FIELD', message: 'Il messaggio della richiesta è obbligatorio' });
    }

    if (!raw.privacyAcceptedAt || !isValidIsoDate(raw.privacyAcceptedAt)) {
      issues.push({ field: 'privacyAcceptedAt', code: 'REQUIRED_DATE', message: 'La data di accettazione privacy (privacyAcceptedAt) è obbligatoria e deve essere un ISO valido' });
    }

    if (!isValidIsoDate(raw.createdAt)) {
      issues.push({ field: 'createdAt', code: 'INVALID_DATE', message: 'La data di creazione (createdAt) deve essere un ISO valido' });
    }

    if (!isValidIsoDate(raw.updatedAt)) {
      issues.push({ field: 'updatedAt', code: 'INVALID_DATE', message: 'La data di aggiornamento (updatedAt) deve essere un ISO valido' });
    } else if (isValidIsoDate(raw.createdAt) && !isChronological(normalized.createdAt, normalized.updatedAt)) {
      issues.push({ field: 'updatedAt', code: 'CHRONOLOGY_ERROR', message: 'updatedAt non può essere precedente a createdAt' });
    }

    if (raw.reviewedAt && !isValidIsoDate(raw.reviewedAt)) {
      issues.push({ field: 'reviewedAt', code: 'INVALID_DATE', message: 'reviewedAt deve essere una data ISO valida se valorizzato' });
    }

    if (raw.closedAt && !isValidIsoDate(raw.closedAt)) {
      issues.push({ field: 'closedAt', code: 'INVALID_DATE', message: 'closedAt deve essere una data ISO valida se valorizzato' });
    }

    if (normalized.status === 'converted_to_customer') {
      if (!normalized.linkedCustomerId) {
        issues.push({ field: 'linkedCustomerId', code: 'REQUIRED_FOR_CONVERTED', message: 'linkedCustomerId è obbligatorio per le richieste con stato "converted_to_customer"' });
      }
    }

    if (normalized.linkedLicenseId && !normalized.linkedCustomerId) {
      issues.push({ field: 'linkedLicenseId', code: 'CUSTOMER_LINK_REQUIRED', message: 'linkedLicenseId può essere valorizzato solo se è presente un linkedCustomerId' });
    }

    if (normalized.status === 'rejected' || normalized.status === 'closed') {
      if (!normalized.closedAt) {
        issues.push({ field: 'closedAt', code: 'REQUIRED_FOR_CLOSED_OR_REJECTED', message: 'closedAt è obbligatorio per le richieste chiuse o rifiutate' });
      }
    }

    if (raw.schemaVersion !== CONTACT_REQUEST_SCHEMA_VERSION) {
      issues.push({ field: 'schemaVersion', code: 'UNSUPPORTED_SCHEMA', message: `Versione dello schema non supportata: attesa ${CONTACT_REQUEST_SCHEMA_VERSION}` });
    }

    return {
      isValid: issues.length === 0,
      value: issues.length === 0 ? normalized : null,
      issues,
    };
  }

  /**
   * Fast boolean check for ContactRequestDocument validity.
   */
  public static isValid(input: unknown): boolean {
    return this.validate(input).isValid;
  }
}
