import api from './api.js';
import { cacheUser, getCachedUser, localResponse, shouldUseOffline, updateLocalProfile } from './offlineData.js';

export const register = (data) => api.post('/auth/register', data);
export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  await cacheUser(response.data.user);
  return response;
};
export const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    await cacheUser(response.data.user);
    return response;
  } catch (error) {
    if (shouldUseOffline(error)) {
      const user = await getCachedUser();
      if (user) return localResponse({ user });
    }
    throw error;
  }
};
export const updateProfile = async (data) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return updateLocalProfile(data);
  const response = await api.put('/auth/profile', data);
  await cacheUser(response.data.user);
  return response;
};
