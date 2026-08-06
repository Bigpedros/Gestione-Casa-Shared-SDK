# Fase 2.2 – Modelli Condivisi e Contatti (Shared SDK)

## Panoramica

La **Fase 2.2** dell'ecosistema Gestione Casa definisce le fondamenta dati condivise per l'intera suite applicativa (Gestione Casa OCR, Gestione Casa License Manager e futuri client nativi).

Lo Shared SDK non è un database e non gestisce la persistenza o la rete: è una **libreria TypeScript pura** che fornisce tipi, contratti, validatori e adattatori deterministici.

---

## I Tre Modelli Canonici Condivisi

1. **`LicenseDocument`** (`/licensing`):
   - Modello di licenza con formato ufficiale `XXXX-XXXX-XXXX-XXXX` e checksum.
   - Separazione netta tra Edizione (`standard`, `professional`, `enterprise`) e Durata (`beta_60_days`, `annual`, `perpetual`).
   - Gestione del ciclo di vita e della validità temporale.

2. **`CustomerDocument`** (`/customers`):
   - Rappresenta un cliente individuale o un'organizzazione.
   - Normalizzazione automatica degli spazi e trasformazione dell'email in minuscolo.
   - Trattamento coerente dei campi facoltativi (stringhe vuote convertite in `null`).
   - Validazione delle date ISO e prevenzione di inconsistenze cronologiche (`updatedAt` non antecedente a `createdAt`).

3. **`ContactRequestDocument`** (`/contact-requests`):
   - Rappresenta una richiesta di contatto, supporto, rinnovo o richiesta di licenza inviata dalle app.
   - Tipi di richiesta: `information`, `support`, `license_request`, `activation_request`, `renewal_request`, `other`.
   - Stati della richiesta: `new`, `in_review`, `converted_to_customer`, `rejected`, `closed`.
   - Obbligo del consenso privacy (`privacyAcceptedAt`).
   - Validazione del canale di contatto preferito (`email` o `phone`).

---

## Architettura e Relazioni tra Modelli

### 1. Collegamento Cliente / Licenza
Il collegamento ufficiale tra cliente e licenza avviene **esclusivamente** tramite `LicenseDocument.customerId`.
Il modello canonico `CustomerDocument` **non contiene** riferimenti a codici di licenza. Per compatibilità transitoria con i record legacy del License Manager, l'adattatore `managerCustomerEntityToDocument` conserva l'eventuale `licenseCode` isolato in `metadata.legacyLicenseCode`.

### 2. Conversione Richiesta / Cliente
Quando una richiesta di contatto viene convertita in un cliente anagrafico, lo stato della richiesta diventa `converted_to_customer` e la proprietà `ContactRequestDocument.linkedCustomerId` deve essere valorizzata con l'ID del cliente creato.

### 3. Assegnazione Licenza da Richiesta
La proprietà `ContactRequestDocument.linkedLicenseId` memorizza la licenza associata alla richiesta. Può essere valorizzata **esclusivamente se `linkedCustomerId` è presente**.

---

## Supporto Alias Legacy del License Manager

Per garantire una migrazione senza interruzioni dal License Manager, l'adattatore supporta sia gli stati canonici che gli alias UI legacy:

| Stato Legacy License Manager | Stato Canonico `CustomerDocument` |
|---|---|
| `da_attivare` | `pending` |
| `attivo` | `active` |
| `sospeso` | `suspended` |
| `revocato` | `archived` |

---

## Responsabilità delle Applicazioni (Dexie e Repository)

- **Shared SDK**: Fornisce le definizioni dei tipi, i validator (`CustomerValidator`, `ContactRequestValidator`), gli adapter e le utility di formato (`/common`).
- **Gestione Casa OCR & License Manager**: Mantengono i propri database locale Dexie/IndexedDB, la gestione dello stato React, i form UI, la gestione dei file e la rete.

---

## Mappa Roadmap delle Fasi

- **Fase 2.2 (COMPLETATA nello SDK)**: Definizione contratti, tipi, validator, adapter e test per clienti e richieste di contatto.
- **Fase 2.3 (Prossima fase)**: Integrazione concreta delle nuove esportazioni dello SDK nei database Dexie e nelle UI di Gestione Casa License Manager e Gestione Casa OCR.
- **Fase 2.4 (Fase futura)**: Implementazione del workflow operativo automatizzato (Richiesta → Cliente → Licenza).
