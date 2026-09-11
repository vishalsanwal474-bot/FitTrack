import { getDailyQuote } from '../services/quoteService.js';

export const getTodayQuote = async (_req, res, next) => {
  try {
    res.json({ quote: getDailyQuote() });
  } catch (err) {
    next(err);
  }
};
