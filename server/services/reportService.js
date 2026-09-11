import Workout from '../models/Workout.js';
import PersonalRecord from '../models/PersonalRecord.js';
import {
  endOfLocalDay,
  startOfLocalDay,
  startOfWeek,
  workoutTotals,
} from '../utils/workoutStats.js';
import { computeStreak } from './streakService.js';

function startOfMonth(date = new Date()) {
  const d = startOfLocalDay(date);
  d.setDate(1);
  return d;
}

function startOfYear(date = new Date()) {
  const d = startOfLocalDay(date);
  d.setMonth(0, 1);
  return d;
}

function periodBounds(period, now = new Date()) {
  const to = endOfLocalDay(now);
  if (period === 'week') {
    return { from: startOfWeek(now), to, label: formatMonthYearRange(startOfWeek(now), to) };
  }
  if (period === 'year') {
    const from = startOfYear(now);
    return { from, to, label: String(from.getFullYear()) };
  }
  // month default
  const from = startOfMonth(now);
  return {
    from,
    to,
    label: from.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  };
}

function formatMonthYearRange(from, to) {
  const a = from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const b = to.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${a} – ${b}`;
}

/**
 * Compact share/report summary for PNG card + PDF.
 */
export async function buildProgressReport(user, period = 'month') {
  const now = new Date();
  const { from, to, label } = periodBounds(period, now);

  const [workouts, streak, prsInPeriod, allRecentPrs] = await Promise.all([
    Workout.find({
      userId: user._id,
      status: 'completed',
      date: { $gte: from, $lte: to },
    })
      .sort({ date: -1 })
      .lean(),
    computeStreak(user._id, now),
    PersonalRecord.find({
      userId: user._id,
      updatedAt: { $gte: from, $lte: to },
    })
      .sort({ updatedAt: -1 })
      .lean(),
    PersonalRecord.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(5).lean(),
  ]);

  let volume = 0;
  let calories = 0;
  let duration = 0;
  let sets = 0;
  const muscleMap = {};

  for (const w of workouts) {
    const totals = workoutTotals(w);
    volume += totals.volume;
    calories += w.caloriesBurned || 0;
    duration += w.duration || 0;
    sets += totals.sets;
    const parts = w.bodyParts?.length ? w.bodyParts : ['General'];
    for (const part of parts) {
      muscleMap[part] = (muscleMap[part] || 0) + 1 / parts.length;
    }
  }

  const muscles = Object.entries(muscleMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    period,
    label,
    from,
    to,
    userName: user.name,
    stats: {
      workouts: workouts.length,
      volume: Math.round(volume),
      calories: Math.round(calories),
      duration,
      sets,
      streak,
      newPRs: prsInPeriod.length,
      currentWeight: user.weight ?? null,
    },
    muscles,
    topPRs: (prsInPeriod.length ? prsInPeriod : allRecentPrs).slice(0, 5).map((pr) => ({
      exerciseName: pr.exerciseName,
      maxWeight: pr.maxWeight || 0,
      maxWeightReps: pr.maxWeightReps || 0,
      maxVolume: pr.maxVolume || 0,
    })),
    recentWorkouts: workouts.slice(0, 8).map((w) => ({
      date: w.date,
      bodyParts: w.bodyParts || [],
      duration: w.duration || 0,
      caloriesBurned: w.caloriesBurned || 0,
      volume: Math.round(workoutTotals(w).volume),
    })),
  };
}
