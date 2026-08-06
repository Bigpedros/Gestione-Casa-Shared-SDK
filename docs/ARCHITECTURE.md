# Architettura dello Shared SDK

## Regola principale

Lo Shared SDK contiene esclusivamente logica pura, contratti e regole di validazione condivisi. Oggetti di database, repository, istanze Dexie e interfacce utente rimangono nelle rispettive applicazioni consumatrici:

- **Gestione Casa OCR**: Persistenza locale IndexedDB/Dexie, UI React, elaborazione documenti;
- **Gestione Casa License Manager**: Persistenza locale IndexedDB/Dexie, UI React, generazione ed emulazione licenze;
- **Futuri client nativi**: Persistenza nativa, UI e API locali.

## Tre Modelli Canonici Condivisi

Lo SDK definisce i contratti per tre entità fondamentali dell'ecosistema:

1. **`LicenseDocument`**: Rappresenta il contratto di licenza rilasciato a un cliente, con edizione (`standard`, `professional`, `enterprise`), durata (`beta_60_days`, `annual`, `perpetual`), stato di vita e parametri di licenziamento.
2. **`CustomerDocument`**: Rappresenta l'anagrafica del cliente (persona fisica o organizzazione/azienda) con email normalizzata e campi opzionali.
3. **`ContactRequestDocument`**: Rappresenta una richiesta formale di contatto/informazioni/assistenza inviata da Gestione Casa OCR o dal License Manager.

## Relazioni Ufficiali tra Modelli

- **Cliente e Licenza**: Il collegamento ufficiale tra cliente e licenza avviene esclusivamente tramite la proprietà `LicenseDocument.customerId`. Il modello canonico `CustomerDocument` non contiene un riferimento diretto a `licenseCode`.
- **Richiesta e Cliente**: `ContactRequestDocument.linkedCustomerId` indica la conversione operativa di una richiesta di contatto in un cliente dell'anagrafica.
- **Richiesta e Licenza**: `ContactRequestDocument.linkedLicenseId` può essere valorizzato solo se la richiesta è stata convertita in un cliente (`linkedCustomerId` presente).

## Confini Operativi

- **Fase 2.2**: Definizione contratti, validator, adapter e utilità condivise per Licenze, Clienti e Richieste.
- **Sottofase 2.3.A**: Contratto canonico di scambio JSON (`ContactRequestExchangeEnvelope`) e API pure di validazione, serializzazione e naming per lo scambio manuale OCR ↔ License Manager.
- **Fase 2.3 (Completamento)**: Integrazione concreta dei modelli nei database Dexie e nelle UI delle due applicazioni.
- **Fase 2.4**: Implementazione del workflow operativo automatizzato (Richiesta → Cliente → Licenza).

## Sicurezza

Il codice licenza è composto da 15 caratteri casuali e un carattere di checksum. Il checksum è utile per l'integrità formale, non per impedire la contraffazione.

