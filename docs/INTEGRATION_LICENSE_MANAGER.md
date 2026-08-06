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

### Prossimi passaggi (Fase 2.3 e Fase 2.4):

- **Fase 2.3**: Sostituzione delle interfacce locali clienti e richieste nel License Manager con i tipi condivisi dallo SDK.
- **Fase 2.4**: Implementazione della logica di conversione e associazione (Richiesta → Cliente → Licenza).

