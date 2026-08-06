import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createContactRequestExchangeEnvelope,
  validateContactRequestExchangeEnvelope,
  serializeContactRequestExchangeEnvelope,
  deserializeContactRequestExchangeEnvelope,
  buildContactRequestExchangeFileName,
  CONTACT_REQUEST_EXCHANGE_FORMAT,
  CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION,
} from '../dist/contact-requests/index.js';
import * as PublicSDK from '../dist/index.js';

const validRequestDoc = {
  id: 'req-test-100',
  requestType: 'license_request',
  status: 'new',
  source: 'gestione_casa_ocr',
  displayName: 'Mario Rossi',
  firstName: 'Mario',
  lastName: 'Rossi',
  companyName: null,
  email: 'mario.rossi@example.com',
  phone: '+39 333 1234567',
  preferredContactChannel: 'email',
  subject: 'Richiesta licenza',
  message: 'Desidero acquistare una licenza',
  privacyAcceptedAt: '2026-08-06T10:00:00.000Z',
  linkedCustomerId: null,
  linkedLicenseId: null,
  createdAt: '2026-08-06T10:00:00.000Z',
  updatedAt: '2026-08-06T10:00:00.000Z',
  reviewedAt: null,
  closedAt: null,
  sourceDeviceId: 'dev-1',
  sourceAppVersion: '1.0.0',
  syncStatus: 'pending',
  schemaVersion: 1,
  metadata: { note: 'test' },
};

test('1. crea un envelope valido da un ContactRequestDocument valido', () => {
  const result = createContactRequestExchangeEnvelope(validRequestDoc);
  assert.equal(result.isValid, true);
  assert.notEqual(result.value, null);
  assert.equal(result.value.request.id, 'req-test-100');
});

test('2. applica format e formatVersion canonici', () => {
  const result = createContactRequestExchangeEnvelope(validRequestDoc);
  assert.equal(result.value.format, CONTACT_REQUEST_EXCHANGE_FORMAT);
  assert.equal(result.value.format, 'gestione-casa-contact-request');
  assert.equal(result.value.formatVersion, CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION);
  assert.equal(result.value.formatVersion, 1);
});

test('3. genera exportedAt automaticamente', () => {
  const before = new Date().getTime();
  const result = createContactRequestExchangeEnvelope(validRequestDoc);
  const after = new Date().getTime();

  assert.equal(result.isValid, true);
  const expTime = new Date(result.value.exportedAt).getTime();
  assert.equal(expTime >= before && expTime <= after, true);
});

test('4. accetta exportedAt ISO fornito', () => {
  const customIso = '2026-08-06T12:34:56.000Z';
  const result = createContactRequestExchangeEnvelope(validRequestDoc, customIso);
  assert.equal(result.isValid, true);
  assert.equal(result.value.exportedAt, customIso);
});

test('5. normalizza la richiesta interna tramite ContactRequestValidator', () => {
  const unnormalizedRequest = {
    ...validRequestDoc,
    email: '  MARIO.ROSSI@EXAMPLE.COM  ',
    subject: '  Richiesta   licenza  ',
  };
  const result = createContactRequestExchangeEnvelope(unnormalizedRequest);
  assert.equal(result.isValid, true);
  assert.equal(result.value.request.email, 'mario.rossi@example.com');
  assert.equal(result.value.request.subject, 'Richiesta licenza');
});

test('6. non modifica l’oggetto sorgente', () => {
  const sourceObj = {
    ...validRequestDoc,
    email: ' SOURCE.USER@EXAMPLE.COM ',
  };
  const freezeCheck = sourceObj.email;
  createContactRequestExchangeEnvelope(sourceObj);
  assert.equal(sourceObj.email, freezeCheck);
});

test('7. rifiuta format errato', () => {
  const invalidEnvelope = {
    format: 'wrong-format',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: validRequestDoc,
  };
  const result = validateContactRequestExchangeEnvelope(invalidEnvelope);
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'exchange.invalid_format'), true);
});

test('8. rifiuta formatVersion diversa da 1', () => {
  const invalidEnvelope = {
    format: 'gestione-casa-contact-request',
    formatVersion: 2,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: validRequestDoc,
  };
  const result = validateContactRequestExchangeEnvelope(invalidEnvelope);
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'exchange.unsupported_format_version'), true);
});

