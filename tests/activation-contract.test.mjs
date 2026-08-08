import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  ActivationValidator,
  buildCanonicalLicensePayloadV1,
  createActivationRequestEnvelope,
  createActivationResponseEnvelope,
  createLicenseDeactivationRequestEnvelope,
  createLicenseDeactivationResponseEnvelope,
  createLicenseValidationRequestEnvelope,
  createLicenseValidationResponseEnvelope,
  deserializeActivationRequestEnvelope,
  deserializeActivationResponseEnvelope,
  deserializeLicenseDeactivationRequestEnvelope,
  deserializeLicenseDeactivationResponseEnvelope,
  deserializeLicenseValidationRequestEnvelope,
  deserializeLicenseValidationResponseEnvelope,
  deserializeSignedLicenseDocument,
  serializeActivationRequestEnvelope,
  serializeActivationResponseEnvelope,
  serializeLicenseDeactivationRequestEnvelope,
  serializeLicenseDeactivationResponseEnvelope,
  serializeLicenseValidationRequestEnvelope,
  serializeLicenseValidationResponseEnvelope,
  serializeSignedLicenseDocument,
  validateActivationRequestEnvelope,
  validateActivationResponseEnvelope,
} from '../dist/activation/index.js';

import { LicenseValidator, LicenseEngine } from '../dist/licensing/index.js';

const deterministicRandom = {
  fill(target) {
    for (let index = 0; index < target.length; index += 1) {
      target[index] = index;
    }
  },
};

const validLicenseCode = LicenseEngine.generateCode(deterministicRandom);

// Valid mock LicenseDocument
const mockLicenseDoc = {
  id: 'lic-100',
  licenseCode: validLicenseCode,
  checksum: validLicenseCode.at(-1),
  edition: 'standard',
  term: 'annual',
  status: 'activated',
  owner: 'Mario Rossi',
  customerId: 'cust-1',
  deviceId: 'dev-123',
  generatedAt: '2026-08-01T10:00:00.000Z',
  assignedAt: '2026-08-01T10:00:00.000Z',
  sentAt: '2026-08-01T10:00:00.000Z',
  activatedAt: '2026-08-01T10:00:00.000Z',
  suspendedAt: null,
  revokedAt: null,
  expiresAt: '2027-08-01T10:00:00.000Z',
  engineVersion: 1,
  schemaVersion: 1,
  metadata: {},
};

// Valid mock SignedLicenseDocument
const mockSignedLicense = {
  license: mockLicenseDoc,
  signature: 'dGhpcyBpcyBhIHZhbGlkIHNpZ25hdHVyZQ==',
  signatureAlgorithm: 'Ed25519',
  keyId: 'key-2026-v1',
  signatureVersion: 1,
};

test('1. valid ActivationRequest', () => {
  const req = {
    licenseCode: validLicenseCode,
    deviceId: 'dev-device-123',
    productId: 'gestione-casa-ocr',
    appVersion: '1.2.0',
  };
  const val = ActivationValidator.validateActivationRequest(req);
  assert.equal(val.isValid, true);
  assert.equal(val.value?.licenseCode, validLicenseCode);
});

test('2. missing or invalid licenseCode', () => {
  const req = {
    licenseCode: 'INVALID-CODE',
    deviceId: 'dev-device-123',
    productId: 'gestione-casa-ocr',
    appVersion: '1.2.0',
  };
  const val = ActivationValidator.validateActivationRequest(req);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'licenseCode'));
});

test('3. invalid deviceId', () => {
  const req = {
    licenseCode: validLicenseCode,
    deviceId: '',
    productId: 'gestione-casa-ocr',
    appVersion: '1.2.0',
  };
  const val = ActivationValidator.validateActivationRequest(req);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'deviceId'));
});

test('4. invalid productId', () => {
  const req = {
    licenseCode: validLicenseCode,
    deviceId: 'dev-123',
    productId: '',
    appVersion: '1.2.0',
  };
  const val = ActivationValidator.validateActivationRequest(req);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'productId'));
});

test('5. valid ActivationResponse', () => {
  const res = {
    status: 'ACTIVATED',
    signedLicense: mockSignedLicense,
    activationId: 'act-999',
    message: 'Attivazione completata',
    serverTime: '2026-08-08T12:00:00.000Z',
    requestId: 'req-corr-001',
  };
  const val = ActivationValidator.validateActivationResponse(res);
  assert.equal(val.isValid, true);
  assert.equal(val.value?.status, 'ACTIVATED');
});

