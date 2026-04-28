import express from 'express';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed in Node 20+)
try {
  const env = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
  env.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#') && !(k.trim() in process.env)) {
      process.env[k.trim()] = v.join('=').trim();
    }
  });
} catch (_) { /* .env absent en prod, on utilise les vars d'env système */ }

const API_KEY        = process.env.API_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const CREDENTIALS_PATH = join(__dirname, '..', 'datalake-380714-d2e17ea483d1.json');
const SPREADSHEET_ID   = '1n1Ab8X5-JY33Q2zJUO5HRIHHQ759p7RU3l16EVHN_vs';
const SHEET_GID        = 0;
const VALID_ACTIONS    = new Set(['create', 'update', 'delete']);

const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
const auth  = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const sheets = google.sheets({ version: 'v4', auth });

// Cache sheet name (doesn't change between requests)
let _sheetName = null;
async function getSheetName() {
  if (_sheetName) return _sheetName;
  const meta  = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
  if (!sheet) throw new Error(`Onglet GID ${SHEET_GID} introuvable.`);
  _sheetName = sheet.properties.title;
  return _sheetName;
}

async function getAllValues(sheetName) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: sheetName });
  return res.data.values || [];
}

const app = express();

// CORS
app.use((req, res, next) => {
  const origin = ALLOWED_ORIGIN || req.headers.origin || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// Auth middleware
app.use('/api', (req, res, next) => {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ ok: false, error: 'Non autorisé.' });
  }
  next();
});

app.post('/api/terms', async (req, res) => {
  try {
    const { action, originalName, data } = req.body;

    // Validate action
    if (!VALID_ACTIONS.has(action)) {
      return res.status(400).json({ ok: false, error: `Action invalide : ${action}` });
    }

    // Validate term name for create/update
    if ((action === 'create' || action === 'update') && !data?.Terme?.trim()) {
      return res.status(400).json({ ok: false, error: 'Le champ Terme est obligatoire.' });
    }

    // Validate originalName for update/delete
    if ((action === 'update' || action === 'delete') && !originalName?.trim()) {
      return res.status(400).json({ ok: false, error: 'originalName est obligatoire pour update/delete.' });
    }

    const sheetName = await getSheetName();
    const allData   = await getAllValues(sheetName);
    const headers   = allData[0] || [];
    const termIdx   = headers.indexOf('Terme');

    if (action === 'create') {
      const row = headers.map(h => data[h] ?? '');
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetName,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
      });

    } else if (action === 'update') {
      let rowIndex = -1;
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][termIdx] === originalName) { rowIndex = i + 1; break; }
      }
      if (rowIndex < 0) return res.status(404).json({ ok: false, error: 'Terme introuvable.' });

      const existing = allData[rowIndex - 1];
      const row = headers.map((h, col) => data[h] !== undefined ? data[h] : (existing[col] ?? ''));
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
      });

    } else if (action === 'delete') {
      let rowIndex = -1;
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][termIdx] === originalName) { rowIndex = i; break; }
      }
      if (rowIndex < 0) return res.status(404).json({ ok: false, error: 'Terme introuvable.' });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: { sheetId: SHEET_GID, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 },
            },
          }],
        },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[API]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`));