test('9. rifiuta exportedAt non ISO', () => {
  const invalidEnvelope = {
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: 'data-non-valida',
    request: validRequestDoc,
  };
  const result = validateContactRequestExchangeEnvelope(invalidEnvelope);
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'exchange.invalid_exported_at'), true);
});

test('10. rifiuta request mancante', () => {
  const invalidEnvelope = {
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
  };
  const result = validateContactRequestExchangeEnvelope(invalidEnvelope);
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'exchange.missing_request'), true);
});

test('11. rifiuta request non valida', () => {
  const invalidEnvelope = {
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: {
      ...validRequestDoc,
      email: 'email-non-valida',
    },
  };
  const result = validateContactRequestExchangeEnvelope(invalidEnvelope);
  assert.equal(result.isValid, false);
  assert.equal(result.issues.length > 0, true);
});

test('12. rifiuta metadata assente, null o array', () => {
  const reqNoMetadata = { ...validRequestDoc };
  delete reqNoMetadata.metadata;

  const res1 = validateContactRequestExchangeEnvelope({
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: reqNoMetadata,
  });
  assert.equal(res1.isValid, false);
  assert.equal(res1.issues.some((i) => i.field === 'request.metadata'), true);

  const res2 = validateContactRequestExchangeEnvelope({
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: {
      ...validRequestDoc,
      metadata: null,
    },
  });
  assert.equal(res2.isValid, false);
  assert.equal(res2.issues.some((i) => i.field === 'request.metadata'), true);

  const res3 = validateContactRequestExchangeEnvelope({
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: {
      ...validRequestDoc,
      metadata: [1, 2, 3],
    },
  });
  assert.equal(res3.isValid, false);
  assert.equal(res3.issues.some((i) => i.field === 'request.metadata'), true);

  const createRes = createContactRequestExchangeEnvelope(reqNoMetadata);
  assert.equal(createRes.isValid, false);
});

test('13. rifiuta schemaVersion assente o diversa da 1', () => {
  const reqNoSchema = { ...validRequestDoc };
  delete reqNoSchema.schemaVersion;

  const res1 = validateContactRequestExchangeEnvelope({
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: reqNoSchema,
  });
  assert.equal(res1.isValid, false);
  assert.equal(res1.issues.some((i) => i.code === 'UNSUPPORTED_SCHEMA'), true);

  const res2 = validateContactRequestExchangeEnvelope({
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: {
      ...validRequestDoc,
      schemaVersion: 99,
    },
  });
  assert.equal(res2.isValid, false);
  assert.equal(res2.issues.some((i) => i.code === 'UNSUPPORTED_SCHEMA'), true);
});

test('14. rifiuta linkedLicenseId senza linkedCustomerId', () => {
  const invalidEnvelope = {
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: {
      ...validRequestDoc,
      linkedCustomerId: null,
      linkedLicenseId: 'lic-123',
    },
  };
  const result = validateContactRequestExchangeEnvelope(invalidEnvelope);
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'CUSTOMER_LINK_REQUIRED'), true);
});

test('15. serializza un envelope valido', () => {
  const envelope = createContactRequestExchangeEnvelope(validRequestDoc, '2026-08-06T10:00:00.000Z').value;
  const ser = serializeContactRequestExchangeEnvelope(envelope);
  assert.equal(ser.isValid, true);
  assert.equal(typeof ser.value, 'string');
  assert.equal(ser.value.includes('"gestione-casa-contact-request"'), true);
});

test('16. produce JSON leggibile e parseable', () => {
  const envelope = createContactRequestExchangeEnvelope(validRequestDoc, '2026-08-06T10:00:00.000Z').value;
  const ser = serializeContactRequestExchangeEnvelope(envelope);
  assert.equal(ser.isValid, true);
  const parsed = JSON.parse(ser.value);
  assert.equal(parsed.format, 'gestione-casa-contact-request');
  assert.equal(ser.value.includes('\n  "format":'), true); // 2 spaces indentation
});

