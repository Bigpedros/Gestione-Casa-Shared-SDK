# Fase 2.3.A – Contratto Canonico di Scambio Richieste di Contatto

Questo documento descrive il contratto canonico e il flusso di scambio per l'esportazione e l'importazione manuale delle richieste di contatto tra **Gestione Casa OCR** e **Gestione Casa License Manager**, introdotto nello `@gestione-casa/shared-sdk` versione `0.3.0`.

---

## 1. Scopo del ContactRequestExchangeEnvelope

`ContactRequestExchangeEnvelope` è il contenitore ufficiale per scambiare file JSON tra applicazioni disaccoppiate o disconnesse. Permette a **Gestione Casa OCR** di esportare una richiesta di contatto su file e a **Gestione Casa License Manager** di importarla e gestirla.

---

## 2. Differenza tra `ContactRequestDocument` ed `Envelope`

- **`ContactRequestDocument`**: Rappresenta il documento di dominio canonico memorizzato nel database dell'applicazione (Dexie/IndexedDB).
- **`ContactRequestExchangeEnvelope`**: Rappresenta il file di interscambio serializzabile che avvolge il `ContactRequestDocument` con metadati di formato e data di esportazione (`exportedAt`).

---

## 3. Struttura del Formato e `formatVersion`

```typescript
export interface ContactRequestExchangeEnvelope {
  format: 'gestione-casa-contact-request';
  formatVersion: 1;
  exportedAt: string; // ISO 8601 UTC
  request: ContactRequestDocument;
}
```

- **`format`**: Sempre `'gestione-casa-contact-request'`.
- **`formatVersion`**: Intero `1`. Garanzia di retrocompatibilità e evoluzione futura.
- **`exportedAt`**: Stringa ISO 8601 indicante il momento esatto dell'esportazione.
- **`request`**: Il documento `ContactRequestDocument` validato e normalizzato.

---

## 4. Flusso OCR → JSON → License Manager

```text
[ Gestione Casa OCR ]
    │
    ├─► Generazione / Selezione ContactRequestDocument
    ├─► createContactRequestExchangeEnvelope(request)
    ├─► serializeContactRequestExchangeEnvelope(envelope)
    ├─► buildContactRequestExchangeFileName(envelope)
    └─► Download File JSON (gestione-casa-contact-request_<ID>_<YYYYMMDD-HHmmss>.json)
            │
            │ (Scambio Manuale / Email / File Transfer)
            ▼
[ Gestione Casa License Manager ]
    │
    ├─► Caricamento File JSON tramite File Picker
    ├─► deserializeContactRequestExchangeEnvelope(json)
    ├─► Validazione Rifiuto File Non Attendibili
    └─► Salvataggio nel Repository Dexie Locale (Prevenzione Duplicati per ID)
```

---

## 5. Validazione Obbligatoria e Gestione File Non Attendibili

Tutti i file JSON caricati in ingresso devono essere considerati **non attendibili** fino a validazione eseguita con `deserializeContactRequestExchangeEnvelope()` o `validateContactRequestExchangeEnvelope()`.

La validazione rifiuta:
- File JSON malformati o stringhe vuote (`exchange.invalid_json`);
- Formati sconosciuti o `formatVersion` diversa da `1` (`exchange.invalid_format`, `exchange.unsupported_format_version`);
- Date `exportedAt` non ISO 8601 (`exchange.invalid_exported_at`);
- Documenti interni con enum non canonici, date incoerenti, `schemaVersion` diversa da `1` o `linkedLicenseId` senza `linkedCustomerId`.

---

## 6. Regole Operative della Fase 2.3

1. **Prevenzione Duplicati**: La prevenzione dei duplicati è demandata al repository del License Manager controllando la presenza del `request.id` nella tabella IndexedDB locale.
2. **Stato di Sincronizzazione (`syncStatus`)**: Durante la Fase 2.3, il campo `syncStatus` rimane `'pending'`. La transizione allo stato `'synced'` è rinviata alla sincronizzazione automatica della **Fase 2.5**.
3. **Firma Digitale**: Nella Fase 2.3 non viene applicata alcuna firma crittografica sui file di scambio JSON.
4. **Nessuna Conversione Automatica**: La conversione automatica **Richiesta → Cliente → Licenza** è rinviata alla **Fase 2.4**.
5. **Distribuzione SDK**: Il pacchetto `@gestione-casa/shared-sdk` viene distribuito ai repository applicativi tramite pacchetto compilato `.tgz` (`gestione-casa-shared-sdk-0.3.0.tgz`).
