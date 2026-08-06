# Integrazione con Gestione Casa OCR

## Prima migrazione

1. Aggiungere `@gestione-casa/shared-sdk` alle dipendenze.
2. Conservare `LicenseContext`, hook e persistenza locale nell'app.
3. Sostituire tipi, calcolo scadenze e validazione con lo SDK.
4. Migrare gradualmente il record locale legacy verso `ClientLicenseSnapshot`.
5. Usare `legacyAppRecordToSnapshot` soltanto come ponte temporaneo.

## File interessati

- `src/types/license.ts`
- `src/services/licenseService.ts`
- `src/context/LicenseContext.tsx`
- `src/tests/license-architecture.test.ts`

## Import suggerito

```ts
import {
  deserializeClientLicense,
  evaluateLicense,
  legacyAppRecordToSnapshot,
  serializeClientLicense,
} from '@gestione-casa/shared-sdk/licensing';
```

## Nota

I vecchi identificativi come `LIC-BETA-2026` non rispettano il nuovo formato con checksum. Durante la migrazione vanno considerati record legacy e sostituiti con codici generati dal License Manager.
