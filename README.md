# Gestione Casa – Shared SDK

Pacchetto TypeScript condiviso tra **Gestione Casa OCR**, **Gestione Casa License Manager** e i futuri client Android, iOS, Windows e macOS.

## Obiettivi della versione 0.3.0 (Sottofase 2.3.A)

La versione 0.3.0 introduce il **contratto canonico di scambio JSON** (`ContactRequestExchangeEnvelope`) per l'esportazione e l'importazione manuale delle richieste di contatto tra **Gestione Casa OCR** e **Gestione Casa License Manager**:

1. **Envelope Canonico (`/contact-requests`)**: Contenitore formattato con formato `gestione-casa-contact-request`, versione `1`, `exportedAt` ISO 8601 e documento `ContactRequestDocument`.
2. **API di Scambio Pure**: `createContactRequestExchangeEnvelope`, `validateContactRequestExchangeEnvelope`, `serializeContactRequestExchangeEnvelope`, `deserializeContactRequestExchangeEnvelope` e `buildContactRequestExchangeFileName`.
3. **Nome File Deterministico**: Formato congelato `gestione-casa-contact-request_<ID>_<YYYYMMDD-HHmmss>.json` senza PII.

Lo SDK **non contiene** React, Dexie, IndexedDB, UI, API server, invio email o logica specifica di una singola piattaforma. Definisce esclusivamente i contratti e le funzioni pure di validazione e scambio.

## Struttura

```text
src/
  common/
    types.ts
    utils.ts
    index.ts
  licensing/
    constants.ts
    types.ts
    LicenseValidator.ts
    LicenseEngine.ts
    lifecycle.ts
    adapters.ts
    serialization.ts
    index.ts
  customers/
    types.ts
    CustomerValidator.ts
    adapters.ts
    index.ts
  contact-requests/
    types.ts
    ContactRequestValidator.ts
    exchange.types.ts
    exchange.ts
    index.ts
```

## Comandi

```bash
npm install
npm run typecheck
npm test
npm run build
npm run pack:check
```

## Uso

```ts
import {
  LicenseEngine,
  LicenseValidator,
  evaluateLicense,
} from '@gestione-casa/shared-sdk/licensing';

import {
  CustomerValidator,
  managerCustomerEntityToDocument,
} from '@gestione-casa/shared-sdk/customers';

import {
  ContactRequestValidator,
} from '@gestione-casa/shared-sdk/contact-requests';

// Validazione Cliente
const customerResult = CustomerValidator.validate(rawCustomer);

// Validazione Richiesta
const requestResult = ContactRequestValidator.validate(rawRequest);
```

## Relazioni tra Modelli

- **`LicenseDocument.customerId`**: Collegamento canonico ufficiale tra licenza e cliente.
- **`ContactRequest.linkedCustomerId`**: Registra l'eventuale conversione di una richiesta di contatto in cliente.
- **`ContactRequest.linkedLicenseId`**: Registra l'eventuale licenza associata (richiede la presenza di `linkedCustomerId`).

Note di roadmap:
- L'integrazione concreta nelle app avverrà nella **Fase 2.3**.
- Il workflow operativo automatizzato Richiesta → Cliente → Licenza appartiene alla **Fase 2.4**.

## Confine di sicurezza

Il checksum rileva errori di digitazione o alterazioni accidentali, ma **non costituisce una firma crittografica**. Prima della distribuzione commerciale occorrerà firmare il payload nel License Manager e verificarlo nei client tramite chiave pubblica Ed25519.

## Documentazione

Consultare:

- `docs/ARCHITECTURE.md`
- `docs/PHASE_2_2_SHARED_MODELS.md`
- `docs/PHASE_2_3_CONTACT_REQUEST_EXCHANGE.md`
- `docs/INTEGRATION_LICENSE_MANAGER.md`
- `docs/INTEGRATION_OCR.md`
- `docs/MIGRATION_MATRIX.md`
- `docs/SOURCE_COMPARISON.md`

