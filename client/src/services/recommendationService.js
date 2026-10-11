import api from './api.js';
import { getCachedExercises, getCachedWorkouts, localResponse, shouldUseOffline } from './offlineData.js';

const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Abs', 'Full Body'];
export const getMuscleGroups = async () => { try { return await api.get('/recommendations'); } catch (error) { if (shouldUseOffline(error)) return localResponse({ muscleGroups: MUSCLES }); throw error; } };
export const getRecommendations = async (muscle, params = {}) => {
  try { return await api.get(`/recommendations/${encodeURIComponent(muscle)}`, { params }); }
  catch (error) {
    if (!isOffline()) throw error;
    const exercises = await getCachedExercises(); const history = await getCachedWorkouts();
    const userRecent = new Set(history.filter((w) => w.status === 'completed').slice(0, 20).flatMap((w) => (w.exercises || []).map((e) => e.exerciseName?.toLowerCase())));
    const preferred = 'intermediate';
    const pool = exercises.filter((e) => e.primaryMuscle?.toLowerCase() === String(muscle).toLowerCase() || (e.secondaryMuscles || []).some((m) => m.toLowerCase() === String(muscle).toLowerCase()));
    const result = pool.map((exercise) => { let score = exercise.primaryMuscle?.toLowerCase() === String(muscle).toLowerCase() ? 40 : 20; const reasons = [exercise.primaryMuscle?.toLowerCase() === String(muscle).toLowerCase() ? `Targets ${exercise.primaryMuscle}` : `Supports ${muscle}`]; if (exercise.difficulty === preferred) { score += 15; reasons.push(`Matches ${preferred} level`); } if (!userRecent.has(exercise.name.toLowerCase())) { score += 12; reasons.push('Fresh variation'); } else { score += 6; reasons.push('Recent — good for progressive overload'); } return { ...exercise, score, reasons: reasons.slice(0, 3) }; }).sort((a, b) => b.score - a.score).slice(0, Number(params.limit) || 8);
    return localResponse({ muscle, provider: 'rule-based-local', exercises: result, muscleGroups: MUSCLES });
  }
};
