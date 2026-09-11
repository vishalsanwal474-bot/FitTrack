import api from './api.js';

export const getWeights = (params = {}) => api.get('/weight', { params });
export const createWeight = (data) => api.post('/weight', data);
export const updateWeight = (id, data) => api.put(`/weight/${id}`, data);
export const deleteWeight = (id) => api.delete(`/weight/${id}`);