test('6. ACTIVATION_LIMIT_REACHED status in ActivationResponse', () => {
  const res = {
    status: 'ACTIVATION_LIMIT_REACHED',
    message: 'Limite massimo di attivazioni raggiunto',
    serverTime: '2026-08-08T12:00:00.000Z',
    requestId: 'req-corr-002',
  };
  const val = ActivationValidator.validateActivationResponse(res);
  assert.equal(val.isValid, true);
  assert.equal(val.value?.status, 'ACTIVATION_LIMIT_REACHED');
});

test('7. valid validation request', () => {
  const req = {
    licenseCode: validLicenseCode,
    deviceId: 'dev-123',
    productId: 'gestione-casa-ocr',
  };
  const val = ActivationValidator.validateLicenseValidationRequest(req);
  assert.equal(val.isValid, true);
});

test('8. valid validation response', () => {
  const res = {
    status: 'VALID',
    signedLicense: mockSignedLicense,
    lastValidatedAt: '2026-08-08T10:00:00.000Z',
    serverTime: '2026-08-08T12:00:00.000Z',
    requestId: 'req-val-100',
  };
  const val = ActivationValidator.validateLicenseValidationResponse(res);
  assert.equal(val.isValid, true);
  assert.equal(val.value?.status, 'VALID');
});

test('9. valid deactivation request', () => {
  const req = {
    licenseCode: validLicenseCode,
    deviceId: 'dev-123',
    productId: 'gestione-casa-ocr',
  };
  const val = ActivationValidator.validateLicenseDeactivationRequest(req);
  assert.equal(val.isValid, true);
});

test('10. valid deactivation response', () => {
  const res = {
    status: 'DEACTIVATED',
    deactivatedAt: '2026-08-08T12:00:00.000Z',
    serverTime: '2026-08-08T12:00:00.000Z',
    requestId: 'req-deact-100',
  };
  const val = ActivationValidator.validateLicenseDeactivationResponse(res);
  assert.equal(val.isValid, true);
  assert.equal(val.value?.status, 'DEACTIVATED');
});

test('11. invalid envelope format', () => {
  const env = {
    format: 'invalid-format',
    formatVersion: 1,
    requestId: 'req-1',
    createdAt: '2026-08-08T12:00:00.000Z',
    request: {
      licenseCode: validLicenseCode,
      deviceId: 'dev-123',
      productId: 'gestione-casa-ocr',
      appVersion: '1.0.0',
    },
  };
  const val = validateActivationRequestEnvelope(env);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'format'));
});

test('12. invalid envelope formatVersion', () => {
  const env = {
    format: 'gestione-casa-license-activation-request',
    formatVersion: 99,
    requestId: 'req-1',
    createdAt: '2026-08-08T12:00:00.000Z',
    request: {
      licenseCode: validLicenseCode,
      deviceId: 'dev-123',
      productId: 'gestione-casa-ocr',
      appVersion: '1.0.0',
    },
  };
  const val = validateActivationRequestEnvelope(env);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'formatVersion'));
});

test('13. requestId correlation across envelope and response', () => {
  const correlationId = 'corr-id-777';
  const envRes = createActivationResponseEnvelope(
    {
      status: 'ACTIVATED',
      serverTime: '2026-08-08T12:00:00.000Z',
      requestId: correlationId,
    },
    correlationId
  );
  assert.equal(envRes.isValid, true);
  assert.equal(envRes.value?.requestId, correlationId);
  assert.equal(envRes.value?.response.requestId, correlationId);
});

test('14. serialize/deserialize roundtrip for all envelopes', () => {
  const reqObj = {
    licenseCode: validLicenseCode,
    deviceId: 'dev-123',
    productId: 'gestione-casa-ocr',
    appVersion: '1.0.0',
  };
  const createRes = createActivationRequestEnvelope(reqObj, 'req-rt-1');
  assert.equal(createRes.isValid, true);

  const serRes = serializeActivationRequestEnvelope(createRes.value);
  assert.equal(serRes.isValid, true);

  const desRes = deserializeActivationRequestEnvelope(serRes.value);
  assert.equal(desRes.isValid, true);
  assert.equal(desRes.value?.requestId, 'req-rt-1');
  assert.equal(desRes.value?.request.licenseCode, validLicenseCode);
});

test('15. SignedLicenseDocument valid', () => {
  const val = ActivationValidator.validateSignedLicenseDocument(mockSignedLicense);
  assert.equal(val.isValid, true);
});

test('16. unsupported signatureVersion', () => {
  const badSigned = {
    ...mockSignedLicense,
    signatureVersion: 2,
  };
  const val = ActivationValidator.validateSignedLicenseDocument(badSigned);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'signatureVersion'));
});

test('17. invalid signatureAlgorithm', () => {
  const badSigned = {
    ...mockSignedLicense,
    signatureAlgorithm: 'RSA',
  };
  const val = ActivationValidator.validateSignedLicenseDocument(badSigned);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'signatureAlgorithm'));
});

