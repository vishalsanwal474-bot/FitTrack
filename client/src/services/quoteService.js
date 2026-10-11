import api from './api.js';
import { getLocal, isOffline, offlineKeys } from './offlineStore.js';
import { localResponse, shouldUseOffline } from './offlineData.js';

const FALLBACK_QUOTES = [
  { text: 'Consistency beats intensity. Show up today.', author: 'FitTrack' },
  { text: 'Progress is built one set at a time.', author: 'FitTrack' },
  { text: 'Stronger than yesterday is enough.', author: 'FitTrack' },
  { text: 'Slow progress is still progress.', author: 'FitTrack' },
];
export const getTodayQuote = async () => {
  try { const response = await api.get('/quotes/today'); await import('./offlineStore.js').then(({ setLocal }) => setLocal(offlineKeys.quote, response.data)); return response; }
  catch (error) { if (shouldUseOffline(error)) return localResponse((await getLocal(offlineKeys.quote)) || FALLBACK_QUOTES[new Date().getDate() % FALLBACK_QUOTES.length]); throw error; }
};
