# Integrazione con Gestione Casa License Manager

## Stato integrazione (Fase 2.2)

Nella versione 0.2.0 dello Shared SDK sono stati messi a disposizione i contratti e gli adattatori per i clienti e le richieste di contatto.

### Nuove esportazioni disponibili per il License Manager:

```ts
import {
  LicenseEngine,
  LicenseValidator,
  managerEntityToDocument,
} from '@gestione-casa/shared-sdk/licensing';

import {
  CustomerValidator,
  managerCustomerEntityToDocument,
} from '@gestione-casa/shared-sdk/customers';

import {
  ContactRequestValidator,
} from '@gestione-casa/shared-sdk/contact-requests';
```

### Note sull'adattatore cliente:

- `managerCustomerEntityToDocument(record)` converte la struttura cliente del License Manager nel documento canonico `CustomerDocument`.
- Supporta gli stati nativi (`pending`, `active`, `suspended`, `archived`) e gli alias UI legacy (`da_attivare`, `attivo`, `sospeso`, `revocato`).
- La proprietà legacy `licenseCode` eventualmente presente nel record cliente non viene inserita nel modello `CustomerDocument`, ma viene conservata temporaneamente in `metadata.legacyLicenseCode`.
- Il collegamento ufficiale tra cliente e licenza deve avvenire tramite `LicenseDocument.customerId`.

### Importazione ed Elaborazione Richieste di Contatto (Sottofase 2.3.A):

Il License Manager può importare file JSON contenenti richieste di contatto esportate da Gestione Casa OCR tramite le API dello Shared SDK:

```ts
import {
  deserializeContactRequestExchangeEnvelope,
  validateContactRequestExchangeEnvelope,
} from '@gestione-casa/shared-sdk/contact-requests';

// 1. Deserializzazione e validazione completa del file JSON caricato
const result = deserializeContactRequestExchangeEnvelope(jsonContent);

if (!result.isValid) {
  // Gestione errori strutturati (formato non valido, schema invalido, ecc.)
  console.error('File non valido:', result.issues);
} else {
  // 2. Estrazione della richiesta di contatto validata
  const requestDoc = result.value.request;
  // La prevenzione dei duplicati verrà gestita nel repository Dexie del License Manager
}
```

### Prossimi passaggi (Fase 2.3 e Fase 2.4):

- **Fase 2.3 (Completamento)**: Sostituzione delle interfacce locali clienti e richieste nel License Manager con i tipi condivisi dallo SDK e integrazione del file picker JSON per le richieste.
- **Fase 2.4**: Implementazione della logica di conversione e associazione (Richiesta → Cliente → Licenza).

