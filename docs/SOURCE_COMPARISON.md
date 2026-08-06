# Confronto dei repository sorgente

Analisi eseguita sui file:

- `Gestione-Casa-OCR-main (7).zip`
- `Gestione-Casa-License-Manager-main(2).zip`

## Elementi realmente condivisibili oggi

1. formato del codice licenza;
2. alfabeto sicuro;
3. checksum e normalizzazione;
4. generazione del codice;
5. stati del ciclo di vita;
6. scadenza e giorni residui;
7. contratti di attivazione e futura firma digitale.

## Incompatibilità rilevate

### Significato di `licenseType`

- Gestione Casa OCR: durata della licenza (`beta_60_days`, `annual`, `lifetime_perpetual`, `enterprise`);
- License Manager: edizione commerciale (`Standard`, `Professional`, `Enterprise`).

Correzione nello SDK: due proprietà separate, `edition` e `term`.

### Stati

- Gestione Casa OCR: `not_activated`, `beta_active`, `beta_expired`, `perpetual_active`, `suspended`, `invalid`;
- License Manager: `generated`, `assigned`, `sent`, `activated`, `revoked`, `expired`, più alias italiani usati dalla UI.

Correzione nello SDK: un solo ciclo canonico indipendente dall'interfaccia utente.

### Formato identificativo

L'app OCR accetta esempi come `LIC-BETA-2026`, mentre il License Manager genera `XXXX-XXXX-XXXX-XXXX` con checksum. I vecchi valori dell'app non sono codici compatibili e devono essere migrati.

### Sicurezza

Il checksum attuale non impedisce la generazione fraudolenta di codici. È un controllo di integrità, non un sistema di autenticità. La firma Ed25519 resta una fase necessaria prima della distribuzione commerciale.

## Codice non trasferito

Non sono stati inseriti nello SDK:

- componenti React e design system;
- database Dexie e repository;
- customer service e audit log;
- OCR, classificazione prodotti, budget, report;
- notifiche ed email;
- server Express.

Questi elementi appartengono ai singoli prodotti oppure non hanno ancora due consumatori reali.
