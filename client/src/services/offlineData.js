import {
  enqueueMutation,
  getLocal,
  isOffline,
  makeOfflineId,
  offlineKeys,
  removeQueuedMutation,
  replaceLocalId,
  replaceQueuedLocalId,
  setLocal,
} from './offlineStore.js';
import { workoutVolume, exerciseVolume, bestSet } from '../utils/workoutHelpers.js';
import { OFFLINE_EXERCISES } from './offlineCatalog.js';

export const localResponse = (data) => ({ data, offline: true });
export const shouldUseOffline = (error) => isOffline() || !error?.response;

export async function cacheUser(user) { await setLocal(offlineKeys.user, user); return user; }
export async function getCachedUser() { return getLocal(offlineKeys.user); }

export async function cacheExercises(exercises) { await setLocal(offlineKeys.exercises, exercises); return exercises; }
export async function getCachedExercises() { const cached = await getLocal(offlineKeys.exercises); return cached?.length ? cached : OFFLINE_EXERCISES; }

function normalizeWorkout(raw) {
  const id = raw.id || raw._id || makeOfflineId('workout');
  const exercises = (raw.exercises || []).map((ex, i) => ({
    id: ex.id || ex._id || `${id}-exercise-${i}`,
    exerciseId: ex.exerciseId || '',
    exerciseName: ex.exerciseName || '',
    notes: ex.notes || '',
    sets: (ex.sets || []).map((s) => ({
      reps: Number(s.reps) || 0,
      weight: Number(s.weight) || 0,
      duration: Number(s.duration) || 0,
      rest: Number(s.rest) || 0,
      completed: Boolean(s.completed),
    })),
  }));
  const volume = workoutVolume({ exercises });
  const sets = exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const reps = exercises.reduce((n, ex) => n + ex.sets.reduce((s, set) => s + (Number(set.reps) || 0), 0), 0);
  return {
    ...raw,
    id,
    date: raw.date || new Date().toISOString(),
    bodyParts: Array.isArray(raw.bodyParts) ? raw.bodyParts : [],
    workoutType: raw.workoutType || 'strength',
    duration: Number(raw.duration) || 0,
    caloriesBurned: Number(raw.caloriesBurned) || 0,
    notes: raw.notes || '',
    status: raw.status === 'completed' ? 'completed' : 'in_progress',
    exercises,
    totals: { exerciseCount: exercises.length, sets, reps, volume, caloriesBurned: Number(raw.caloriesBurned) || 0 },
    _offline: String(id).startsWith('offline-'),
  };
}

export async function getCachedWorkouts() { return ((await getLocal(offlineKeys.workouts)) || []).map(normalizeWorkout); }

export async function saveWorkouts(workouts) {
  const normalized = workouts.map(normalizeWorkout).sort((a, b) => new Date(b.date) - new Date(a.date));
  await setLocal(offlineKeys.workouts, normalized);
  return normalized;
}

export async function upsertWorkout(workout) {
  const current = await getCachedWorkouts();
  const normalized = normalizeWorkout(workout);
  const next = [normalized, ...current.filter((w) => String(w.id) !== String(normalized.id))];
  await saveWorkouts(next);
  return normalized;
}

export async function removeWorkout(id) {
  const current = await getCachedWorkouts();
  await saveWorkouts(current.filter((w) => String(w.id) !== String(id)));
}

export async function cacheWeights(weights) { await setLocal(offlineKeys.weights, weights || []); return weights || []; }
export async function getCachedWeights() { return (await getLocal(offlineKeys.weights)) || []; }

function estimateCalories(workout, user, exercises) {
  const weight = Number(user?.weight) || 0;
  const duration = Number(workout?.duration) || 0;
  if (!weight || !duration) return 0;
  const mets = (workout?.exercises || []).map((ex) => {
    const found = exercises.find((item) => String(item.id || item._id) === String(ex.exerciseId) || item.name?.toLowerCase() === ex.exerciseName?.toLowerCase());
    return Number(found?.met) || 5;
  });
  const avg = mets.length ? mets.reduce((a, b) => a + b, 0) / mets.length : 5;
  return Math.max(0, Math.round(avg * weight * (duration / 60)));
}

