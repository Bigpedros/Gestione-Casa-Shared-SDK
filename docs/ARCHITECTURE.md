# Architettura dello Shared SDK

## Regola principale

Lo Shared SDK contiene esclusivamente logica pura e contratti condivisi. Ogni repository consumatore conserva:

- persistenza locale o remota;
- interfaccia utente;
- stato React e context;
- gestione rete e API;
- adattatori specifici per Android, iOS, Windows e macOS.

## Modello canonico

Nel codice precedente `licenseType` aveva due significati diversi:

- nell'app indicava la durata: beta, annuale o perpetua;
- nel License Manager indicava l'edizione: Standard, Professional o Enterprise.

Nel modello condiviso i concetti sono separati:

- `edition`: standard, professional, enterprise;
- `term`: beta_60_days, annual, perpetual;
- `status`: ciclo di vita operativo della licenza.

Questa separazione evita conversioni ambigue e permette future politiche commerciali senza cambiare il formato del codice.

## Sicurezza

Il codice licenza è composto da 15 caratteri casuali e un carattere di checksum. Il checksum è utile per l'integrità formale, non per impedire la contraffazione.

Architettura prevista per la fase successiva:

1. il License Manager crea il documento licenza;
2. il documento viene serializzato in forma canonica;
3. il License Manager firma il payload con chiave privata Ed25519;
4. l'app verifica la firma con la sola chiave pubblica incorporata;
5. la chiave privata non entra mai nei client.
