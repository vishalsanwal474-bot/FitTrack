import api from './api.js';

export const getTodayQuote = () => api.get('/quotes/today');
