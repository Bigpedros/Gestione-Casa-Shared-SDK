import express from 'express';
import path from 'path';
import {
  LicenseEngine,
  LicenseValidator,
  calculateExpirationDate,
  calculateRemainingDays,
  evaluateLicense,
  legacyAppRecordToSnapshot,
  managerEntityToDocument,
  documentToClientSnapshot,
  serializeClientLicense,
  deserializeClientLicense,
  SAFE_ALPHABET,
  LICENSE_ENGINE_VERSION,
  LICENSE_SCHEMA_VERSION,
  type ClientLicenseSnapshot,
  type LegacyAppLicenseRecord,
  type ManagerLicenseEntityLike,
  type LicenseEdition,
  type LicenseTerm,
} from '../../src/licensing/index.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sdk: 'Gestione Casa Shared SDK',
    version: '0.1.0',
    engineVersion: LICENSE_ENGINE_VERSION,
    schemaVersion: LICENSE_SCHEMA_VERSION,
    alphabetSize: SAFE_ALPHABET.length,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/generate', (req, res) => {
  try {
    const { count = 1, deterministic = false } = req.body || {};
    const qty = Math.min(Math.max(1, parseInt(String(count), 10) || 1), 50);

    const codes: string[] = [];

    if (deterministic) {
      let seedCounter = 0;
      const deterministicRandom = {
        fill(target: Uint32Array) {
          for (let i = 0; i < target.length; i++) {
            target[i] = seedCounter++;
          }
        },
      };
      for (let i = 0; i < qty; i++) {
        codes.push(LicenseEngine.generateCode(deterministicRandom));
      }
    } else {
      for (let i = 0; i < qty; i++) {
        codes.push(LicenseEngine.generateCode());
      }
    }

    res.json({
      success: true,
      codes,
      count: codes.length,
      isDeterministic: !!deterministic,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Errore nella generazione' });
  }
});

