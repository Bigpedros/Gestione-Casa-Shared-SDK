# Gestione Casa – Shared SDK

Pacchetto TypeScript condiviso tra **Gestione Casa OCR**, **Gestione Casa License Manager** e i futuri client Android, iOS, Windows e macOS.

## Obiettivi della versione 0.2.0 (Fase 2.2)

Nella versione 0.1.0 è stato consolidato il dominio delle licenze. La versione 0.2.0 introduce i tre modelli canonici condivisi dell'ecosistema Gestione Casa:

1. **Licenze (`/licensing`)**: Generazione codici, formato `XXXX-XXXX-XXXX-XXXX`, checksum, scadenze, contratti Ed25519 e snapshots.
2. **Clienti (`/customers`)**: Gestione unificata dei clienti (individuali e organizzazioni), validazione formale, pulizia dati e adapter per modelli legacy.
3. **Richieste di Contatto (`/contact-requests`)**: Contratti e regole di validazione per richieste di supporto, attivazione, rinnovo e informazioni.
4. **Utilità Condivise (`/common`)**: Tipi di sincronizzazione (`SyncStatus`), strutture di validazione (`ValidationResult`), normalizzazione stringhe/email/telefoni e verifica date ISO.

Lo SDK **non contiene** React, Dexie, IndexedDB, UI, API server, invio email o logica specifica di una singola piattaforma. Definisce esclusivamente i contratti e i validator.

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
- `docs/INTEGRATION_LICENSE_MANAGER.md`
- `docs/INTEGRATION_OCR.md`
- `docs/MIGRATION_MATRIX.md`
- `docs/SOURCE_COMPARISON.md`

