import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Copy, Plus, Trash2, X } from 'lucide-react';
import WorkoutTimer from '../components/WorkoutTimer.jsx';
import { getExercises } from '../services/exerciseService.js';
import {
  createWorkout,
  getPreviousPerformance,
  getWorkout,
  updateWorkout,
} from '../services/workoutService.js';
import {
  compareToPrevious,
  emptyExercise,
  emptySet,
  exerciseVolume,
  formatDateInput,
  workoutVolume,
} from '../utils/workoutHelpers.js';

const BODY_PARTS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Calves',
  'Abs',
  'Full Body',
];

const fieldClass =
  'w-full rounded-lg border border-mist bg-fog px-3 py-2 outline-none ring-lime focus:ring-2';

function comparisonTone(status) {
  if (status === 'improved') return 'text-success';
  if (status === 'decreased') return 'text-danger';
  return 'text-muted';
}

export default function StartWorkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [date, setDate] = useState(formatDateInput());
  const [bodyParts, setBodyParts] = useState([]);
  const [workoutType, setWorkoutType] = useState('strength');
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([]);
  const [library, setLibrary] = useState([]);
  const [previousMap, setPreviousMap] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(editId));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const onTimerMinutes = useCallback((mins) => {
    if (mins > 0) setDuration(mins);
  }, []);

  useEffect(() => {
    getExercises()
      .then(({ data }) => setLibrary(data.exercises || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getWorkout(editId);
        if (cancelled) return;
        const w = data.workout;
        setDate(formatDateInput(w.date));
        setBodyParts(w.bodyParts || []);
        setWorkoutType(w.workoutType || 'strength');
        setDuration(w.duration || 0);
        setNotes(w.notes || '');
        setExercises(
          (w.exercises || []).map((ex) => ({
            exerciseId: ex.exerciseId || '',
            exerciseName: ex.exerciseName,
            notes: ex.notes || '',
            sets: (ex.sets || []).map((s) => ({ ...s })),
          }))
        );
      } catch {
        if (!cancelled) setError('Unable to load this workout.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const exerciseNamesKey = exercises.map((e) => e.exerciseName).join('|');

  useEffect(() => {
    const names = exercises.map((e) => e.exerciseName).filter(Boolean);
    if (!names.length) {
      setPreviousMap({});
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data } = await getPreviousPerformance({
          names: names.join(','),
          excludeId: editId || undefined,
        });
        if (!cancelled) setPreviousMap(data.previous || {});
      } catch {
        if (!cancelled) setPreviousMap({});
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [exerciseNamesKey, editId, exercises]);

  const totals = useMemo(() => {
    let sets = 0;
    let reps = 0;
    for (const ex of exercises) {
      for (const set of ex.sets || []) {
        sets += 1;
        reps += Number(set.reps) || 0;
      }
    }
    return { sets, reps, volume: workoutVolume({ exercises }), exerciseCount: exercises.length };
  }, [exercises]);

  const filteredLibrary = useMemo(() => {
    const q = pickerQ.trim().toLowerCase();
    return library.filter((ex) => {
      const matchesQ =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q);
      if (q) return matchesQ;
      if (!bodyParts.length) return true;
      return bodyParts.some((p) => p.toLowerCase() === ex.primaryMuscle.toLowerCase());
    });
  }, [library, pickerQ, bodyParts]);

  const toggleBodyPart = (part) => {
    setBodyParts((prev) => (prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]));
  };

  const addExercise = (ex) => {
    setExercises((prev) => [...prev, emptyExercise(ex)]);
    setPickerOpen(false);
    setPickerQ('');
  };

  const removeExercise = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSet = (exIndex, setIndex, key, value) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const sets = ex.sets.map((s, si) => {
          if (si !== setIndex) return s;
          if (key === 'completed') return { ...s, completed: value };
          return { ...s, [key]: value === '' ? '' : Number(value) };
        });
        return { ...ex, sets };
      })
    );
  };

  const addSet = (exIndex) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, last ? { ...last, completed: false } : emptySet()],
        };
      })
    );
  };

  const duplicateSet = (exIndex, setIndex) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const copy = { ...ex.sets[setIndex], completed: false };
        const sets = [...ex.sets];
        sets.splice(setIndex + 1, 0, copy);
        return { ...ex, sets };
      })
    );
  };

  const removeSet = (exIndex, setIndex) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        return { ...ex, sets: ex.sets.filter((_, si) => si !== setIndex) };
      })
    );
  };

  const buildPayload = (status) => ({
    date: new Date(`${date}T12:00:00`),
    bodyParts,
    workoutType,
    duration: Number(duration) || 0,
    notes,
    status,
    exercises: exercises.map((ex) => ({
      exerciseId: ex.exerciseId || undefined,
      exerciseName: ex.exerciseName,
      notes: ex.notes || '',
      sets: (ex.sets || []).map((s) => ({
        reps: Number(s.reps) || 0,
        weight: Number(s.weight) || 0,
        duration: Number(s.duration) || 0,
        rest: Number(s.rest) || 0,
        completed: Boolean(s.completed),
      })),
    })),
  });

  const formatNewPRs = (newPRs = []) => {
    if (!newPRs.length) return '';
    return `New PR: ${newPRs.map((p) => p.exerciseName).join(', ')}`;
  };

  const save = async (status) => {
    setError('');
    setMessage('');
    if (!exercises.length) {
      setError('Add at least one exercise before saving.');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(status);
      let newPRs = [];
      if (editId) {
        const { data } = await updateWorkout(editId, payload);
        newPRs = data.newPRs || [];
      } else {
        const { data } = await createWorkout(payload);
        newPRs = data.newPRs || [];
        if (status !== 'completed') {
          navigate(`/workout?id=${data.workout.id}`, { replace: true });
        }
      }
      if (status === 'completed') {
        if (newPRs.length) {
          sessionStorage.setItem('fittrack-pr-flash', formatNewPRs(newPRs));
        }
        if (editId) localStorage.removeItem(`fittrack-timer-${editId}`);
        localStorage.removeItem('fittrack-timer-new');
        navigate('/history');
        return;
      }
      setMessage(newPRs.length ? formatNewPRs(newPRs) : 'Workout saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save workout.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted">Loading workout…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            {editId ? 'Edit Workout' : 'Start Workout'}
          </h1>
          <p className="mt-1 text-muted">
            {totals.exerciseCount} exercises · {totals.sets} sets · {totals.reps} reps ·{' '}
            {Math.round(totals.volume)} kg volume
          </p>
        </div>
        <Link to="/history" className="text-sm font-medium text-slate hover:text-ink">
          View history
        </Link>
      </div>

      <WorkoutTimer workoutId={editId} onMinutesChange={onTimerMinutes} />

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success" role="status">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-xl border border-mist bg-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="wo-date" className="mb-1.5 block text-sm font-medium text-slate">
              Date
            </label>
            <input
              id="wo-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="wo-type" className="mb-1.5 block text-sm font-medium text-slate">
              Workout type
            </label>
            <select
              id="wo-type"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              className={fieldClass}
            >
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="endurance">Endurance</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label htmlFor="wo-duration" className="mb-1.5 block text-sm font-medium text-slate">
              Duration (min)
            </label>
            <input
              id="wo-duration"
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate">Body parts</p>
          <div className="flex flex-wrap gap-2">
            {BODY_PARTS.map((part) => {
              const active = bodyParts.includes(part);
              return (
                <button
                  key={part}
                  type="button"
                  onClick={() => toggleBodyPart(part)}
                  className={[
                    'rounded-lg px-3 py-1.5 text-sm font-medium',
                    active ? 'bg-steel text-lime' : 'border border-mist bg-fog text-slate',
                  ].join(' ')}
                >
                  {part}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="wo-notes" className="mb-1.5 block text-sm font-medium text-slate">
            Notes
          </label>
          <textarea
            id="wo-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={fieldClass}
            placeholder="How did the session feel?"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-ink">Exercises</h2>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-steel px-3 py-2 text-sm font-semibold text-lime"
          >
            <Plus size={16} aria-hidden />
            Add exercise
          </button>
        </div>

        {exercises.length === 0 ? (
          <div className="rounded-xl border border-dashed border-mist bg-white px-4 py-10 text-center text-sm text-muted">
            No exercises yet. Add one to start logging sets.
          </div>
        ) : (
          exercises.map((ex, exIndex) => {
            const prev = previousMap[ex.exerciseName];
            const cmp = compareToPrevious(prev, ex.sets);
            const vol = exerciseVolume(ex);
            return (
              <article key={`${ex.exerciseName}-${exIndex}`} className="rounded-xl border border-mist bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">{ex.exerciseName}</h3>
                    <p className="text-xs text-muted">
                      Volume {Math.round(vol)} kg · Set · Reps · Weight
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exIndex)}
                    className="rounded-lg p-2 text-muted hover:bg-fog hover:text-danger"
                    aria-label={`Remove ${ex.exerciseName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div
                  className={[
                    'mb-3 rounded-lg px-3 py-2 text-sm',
                    prev ? 'bg-fog' : 'border border-dashed border-mist',
                  ].join(' ')}
                >
                  {prev ? (
                    <>
                      <p className="text-slate">
                        Last: {prev.bestWeight} kg × {prev.bestReps} · {Math.round(prev.volume)} kg
                        vol
                      </p>
                      <p className={`mt-0.5 font-medium ${comparisonTone(cmp.status)}`}>
                        {cmp.status === 'improved' ? '↑' : cmp.status === 'decreased' ? '↓' : '→'}{' '}
                        {cmp.label}
                        {cmp.detail ? ` · ${cmp.detail}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">First time logging this exercise.</p>
                  )}
                </div>

                <div className="space-y-2">
                  {ex.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem_auto] items-center gap-1.5 sm:gap-2"
                    >
                      <span className="w-6 text-center text-xs font-medium text-muted">
                        {setIndex + 1}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={set.reps}
                        onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                        className={fieldClass}
                        aria-label={`Reps for set ${setIndex + 1}`}
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={set.weight}
                        onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                        className={fieldClass}
                        aria-label={`Weight for set ${setIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => updateSet(exIndex, setIndex, 'completed', !set.completed)}
                        className={[
                          'rounded-lg p-2',
                          set.completed ? 'bg-success/15 text-success' : 'bg-fog text-muted',
                        ].join(' ')}
                        aria-label={set.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        <Check size={16} />
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateSet(exIndex, setIndex)}
                          className="rounded-lg p-2 text-muted hover:bg-fog"
                          aria-label="Duplicate set"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSet(exIndex, setIndex)}
                          className="rounded-lg p-2 text-muted hover:bg-fog hover:text-danger"
                          aria-label="Remove set"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(exIndex)}
                  className="mt-3 text-sm font-medium text-slate hover:text-ink"
                >
                  + Add set
                </button>
              </article>
            );
          })
        )}
      </section>

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex gap-2 rounded-xl border border-mist bg-white/95 p-3 backdrop-blur lg:bottom-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => save('in_progress')}
          className="flex-1 rounded-lg border border-mist px-4 py-3 text-sm font-semibold text-slate disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save('completed')}
          className="flex-1 rounded-lg bg-steel px-4 py-3 text-sm font-semibold text-lime disabled:opacity-60"
        >
          Complete workout
        </button>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add exercise"
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-mist px-4 py-3">
              <h2 className="font-display text-lg font-bold">Add exercise</h2>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-fog"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-mist p-3">
              <input
                type="search"
                value={pickerQ}
                onChange={(e) => setPickerQ(e.target.value)}
                placeholder="Search library"
                className={fieldClass}
                autoFocus
              />
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {filteredLibrary.map((ex) => (
                <li key={ex._id}>
                  <button
                    type="button"
                    onClick={() => addExercise(ex)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-fog"
                  >
                    <span>
                      <span className="block font-medium text-ink">{ex.name}</span>
                      <span className="text-xs text-muted">
                        {ex.primaryMuscle} · {ex.equipment}
                      </span>
                    </span>
                    <Plus size={16} className="text-muted" aria-hidden />
                  </button>
                </li>
              ))}
              {filteredLibrary.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted">No matches.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
