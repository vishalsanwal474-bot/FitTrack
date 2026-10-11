import api from './api.js';
import { buildLocalDashboard, localResponse, shouldUseOffline } from './offlineData.js';
import { offlineKeys, getLocal, setLocal } from './offlineStore.js';

export const getDashboard = async () => {
  try {
    const response = await api.get('/dashboard');
    await setLocal(offlineKeys.quote, response.data.quote || null);
    await setLocal('dashboard', response.data);
    return response;
  } catch (error) {
    if (shouldUseOffline(error)) {
      const cached = await getLocal('dashboard');
      return cached ? localResponse(cached) : localResponse(await buildLocalDashboard());
    }
    throw error;
  }
};
