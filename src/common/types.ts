export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  value: T | null;
  issues: ValidationIssue[];
}
