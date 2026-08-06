import test from 'node:test';
import assert from 'node:assert/strict';
import { ContactRequestValidator } from '../dist/index.js';

test('accetta una richiesta email valida', () => {
  const input = {
    id: 'req-001',
    requestType: 'license_request',
    status: 'new',
    source: 'gestione_casa_ocr',
    displayName: '   Marco Polo   ',
    firstName: 'Marco',
    lastName: 'Polo',
    email: ' MARCO.POLO@DESK.IT ',
    preferredContactChannel: 'email',
    subject: ' Richiesta nuova licenza ',
    message: ' Vorrei acquistare una licenza annua ',
    privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z',
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, true);
  assert.notEqual(validation.value, null);

  const doc = validation.value;
  assert.equal(doc.id, 'req-001');
  assert.equal(doc.displayName, 'Marco Polo');
  assert.equal(doc.email, 'marco.polo@desk.it');
  assert.equal(doc.subject, 'Richiesta nuova licenza');
  assert.equal(doc.message, 'Vorrei acquistare una licenza annua');
  assert.equal(doc.preferredContactChannel, 'email');
  assert.equal(doc.status, 'new');
});

test('accetta una richiesta con canale telefonico e telefono valido', () => {
  const input = {
    id: 'req-002',
    requestType: 'support',
    status: 'in_review',
    source: 'license_manager',
    displayName: 'Azienda Alfa',
    companyName: 'Alfa S.r.l.',
    email: 'supporto@alfa.com',
    phone: '+3902998877',
    preferredContactChannel: 'phone',
    subject: 'Richiesta assistenza tecnica',
    message: 'Non riesco ad attivare l\'app',
    privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T11:00:00.000Z',
    reviewedAt: '2026-08-06T11:00:00.000Z',
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, true);
  assert.equal(validation.value.preferredContactChannel, 'phone');
  assert.equal(validation.value.phone, '+3902998877');
});

test('rifiuta il canale telefonico senza telefono', () => {
  const input = {
    id: 'req-err-1',
    requestType: 'support',
    status: 'new',
    source: 'manual',
    displayName: 'Test User',
    email: 'user@test.it',
    phone: '',
    preferredContactChannel: 'phone',
    subject: 'Oggetto',
    message: 'Messaggio',
    privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z',
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.code === 'REQUIRED_FOR_PHONE_CHANNEL'), true);
});

test('rifiuta la richiesta senza consenso privacy', () => {
  const input = {
    id: 'req-err-2',
    requestType: 'information',
    status: 'new',
    source: 'manual',
    displayName: 'Test Privacy',
    email: 'privacy@test.it',
    preferredContactChannel: 'email',
    subject: 'Info',
    message: 'Chiedo informazioni',
    privacyAcceptedAt: '',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z',
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.field === 'privacyAcceptedAt'), true);
});

test('rifiuta converted_to_customer senza linkedCustomerId', () => {
  const input = {
    id: 'req-err-3',
    requestType: 'license_request',
    status: 'converted_to_customer',
    source: 'gestione_casa_ocr',
    displayName: 'Mario',
    email: 'mario@test.it',
    preferredContactChannel: 'email',
    subject: 'Licenza',
    message: 'Vorrei la licenza',
    privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z',
    linkedCustomerId: null,
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.code === 'REQUIRED_FOR_CONVERTED'), true);
});

test('rifiuta linkedLicenseId senza linkedCustomerId', () => {
  const input = {
    id: 'req-err-4',
    requestType: 'license_request',
    status: 'in_review',
    source: 'gestione_casa_ocr',
    displayName: 'Mario',
    email: 'mario@test.it',
    preferredContactChannel: 'email',
    subject: 'Licenza',
    message: 'Vorrei la licenza',
    privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z',
    linkedCustomerId: null,
    linkedLicenseId: 'lic-999',
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.code === 'CUSTOMER_LINK_REQUIRED'), true);
});

test('rifiuta closed o rejected senza closedAt', () => {
  const input = {
    id: 'req-err-5',
    requestType: 'support',
    status: 'closed',
    source: 'manual',
    displayName: 'Test Closed',
    email: 'closed@test.it',
    preferredContactChannel: 'email',
    subject: 'Chiusura',
    message: 'Da chiudere',
    privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z',
    closedAt: null,
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.code === 'REQUIRED_FOR_CLOSED_OR_REJECTED'), true);
});

test('normalizza email, testi e campi nullable', () => {
  const normalized = ContactRequestValidator.normalize({
    id: 'req-norm',
    firstName: '  ',
    lastName: '',
    companyName: '  ',
    phone: '  ',
    sourceDeviceId: '  ',
    sourceAppVersion: '',
  });

  assert.equal(normalized.firstName, null);
  assert.equal(normalized.lastName, null);
  assert.equal(normalized.companyName, null);
  assert.equal(normalized.phone, null);
  assert.equal(normalized.sourceDeviceId, null);
  assert.equal(normalized.sourceAppVersion, null);
});

test('verifica la coerenza cronologica delle date', () => {
  const input = {
    id: 'req-chron',
    requestType: 'support',
    status: 'new',
    source: 'manual',
    displayName: 'Test Dates',
    email: 'date@test.it',
    preferredContactChannel: 'email',
    subject: 'Oggetto',
    message: 'Messaggio',
    privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-05T10:00:00.000Z', // Precedente!
    schemaVersion: 1,
  };

  const validation = ContactRequestValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.code === 'CHRONOLOGY_ERROR'), true);
});