app.post('/api/validate', (req, res) => {
  try {
    const { code = '' } = req.body || {};
    const parseResult = LicenseValidator.parse(String(code));
    res.json({
      success: true,
      result: parseResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Errore nella validazione' });
  }
});

app.post('/api/evaluate', (req, res) => {
  try {
    const { snapshot, evaluationDate } = req.body || {};
    if (!snapshot || typeof snapshot !== 'object') {
      return res.status(400).json({ success: false, error: 'Snapshot mancante o non valido.' });
    }

    const now = evaluationDate ? new Date(evaluationDate) : new Date();
    const result = evaluateLicense(snapshot as ClientLicenseSnapshot, now);

    res.json({
      success: true,
      evaluation: result,
      evaluatedAt: now.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Errore nella valutazione' });
  }
});

app.post('/api/adapt-legacy', (req, res) => {
  try {
    const { record, type, edition = 'standard', term = 'annual' } = req.body || {};

    if (type === 'legacyApp') {
      const snapshot = legacyAppRecordToSnapshot(record as LegacyAppLicenseRecord, edition as LicenseEdition);
      return res.json({ success: true, snapshot });
    } else if (type === 'manager') {
      const doc = managerEntityToDocument(record as ManagerLicenseEntityLike, term as LicenseTerm);
      const snapshot = documentToClientSnapshot(doc);
      return res.json({ success: true, document: doc, snapshot });
    }

    res.status(400).json({ success: false, error: 'Tipo adattatore non supportato.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Errore nella conversione' });
  }
});

app.post('/api/serialize', (req, res) => {
  try {
    const { snapshot } = req.body || {};
    const serialized = serializeClientLicense(snapshot as ClientLicenseSnapshot);
    const deserialized = deserializeClientLicense(serialized);

    res.json({
      success: true,
      serialized,
      deserialized,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Errore nella serializzazione' });
  }
});

app.post('/api/calc-expiration', (req, res) => {
  try {
    const { activatedAt, term } = req.body || {};
    const expiresAt = calculateExpirationDate(activatedAt, term);
    const remainingDays = calculateRemainingDays(expiresAt);

    res.json({
      success: true,
      activatedAt,
      term,
      expiresAt,
      remainingDays,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Errore nel calcolo scadenza' });
  }
});

// Serve HTML Workbench UI
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gestione Casa - Shared SDK Workbench</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col">

  <!-- Header -->
  <header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg shadow-inner">
          GC
        </div>
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight">Gestione Casa <span class="text-indigo-400 font-normal">Shared SDK</span></h1>
          <p class="text-xs text-slate-400">Pacchetto Condiviso per Gestione Licenze & Model Contracts</p>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">SDK v0.1.0</span>
        <span class="px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 font-medium">Engine v${LICENSE_ENGINE_VERSION}</span>
        <span class="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-medium flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Attivo (Porta 3000)
        </span>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

    <!-- Overview Bar -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Formato Licenza</span>
        <div class="text-lg font-mono font-bold text-indigo-300 mt-1">XXXX-XXXX-XXXX-XXXX</div>
        <span class="text-xs text-slate-400 mt-2">16 caratteri divisi in 4 gruppi</span>
      </div>

      <div class="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Alfabeto Sicuro</span>
        <div class="text-lg font-mono font-bold text-emerald-300 mt-1">27 Caratteri</div>
        <span class="text-xs text-slate-400 mt-2">Esclusi O/0, I/1/L, S/5, Z/2</span>
      </div>

      <div class="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Payload + Checksum</span>
        <div class="text-lg font-mono font-bold text-amber-300 mt-1">15 Payload + 1 Check</div>
        <span class="text-xs text-slate-400 mt-2">Checksum modulo 27 pesato</span>
      </div>

      <div class="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Modelli Canonici</span>
        <div class="text-lg font-mono font-bold text-cyan-300 mt-1">Edition & Term</div>
        <span class="text-xs text-slate-400 mt-2">Separazione netta durata e piano</span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-800 gap-2 overflow-x-auto">
      <button id="tab-btn-generator" onclick="switchTab('generator')" class="tab-btn active px-4 py-2.5 text-sm font-semibold text-indigo-400 border-b-2 border-indigo-500 flex items-center gap-2">
        ⚡ Generatore Codici
      </button>
      <button id="tab-btn-validator" onclick="switchTab('validator')" class="tab-btn px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2">
        🔍 Validatore & Analizzatore
      </button>
      <button id="tab-btn-evaluator" onclick="switchTab('evaluator')" class="tab-btn px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2">
        ⏱️ Valutatore Ciclo di Vita
      </button>
      <button id="tab-btn-adapter" onclick="switchTab('adapter')" class="tab-btn px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2">
        🔄 Adattatore Legacy
      </button>
      <button id="tab-btn-docs" onclick="switchTab('docs')" class="tab-btn px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2">
        📚 Documentazione SDK
      </button>
    </div>

    <!-- Tab 1: Generatore -->
    <div id="tab-generator" class="tab-content flex flex-col gap-6">
      <div class="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-bold text-white mb-2">Generatore di Codici Licenza Ufficiali</h2>
        <p class="text-sm text-slate-400 mb-6">Genera codici licenza secondo il formato canonico dell'SDK utilizzando il generatore crittograficamente sicuro o una sorgente deterministica per test.</p>

        <div class="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2">Quantità da Generare</label>
            <input type="number" id="gen-count" value="5" min="1" max="20" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-28 focus:outline-none focus:border-indigo-500">
          </div>

          <div class="flex items-center gap-2 pb-2">
            <input type="checkbox" id="gen-deterministic" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0">
            <label for="gen-deterministic" class="text-xs text-slate-300 cursor-pointer">Usa sorgente deterministica (Mock)</label>
          </div>

          <button onclick="generateCodes()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-600/20">
            Genera Codici
          </button>
        </div>

        <div id="gen-results" class="hidden flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase text-slate-400">Codici Generati</span>
            <button onclick="copyGeneratedCodes()" class="text-xs text-indigo-400 hover:text-indigo-300">Copia tutti</button>
          </div>
          <div id="gen-list" class="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2"></div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Validatore -->
    <div id="tab-validator" class="tab-content hidden flex flex-col gap-6">
      <div class="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-bold text-white mb-2">Validatore & Analizzatore Sintattico</h2>
        <p class="text-sm text-slate-400 mb-6">Incolla o digita un codice licenza per verificare formato, alfabeto sicuro e checksum pesato.</p>

        <div class="flex flex-col gap-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2">Codice Licenza</label>
            <div class="flex gap-3">
              <input type="text" id="val-input" placeholder="es. A3BK-79MP-XUYT-469E" class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 font-mono text-sm text-white flex-1 uppercase focus:outline-none focus:border-indigo-500">
              <button onclick="validateInput()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                Verifica Codice
              </button>
            </div>
          </div>
        </div>

        <div id="val-output" class="hidden bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <span class="text-sm font-semibold text-slate-300">Esito Validazione</span>
            <span id="val-status-badge" class="px-3 py-1 rounded-full text-xs font-bold"></span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div class="bg-slate-950 p-3 rounded-lg">
              <span class="text-slate-400 block mb-1">Codice Normalizzato</span>
              <span id="val-norm" class="font-mono font-bold text-white text-sm"></span>
            </div>
            <div class="bg-slate-950 p-3 rounded-lg">
              <span class="text-slate-400 block mb-1">Formato (19 Caratteri / 4 Gruppi)</span>
              <span id="val-fmt" class="font-bold text-sm"></span>
            </div>
            <div class="bg-slate-950 p-3 rounded-lg">
              <span class="text-slate-400 block mb-1">Payload Base (15 Caratteri)</span>
              <span id="val-payload" class="font-mono font-bold text-amber-400 text-sm"></span>
            </div>
            <div class="bg-slate-950 p-3 rounded-lg">
              <span class="text-slate-400 block mb-1">Carattere Checksum Calcolato</span>
              <span id="val-checksum" class="font-mono font-bold text-emerald-400 text-sm"></span>
            </div>
          </div>

          <div id="val-error-container" class="hidden bg-red-950/40 border border-red-800/50 rounded-lg p-3 text-red-300 text-xs">
            <strong class="font-semibold">Messaggio di errore:</strong> <span id="val-error-text"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Valutatore Ciclo di Vita -->
    <div id="tab-evaluator" class="tab-content hidden flex flex-col gap-6">
      <div class="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-bold text-white mb-2">Valutatore di Usabilità Licenza</h2>
        <p class="text-sm text-slate-400 mb-6">Simula una valutazione ClientLicenseSnapshot per calcolare l'usabilità effettiva e i giorni residui.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Codice Licenza</label>
            <input type="text" id="eval-code" value="A3BK-79MP-XUYT-469E" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white w-full">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Intestatario (Owner)</label>
            <input type="text" id="eval-owner" value="Mario Rossi" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Edizione (Edition)</label>
            <select id="eval-edition" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full">
              <option value="standard">standard</option>
              <option value="professional" selected>professional</option>
              <option value="enterprise">enterprise</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Durata (Term)</label>
            <select id="eval-term" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full" onchange="updateEvalDates()">
              <option value="beta_60_days">beta_60_days (60 giorni)</option>
              <option value="annual" selected>annual (1 anno)</option>
              <option value="perpetual">perpetual (perpetua)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Stato Operativo (Status)</label>
            <select id="eval-status" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full">
              <option value="activated" selected>activated (Attiva)</option>
              <option value="generated">generated</option>
              <option value="assigned">assigned</option>
              <option value="sent">sent</option>
              <option value="suspended">suspended</option>
              <option value="revoked">revoked</option>
              <option value="expired">expired</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Data Attivazione</label>
            <input type="datetime-local" id="eval-activated" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Data Scadenza (Calcolata o Personalizzata)</label>
            <input type="datetime-local" id="eval-expires" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Data di Valutazione (Simulazione)</label>
            <input type="datetime-local" id="eval-now" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full">
          </div>
        </div>

        <button onclick="evaluateSnapshot()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors mb-6">
          Valuta Licenza
        </button>

        <div id="eval-output" class="hidden bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <span class="text-sm font-semibold text-slate-300">Risultato Valutazione</span>
            <span id="eval-badge" class="px-3 py-1 rounded-full text-xs font-bold"></span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div class="bg-slate-950 p-3 rounded-lg">
              <span class="text-slate-400 block mb-1">Stato Effettivo</span>
              <span id="eval-eff-status" class="font-bold text-sm text-indigo-300"></span>
            </div>
            <div class="bg-slate-950 p-3 rounded-lg">
              <span class="text-slate-400 block mb-1">Giorni Residui</span>
              <span id="eval-days" class="font-bold text-sm text-emerald-400"></span>
            </div>
            <div class="bg-slate-950 p-3 rounded-lg">
              <span class="text-slate-400 block mb-1">Utilizzabile (isUsable)</span>
              <span id="eval-usable" class="font-bold text-sm"></span>
            </div>
          </div>

          <div id="eval-reason-box" class="hidden bg-amber-950/40 border border-amber-800/50 rounded-lg p-3 text-amber-300 text-xs">
            <strong class="font-semibold">Motivo:</strong> <span id="eval-reason"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Adattatori Legacy -->
    <div id="tab-adapter" class="tab-content hidden flex flex-col gap-6">
      <div class="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-bold text-white mb-2">Adattatori di Conversione Modelli Legacy</h2>
        <p class="text-sm text-slate-400 mb-6">Mappa le strutture dati dei vecchi repository (Gestione Casa OCR e License Manager) verso il modello canonico dello SDK.</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Legacy App Adapter -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 class="text-sm font-bold text-indigo-300 uppercase tracking-wider">Adattatore App Legacy (Gestione Casa OCR)</h3>
            <p class="text-xs text-slate-400">Converte <code class="text-indigo-400">LegacyAppLicenseRecord</code> in <code class="text-indigo-400">ClientLicenseSnapshot</code>.</p>

            <div class="flex flex-col gap-3 text-xs">
              <div>
                <label class="block text-slate-300 mb-1">License ID (Legacy)</label>
                <input type="text" id="leg-id" value="A3BK79MPXUYT469E" class="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 w-full font-mono text-white">
              </div>
              <div>
                <label class="block text-slate-300 mb-1">License Type (Legacy)</label>
                <select id="leg-type" class="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 w-full text-white">
                  <option value="beta_60_days">beta_60_days</option>
                  <option value="annual" selected>annual</option>
                  <option value="lifetime_perpetual">lifetime_perpetual</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-300 mb-1">Status (Legacy)</label>
                <select id="leg-status" class="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 w-full text-white">
                  <option value="beta_active">beta_active</option>
                  <option value="perpetual_active" selected>perpetual_active</option>
                  <option value="beta_expired">beta_expired</option>
                  <option value="not_activated">not_activated</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>
            </div>

            <button onclick="convertLegacyApp()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded transition-colors self-start">
              Converti Record App
            </button>

            <pre id="leg-output" class="hidden bg-slate-950 p-3 rounded text-xs text-emerald-300 overflow-x-auto font-mono"></pre>
          </div>

          <!-- License Manager Adapter -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 class="text-sm font-bold text-cyan-300 uppercase tracking-wider">Adattatore License Manager</h3>
            <p class="text-xs text-slate-400">Converte <code class="text-cyan-400">ManagerLicenseEntityLike</code> in <code class="text-cyan-400">LicenseDocument</code> canonico.</p>

            <div class="flex flex-col gap-3 text-xs">
              <div>
                <label class="block text-slate-300 mb-1">Customer Name</label>
                <input type="text" id="mgr-name" value="Giuseppe Verdi" class="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 w-full text-white">
              </div>
              <div>
                <label class="block text-slate-300 mb-1">License Type (Manager)</label>
                <select id="mgr-type" class="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 w-full text-white">
                  <option value="Standard">Standard</option>
                  <option value="Professional" selected>Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-300 mb-1">Status (Manager)</label>
                <select id="mgr-status" class="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 w-full text-white">
                  <option value="activated" selected>activated</option>
                  <option value="generated">generated</option>
                  <option value="assigned">assigned</option>
                  <option value="revoked">revoked</option>
                </select>
              </div>
            </div>

            <button onclick="convertManagerEntity()" class="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2 rounded transition-colors self-start">
              Converti Entità Manager
            </button>

            <pre id="mgr-output" class="hidden bg-slate-950 p-3 rounded text-xs text-cyan-300 overflow-x-auto font-mono"></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 5: Documentazione -->
    <div id="tab-docs" class="tab-content hidden flex flex-col gap-6">
      <div class="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h2 class="text-lg font-bold text-white mb-2">Architettura & Specifica dello Shared SDK</h2>
          <p class="text-sm text-slate-400">Lo Shared SDK stabilisce il contratto canonico per tutte le piattaforme client e server dell'ecosistema Gestione Casa.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <span class="font-bold text-indigo-400 text-sm">Separazione Concettuale (Edition vs Term)</span>
            <p class="text-slate-300 leading-relaxed">I repository originali sovrapponevano il concetto di edizione e durata. Nello SDK condiviso:</p>
            <ul class="list-disc list-inside text-slate-400 space-y-1 mt-1">
              <li><strong class="text-slate-200">edition:</strong> standard, professional, enterprise</li>
              <li><strong class="text-slate-200">term:</strong> beta_60_days, annual, perpetual</li>
              <li><strong class="text-slate-200">status:</strong> generated, assigned, sent, activated, suspended, revoked, expired, invalid</li>
            </ul>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <span class="font-bold text-emerald-400 text-sm">Caratteristiche Algoritmo Codice</span>
            <p class="text-slate-300 leading-relaxed">Algoritmo di generazione sicuro e resistente a errori di digitazione:</p>
            <ul class="list-disc list-inside text-slate-400 space-y-1 mt-1">
              <li>Formato ufficiale: <code class="text-emerald-300 font-mono">XXXX-XXXX-XXXX-XXXX</code></li>
              <li>Alfabeto sicuro di 27 caratteri (esclusi O/0, I/1/L, S/5, Z/2)</li>
              <li>15 caratteri casuali di payload + 1 carattere checksum pesato</li>
              <li>Checksum pesato per posizione con aritmetica modulare 27</li>
            </ul>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
          <span class="font-bold text-amber-400 text-sm block mb-2">Firma Digitale & Predisposizione Ed25519</span>
          <p class="text-slate-300 leading-relaxed">
            Il checksum rileva errori di inserimento ma non impedisce alterazioni intenzionali. Lo SDK predispone le interfacce <code class="text-amber-300 font-mono">DigitalSignatureEnvelope</code> e <code class="text-amber-300 font-mono">DigitalSignatureVerifier</code> per consentire al License Manager di firmare i documenti con chiave privata Ed25519 e ai client (Android/iOS/Desktop) di verificarli tramite la sola chiave pubblica.
          </p>
        </div>
      </div>
    </div>

  </main>

  <footer class="border-t border-slate-800 bg-slate-950 py-4 mt-auto">
    <div class="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
      Gestione Casa Shared SDK &copy; 2026 &bull; Ecosistema Gestione Casa &bull; Licenza MIT
    </div>
  </footer>

  <script>
    function switchTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active', 'text-indigo-400', 'border-indigo-500');
        el.classList.add('text-slate-400', 'border-transparent');
      });

      const targetContent = document.getElementById('tab-' + tabName);
      const targetBtn = document.getElementById('tab-btn-' + tabName);

      if (targetContent) targetContent.classList.remove('hidden');
      if (targetBtn) {
        targetBtn.classList.add('active', 'text-indigo-400', 'border-indigo-500');
        targetBtn.classList.remove('text-slate-400', 'border-transparent');
      }
    }

    async function generateCodes() {
      const count = document.getElementById('gen-count').value || 5;
      const deterministic = document.getElementById('gen-deterministic').checked;

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count, deterministic })
        });
        const data = await res.json();

        if (data.success) {
          const list = document.getElementById('gen-list');
          list.innerHTML = '';
          data.codes.forEach(code => {
            const row = document.createElement('div');
            row.className = 'bg-slate-900 border border-slate-700/70 rounded-lg p-2.5 px-4 flex items-center justify-between font-mono text-sm text-indigo-300 hover:border-indigo-500/50 transition-colors';
            row.innerHTML = \`
              <span>\${code}</span>
              <button onclick="copyToClipboard('\${code}')" class="text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded">Copia</button>
            \`;
            list.appendChild(row);
          });
          document.getElementById('gen-results').classList.remove('hidden');
        }
      } catch (err) {
        alert('Errore generazione: ' + err.message);
      }
    }

    async function validateInput() {
      const code = document.getElementById('val-input').value;
      if (!code) return;

      try {
        const res = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.success) {
          const r = data.result;
          document.getElementById('val-output').classList.remove('hidden');
          document.getElementById('val-norm').innerText = r.normalizedCode || '-';
          document.getElementById('val-fmt').innerText = r.isFormatValid ? 'VALIDO' : 'NON VALIDO';
          document.getElementById('val-fmt').className = r.isFormatValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';
          document.getElementById('val-payload').innerText = r.payloadBase || '-';
          document.getElementById('val-checksum').innerText = r.checksumChar || '-';

          const badge = document.getElementById('val-status-badge');
          if (r.isValid) {
            badge.innerText = 'CODICE VALIDO';
            badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
            document.getElementById('val-error-container').classList.add('hidden');
          } else {
            badge.innerText = 'CODICE NON VALIDO';
            badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800';
            document.getElementById('val-error-container').classList.remove('hidden');
            document.getElementById('val-error-text').innerText = r.error || 'Errore generico';
          }
        }
      } catch (err) {
        alert('Errore validazione: ' + err.message);
      }
    }

    function updateEvalDates() {
      const term = document.getElementById('eval-term').value;
      const now = new Date();
      document.getElementById('eval-activated').value = now.toISOString().slice(0, 16);
      document.getElementById('eval-now').value = now.toISOString().slice(0, 16);

      if (term === 'perpetual') {
        document.getElementById('eval-expires').value = '';
      } else if (term === 'beta_60_days') {
        const exp = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        document.getElementById('eval-expires').value = exp.toISOString().slice(0, 16);
      } else {
        const exp = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        document.getElementById('eval-expires').value = exp.toISOString().slice(0, 16);
      }
    }

    async function evaluateSnapshot() {
      const snapshot = {
        licenseCode: document.getElementById('eval-code').value,
        owner: document.getElementById('eval-owner').value,
        edition: document.getElementById('eval-edition').value,
        term: document.getElementById('eval-term').value,
        status: document.getElementById('eval-status').value,
        customerId: null,
        deviceId: null,
        activatedAt: document.getElementById('eval-activated').value ? new Date(document.getElementById('eval-activated').value).toISOString() : null,
        expiresAt: document.getElementById('eval-expires').value ? new Date(document.getElementById('eval-expires').value).toISOString() : null,
        engineVersion: '2.1',
        schemaVersion: 1
      };

      const nowVal = document.getElementById('eval-now').value;
      const evaluationDate = nowVal ? new Date(nowVal).toISOString() : new Date().toISOString();

      try {
        const res = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshot, evaluationDate })
        });
        const data = await res.json();

        if (data.success) {
          const ev = data.evaluation;
          document.getElementById('eval-output').classList.remove('hidden');
          document.getElementById('eval-eff-status').innerText = ev.effectiveStatus;
          document.getElementById('eval-days').innerText = ev.remainingDays !== null ? ev.remainingDays + ' giorni' : 'Illimitati (Perpetua)';
          document.getElementById('eval-usable').innerText = ev.isUsable ? 'SI (Utilizzabile)' : 'NO (Non utilizzabile)';
          document.getElementById('eval-usable').className = ev.isUsable ? 'font-bold text-sm text-emerald-400' : 'font-bold text-sm text-red-400';

          const badge = document.getElementById('eval-badge');
          if (ev.isUsable) {
            badge.innerText = 'UTILIZZABILE';
            badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
            document.getElementById('eval-reason-box').classList.add('hidden');
          } else {
            badge.innerText = 'NON UTILIZZABILE';
            badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800';
            document.getElementById('eval-reason-box').classList.remove('hidden');
            document.getElementById('eval-reason').innerText = ev.reason || 'Licenza non attiva o scaduta';
          }
        }
      } catch (err) {
        alert('Errore valutazione: ' + err.message);
      }
    }

    async function convertLegacyApp() {
      const record = {
        licenseId: document.getElementById('leg-id').value,
        licenseType: document.getElementById('leg-type').value,
        status: document.getElementById('leg-status').value,
        activationDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        owner: 'Utente Legacy App'
      };

      try {
        const res = await fetch('/api/adapt-legacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'legacyApp', record, edition: 'standard' })
        });
        const data = await res.json();
        if (data.success) {
          const el = document.getElementById('leg-output');
          el.innerText = JSON.stringify(data.snapshot, null, 2);
          el.classList.remove('hidden');
        }
      } catch (err) { alert(err.message); }
    }

    async function convertManagerEntity() {
      const record = {
        id: 'mgr-lic-001',
        licenseCode: 'A3BK-79MP-XUYT-469E',
        licenseType: document.getElementById('mgr-type').value,
        status: document.getElementById('mgr-status').value,
        customerName: document.getElementById('mgr-name').value,
        generatedAt: new Date().toISOString(),
        activatedAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/adapt-legacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'manager', record, term: 'annual' })
        });
        const data = await res.json();
        if (data.success) {
          const el = document.getElementById('mgr-output');
          el.innerText = JSON.stringify(data.document, null, 2);
          el.classList.remove('hidden');
        }
      } catch (err) { alert(err.message); }
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text);
      alert('Copiato: ' + text);
    }

    function copyGeneratedCodes() {
      const list = Array.from(document.querySelectorAll('#gen-list span')).map(e => e.innerText).join('\\n');
      navigator.clipboard.writeText(list);
      alert('Tutti i codici sono stati copiati negli appunti!');
    }

    // Init defaults
    window.addEventListener('DOMContentLoaded', () => {
      updateEvalDates();
      generateCodes();
    });
  </script>
</body>
</html>`;
  res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AI Studio] Gestione Casa Shared SDK Workbench running at http://0.0.0.0:${PORT}`);
});
