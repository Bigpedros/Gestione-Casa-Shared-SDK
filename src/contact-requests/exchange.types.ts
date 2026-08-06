import type { ContactRequestDocument } from './types.js';

export const CONTACT_REQUEST_EXCHANGE_FORMAT = 'gestione-casa-contact-request' as const;

export const CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION = 1 as const;

export type ContactRequestExchangeFormat = typeof CONTACT_REQUEST_EXCHANGE_FORMAT;

export type ContactRequestExchangeFormatVersion = typeof CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION;

export interface ContactRequestExchangeEnvelope {
  format: ContactRequestExchangeFormat;
  formatVersion: ContactRequestExchangeFormatVersion;
  exportedAt: string;
  request: ContactRequestDocument;
}
