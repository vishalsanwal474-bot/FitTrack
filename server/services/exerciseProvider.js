import Exercise from '../models/Exercise.js';
import { EXERCISE_SEED } from '../data/exercises.js';

/**
 * LocalExerciseProvider — seeds Mongo from static catalog when empty.
 * Swap/extend later without changing controllers.
 */
export async function ensureExercisesSeeded() {
  const count = await Exercise.countDocuments();
  if (count > 0) return { seeded: false, count };

  await Exercise.insertMany(EXERCISE_SEED);
  const next = await Exercise.countDocuments();
  return { seeded: true, count: next };
}

export async function listExercises({ muscle, q, equipment, difficulty } = {}) {
  const filter = {};
  if (muscle) filter.primaryMuscle = new RegExp(`^${escapeRegex(muscle)}$`, 'i');
  if (equipment) filter.equipment = equipment;
  if (difficulty) filter.difficulty = difficulty;
  if (q?.trim()) {
    filter.$or = [
      { name: new RegExp(escapeRegex(q.trim()), 'i') },
      { primaryMuscle: new RegExp(escapeRegex(q.trim()), 'i') },
    ];
  }

  return Exercise.find(filter).sort({ primaryMuscle: 1, name: 1 }).lean();
}

export async function getExerciseById(id) {
  return Exercise.findById(id).lean();
}

export async function getExercisesByMuscle(muscle) {
  return listExercises({ muscle });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
