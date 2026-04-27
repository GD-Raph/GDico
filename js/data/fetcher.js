import Papa from 'papaparse';
import { SHEET_CSV_URL, CACHE_TTL } from '../config.js';

export async function fetchGlossaryData() {
  const cached = sessionStorage.getItem('gdico_data');
  const timestamp = sessionStorage.getItem('gdico_timestamp');

  if (cached && timestamp && (Date.now() - timestamp < CACHE_TTL)) {
    console.log('Using cached data');
    return JSON.parse(cached);
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error('Erreur réseau lors de la récupération du Sheet');
    
    const csvText = await response.text();
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      console.warn('Erreurs PapaParse:', result.errors);
    }

    sessionStorage.setItem('gdico_data', JSON.stringify(result.data));
    sessionStorage.setItem('gdico_timestamp', Date.now().toString());

    return result.data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
