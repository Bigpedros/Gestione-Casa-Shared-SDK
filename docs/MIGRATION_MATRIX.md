# Matrice di migrazione

| Responsabilità | Shared SDK | License Manager | Gestione Casa OCR |
|---|---:|---:|---:|
| Formato e checksum codice licenza | Sì | No | No |
| Generazione codice licenza | Sì | Consuma | No |
| Tipi canonici licenza (`LicenseDocument`) | Sì | Consuma | Consuma |
| Modello canonico cliente (`CustomerDocument`) | Sì | Consuma (Fase 2.3) | Consuma (Fase 2.3) |
| Modello richiesta contatto (`ContactRequestDocument`) | Sì | Consuma (Fase 2.3) | Consuma (Fase 2.3) |
| Contratto di scambio JSON richieste (`ContactRequestExchangeEnvelope`) | Sì (v0.3.0) | Consuma (Fase 2.3) | Consuma (Fase 2.3) |
| Validator e normalizzatori | Sì | Consuma | Consuma |
| Calcolo scadenze e utilità date | Sì | Consuma | Consuma |
| Adapter legacy cliente | Sì | Consuma | No |
| Database Dexie e schemi locale | No | Sì | Sì |
| Repository e persistenze | No | Sì | Sì |
| React UI e form | No | Sì | Sì |
| Workflow transizionale (Richiesta → Cliente → Licenza) | Solo contratti | Implementa (Fase 2.4) | Consuma (Fase 2.4) |
| Contratti attivazione online (`ActivationRequest`, `ActivationResponse`, envelopes) | Sì (Fase 2.6.B1) | Consuma (Fase 2.6) | Consuma (Fase 2.6) |
| Licenza firmata e payload canonico v1 (`SignedLicenseDocument`, `buildCanonicalLicensePayloadV1`) | Sì (Fase 2.6.B1) | Consuma / Firma | Consuma / Verifica |

## Scelta di perimetro

Nella Fase 2.2 lo Shared SDK definisce i contratti, i tipi e le regole di validazione per `LicenseDocument`, `CustomerDocument` e `ContactRequestDocument`. La gestione concreta dei dati nel database (Dexie/IndexedDB) e l'interfaccia utente rimangono responsabilità delle singole applicazioni.

