import Workout from '../models/Workout.js';
import { endOfLocalDay, startOfLocalDay } from '../utils/workoutStats.js';

/** Consecutive calendar days with at least one completed workout (ending today or yesterday). */
export async function computeStreak(userId, now = new Date()) {
  const workouts = await Workout.find({
    userId,
    status: 'completed',
  })
    .select('date')
    .sort({ date: -1 })
    .lean();

  if (!workouts.length) return 0;

  const days = new Set(
    workouts.map((w) => {
      const d = startOfLocalDay(w.date);
      return d.getTime();
    })
  );

  let cursor = startOfLocalDay(now);
  if (!days.has(cursor.getTime())) {
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);
    if (!days.has(yesterday.getTime())) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function getLastCompletedWorkout(userId, excludeId) {
  const filter = { userId, status: 'completed' };
  if (excludeId) filter._id = { $ne: excludeId };
  return Workout.findOne(filter).sort({ date: -1, updatedAt: -1 });
}

export { endOfLocalDay, startOfLocalDay };
