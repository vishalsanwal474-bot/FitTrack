import api from './api.js';
import { buildLocalNutrition, localResponse, shouldUseOffline, cacheUser } from './offlineData.js';

export const getNutrition = async () => {
  try { return await api.get('/nutrition'); }
  catch (error) { if (shouldUseOffline(error)) return localResponse(await buildLocalNutrition()); throw error; }
};