test('17. esegue correttamente il round-trip serializzazione/deserializzazione', () => {
  const originalEnv = createContactRequestExchangeEnvelope(validRequestDoc, '2026-08-06T10:00:00.000Z').value;
  const serialized = serializeContactRequestExchangeEnvelope(originalEnv).value;
  const deserialized = deserializeContactRequestExchangeEnvelope(serialized);

  assert.equal(deserialized.isValid, true);
  assert.deepEqual(deserialized.value, originalEnv);
});

test('18. rifiuta JSON malformato', () => {
  const result = deserializeContactRequestExchangeEnvelope('{ json-sbagliato: ');
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'exchange.invalid_json'), true);
});

test('19. rifiuta stringa JSON vuota', () => {
  const result = deserializeContactRequestExchangeEnvelope('   ');
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'exchange.invalid_json'), true);
});

test('20. rifiuta enum non canonici nel documento interno', () => {
  const invalidEnvelope = {
    format: 'gestione-casa-contact-request',
    formatVersion: 1,
    exportedAt: '2026-08-06T10:00:00.000Z',
    request: {
      ...validRequestDoc,
      requestType: 'enum_inventato',
    },
  };
  const result = validateContactRequestExchangeEnvelope(invalidEnvelope);
  assert.equal(result.isValid, false);
  assert.equal(result.issues.some((i) => i.code === 'INVALID_ENUM' || i.code === 'exchange.invalid_request'), true);
});

test('21. genera il nome file nel formato congelato', () => {
  const envelope = createContactRequestExchangeEnvelope(validRequestDoc, '2026-08-06T16:15:00.000Z').value;
  const filenameResult = buildContactRequestExchangeFileName(envelope);

  assert.equal(filenameResult.isValid, true);
  assert.equal(filenameResult.value, 'gestione-casa-contact-request_req-test-100_20260806-161500.json');
});

test('22. il nome file non contiene nome, email o telefono', () => {
  const envelope = createContactRequestExchangeEnvelope(validRequestDoc, '2026-08-06T16:15:00.000Z').value;
  const filename = buildContactRequestExchangeFileName(envelope).value;

  assert.equal(filename.includes('Mario'), false);
  assert.equal(filename.includes('Rossi'), false);
  assert.equal(filename.includes('mario.rossi'), false);
  assert.equal(filename.includes('3331234567'), false);
});

test('23. la serializzazione non modifica pending in synced', () => {
  const requestWithPending = {
    ...validRequestDoc,
    syncStatus: 'pending',
  };
  const envelope = createContactRequestExchangeEnvelope(requestWithPending, '2026-08-06T10:00:00.000Z').value;
  const serializedStr = serializeContactRequestExchangeEnvelope(envelope).value;
  const parsed = JSON.parse(serializedStr);

  assert.equal(parsed.request.syncStatus, 'pending');
});

test('24. due envelope con stesso contenuto ed exportedAt producono lo stesso nome file', () => {
  const env1 = createContactRequestExchangeEnvelope(validRequestDoc, '2026-08-06T16:15:00.000Z').value;
  const env2 = createContactRequestExchangeEnvelope(validRequestDoc, '2026-08-06T16:15:00.000Z').value;

  const file1 = buildContactRequestExchangeFileName(env1).value;
  const file2 = buildContactRequestExchangeFileName(env2).value;

  assert.equal(file1, file2);
});

test('25. il pacchetto pubblico esporta tutte le nuove API dal sottopercorso contact-requests e root', () => {
  assert.equal(typeof PublicSDK.createContactRequestExchangeEnvelope, 'function');
  assert.equal(typeof PublicSDK.validateContactRequestExchangeEnvelope, 'function');
  assert.equal(typeof PublicSDK.serializeContactRequestExchangeEnvelope, 'function');
  assert.equal(typeof PublicSDK.deserializeContactRequestExchangeEnvelope, 'function');
  assert.equal(typeof PublicSDK.buildContactRequestExchangeFileName, 'function');
  assert.equal(PublicSDK.CONTACT_REQUEST_EXCHANGE_FORMAT, 'gestione-casa-contact-request');
  assert.equal(PublicSDK.CONTACT_REQUEST_EXCHANGE_FORMAT_VERSION, 1);
});
