import Workout from '../models/Workout.js';
import { exerciseVolume, setVolume } from '../utils/workoutStats.js';

function summarizeExercise(exercise, date) {
  const sets = exercise.sets || [];
  let bestWeight = 0;
  let bestReps = 0;
  let bestWeightReps = 0;

  for (const set of sets) {
    const weight = Number(set.weight) || 0;
    const reps = Number(set.reps) || 0;
    if (weight > bestWeight || (weight === bestWeight && reps > bestWeightReps)) {
      bestWeight = weight;
      bestWeightReps = reps;
    }
    if (reps > bestReps) bestReps = reps;
  }

  return {
    date,
    exerciseName: exercise.exerciseName,
    sets: sets.map((s) => ({
      reps: Number(s.reps) || 0,
      weight: Number(s.weight) || 0,
      completed: Boolean(s.completed),
      volume: setVolume(s),
    })),
    setCount: sets.length,
    bestWeight,
    bestReps: bestWeightReps,
    maxReps: bestReps,
    volume: exerciseVolume(exercise),
  };
}

/**
 * Previous performance for one or more exercises (most recent completed workout each).
 */
export async function getPreviousPerformances(userId, exerciseNames = [], excludeWorkoutId) {
  const names = [...new Set(exerciseNames.map((n) => String(n || '').trim()).filter(Boolean))];
  const result = {};
  for (const name of names) result[name] = null;
  if (!names.length) return result;

  const filter = {
    userId,
    status: 'completed',
    'exercises.exerciseName': { $in: names },
  };
  if (excludeWorkoutId) filter._id = { $ne: excludeWorkoutId };

  const workouts = await Workout.find(filter).sort({ date: -1, updatedAt: -1 }).limit(40).lean();

  const remaining = new Set(names.map((n) => n.toLowerCase()));

  for (const workout of workouts) {
    if (!remaining.size) break;
    for (const exercise of workout.exercises || []) {
      const key = exercise.exerciseName?.trim();
      if (!key) continue;
      const lower = key.toLowerCase();
      if (!remaining.has(lower)) continue;
      // Match original casing from request list
      const original = names.find((n) => n.toLowerCase() === lower) || key;
      result[original] = summarizeExercise(exercise, workout.date);
      remaining.delete(lower);
    }
  }

  return result;
}

export function compareProgress(previous, currentSets = []) {
  if (!previous) {
    return { status: 'new', label: 'First time', detail: '' };
  }

  const current = summarizeExercise({ exerciseName: previous.exerciseName, sets: currentSets }, new Date());

  const weightDiff = current.bestWeight - previous.bestWeight;
  const repsDiff = current.bestReps - previous.bestReps;
  const volumeDiff = current.volume - previous.volume;

  let status = 'same';
  if (volumeDiff > 0 || weightDiff > 0 || (weightDiff === 0 && repsDiff > 0)) status = 'improved';
  else if (volumeDiff < 0 || weightDiff < 0 || (weightDiff === 0 && repsDiff < 0)) status = 'decreased';

  const parts = [];
  if (weightDiff !== 0) parts.push(`${weightDiff > 0 ? '+' : ''}${weightDiff} kg`);
  if (weightDiff === 0 && repsDiff !== 0) parts.push(`${repsDiff > 0 ? '+' : ''}${repsDiff} reps`);
  if (volumeDiff !== 0) parts.push(`${volumeDiff > 0 ? '+' : ''}${Math.round(volumeDiff)} kg vol`);

  return {
    status,
    label: status === 'improved' ? 'Improved' : status === 'decreased' ? 'Decreased' : 'Same',
    detail: parts.join(' · ') || 'Matching last session',
    previous,
    current: {
      bestWeight: current.bestWeight,
      bestReps: current.bestReps,
      volume: current.volume,
      setCount: current.setCount,
    },
  };
}