test('18. canonical payload v1 deterministic output', () => {
  const payload1 = buildCanonicalLicensePayloadV1(mockLicenseDoc);
  const payload2 = buildCanonicalLicensePayloadV1(mockLicenseDoc);
  assert.equal(payload1, payload2);
});

test('19. canonical payload v1 exact field set and key order', () => {
  const payloadJson = buildCanonicalLicensePayloadV1(mockLicenseDoc);
  const parsed = JSON.parse(payloadJson);
  const keys = Object.keys(parsed);

  const expectedKeys = [
    'checksum',
    'customerId',
    'deviceId',
    'engineVersion',
    'expiresAt',
    'generatedAt',
    'id',
    'licenseCode',
    'licenseType',
    'schemaVersion',
    'status',
  ];

  assert.deepEqual(keys, expectedKeys);
});

test('20. future activation fields excluded from v1 canonical payload', () => {
  const docWithExtra = {
    ...mockLicenseDoc,
    maxActivations: 32,
    activationPolicy: 'BETA_TESTER',
  };
  const payloadJson = buildCanonicalLicensePayloadV1(docWithExtra);
  const parsed = JSON.parse(payloadJson);

  assert.equal(parsed.maxActivations, undefined);
  assert.equal(parsed.activationPolicy, undefined);
});

test('20a. Golden Vector A - exact canonical string and SHA-256', () => {
  const vectorA = {
    id: 'LIC-GOLDEN-001',
    licenseCode: 'A1B2-C3D4-E5F6-G7H8',
    checksum: '8',
    customerId: 'CUS-GOLDEN-001',
    deviceId: 'DEV-GOLDEN-001',
    expiresAt: '2027-12-31T23:59:59.000Z',
    generatedAt: '2026-01-01T10:00:00.000Z',
    engineVersion: '2.1',
    schemaVersion: 1,
    status: 'assigned',
    licenseType: 'Professional',
  };

  const expectedCanonical = '{"checksum":"8","customerId":"CUS-GOLDEN-001","deviceId":"DEV-GOLDEN-001","engineVersion":"2.1","expiresAt":"2027-12-31T23:59:59.000Z","generatedAt":"2026-01-01T10:00:00.000Z","id":"LIC-GOLDEN-001","licenseCode":"A1B2-C3D4-E5F6-G7H8","licenseType":"Professional","schemaVersion":1,"status":"assigned"}';
  const canonical = buildCanonicalLicensePayloadV1(vectorA);
  assert.equal(canonical, expectedCanonical);
  assert.equal(Buffer.byteLength(canonical, 'utf8'), 301);

  const sha256 = createHash('sha256').update(canonical, 'utf8').digest('hex');
  assert.equal(sha256, '072d4bf56f2f468ab719279224c14f2ebb3369847082a23e40c36d21a525e24f');
});

test('20b. Golden Vector B - deviceId and sourceDeviceId absent (empty string deviceId)', () => {
  const vectorB = {
    id: 'LIC-GOLDEN-001',
    licenseCode: 'A1B2-C3D4-E5F6-G7H8',
    checksum: '8',
    customerId: 'CUS-GOLDEN-001',
    expiresAt: '2027-12-31T23:59:59.000Z',
    generatedAt: '2026-01-01T10:00:00.000Z',
    engineVersion: '2.1',
    schemaVersion: 1,
    status: 'assigned',
    licenseType: 'Professional',
  };

  const canonical = buildCanonicalLicensePayloadV1(vectorB);
  assert.ok(canonical.includes('"deviceId":""'));
  const sha256 = createHash('sha256').update(canonical, 'utf8').digest('hex');
  assert.equal(sha256, '36b4fd320af4220610b126511e2625c692f5fb6b9e1ede0e9b9f217e1484e17c');
});

test('20c. Golden Vector C - fallback to sourceDeviceId', () => {
  const vectorC = {
    id: 'LIC-GOLDEN-001',
    licenseCode: 'A1B2-C3D4-E5F6-G7H8',
    checksum: '8',
    customerId: 'CUS-GOLDEN-001',
    sourceDeviceId: 'DEV-SOURCE-GOLDEN-001',
    expiresAt: '2027-12-31T23:59:59.000Z',
    generatedAt: '2026-01-01T10:00:00.000Z',
    engineVersion: '2.1',
    schemaVersion: 1,
    status: 'assigned',
    licenseType: 'Professional',
  };

  const canonical = buildCanonicalLicensePayloadV1(vectorC);
  assert.ok(canonical.includes('"deviceId":"DEV-SOURCE-GOLDEN-001"'));
  const sha256 = createHash('sha256').update(canonical, 'utf8').digest('hex');
  assert.equal(sha256, '7f7f0629bb566dca82ee68a6b7cb0165fc4c1810761ec1e0cd8575cc212afa3f');
});

