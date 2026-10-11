import api from './api.js';
import {
  createLocalWorkout,
  deleteLocalWorkout,
  getCachedWorkouts,
  localResponse,
  shouldUseOffline,
  quickStartLocal,
  updateLocalWorkout,
  upsertWorkout,
  removeWorkout,
} from './offlineData.js';

async function onlineOrLocal(request, fallback) {
  try { return await request(); } catch (error) { if (shouldUseOffline(error)) return fallback(); throw error; }
}

export const getWorkouts = async (params = {}) => onlineOrLocal(
  async () => { const response = await api.get('/workouts', { params }); await import('./offlineData.js').then(({ saveWorkouts }) => saveWorkouts(response.data.workouts || [])); return response; },
  async () => {
    let items = await getCachedWorkouts();
    if (params.status) items = items.filter((w) => w.status === params.status);
    if (params.from) items = items.filter((w) => new Date(w.date) >= new Date(params.from));
    if (params.to) items = items.filter((w) => new Date(w.date) <= new Date(params.to));
    const page = Math.max(1, Number(params.page) || 1); const limit = Math.max(1, Number(params.limit) || 20); const start = (page - 1) * limit; const total = items.length;
    return localResponse({ workouts: items.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
  }
);

export const getWorkout = async (id) => onlineOrLocal(
  async () => { const response = await api.get(`/workouts/${id}`); await upsertWorkout(response.data.workout); return response; },
  async () => { const workout = (await getCachedWorkouts()).find((w) => String(w.id) === String(id)); return workout ? localResponse({ workout }) : Promise.reject(new Error('Workout not found')); }
);
export const createWorkout = (data) => onlineOrLocal(
  async () => { const response = await api.post('/workouts', data); await upsertWorkout(response.data.workout); return response; },
  () => createLocalWorkout(data)
);
export const updateWorkout = (id, data) => onlineOrLocal(
  async () => { const response = await api.put(`/workouts/${id}`, data); await upsertWorkout(response.data.workout); return response; },
  () => updateLocalWorkout(id, data)
);
export const deleteWorkout = (id) => onlineOrLocal(
  async () => { const response = await api.delete(`/workouts/${id}`); await removeWorkout(id).catch(() => {}); return response; },
  () => deleteLocalWorkout(id)
);
export const getLastWorkout = () => onlineOrLocal(
  async () => api.get('/workouts/last'),
  async () => { const workout = (await getCachedWorkouts()).filter((w) => w.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null; return localResponse({ workout }); }
);
export const getPreviousPerformance = async (params = {}) => onlineOrLocal(
  () => api.get('/workouts/previous', { params }),
  async () => {
    const workouts = (await getCachedWorkouts()).filter((w) => w.status === 'completed' && String(w.id) !== String(params.excludeId)); const names = String(params.names || params.exerciseName || '').split(',').map((n) => n.trim().toLowerCase()).filter(Boolean); const previous = {};
    for (const name of names) { const exs = workouts.flatMap((w) => (w.exercises || []).map((e) => ({ ...e, date: w.date }))).filter((e) => e.exerciseName?.toLowerCase() === name).sort((a, b) => new Date(b.date) - new Date(a.date)); const ex = exs[0]; if (ex) { const sets = ex.sets || []; let bestWeight = 0; let bestReps = 0; for (const s of sets) { const weight = Number(s.weight) || 0; const reps = Number(s.reps) || 0; if (weight > bestWeight || (weight === bestWeight && reps > bestReps)) { bestWeight = weight; bestReps = reps; } } previous[ex.exerciseName] = { bestWeight, bestReps, volume: sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0), date: ex.date }; } }
    return localResponse({ previous });
  }
);
export const quickStart = (data) => onlineOrLocal(
  async () => { const response = await api.post('/workouts/quick-start', data); await upsertWorkout(response.data.workout); return response; },
  () => quickStartLocal(data.mode || 'empty')
);
