# Fase 2.6.B1 - Online Activation Contract

## 1. Scopo e Obiettivi
La Fase 2.6.B1 definisce i contratti condivisibili, i tipi TypeScript, gli envelope JSON e la logica di serializzazione/validazione per il futuro servizio di attivazione online di Gestione Casa (`Gestione Casa Activation Service`).

I contratti sono fruibili da:
- **Gestione Casa OCR** (client/consumatore)
- **Gestione Casa License Manager** (backoffice/amministrazione)
- **Gestione Casa Activation Service** (servizio di attivazione)

## 2. Perimetro e Trust Boundary
Lo Shared SDK agisce esclusivamente come **definitore di contratti immutabili e pure utility browser-safe**.

- **Responsabilità Shared SDK (Incluso)**:
  - Definizione di tipi e interfacce condivisibili (`ActivationRequest`, `ActivationResponse`, `SignedLicenseDocument`, etc.).
  - Definizione degli envelope di scambio (`gestione-casa-license-activation-request`, etc.) con `formatVersion = 1`.
  - Costruzione deterministica del payload canonico di licenza v1 (`buildCanonicalLicensePayloadV1`).
  - Regole di validazione formale e strutturale su codici licenza, device ID, product ID e firma.
  - Zero dipendenze runtime e isolamento totale da moduli Node (`node:crypto`, `fs`, `path`).

- **Responsabilità Server / Backoffice (Escluso dallo SDK)**:
  - Generazione di chiavi private e firma crittografica Ed25519.
  - Persistenza su database (Firestore, Cloud SQL, PostgreSQL).
  - Rate limiting, IP tracking, autenticazione HTTP o OAuth.
  - Endpoint REST / gRPC e contatori reali di attivazione.

## 3. Contratti e Tipi Canonici

### 3.1 Licenza Firmata (`SignedLicenseDocument`)
Rappresenta il documento di licenza corredato da firma digitale emessa dal server.
```typescript
export interface SignedLicenseDocument {
  license: LicenseDocument;
  signature: string; // Base64
  signatureAlgorithm: 'Ed25519';
  keyId: string;
  signatureVersion: 1;
  canonicalPayload?: string;
}
```

### 3.2 Richiesta e Risposta di Attivazione
- **`ActivationRequest`**:
  - `licenseCode`: string (validato via `LicenseValidator`)
  - `deviceId`: string (max 256 caratteri)
  - `productId`: string ('gestione-casa-ocr')
  - `appVersion`: string
- **`ActivationResponse`**:
  - `status`: `ActivationStatus`
  - `signedLicense`: `SignedLicenseDocument | null`
  - `activationId`: string | null
  - `message`: string | null
  - `serverTime`: ISO date string
  - `requestId`: string (correlation ID)

### 3.3 Validazione e Disattivazione
Vengono forniti analoghi contratti di richiesta/risposta per le operazioni di validazione periodica (`LicenseValidationRequest`/`Response`) e disattivazione dispositivo (`LicenseDeactivationRequest`/`Response`).

## 4. Envelope JSON e Versionamento
Ogni messaggio scambiato utilizza un envelope strutturato con `formatVersion = 1`:
- `gestione-casa-license-activation-request`
- `gestione-casa-license-activation-response`
- `gestione-casa-license-validation-request`
- `gestione-casa-license-validation-response`
- `gestione-casa-license-deactivation-request`
- `gestione-casa-license-deactivation-response`

Gli envelope includono un campo `requestId` per correlare le transazioni end-to-end e `createdAt` (ISO 8601).

## 5. Payload Canonico v1 (`buildCanonicalLicensePayloadV1`)
La funzione `buildCanonicalLicensePayloadV1(license: LicenseDocument)` produce una stringa JSON deterministica ordinata alfabeticamente sui seguenti campi essenziali, garantendo compatibilità byte-per-byte con License Manager 2.6.A:
1. `checksum`
2. `customerId`
3. `deviceId` (supporta fallback da `sourceDeviceId`)
4. `engineVersion` (default: `'2.1'`)
5. `expiresAt` (supporta fallback da `expirationDate`)
6. `generatedAt` (supporta fallback da `createdDate`)
7. `id`
8. `licenseCode` (supporta fallback da `code`, con normalizzazione uppercase + trim)
9. `licenseType` (supporta fallback da `planType`, default: `'Standard'`)
10. `schemaVersion` (default: `1`)
11. `status` (default: `'generated'`)

### 5.1 Golden Vectors V1
- **Vector A**:
  - Stringa canonical (301 byte): `{"checksum":"8","customerId":"CUS-GOLDEN-001","deviceId":"DEV-GOLDEN-001","engineVersion":"2.1","expiresAt":"2027-12-31T23:59:59.000Z","generatedAt":"2026-01-01T10:00:00.000Z","id":"LIC-GOLDEN-001","licenseCode":"A1B2-C3D4-E5F6-G7H8","licenseType":"Professional","schemaVersion":1,"status":"assigned"}`
  - SHA-256: `072d4bf56f2f468ab719279224c14f2ebb3369847082a23e40c36d21a525e24f`
- **Vector B** (deviceId assente → `""`): SHA-256: `36b4fd320af4220610b126511e2625c692f5fb6b9e1ede0e9b9f217e1484e17c`
- **Vector C** (sourceDeviceId fallback): SHA-256: `7f7f0629bb566dca82ee68a6b7cb0165fc4c1810761ec1e0cd8575cc212afa3f`
- **Vector D** (customerId null, expiresAt null): SHA-256: `265e1051c8cad71a46ec3a584a17c7a387b47fd6b144d74653f9908577f7da21`

Campi futuri relativi alle politiche di attivazione sono esclusi dal payload canonico v1 per preservare l'immutabilità e la compatibilità con le firme digitali esistenti.

## 6. Supporto Politica Beta Tester
Il modello di politica di attivazione (`ActivationPolicy`) supporta fino a **32 attivazioni simultanee** per le licenze destinate ai Beta Tester (`maxActivations: 32`). Il conteggio reale e l'applicazione dei limiti rimangono responsabilità server-side.
