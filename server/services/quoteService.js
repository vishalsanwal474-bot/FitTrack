import { QUOTES } from '../data/quotes.js';
import { startOfLocalDay } from '../utils/workoutStats.js';

function daySeed(date = new Date()) {
  const d = startOfLocalDay(date);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Same quote for everyone on a given local calendar day. */
export function getDailyQuote(date = new Date()) {
  const index = daySeed(date) % QUOTES.length;
  const quote = QUOTES[index];
  return {
    text: quote.text,
    author: quote.author,
    date: startOfLocalDay(date).toISOString(),
    index,
  };
}
