/** Local volume helpers — keep calorie/PR logic in later phase services. */

export function setVolume(set) {
  const reps = Number(set?.reps) || 0;
  const weight = Number(set?.weight) || 0;
  return reps * weight;
}

export function exerciseVolume(exercise) {
  return (exercise?.sets || []).reduce((sum, set) => sum + setVolume(set), 0);
}

export function workoutVolume(workout) {
  return (workout?.exercises || []).reduce((sum, ex) => sum + exerciseVolume(ex), 0);
}

export function workoutTotals(workout) {
  let sets = 0;
  let reps = 0;
  let completedSets = 0;

  for (const exercise of workout?.exercises || []) {
    for (const set of exercise.sets || []) {
      sets += 1;
      reps += Number(set.reps) || 0;
      if (set.completed) completedSets += 1;
    }
  }

  return {
    exerciseCount: workout?.exercises?.length || 0,
    sets,
    completedSets,
    reps,
    volume: workoutVolume(workout),
    duration: workout?.duration || 0,
    caloriesBurned: workout?.caloriesBurned || 0,
  };
}

export function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date = new Date()) {
  const d = startOfLocalDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}
