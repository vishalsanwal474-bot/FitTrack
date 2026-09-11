import Exercise from '../models/Exercise.js';

const DEFAULT_MET = 5;

/**
 * Estimate workout kcal: avg MET × bodyWeightKg × hours.
 * Uses exercise.met when available; falls back to DEFAULT_MET.
 */
export async function estimateWorkoutCalories({ exercises = [], durationMinutes = 0, bodyWeightKg }) {
  const weight = Number(bodyWeightKg);
  const minutes = Number(durationMinutes);
  if (!weight || weight <= 0 || !minutes || minutes <= 0) return 0;

  const mets = await resolveMets(exercises);
  const avgMet = mets.length
    ? mets.reduce((sum, m) => sum + m, 0) / mets.length
    : DEFAULT_MET;

  return Math.max(0, Math.round(avgMet * weight * (minutes / 60)));
}

async function resolveMets(exercises) {
  if (!exercises.length) return [DEFAULT_MET];

  const ids = exercises.map((e) => e.exerciseId).filter(Boolean);
  const names = exercises.map((e) => e.exerciseName).filter(Boolean);

  const found = await Exercise.find({
    $or: [
      ...(ids.length ? [{ _id: { $in: ids } }] : []),
      ...(names.length ? [{ name: { $in: names } }] : []),
    ],
  })
    .select('name met')
    .lean();

  const byId = new Map(found.map((e) => [String(e._id), e.met]));
  const byName = new Map(found.map((e) => [e.name.toLowerCase(), e.met]));

  return exercises.map((ex) => {
    if (ex.exerciseId && byId.has(String(ex.exerciseId))) return byId.get(String(ex.exerciseId)) || DEFAULT_MET;
    if (ex.exerciseName && byName.has(ex.exerciseName.toLowerCase())) {
      return byName.get(ex.exerciseName.toLowerCase()) || DEFAULT_MET;
    }
    return DEFAULT_MET;
  });
}
