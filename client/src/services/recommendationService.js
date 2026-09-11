import api from './api.js';

export const getMuscleGroups = () => api.get('/recommendations');
export const getRecommendations = (muscle, params = {}) =>
  api.get(`/recommendations/${encodeURIComponent(muscle)}`, { params });
