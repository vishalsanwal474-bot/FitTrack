export function emptySet(rest = 90) {
  return { reps: 10, weight: 0, duration: 0, rest, completed: false };
}

export function emptyExercise(exercise) {
  return {
    exerciseId: exercise?.id || exercise?._id || '',
    exerciseName: exercise?.name || '',
    notes: '',
    sets: [emptySet(exercise?.restTime ?? 90), emptySet(exercise?.restTime ?? 90), emptySet(exercise?.restTime ?? 90)],
  };
}

export function formatBodyParts(parts = []) {
  if (!parts.length) return 'General';
  return parts.join(' + ');
}

export function formatDateInput(value = new Date()) {
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDisplayDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function workoutVolume(workout) {
  return (workout?.exercises || []).reduce((sum, ex) => {
    return (
      sum +
      (ex.sets || []).reduce((s, set) => s + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0)
    );
  }, 0);
}

export function exerciseVolume(exercise) {
  return (exercise?.sets || []).reduce(
    (sum, set) => sum + (Number(set.reps) || 0) * (Number(set.weight) || 0),
    0
  );
}

export function bestSet(sets = []) {
  let best = { weight: 0, reps: 0 };
  for (const set of sets) {
    const weight = Number(set.weight) || 0;
    const reps = Number(set.reps) || 0;
    if (weight > best.weight || (weight === best.weight && reps > best.reps)) {
      best = { weight, reps };
    }
  }
  return best;
}

/** Client-side progressive overload comparison. */
export function compareToPrevious(previous, sets = []) {
  if (!previous) return { status: 'new', label: 'First time', detail: '' };

  const current = bestSet(sets);
  const volume = exerciseVolume({ sets });
  const weightDiff = current.weight - (previous.bestWeight || 0);
  const repsDiff = current.reps - (previous.bestReps || 0);
  const volumeDiff = volume - (previous.volume || 0);

  let status = 'same';
  if (volumeDiff > 0 || weightDiff > 0 || (weightDiff === 0 && repsDiff > 0)) status = 'improved';
  else if (volumeDiff < 0 || weightDiff < 0 || (weightDiff === 0 && repsDiff < 0)) status = 'decreased';

  const parts = [];
  if (weightDiff !== 0) parts.push(`${weightDiff > 0 ? '+' : ''}${weightDiff} kg`);
  else if (repsDiff !== 0) parts.push(`${repsDiff > 0 ? '+' : ''}${repsDiff} reps`);
  if (volumeDiff !== 0) parts.push(`${volumeDiff > 0 ? '+' : ''}${Math.round(volumeDiff)} vol`);

  return {
    status,
    label: status === 'improved' ? 'Improved' : status === 'decreased' ? 'Decreased' : 'Same',
    detail: parts.join(' · ') || 'Matching last session',
  };
}

export function formatTimer(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
