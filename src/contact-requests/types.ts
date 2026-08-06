import type { SyncStatus } from '../common/types.js';

export const CONTACT_REQUEST_SCHEMA_VERSION = 1 as const;

export type ContactRequestSchemaVersion = typeof CONTACT_REQUEST_SCHEMA_VERSION;

export type ContactRequestType =
  | 'information'
  | 'support'
  | 'license_request'
  | 'activation_request'
  | 'renewal_request'
  | 'other';

export type ContactRequestStatus =
  | 'new'
  | 'in_review'
  | 'converted_to_customer'
  | 'rejected'
  | 'closed';

export type ContactRequestSource =
  | 'gestione_casa_ocr'
  | 'license_manager'
  | 'manual';

export type PreferredContactChannel =
  | 'email'
  | 'phone';

export interface ContactRequestDocument {
  id: string;
  requestType: ContactRequestType;
  status: ContactRequestStatus;
  source: ContactRequestSource;

  displayName: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string;
  phone: string | null;
  preferredContactChannel: PreferredContactChannel;

  subject: string;
  message: string;
  privacyAcceptedAt: string;

  linkedCustomerId: string | null;
  linkedLicenseId: string | null;

  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  closedAt: string | null;

  sourceDeviceId: string | null;
  sourceAppVersion: string | null;
  syncStatus: SyncStatus;
  schemaVersion: ContactRequestSchemaVersion;
  metadata: Record<string, unknown>;
}
