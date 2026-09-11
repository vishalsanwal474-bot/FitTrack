import api from './api.js';

export const getWorkouts = (params = {}) => api.get('/workouts', { params });
export const getWorkout = (id) => api.get(`/workouts/${id}`);
export const createWorkout = (data) => api.post('/workouts', data);
export const updateWorkout = (id, data) => api.put(`/workouts/${id}`, data);
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`);
export const getLastWorkout = () => api.get('/workouts/last');
export const getPreviousPerformance = (params) => api.get('/workouts/previous', { params });
export const quickStart = (data) => api.post('/workouts/quick-start', data);
