# Matrice di migrazione

| Responsabilità | Shared SDK | License Manager | Gestione Casa OCR |
|---|---:|---:|---:|
| Formato e checksum codice | Sì | No | No |
| Generazione codice | Sì | Consuma | No |
| Tipi canonici licenza | Sì | Consuma | Consuma |
| Calcolo scadenza | Sì | Consuma | Consuma |
| Firma privata futura | Contratto | Implementa | Mai |
| Verifica firma futura | Contratto | Facoltativa | Implementa |
| Database Dexie | No | Sì | Sì |
| Repository dati | No | Sì | Sì |
| React/context/UI | No | Sì | Sì |
| Attivazione remota/API | Contratti futuri | Server/autore | Client |
| OCR e classificazione prodotti | No, per ora | No | Sì |
| Notifiche ed email | Solo contratti futuri | No | Sì |

## Scelta di perimetro

OCR, budget, report e notifiche non vengono trasferiti nella versione 0.1.0 perché non sono attualmente condivisi con il License Manager. Saranno estratti solo quando esisterà almeno un secondo consumatore reale, evitando di trasformare lo SDK in un duplicato dell'app principale.
