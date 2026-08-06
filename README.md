# Gestione Casa – Shared SDK

Pacchetto TypeScript condiviso tra **Gestione Casa OCR**, **Gestione Casa License Manager** e i futuri client Android, iOS, Windows e macOS.

## Obiettivo della versione 0.1.0

Questa prima versione consolida il dominio licenze, che nei due repository originari era implementato con modelli differenti. Lo SDK diventa la fonte ufficiale per:

- formato `XXXX-XXXX-XXXX-XXXX`;
- alfabeto sicuro e checksum;
- generazione dei codici;
- tipi canonici di edizione, durata e stato;
- calcolo di scadenza e giorni residui;
- valutazione utilizzabilità della licenza;
- conversione temporanea dai modelli legacy;
- contratti predisposti per firma digitale Ed25519.

Lo SDK **non contiene** React, Dexie, IndexedDB, UI, API server o logica specifica di una piattaforma.

## Struttura

```text
src/
  licensing/
    constants.ts
    types.ts
    LicenseValidator.ts
    LicenseEngine.ts
    lifecycle.ts
    adapters.ts
    serialization.ts
```

## Comandi

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Uso

```ts
import {
  LicenseEngine,
  LicenseValidator,
  evaluateLicense,
} from '@gestione-casa/shared-sdk/licensing';

const code = LicenseEngine.generateCode();
const valid = LicenseValidator.isValid(code);
const result = evaluateLicense(clientSnapshot);
```

## Collegamento iniziale da GitHub

Dopo la pubblicazione del repository:

```bash
npm install github:<utente-github>/Gestione-Casa-Shared-SDK#v0.1.0
```

Per sviluppo locale è possibile usare:

```bash
npm install ../Gestione-Casa-Shared-SDK
```

## Confine di sicurezza

Il checksum rileva errori di digitazione o alterazioni accidentali, ma **non costituisce una firma crittografica**. Prima della distribuzione commerciale occorrerà firmare il payload nel License Manager e verificarlo nei client tramite chiave pubblica Ed25519. Le interfacce per questa estensione sono già presenti, ma la firma non è ancora implementata.

## Migrazione

Consultare:

- `docs/ARCHITECTURE.md`
- `docs/INTEGRATION_LICENSE_MANAGER.md`
- `docs/INTEGRATION_OCR.md`
- `docs/MIGRATION_MATRIX.md`
- `docs/SOURCE_COMPARISON.md`
