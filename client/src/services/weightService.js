import api from './api.js';
import { cacheWeights, createLocalWeight, deleteLocalWeight, getCachedWeights, localResponse, shouldUseOffline, updateLocalWeight } from './offlineData.js';

const onlineOrLocal = async (request, fallback) => { try { return await request(); } catch (error) { if (shouldUseOffline(error)) return fallback(); throw error; } };
export const getWeights = (params = {}) => onlineOrLocal(
  async () => { const response = await api.get('/weight', { params }); await cacheWeights(response.data.weights || []); return response; },
  async () => { let weights = await getCachedWeights(); if (params.from) weights = weights.filter((w) => new Date(w.date) >= new Date(params.from)); if (params.to) weights = weights.filter((w) => new Date(w.date) <= new Date(params.to)); return localResponse({ weights: weights.slice(0, Number(params.limit) || 30) }); }
);
export const createWeight = (data) => onlineOrLocal(
  async () => { const response = await api.post('/weight', data); const weights = await getCachedWeights(); await cacheWeights([response.data.weight, ...weights.filter((w) => String(w.id) !== String(response.data.weight.id))]); return response; },
  () => createLocalWeight(data)
);
export const updateWeight = (id, data) => onlineOrLocal(
  async () => { const response = await api.put(`/weight/${id}`, data); const weights = await getCachedWeights(); await cacheWeights(weights.map((w) => String(w.id) === String(id) ? response.data.weight : w)); return response; },
  () => updateLocalWeight(id, data)
);
export const deleteWeight = (id) => onlineOrLocal(
  async () => { const response = await api.delete(`/weight/${id}`); await cacheWeights((await getCachedWeights()).filter((w) => String(w.id) !== String(id))); return response; },
  () => deleteLocalWeight(id)
);
