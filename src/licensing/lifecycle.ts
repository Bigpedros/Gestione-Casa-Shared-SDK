import { LicenseValidator } from './LicenseValidator.js';
import type {
  ClientLicenseSnapshot,
  LicenseEvaluationResult,
  LicenseLifecycleStatus,
  LicenseTerm,
} from './types.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateExpirationDate(
  activatedAt: string,
  term: LicenseTerm,
): string | null {
  if (term === 'perpetual') return null;

  const activationDate = parseDate(activatedAt);
  if (!activationDate) {
    throw new Error('Data di attivazione non valida.');
  }

  const expiration = new Date(activationDate.getTime());
  if (term === 'beta_60_days') {
    expiration.setUTCDate(expiration.getUTCDate() + 60);
  } else {
    expiration.setUTCFullYear(expiration.getUTCFullYear() + 1);
  }

  return expiration.toISOString();
}

export function calculateRemainingDays(
  expiresAt: string | null,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;

  const expiration = parseDate(expiresAt);
  if (!expiration) return 0;

  const difference = expiration.getTime() - now.getTime();
  if (difference <= 0) return 0;
  return Math.ceil(difference / DAY_MS);
}

function inactiveReason(status: LicenseLifecycleStatus): string {
  switch (status) {
    case 'generated':
    case 'assigned':
    case 'sent':
      return 'Licenza non ancora attivata.';
    case 'suspended':
      return 'Licenza sospesa.';
    case 'revoked':
      return 'Licenza revocata.';
    case 'expired':
      return 'Licenza scaduta.';
    case 'invalid':
      return 'Licenza non valida.';
    case 'activated':
      return '';
  }
}

export function evaluateLicense(
  snapshot: ClientLicenseSnapshot,
  now: Date = new Date(),
): LicenseEvaluationResult {
  const parsedCode = LicenseValidator.parse(snapshot.licenseCode);
  if (!parsedCode.isValid) {
    return {
      isCodeValid: false,
      isLifecycleValid: false,
      isUsable: false,
      effectiveStatus: 'invalid',
      remainingDays: null,
      reason: parsedCode.error ?? 'Codice licenza non valido.',
    };
  }

  if (snapshot.status !== 'activated') {
    return {
      isCodeValid: true,
      isLifecycleValid: snapshot.status !== 'invalid',
      isUsable: false,
      effectiveStatus: snapshot.status,
      remainingDays: calculateRemainingDays(snapshot.expiresAt, now),
      reason: inactiveReason(snapshot.status),
    };
  }

  if (snapshot.term !== 'perpetual' && !snapshot.expiresAt) {
    return {
      isCodeValid: true,
      isLifecycleValid: false,
      isUsable: false,
      effectiveStatus: 'invalid',
      remainingDays: null,
      reason: 'La licenza a termine non contiene una data di scadenza.',
    };
  }

  const remainingDays = calculateRemainingDays(snapshot.expiresAt, now);
  if (remainingDays === 0 && snapshot.term !== 'perpetual') {
    return {
      isCodeValid: true,
      isLifecycleValid: true,
      isUsable: false,
      effectiveStatus: 'expired',
      remainingDays: 0,
      reason: 'Licenza scaduta.',
    };
  }

  return {
    isCodeValid: true,
    isLifecycleValid: true,
    isUsable: true,
    effectiveStatus: 'activated',
    remainingDays,
  };
}