export async function refreshLocalDerivedData() {
  const user = await getCachedUser();
  const workouts = await getCachedWorkouts();
  const exercises = await getCachedExercises();
  if (!user) return;
  const updated = workouts.map((w) => {
    if (w.caloriesBurned) return w;
    const calories = estimateCalories(w, user, exercises);
    return normalizeWorkout({ ...w, caloriesBurned: calories });
  });
  await saveWorkouts(updated);
}

function startOfDay(value) { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; }
function endOfDay(value) { const d = new Date(value); d.setHours(23, 59, 59, 999); return d; }
function startOfWeek(value) { const d = startOfDay(value); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; d.setDate(d.getDate() + diff); return d; }
function startOfMonth(value) { const d = startOfDay(value); d.setDate(1); return d; }
function startOfYear(value) { const d = startOfDay(value); d.setMonth(0, 1); return d; }
function addDays(value, n) { const d = new Date(value); d.setDate(d.getDate() + n); return d; }
function bucketKey(value, type) { const d = new Date(value); if (type === 'year') return String(d.getFullYear()); if (type === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function emptyBucket(label) { return { label, workouts: 0, volume: 0, calories: 0, duration: 0, sets: 0, reps: 0 }; }
function accumulate(bucket, w) { const t = w.totals || {}; bucket.workouts += 1; bucket.volume += Number(t.volume) || workoutVolume(w); bucket.calories += Number(w.caloriesBurned) || 0; bucket.duration += Number(w.duration) || 0; bucket.sets += Number(t.sets) || 0; bucket.reps += Number(t.reps) || 0; }
function muscleBreakdown(workouts) { const map = {}; for (const w of workouts) { const parts = w.bodyParts?.length ? w.bodyParts : ['General']; const share = 1 / parts.length; for (const part of parts) map[part] = (map[part] || 0) + share; } return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 })).sort((a, b) => b.value - a.value); }
function roundBucket(b) { return { ...b, volume: Math.round(b.volume), calories: Math.round(b.calories) }; }

export async function buildLocalProgress(range, options = {}) {
  const workouts = (await getCachedWorkouts()).filter((w) => w.status === 'completed');
  const weights = await getCachedWeights();
  const now = new Date();
  let count; let from; let to; let type;
  if (range === 'daily') { count = Number(options.days) || 14; to = endOfDay(now); from = startOfDay(addDays(to, -(count - 1))); type = 'day'; }
  else if (range === 'weekly') { count = Number(options.weeks) || 12; const thisWeek = startOfWeek(now); from = addDays(thisWeek, -(count - 1) * 7); to = endOfDay(addDays(thisWeek, 6)); type = 'week'; }
  else if (range === 'yearly') { count = Number(options.years) || 5; const thisYear = startOfYear(now); from = new Date(thisYear); from.setFullYear(from.getFullYear() - (count - 1)); to = endOfDay(now); type = 'year'; }
  else { count = Number(options.months) || 12; const thisMonth = startOfMonth(now); from = new Date(thisMonth); from.setMonth(from.getMonth() - (count - 1)); to = endOfDay(new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0)); type = 'month'; }
  const scoped = workouts.filter((w) => { const d = new Date(w.date); return d >= from && d <= to; });
  const buckets = [];
  for (let i = 0; i < count; i += 1) {
    let d;
    if (type === 'day') d = addDays(from, i);
    else if (type === 'week') d = addDays(from, i * 7);
    else if (type === 'month') { d = new Date(from); d.setMonth(from.getMonth() + i); }
    else { d = new Date(from); d.setFullYear(from.getFullYear() + i); }
    const label = type === 'day' ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : type === 'week' ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : type === 'month' ? d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : String(d.getFullYear());
    buckets.push({ key: bucketKey(d, type === 'week' ? 'day' : type), ...emptyBucket(label) });
  }
  for (const w of scoped) {
    const d = new Date(w.date);
    const key = type === 'week' ? bucketKey(startOfWeek(d), 'day') : bucketKey(d, type);
    const b = buckets.find((item) => item.key === key); if (b) accumulate(b, w);
  }
  const summary = emptyBucket('total'); scoped.forEach((w) => accumulate(summary, w));
  const weightMap = {};
  for (const w of weights) { const d = new Date(w.date); if (d >= from && d <= to) weightMap[bucketKey(d, type === 'day' ? 'day' : 'month')] = w.weight; }
  const series = buckets.map((b) => { const out = roundBucket(b); if (type === 'month' && weightMap[b.key] != null) out.weight = weightMap[b.key]; return out; });
  return { range, from, to, series, muscles: muscleBreakdown(scoped), weights: type === 'day' ? weights.filter((w) => new Date(w.date) >= from && new Date(w.date) <= to).map((w) => ({ label: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), weight: w.weight, date: w.date })) : Object.entries(weightMap).map(([label, weight]) => ({ label, weight })), summary: roundBucket(summary) };
}

