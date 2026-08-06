import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CustomerValidator,
  managerCustomerEntityToDocument,
} from '../dist/index.js';

test('accetta e normalizza un cliente individuale valido', () => {
  const input = {
    id: 'cust-101',
    kind: 'individual',
    displayName: '  Mario Rossi  ',
    firstName: '  Mario ',
    lastName: 'Rossi  ',
    companyName: '   ',
    email: ' MARIO.ROSSI@EXAMPLE.COM ',
    phone: ' +39 333 1234567 ',
    status: 'active',
    notes: '  Cliente VIP ',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
    version: 1,
    sourceDeviceId: 'dev-01',
    syncStatus: 'synced',
    schemaVersion: 1,
    metadata: { tag: 'vip' },
  };

  const validation = CustomerValidator.validate(input);
  assert.equal(validation.isValid, true);
  assert.notEqual(validation.value, null);

  const doc = validation.value;
  assert.equal(doc.id, 'cust-101');
  assert.equal(doc.kind, 'individual');
  assert.equal(doc.displayName, 'Mario Rossi');
  assert.equal(doc.firstName, 'Mario');
  assert.equal(doc.lastName, 'Rossi');
  assert.equal(doc.companyName, null);
  assert.equal(doc.email, 'mario.rossi@example.com');
  assert.equal(doc.phone, '+39 333 1234567');
  assert.equal(doc.notes, 'Cliente VIP');
  assert.equal(doc.status, 'active');
  assert.equal(doc.syncStatus, 'synced');
  assert.equal(doc.metadata.tag, 'vip');
});

test('accetta un\'organizzazione valida', () => {
  const input = {
    id: 'org-202',
    kind: 'organization',
    displayName: 'Acme S.r.l.',
    companyName: 'Acme S.r.l.',
    email: 'info@acme.com',
    status: 'active',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 1,
    schemaVersion: 1,
  };

  const validation = CustomerValidator.validate(input);
  assert.equal(validation.isValid, true);
  assert.equal(validation.value.kind, 'organization');
  assert.equal(validation.value.companyName, 'Acme S.r.l.');
});

test('converte l\'email in lowercase', () => {
  const normalized = CustomerValidator.normalize({
    id: 'c1',
    email: 'USER.TEST@DOMAIN.IT',
  });
  assert.equal(normalized.email, 'user.test@domain.it');
});

test('converte stringhe nullable vuote in null', () => {
  const normalized = CustomerValidator.normalize({
    id: 'c2',
    firstName: '   ',
    lastName: '',
    phone: '  ',
    notes: '   ',
    sourceDeviceId: '',
  });

  assert.equal(normalized.firstName, null);
  assert.equal(normalized.lastName, null);
  assert.equal(normalized.phone, null);
  assert.equal(normalized.notes, null);
  assert.equal(normalized.sourceDeviceId, null);
});

test('rifiuta un\'email non valida', () => {
  const input = {
    id: 'cust-err-1',
    kind: 'individual',
    displayName: 'Luigi Verdi',
    email: 'email-non-valida-senza-chiocciola',
    status: 'active',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 1,
    schemaVersion: 1,
  };

  const validation = CustomerValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.value, null);
  assert.equal(validation.issues.some((i) => i.field === 'email'), true);
});

test('rifiuta updatedAt precedente a createdAt', () => {
  const input = {
    id: 'cust-err-2',
    kind: 'individual',
    displayName: 'Luigi Verdi',
    email: 'luigi@verdi.it',
    status: 'active',
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 1,
    schemaVersion: 1,
  };

  const validation = CustomerValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.code === 'CHRONOLOGY_ERROR'), true);
});

test('rifiuta version minore di 1', () => {
  const input = {
    id: 'cust-err-3',
    kind: 'individual',
    displayName: 'Luigi Verdi',
    email: 'luigi@verdi.it',
    status: 'active',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 0,
    schemaVersion: 1,
  };

  const validation = CustomerValidator.validate(input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.issues.some((i) => i.field === 'version'), true);
});

test('converte correttamente un ManagerCustomerEntityLike', () => {
  const legacyRecord = {
    id: 'mgr-cust-01',
    firstName: 'Giuseppe',
    lastName: 'Garibaldi',
    displayName: 'Giuseppe Garibaldi',
    email: 'garibaldi@unita.it',
    phone: '+3906123456',
    company: '',
    status: 'attivo',
    notes: 'Note ereditate dal Manager',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-02T10:00:00.000Z',
    version: 2,
    licenseCode: 'A3BK-79MP-XUYT-469E',
  };

  const doc = managerCustomerEntityToDocument(legacyRecord);

  assert.equal(doc.id, 'mgr-cust-01');
  assert.equal(doc.kind, 'individual');
  assert.equal(doc.status, 'active');
  assert.equal(doc.email, 'garibaldi@unita.it');
  assert.equal(doc.displayName, 'Giuseppe Garibaldi');
  assert.equal(doc.metadata.legacyLicenseCode, 'A3BK-79MP-XUYT-469E');
});

test('converte correttamente gli alias legacy degli stati', () => {
  assert.equal(managerCustomerEntityToDocument({ id: '1', email: 'a@b.it', status: 'da_attivare' }).status, 'pending');
  assert.equal(managerCustomerEntityToDocument({ id: '2', email: 'a@b.it', status: 'attivo' }).status, 'active');
  assert.equal(managerCustomerEntityToDocument({ id: '3', email: 'a@b.it', status: 'sospeso' }).status, 'suspended');
  assert.equal(managerCustomerEntityToDocument({ id: '4', email: 'a@b.it', status: 'revocato' }).status, 'archived');
});

test('conserva l\'eventuale licenseCode legacy soltanto nei metadata', () => {
  const doc = managerCustomerEntityToDocument({
    id: 'c-legacy',
    email: 'user@test.it',
    status: 'active',
    licenseCode: 'TEST-CODE-1234',
  });

  assert.equal('licenseCode' in doc, false);
  assert.equal(doc.metadata.legacyLicenseCode, 'TEST-CODE-1234');
});