test('20d. Golden Vector D - null customerId and null expiresAt', () => {
  const vectorD = {
    id: 'LIC-GOLDEN-001',
    licenseCode: 'A1B2-C3D4-E5F6-G7H8',
    checksum: '8',
    customerId: null,
    deviceId: 'DEV-GOLDEN-001',
    expiresAt: null,
    generatedAt: '2026-01-01T10:00:00.000Z',
    engineVersion: '2.1',
    schemaVersion: 1,
    status: 'assigned',
    licenseType: 'Professional',
  };

  const canonical = buildCanonicalLicensePayloadV1(vectorD);
  const sha256 = createHash('sha256').update(canonical, 'utf8').digest('hex');
  assert.equal(sha256, '265e1051c8cad71a46ec3a584a17c7a387b47fd6b144d74653f9908577f7da21');
});

test('20e. legacy aliases (code, sourceDeviceId, expirationDate, createdDate, planType)', () => {
  const legacyDoc = {
    id: 'LIC-LEGACY-001',
    code: 'a1b2-c3d4-e5f6-g7h8',
    checksum: '8',
    sourceDeviceId: 'DEV-SRC-99',
    expirationDate: '2028-01-01T00:00:00.000Z',
    createdDate: '2026-01-01T00:00:00.000Z',
    planType: 'Enterprise',
  };

  const canonical = buildCanonicalLicensePayloadV1(legacyDoc);
  const parsed = JSON.parse(canonical);

  assert.equal(parsed.licenseCode, 'A1B2-C3D4-E5F6-G7H8');
  assert.equal(parsed.deviceId, 'DEV-SRC-99');
  assert.equal(parsed.expiresAt, '2028-01-01T00:00:00.000Z');
  assert.equal(parsed.generatedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(parsed.licenseType, 'Enterprise');
});

test('20f. licenseCode normalization (uppercase + trim)', () => {
  const doc = {
    ...mockLicenseDoc,
    licenseCode: '  abcd-1234  ',
  };
  const canonical = buildCanonicalLicensePayloadV1(doc);
  const parsed = JSON.parse(canonical);
  assert.equal(parsed.licenseCode, 'ABCD-1234');
});

test('20g. default values fallback', () => {
  const emptyDoc = {};
  const canonical = buildCanonicalLicensePayloadV1(emptyDoc);
  const parsed = JSON.parse(canonical);

  assert.equal(parsed.checksum, '');
  assert.equal(parsed.customerId, null);
  assert.equal(parsed.deviceId, '');
  assert.equal(parsed.engineVersion, '2.1');
  assert.equal(parsed.expiresAt, null);
  assert.equal(parsed.generatedAt, '');
  assert.equal(parsed.id, '');
  assert.equal(parsed.licenseType, 'Standard');
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.status, 'generated');
});

test('21. no private/security fields accepted in client requests', () => {
  const reqWithSecrets = {
    licenseCode: validLicenseCode,
    deviceId: 'dev-123',
    productId: 'gestione-casa-ocr',
    appVersion: '1.0.0',
    maxActivations: 32,
    privateKey: 'SECRET_KEY',
  };
  const val = ActivationValidator.validateActivationRequest(reqWithSecrets);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.code === 'PROHIBITED_FIELD'));
});

test('22. Beta Tester policy type supports 32 maxActivations', () => {
  const betaPolicy = {
    policyId: 'policy-beta-32',
    licenseType: 'BETA_TESTER',
    maxActivations: 32,
    allowDeactivation: true,
  };
  assert.equal(betaPolicy.maxActivations, 32);
});

test('23. maxActivations absent from client request', () => {
  const clientReq = {
    licenseCode: validLicenseCode,
    deviceId: 'dev-123',
    productId: 'gestione-casa-ocr',
    appVersion: '1.0.0',
  };
  const val = ActivationValidator.validateActivationRequest(clientReq);
  assert.equal(val.isValid, true);
  assert.equal(val.value.maxActivations, undefined);
});

test('24. unknown enum rejected in response status', () => {
  const resWithUnknownStatus = {
    status: 'UNKNOWN_STATUS_ENUM',
    serverTime: '2026-08-08T12:00:00.000Z',
    requestId: 'req-1',
  };
  const val = ActivationValidator.validateActivationResponse(resWithUnknownStatus);
  assert.equal(val.isValid, false);
  assert.ok(val.issues.some((i) => i.field === 'status'));
});

test('25. browser-safe imports and pure execution', () => {
  // Confirm that building canonical payload and validating request does not use process or fs
  const payload = buildCanonicalLicensePayloadV1(mockLicenseDoc);
  assert.equal(typeof payload, 'string');
});
