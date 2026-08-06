# Integrazione con Gestione Casa OCR

## Stato integrazione (Fase 2.2)

Nella versione 0.2.0 dello Shared SDK sono disponibili i modelli `CustomerDocument` e `ContactRequestDocument` da integrare nei moduli di Gestione Casa OCR.

### Utilizzo previsto in Gestione Casa OCR:

1. **Invio e tracciamento richieste**: Gestione Casa OCR può generare richieste di supporto, attivazione o licenza conformi a `ContactRequestDocument` con validazione tramite `ContactRequestValidator`.
2. **Profilo utente / cliente locale**: Il profilo utente registrato o salvato nell'app client seguirà la struttura `CustomerDocument`.
3. **Persistenza locale**: L'app conserverà il suo database Dexie/IndexedDB per memorizzare le richieste e i dati utente.

### Import suggeriti:

```ts
import {
  evaluateLicense,
  deserializeClientLicense,
} from '@gestione-casa/shared-sdk/licensing';

import {
  ContactRequestValidator,
  type ContactRequestDocument,
} from '@gestione-casa/shared-sdk/contact-requests';

import {
  CustomerValidator,
  type CustomerDocument,
} from '@gestione-casa/shared-sdk/customers';
```

### Prossimi passaggi:
- **Fase 2.3**: Sostituzione graduale delle interfacce locali in Gestione Casa OCR con i tipi condivisi dello SDK.
- **Fase 2.4**: Allineamento delle API e form di invio richieste per la conversione automatica lato manager.

