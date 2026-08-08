import type { LicenseDocument } from '../licensing/types.js';

/**
 * Builds the canonical payload v1 for a license document.
 * Guarantees exact deterministic JSON output matching License Manager 2.6.A.
 */
export function buildCanonicalLicensePayloadV1(license: LicenseDocument): string {
  const l = (license || {}) as unknown as Record<string, unknown>;

  const code = (
    (l.licenseCode as string) ||
    (l.code as string) ||
    ''
  )
    .toString()
    .toUpperCase()
    .trim();

  const canonicalObj = {
    checksum: (l.checksum as string) || '',
    customerId: (l.customerId as string) || null,
    deviceId:
      (l.deviceId as string) ||
      (l.sourceDeviceId as string) ||
      '',
    engineVersion: (l.engineVersion as string) || '2.1',
    expiresAt:
      (l.expiresAt as string) ||
      (l.expirationDate as string) ||
      null,
    generatedAt:
      (l.generatedAt as string) ||
      (l.createdDate as string) ||
      '',
    id: (l.id as string) || '',
    licenseCode: code,
    licenseType:
      (l.licenseType as string) ||
      (l.planType as string) ||
      'Standard',
    schemaVersion: (l.schemaVersion as number | string) ?? 1,
    status: ((l.status as string) || 'generated').toString(),
  };

  return JSON.stringify(canonicalObj);
}

