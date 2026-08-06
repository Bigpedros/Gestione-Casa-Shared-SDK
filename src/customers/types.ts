import type { SyncStatus } from '../common/types.js';

export const CUSTOMER_SCHEMA_VERSION = 1 as const;

export type CustomerSchemaVersion = typeof CUSTOMER_SCHEMA_VERSION;

export type CustomerKind = 'individual' | 'organization';

export type CustomerStatus = 'pending' | 'active' | 'suspended' | 'archived';

export interface CustomerDocument {
  id: string;
  kind: CustomerKind;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  sourceDeviceId: string | null;
  syncStatus: SyncStatus;
  schemaVersion: CustomerSchemaVersion;
  metadata: Record<string, unknown>;
}
