import api from './api.js';

export const getExercises = (params = {}) => api.get('/exercises', { params });
export const getExercise = (id) => api.get(`/exercises/${id}`);
export const getExercisesByMuscle = (muscle) => api.get(`/exercises/muscle/${encodeURIComponent(muscle)}`);
