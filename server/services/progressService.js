import Workout from '../models/Workout.js';
import BodyWeight from '../models/BodyWeight.js';
import {
  endOfLocalDay,
  startOfLocalDay,
  startOfWeek,
  workoutTotals,
} from '../utils/workoutStats.js';

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

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

function dayKey(date) {
  const d = startOfLocalDay(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function emptyBucket(label) {
  return {
    label,
    workouts: 0,
    volume: 0,
    calories: 0,
    duration: 0,
    sets: 0,
    reps: 0,
  };
}

function accumulate(bucket, workout) {
  const totals = workoutTotals(workout);
  bucket.workouts += 1;
  bucket.volume += totals.volume;
  bucket.calories += workout.caloriesBurned || totals.caloriesBurned || 0;
  bucket.duration += workout.duration || 0;
  bucket.sets += totals.sets;
  bucket.reps += totals.reps;
}

function roundBucket(bucket) {
  return {
    ...bucket,
    volume: Math.round(bucket.volume),
    calories: Math.round(bucket.calories),
  };
}

function muscleBreakdown(workouts) {
  const map = {};
  for (const workout of workouts) {
    const parts = workout.bodyParts?.length ? workout.bodyParts : ['General'];
    const share = 1 / parts.length;
    for (const part of parts) {
      map[part] = (map[part] || 0) + share;
    }
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value);
}

async function loadCompleted(userId, from, to) {
  return Workout.find({
    userId,
    status: 'completed',
    date: { $gte: from, $lte: to },
  })
    .sort({ date: 1 })
    .lean();
}

async function loadWeights(userId, from, to) {
  return BodyWeight.find({
    userId,
    date: { $gte: from, $lte: to },
  })
    .sort({ date: 1 })
    .lean();
}

function summarize(workouts) {
  const summary = emptyBucket('total');
  for (const w of workouts) accumulate(summary, w);
  return roundBucket(summary);
}

/** Last N calendar days (including today). */
export async function getDailyProgress(userId, days = 14) {
  const to = endOfLocalDay(new Date());
  const from = startOfLocalDay(addDays(to, -(days - 1)));
  const [workouts, weights] = await Promise.all([
    loadCompleted(userId, from, to),
    loadWeights(userId, from, to),
  ]);

  const buckets = [];
  for (let i = 0; i < days; i += 1) {
    const d = addDays(from, i);
    const key = dayKey(d);
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    buckets.push({ key, ...emptyBucket(label) });
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));

  for (const w of workouts) {
    const i = index[dayKey(w.date)];
    if (i != null) accumulate(buckets[i], w);
  }

  const weightSeries = weights.map((w) => ({
    label: startOfLocalDay(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: w.weight,
    date: w.date,
  }));

  return {
    range: 'daily',
    from,
    to,
    series: buckets.map(({ key, ...rest }) => roundBucket(rest)),
    muscles: muscleBreakdown(workouts),
    weights: weightSeries,
    summary: summarize(workouts),
  };
}

/** Last N weeks (Mon–Sun), ending this week. */
export async function getWeeklyProgress(userId, weeks = 12) {
  const thisWeek = startOfWeek(new Date());
  const from = addDays(thisWeek, -(weeks - 1) * 7);
  const to = endOfLocalDay(addDays(thisWeek, 6));
  const workouts = await loadCompleted(userId, from, to);

  const buckets = [];
  for (let i = 0; i < weeks; i += 1) {
    const start = addDays(from, i * 7);
    const key = dayKey(start);
    const label = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    buckets.push({ key, start, ...emptyBucket(label) });
  }

  for (const w of workouts) {
    const wk = startOfWeek(w.date);
    const key = dayKey(wk);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) accumulate(bucket, w);
  }

  return {
    range: 'weekly',
    from,
    to,
    series: buckets.map(({ key, start, ...rest }) => roundBucket(rest)),
    muscles: muscleBreakdown(workouts),
    weights: [],
    summary: summarize(workouts),
  };
}

/** Last N months. */
export async function getMonthlyProgress(userId, months = 12) {
  const thisMonth = startOfMonth(new Date());
  const from = new Date(thisMonth);
  from.setMonth(from.getMonth() - (months - 1));
  const to = endOfLocalDay(new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0));
  const [workouts, weights] = await Promise.all([
    loadCompleted(userId, from, to),
    loadWeights(userId, from, to),
  ]);

  const buckets = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(from);
    d.setMonth(from.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    buckets.push({ key, ...emptyBucket(label) });
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));

  for (const w of workouts) {
    const d = new Date(w.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const i = index[key];
    if (i != null) accumulate(buckets[i], w);
  }

  const weightByMonth = {};
  for (const w of weights) {
    const d = new Date(w.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    weightByMonth[key] = w.weight; // latest in month wins due to sort
  }

  return {
    range: 'monthly',
    from,
    to,
    series: buckets.map(({ key, ...rest }) => {
      const point = roundBucket(rest);
      if (weightByMonth[key] != null) point.weight = weightByMonth[key];
      return point;
    }),
    muscles: muscleBreakdown(workouts),
    weights: Object.entries(weightByMonth).map(([key, weight]) => ({
      label: key,
      weight,
    })),
    summary: summarize(workouts),
  };
}

/** Last N years. */
export async function getYearlyProgress(userId, years = 5) {
  const thisYear = startOfYear(new Date());
  const from = new Date(thisYear);
  from.setFullYear(from.getFullYear() - (years - 1));
  const to = endOfLocalDay(new Date());
  const workouts = await loadCompleted(userId, from, to);

  const buckets = [];
  for (let i = 0; i < years; i += 1) {
    const year = from.getFullYear() + i;
    buckets.push({ key: String(year), ...emptyBucket(String(year)) });
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));

  for (const w of workouts) {
    const key = String(new Date(w.date).getFullYear());
    const i = index[key];
    if (i != null) accumulate(buckets[i], w);
  }

  return {
    range: 'yearly',
    from,
    to,
    series: buckets.map(({ key, ...rest }) => roundBucket(rest)),
    muscles: muscleBreakdown(workouts),
    weights: [],
    summary: summarize(workouts),
  };
}