function streak(workouts) {
  const days = new Set(workouts.filter((w) => w.status === 'completed').map((w) => bucketKey(w.date, 'day')));
  let cursor = startOfDay(new Date()); let n = 0;
  while (days.has(bucketKey(cursor, 'day'))) { n += 1; cursor = addDays(cursor, -1); }
  return n;
}

export async function buildLocalDashboard() {
  const user = await getCachedUser(); const workouts = await getCachedWorkouts();
  const todayStart = startOfDay(new Date()); const todayEnd = endOfDay(new Date());
  const today = workouts.filter((w) => { const d = new Date(w.date); return d >= todayStart && d <= todayEnd; }).sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
  const completed = workouts.filter((w) => w.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastWorkout = completed[0] || null;
  const weekStart = startOfWeek(new Date());
  const week = completed.filter((w) => new Date(w.date) >= weekStart);
  const weeklyVolume = week.reduce((s, w) => s + (w.totals?.volume || workoutVolume(w)), 0);
  const caloriesBurnedToday = workouts.filter((w) => { const d = new Date(w.date); return d >= todayStart && d <= todayEnd; }).reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const recentPR = await buildLocalPRs();
  const daily = await buildLocalNutrition();
  const quote = (await getLocal(offlineKeys.quote)) || null;
  return { today, lastWorkout, streak: streak(workouts), weeklyCompletedCount: week.length, weeklyVolume: Math.round(weeklyVolume), caloriesBurnedToday: Math.round(caloriesBurnedToday), calorieTarget: daily.calorieTarget, currentWeight: user?.weight ?? null, recentPR: recentPR.prs?.[0] || null, recentWorkouts: completed.slice(0, 5), dailyQuote: quote };
}

export async function buildLocalNutrition() {
  const user = (await getCachedUser()) || {}; const workouts = await getCachedWorkouts();
  const weight = Number(user?.weight), height = Number(user?.height), age = Number(user?.age);
  const bmr = weight && height && age ? Math.round(10 * weight + 6.25 * height - 5 * age + (user.gender === 'male' ? 5 : user.gender === 'female' ? -161 : -78)) : null;
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[user?.activityLevel] || 1.55;
  const tdee = bmr ? Math.round(bmr * mult) : null;
  const calorieTarget = tdee ? user?.fitnessGoal === 'lose' ? Math.max(1200, tdee - 500) : user?.fitnessGoal === 'gain' ? tdee + 300 : tdee : null;
  const today = workouts.filter((w) => { const d = new Date(w.date); return d >= startOfDay(new Date()) && d <= endOfDay(new Date()); });
  const weekStart = startOfWeek(new Date());
  const week = workouts.filter((w) => w.status === 'completed' && new Date(w.date) >= weekStart);
  const caloriesToday = today.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const caloriesWeek = week.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  return { bmr, tdee, calorieTarget, activityLevel: user?.activityLevel || '', fitnessGoal: user?.fitnessGoal || '', weight: user?.weight ?? null, height: user?.height ?? null, age: user?.age ?? null, gender: user?.gender || '', complete: Boolean(bmr && tdee && calorieTarget), missing: [!weight && 'weight', !height && 'height', !age && 'age'].filter(Boolean), caloriesBurnedToday: Math.round(caloriesToday), caloriesBurnedWeek: Math.round(caloriesWeek), remainingToday: calorieTarget != null ? Math.round(calorieTarget - caloriesToday) : null };
}

export async function buildLocalPRs() {
  const workouts = (await getCachedWorkouts()).filter((w) => w.status === 'completed'); const map = new Map();
  for (const w of workouts) for (const ex of w.exercises || []) { const name = ex.exerciseName?.trim(); if (!name) continue; const top = bestSet(ex.sets || []); const volume = exerciseVolume(ex); const old = map.get(name) || { exerciseName: name, maxWeight: 0, maxWeightReps: 0, maxReps: 0, maxRepsWeight: 0, maxVolume: 0 }; if (top.weight > old.maxWeight || (top.weight === old.maxWeight && top.reps > old.maxWeightReps)) Object.assign(old, { maxWeight: top.weight, maxWeightReps: top.reps, maxWeightDate: w.date }); if (top.reps > old.maxReps || (top.reps === old.maxReps && top.weight > old.maxRepsWeight)) Object.assign(old, { maxReps: top.reps, maxRepsWeight: top.weight, maxRepsDate: w.date }); if (volume > old.maxVolume) Object.assign(old, { maxVolume: volume, maxVolumeDate: w.date }); map.set(name, old); }
  const prs = [...map.values()].sort((a, b) => new Date(b.maxWeightDate || 0) - new Date(a.maxWeightDate || 0)); await setLocal(offlineKeys.prs, prs); return { prs };
}

export async function buildLocalReport(period = 'month') {
  const user = await getCachedUser(); const workouts = (await getCachedWorkouts()).filter((w) => w.status === 'completed'); const now = new Date();
  let from; const to = endOfDay(now); if (period === 'week') from = startOfWeek(now); else if (period === 'year') from = startOfYear(now); else from = startOfMonth(now);
  const scoped = workouts.filter((w) => new Date(w.date) >= from && new Date(w.date) <= to); const stats = scoped.reduce((s, w) => ({ workouts: s.workouts + 1, volume: s.volume + (w.totals?.volume || workoutVolume(w)), calories: s.calories + (w.caloriesBurned || 0), duration: s.duration + (w.duration || 0), sets: s.sets + (w.totals?.sets || 0) }), { workouts: 0, volume: 0, calories: 0, duration: 0, sets: 0 }); const prs = await buildLocalPRs();
  const muscleMap = {}; scoped.forEach((w) => { const parts = w.bodyParts?.length ? w.bodyParts : ['General']; parts.forEach((p) => { muscleMap[p] = (muscleMap[p] || 0) + 1 / parts.length; }); });
  return { period, label: from.toLocaleDateString(undefined, period === 'year' ? { year: 'numeric' } : period === 'week' ? { month: 'short', day: 'numeric' } : { month: 'long', year: 'numeric' }), from, to, userName: user?.name || 'FitTrack', stats: { ...stats, volume: Math.round(stats.volume), calories: Math.round(stats.calories), streak: streak(workouts), newPRs: prs.prs.length, currentWeight: user?.weight ?? null }, muscles: Object.entries(muscleMap).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 })).sort((a, b) => b.value - a.value).slice(0, 6), topPRs: prs.prs.slice(0, 5).map((pr) => ({ exerciseName: pr.exerciseName, maxWeight: pr.maxWeight || 0, maxWeightReps: pr.maxWeightReps || 0, maxVolume: pr.maxVolume || 0 })), recentWorkouts: scoped.slice(0, 8).map((w) => ({ date: w.date, bodyParts: w.bodyParts || [], duration: w.duration || 0, caloriesBurned: w.caloriesBurned || 0, volume: Math.round(w.totals?.volume || workoutVolume(w)) })) };
}


