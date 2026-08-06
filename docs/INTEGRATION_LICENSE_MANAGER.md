# Integrazione con Gestione Casa License Manager

## Prima migrazione

1. Aggiungere `@gestione-casa/shared-sdk` alle dipendenze.
2. Sostituire gli import da `src/engine` con gli import dal pacchetto.
3. Mantenere Dexie, repository e servizi nel License Manager.
4. Aggiungere alla tabella licenze un campo `term` distinto da `licenseType`.
5. Conservare `licenseType` solo come edizione commerciale durante la migrazione.

## File che possono essere rimossi dopo il passaggio

- `src/engine/LicenseValidator.ts`
- la parte di generazione codice di `src/engine/LicenseEngine.ts`
- `src/engine/types.ts` per i tipi già coperti dallo SDK

Le funzioni di analisi collegate al database e i preparatori per sync possono restare nel License Manager, perché dipendono dal suo modello applicativo.

## Import suggerito

```ts
import {
  LicenseEngine,
  LicenseValidator,
  managerEntityToDocument,
} from '@gestione-casa/shared-sdk/licensing';
```
