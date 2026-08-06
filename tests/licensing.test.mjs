import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LicenseEngine,
  LicenseValidator,
  calculateExpirationDate,
  calculateRemainingDays,
  evaluateLicense,
  managerEntityToDocument,
  documentToClientSnapshot,
} from '../dist/index.js';

const deterministicRandom = {
  fill(target) {
    for (let index = 0; index < target.length; index += 1) {
      target[index] = index;
    }
  },
};

test('genera un codice nel formato ufficiale con checksum valido', () => {
  const code = LicenseEngine.generateCode(deterministicRandom);
  assert.match(code, /^[A-Z3-9]{4}(?:-[A-Z3-9]{4}){3}$/);
  assert.equal(LicenseValidator.isValid(code), true);
});

test('normalizza spazi, underscore e trattini', () => {
  const code = LicenseEngine.generateCode(deterministicRandom);
  const raw = code.replaceAll('-', '').toLowerCase();
  assert.equal(LicenseValidator.normalize(raw), code);
  assert.equal(LicenseValidator.normalize(code.replaceAll('-', '_')), code);
});

test('rifiuta un codice alterato', () => {
  const code = LicenseEngine.generateCode(deterministicRandom);
  const finalCharacter = code.at(-1);
  const replacement = finalCharacter === 'A' ? 'B' : 'A';
  const altered = `${code.slice(0, -1)}${replacement}`;
  assert.equal(LicenseValidator.isValid(altered), false);
});

test('calcola beta a 60 giorni e giorni residui', () => {
  const activatedAt = '2026-08-06T10:00:00.000Z';
  const expiresAt = calculateExpirationDate(activatedAt, 'beta_60_days');
  assert.equal(expiresAt, '2026-10-05T10:00:00.000Z');
  assert.equal(
    calculateRemainingDays(expiresAt, new Date('2026-08-06T10:00:00.000Z')),
    60,
  );
});

test('valuta una licenza attiva e poi scaduta', () => {
  const code = LicenseEngine.generateCode(deterministicRandom);
  const snapshot = {
    licenseCode: code,
    edition: 'standard',
    term: 'annual',
    status: 'activated',
    owner: 'Utente Test',
    customerId: null,
    deviceId: null,
    activatedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2027-01-01T00:00:00.000Z',
    engineVersion: '2.1',
    schemaVersion: 1,
  };

  assert.equal(evaluateLicense(snapshot, new Date('2026-08-06T00:00:00.000Z')).isUsable, true);
  const expired = evaluateLicense(snapshot, new Date('2027-01-02T00:00:00.000Z'));
  assert.equal(expired.isUsable, false);
  assert.equal(expired.effectiveStatus, 'expired');
});

test('converte una licenza del manager nel documento canonico', () => {
  const code = LicenseEngine.generateCode(deterministicRandom);
  const document = managerEntityToDocument(
    {
      id: 'license-1',
      licenseCode: code,
      licenseType: 'Professional',
      status: 'activated',
      customerId: 'customer-1',
      customerName: 'Mario Rossi',
      generatedAt: '2026-08-01T00:00:00.000Z',
      activatedAt: '2026-08-02T00:00:00.000Z',
      expiresAt: '2027-08-02T00:00:00.000Z',
    },
    'annual',
  );

  assert.equal(document.edition, 'professional');
  assert.equal(document.owner, 'Mario Rossi');
  assert.equal(documentToClientSnapshot(document).licenseCode, code);
});
