import {
  LICENSE_CODE_RAW_LENGTH,
  LICENSE_PAYLOAD_LENGTH,
  SAFE_ALPHABET,
} from './constants.js';
import type { LicenseParseResult } from './types.js';

const SAFE_ALPHABET_SET = new Set<string>(SAFE_ALPHABET);

export class LicenseValidator {
  static normalize(input: string): string {
    if (!input) return '';

    const clean = input.trim().toUpperCase().replace(/[\s_-]/g, '');
    if (clean.length === LICENSE_CODE_RAW_LENGTH) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}`;
    }

    return clean;
  }

  static validateFormat(code: string): boolean {
    const normalized = this.normalize(code);
    if (normalized.length !== 19) return false;

    const groups = normalized.split('-');
    if (groups.length !== 4) return false;

    return groups.every(
      (group) =>
        group.length === 4 &&
        [...group].every((character) => SAFE_ALPHABET_SET.has(character)),
    );
  }

  static calculateChecksumChar(base15: string): string {
    if (base15.length !== LICENSE_PAYLOAD_LENGTH) return '';

    let weightedSum = 0;
    for (let index = 0; index < base15.length; index += 1) {
      const character = base15[index];
      if (!character) return '';

      const alphabetIndex = SAFE_ALPHABET.indexOf(
        character as (typeof SAFE_ALPHABET)[number],
      );
      if (alphabetIndex === -1) return '';

      weightedSum += alphabetIndex * (index + 1);
    }

    return SAFE_ALPHABET[weightedSum % SAFE_ALPHABET.length] ?? '';
  }

  static validateChecksum(code: string): boolean {
    const normalized = this.normalize(code);
    if (!this.validateFormat(normalized)) return false;

    const raw16 = normalized.replace(/-/g, '');
    const payloadBase = raw16.slice(0, LICENSE_PAYLOAD_LENGTH);
    const expectedChecksum = raw16.slice(LICENSE_PAYLOAD_LENGTH);
    return this.calculateChecksumChar(payloadBase) === expectedChecksum;
  }

  static parse(input: string): LicenseParseResult {
    const normalizedCode = this.normalize(input);
    const isFormatValid = this.validateFormat(normalizedCode);
    const isChecksumValid = isFormatValid && this.validateChecksum(normalizedCode);
    const raw16 = isFormatValid ? normalizedCode.replace(/-/g, '') : '';

    let error: string | undefined;
    if (!normalizedCode) {
      error = 'Codice licenza vuoto.';
    } else if (!isFormatValid) {
      error = 'Formato codice non valido o caratteri non consentiti.';
    } else if (!isChecksumValid) {
      error = 'Checksum non valido: codice alterato o digitato in modo errato.';
    }

    return {
      rawInput: input,
      normalizedCode,
      isFormatValid,
      isChecksumValid,
      isValid: isFormatValid && isChecksumValid,
      groups: isFormatValid ? normalizedCode.split('-') : [],
      payloadBase: raw16.slice(0, LICENSE_PAYLOAD_LENGTH),
      checksumChar: raw16.slice(LICENSE_PAYLOAD_LENGTH),
      ...(error ? { error } : {}),
    };
  }

  static isValid(input: string): boolean {
    return this.parse(input).isValid;
  }
}
