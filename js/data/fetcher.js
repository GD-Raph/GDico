import Papa from 'papaparse';
import { SHEET_CSV_URL, CACHE_TTL } from '../config.js';

const CACHE_KEY = 'gdico_data';
const CACHE_TS_KEY = 'gdico_ts';

export function fetchData() {
  const cached = getCache();
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    Papa.parse(SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(results) {
        setCache(results.data);
        resolve(results.data);
      },
      error(err) {
        reject(new Error(`Impossible de charger le glossaire : ${err.message}`));
      },
    });
  });
}

function getCache() {
  try {
    const ts = sessionStorage.getItem(CACHE_TS_KEY);
    if (!ts || Date.now() - parseInt(ts, 10) > CACHE_TTL) return null;
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {
    // storage full or unavailable — silently skip
  }
}
