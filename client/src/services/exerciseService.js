import api from './api.js';
import { cacheExercises, getCachedExercises, localResponse, shouldUseOffline } from './offlineData.js';

export const getExercises = async (params = {}) => {
  try {
    const response = await api.get('/exercises', { params });
    await cacheExercises(response.data.exercises || []);
    return response;
  } catch (error) {
    if (shouldUseOffline(error)) {
      let exercises = await getCachedExercises();
      const q = String(params.search || params.q || '').toLowerCase();
      const muscle = String(params.muscle || '').toLowerCase();
      if (q) exercises = exercises.filter((e) => e.name?.toLowerCase().includes(q) || e.primaryMuscle?.toLowerCase().includes(q));
      if (muscle) exercises = exercises.filter((e) => e.primaryMuscle?.toLowerCase() === muscle);
      return localResponse({ exercises });
    }
    throw error;
  }
};
export const getExercise = async (id) => { const all = await getExercises(); const found = (all.data.exercises || []).find((e) => String(e.id) === String(id)); return localResponse({ exercise: found || null }); };
export const getExercisesByMuscle = (muscle) => getExercises({ muscle });
