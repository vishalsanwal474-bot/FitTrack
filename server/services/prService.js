import PersonalRecord from '../models/PersonalRecord.js';
import { exerciseVolume, setVolume } from '../utils/workoutStats.js';

function bestSet(sets = []) {
  let best = null;
  for (const set of sets) {
    const weight = Number(set.weight) || 0;
    const reps = Number(set.reps) || 0;
    if (!best) {
      best = { weight, reps, volume: setVolume(set) };
      continue;
    }
    if (weight > best.weight || (weight === best.weight && reps > best.reps)) {
      best = { weight, reps, volume: setVolume(set) };
    }
  }
  return best || { weight: 0, reps: 0, volume: 0 };
}

/**
 * Update PRs from a completed workout. Returns newly broken records.
 */
export async function updatePRsFromWorkout(userId, workout) {
  const date = workout.date || new Date();
  const newPRs = [];

  for (const exercise of workout.exercises || []) {
    const name = exercise.exerciseName?.trim();
    if (!name) continue;

    const sets = exercise.sets || [];
    const top = bestSet(sets);
    const volume = exerciseVolume(exercise);
    if (top.weight <= 0 && top.reps <= 0 && volume <= 0) continue;

    let record = await PersonalRecord.findOne({ userId, exerciseName: name });
    if (!record) {
      record = new PersonalRecord({
        userId,
        exerciseId: exercise.exerciseId || undefined,
        exerciseName: name,
      });
    }

    const broken = [];

    if (top.weight > (record.maxWeight || 0) || (top.weight === record.maxWeight && top.reps > (record.maxWeightReps || 0))) {
      if (top.weight > 0) {
        record.maxWeight = top.weight;
        record.maxWeightReps = top.reps;
        record.maxWeightDate = date;
        broken.push({ type: 'weight', value: top.weight, reps: top.reps });
      }
    }

    if (top.reps > (record.maxReps || 0) || (top.reps === record.maxReps && top.weight > (record.maxRepsWeight || 0))) {
      if (top.reps > 0) {
        record.maxReps = top.reps;
        record.maxRepsWeight = top.weight;
        record.maxRepsDate = date;
        broken.push({ type: 'reps', value: top.reps, weight: top.weight });
      }
    }

    if (volume > (record.maxVolume || 0)) {
      record.maxVolume = volume;
      record.maxVolumeDate = date;
      broken.push({ type: 'volume', value: volume });
    }

    if (broken.length) {
      record.workoutId = workout._id;
      if (exercise.exerciseId) record.exerciseId = exercise.exerciseId;
      await record.save();
      newPRs.push({
        exerciseName: name,
        records: broken,
      });
    }
  }

  return newPRs;
}

export async function listPRs(userId) {
  return PersonalRecord.find({ userId }).sort({ updatedAt: -1 }).lean();
}

export async function getRecentPR(userId) {
  return PersonalRecord.findOne({ userId }).sort({ updatedAt: -1 }).lean();
}
