import {
  LICENSE_PAYLOAD_LENGTH,
  SAFE_ALPHABET,
} from './constants.js';
import { LicenseValidator } from './LicenseValidator.js';
import type { LicenseCodeRandomSource } from './types.js';

const systemRandomSource: LicenseCodeRandomSource = {
  fill(target: Uint32Array): void {
    const cryptoObject = globalThis.crypto;
    if (!cryptoObject?.getRandomValues) {
      throw new Error('Generatore casuale crittograficamente sicuro non disponibile.');
    }
    cryptoObject.getRandomValues(target);
  },
};

export class LicenseEngine {
  static generateCode(randomSource: LicenseCodeRandomSource = systemRandomSource): string {
    const payloadCharacters: string[] = [];
    const randomValues = new Uint32Array(LICENSE_PAYLOAD_LENGTH);
    randomSource.fill(randomValues);

    for (const value of randomValues) {
      const character = SAFE_ALPHABET[value % SAFE_ALPHABET.length];
      if (!character) {
        throw new Error('Impossibile selezionare un carattere licenza valido.');
      }
      payloadCharacters.push(character);
    }

    const payloadBase = payloadCharacters.join('');
    const checksum = LicenseValidator.calculateChecksumChar(payloadBase);
    const raw16 = `${payloadBase}${checksum}`;

    return `${raw16.slice(0, 4)}-${raw16.slice(4, 8)}-${raw16.slice(8, 12)}-${raw16.slice(12, 16)}`;
  }

  static async generateUniqueCode(
    codeExists: (code: string) => Promise<boolean>,
    maxRetries = 10,
    randomSource: LicenseCodeRandomSource = systemRandomSource,
  ): Promise<string> {
    if (!Number.isInteger(maxRetries) || maxRetries < 1) {
      throw new Error('maxRetries deve essere un intero maggiore di zero.');
    }

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      const code = this.generateCode(randomSource);
      if (!(await codeExists(code))) return code;
    }

    throw new Error('Impossibile generare un codice licenza univoco.');
  }
}