function prepareServerWorkoutPayload(payload) {
  return {
    ...payload,
    exercises: (payload.exercises || []).map((ex) => ({
      ...ex,
      exerciseId: /^[a-f0-9]{24}$/i.test(String(ex.exerciseId || '')) ? ex.exerciseId : undefined,
    })),
  };
}

export async function createLocalWorkout(payload) {
  const user = await getCachedUser(); const exercises = await getCachedExercises(); const id = makeOfflineId('workout');
  const calories = Number(payload.caloriesBurned) || estimateCalories(payload, user, exercises);
  const workout = normalizeWorkout({ ...payload, id, caloriesBurned: calories, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await upsertWorkout(workout);
  await enqueueMutation({ type: 'createWorkout', localId: id, payload: { ...prepareServerWorkoutPayload(payload), caloriesBurned: calories } });
  return localResponse({ workout, newPRs: payload.status === 'completed' ? [] : [] });
}

export async function updateLocalWorkout(id, payload) {
  const current = (await getCachedWorkouts()).find((w) => String(w.id) === String(id));
  if (!current) throw new Error('Workout not found');
  const user = await getCachedUser(); const exercises = await getCachedExercises(); const calories = Number(payload.caloriesBurned) || estimateCalories(payload, user, exercises);
  const workout = normalizeWorkout({ ...current, ...payload, id, caloriesBurned: calories, updatedAt: new Date().toISOString() });
  await upsertWorkout(workout);
  await enqueueMutation({ type: 'updateWorkout', localId: id, payload: { id, data: { ...prepareServerWorkoutPayload(payload), caloriesBurned: calories } } });
  return localResponse({ workout, newPRs: [] });
}

export async function deleteLocalWorkout(id) { await removeWorkout(id); await enqueueMutation({ type: 'deleteWorkout', localId: id, payload: { id } }); return localResponse({ message: 'Workout deleted' }); }

export async function quickStartLocal(mode) {
  const workouts = await getCachedWorkouts(); const source = workouts.find((w) => w.status === 'completed');
  const payload = mode === 'repeat' && source ? { date: new Date().toISOString(), bodyParts: source.bodyParts, workoutType: source.workoutType, duration: 0, notes: '', status: 'in_progress', exercises: source.exercises.map((e) => ({ exerciseId: e.exerciseId, exerciseName: e.exerciseName, notes: e.notes || '', sets: e.sets.map((s) => ({ ...s, completed: false })) })) } : { date: new Date().toISOString(), bodyParts: [], workoutType: 'strength', duration: 0, notes: '', status: 'in_progress', exercises: [] };
  return createLocalWorkout(payload);
}

export async function createLocalWeight(data) { const current = await getCachedWeights(); const date = data.date || new Date().toISOString(); const id = makeOfflineId('weight'); const entry = { id, weight: Number(data.weight), date, notes: data.notes || '' }; const next = [entry, ...current.filter((w) => new Date(w.date).toDateString() !== new Date(date).toDateString())]; await cacheWeights(next); await enqueueMutation({ type: 'createWeight', localId: id, payload: data }); const user = await getCachedUser(); if (user) await cacheUser({ ...user, weight: entry.weight }); return localResponse({ weight: entry, currentWeight: entry.weight }); }
export async function updateLocalWeight(id, data) { const current = await getCachedWeights(); const item = current.find((w) => String(w.id) === String(id)); if (!item) throw new Error('Weight entry not found'); const nextItem = { ...item, ...data, weight: data.weight !== undefined ? Number(data.weight) : item.weight }; await cacheWeights(current.map((w) => String(w.id) === String(id) ? nextItem : w)); await enqueueMutation({ type: 'updateWeight', localId: id, payload: { id, data } }); return localResponse({ weight: nextItem, currentWeight: nextItem.weight }); }
export async function deleteLocalWeight(id) { await cacheWeights((await getCachedWeights()).filter((w) => String(w.id) !== String(id))); await enqueueMutation({ type: 'deleteWeight', localId: id, payload: { id } }); return localResponse({ message: 'Weight entry deleted' }); }

export async function updateLocalProfile(data) { const user = await getCachedUser(); const next = { ...user, ...data }; await cacheUser(next); await enqueueMutation({ type: 'updateProfile', payload: data }); return localResponse({ user: next }); }

export async function syncPendingMutations(api) {
  if (isOffline()) return { synced: 0, pending: true };
  const { getQueuedMutations } = await import('./offlineStore.js');
  const queue = await getQueuedMutations(); let synced = 0;
  for (const item of queue) {
    try {
      let response;
      if (item.type === 'createWorkout') response = await api.post('/workouts', item.payload, { offlineBypass: true });
      else if (item.type === 'updateWorkout') { const id = String(item.payload.id); if (id.startsWith('offline-')) { await removeQueuedMutation(item.id); continue; } response = await api.put(`/workouts/${id}`, item.payload.data, { offlineBypass: true }); }
      else if (item.type === 'deleteWorkout') { const id = String(item.payload.id); if (id.startsWith('offline-')) { await removeQueuedMutation(item.id); continue; } response = await api.delete(`/workouts/${id}`, { offlineBypass: true }); }
      else if (item.type === 'createWeight') response = await api.post('/weight', item.payload, { offlineBypass: true });
      else if (item.type === 'updateWeight') { const id = String(item.payload.id); if (id.startsWith('offline-')) { await removeQueuedMutation(item.id); continue; } response = await api.put(`/weight/${id}`, item.payload.data, { offlineBypass: true }); }
      else if (item.type === 'deleteWeight') { const id = String(item.payload.id); if (id.startsWith('offline-')) { await removeQueuedMutation(item.id); continue; } response = await api.delete(`/weight/${id}`, { offlineBypass: true }); }
      else if (item.type === 'updateProfile') response = await api.put('/auth/profile', item.payload, { offlineBypass: true });
      else { await removeQueuedMutation(item.id); continue; }
      if (item.type === 'createWorkout' && response?.data?.workout) { const realId = response.data.workout.id; await replaceLocalId(item.localId, realId); await replaceQueuedLocalId(item.localId, realId); }
      if (item.type === 'createWeight' && response?.data?.weight) { const realId = response.data.weight.id; const weights = await getCachedWeights(); await setLocal(offlineKeys.weights, [response.data.weight, ...weights.filter((w) => String(w.id) !== String(item.localId))]); await replaceQueuedLocalId(item.localId, realId); }
      if (item.type === 'updateProfile' && response?.data?.user) await cacheUser(response.data.user);
      await removeQueuedMutation(item.id); synced += 1;
    } catch (error) {
      if (!error.response || error.response.status >= 500) break;
      await removeQueuedMutation(item.id);
    }
  }
  if (synced > 0 && !isOffline()) {
    try {
      const [workoutsRes, weightsRes, userRes] = await Promise.all([
        api.get('/workouts', { params: { page: 1, limit: 50 } }),
        api.get('/weight', { params: { limit: 100 } }),
        api.get('/auth/me'),
      ]);
      await saveWorkouts(workoutsRes.data.workouts || []);
      await cacheWeights(weightsRes.data.weights || []);
      await cacheUser(userRes.data.user);
      await buildLocalPRs();
    } catch { /* the queued mutations already remain durable */ }
  }
  return { synced, pending: false };
}
