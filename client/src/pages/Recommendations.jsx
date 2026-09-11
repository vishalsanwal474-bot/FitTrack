import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { getMuscleGroups, getRecommendations } from '../services/recommendationService.js';
import { createWorkout } from '../services/workoutService.js';
import { emptyExercise, formatDateInput } from '../utils/workoutHelpers.js';

export default function Recommendations() {
  const navigate = useNavigate();
  const [muscles, setMuscles] = useState([]);
  const [muscle, setMuscle] = useState('Chest');
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState('rule-based');
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMuscleGroups()
      .then(({ data }) => {
        const groups = data.muscleGroups || [];
        setMuscles(groups);
        if (groups.length && !groups.includes(muscle)) setMuscle(groups[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!muscle) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setSelected(new Set());
      try {
        const { data } = await getRecommendations(muscle, { limit: 8 });
        if (!cancelled) {
          setItems(data.exercises || []);
          setProvider(data.provider || 'rule-based');
          if (data.muscleGroups?.length) setMuscles(data.muscleGroups);
        }
      } catch {
        if (!cancelled) setError('Unable to load recommendations. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [muscle]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startWithSelected = async () => {
    const chosen = items.filter((ex) => selected.has(ex.id));
    if (!chosen.length) {
      setError('Select at least one exercise.');
      return;
    }
    setStarting(true);
    setError('');
    try {
      const { data } = await createWorkout({
        date: new Date(`${formatDateInput()}T12:00:00`),
        bodyParts: [muscle],
        workoutType: 'hypertrophy',
        duration: 0,
        status: 'in_progress',
        exercises: chosen.map((ex) => emptyExercise(ex)),
      });
      navigate(`/workout?id=${data.workout.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start workout.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Recommendations</h1>
        <p className="mt-1 text-muted">
          Rule-based suggestions by muscle group
          {provider ? ` · ${provider}` : ''}.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {muscles.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setMuscle(group)}
            className={[
              'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium',
              muscle === group ? 'bg-steel text-lime' : 'border border-mist bg-white text-slate',
            ].join(' ')}
          >
            {group}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted">Finding exercises…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white px-4 py-10 text-center text-sm text-muted">
          No recommendations for this muscle group yet.
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((ex) => {
              const checked = selected.has(ex.id);
              return (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => toggle(ex.id)}
                    className={[
                      'w-full rounded-xl border px-4 py-4 text-left transition-colors',
                      checked ? 'border-steel bg-steel/5' : 'border-mist bg-white hover:bg-fog/60',
                    ].join(' ')}
                    aria-pressed={checked}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="shrink-0 text-lime-dark" aria-hidden />
                          <p className="font-semibold text-ink">{ex.name}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {ex.equipment} · {ex.difficulty} · {ex.recommendedSets}×{ex.recommendedReps}
                        </p>
                        {ex.reasons?.length > 0 && (
                          <p className="mt-2 text-sm text-slate">{ex.reasons.join(' · ')}</p>
                        )}
                      </div>
                      <span
                        className={[
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                          checked ? 'border-steel bg-steel text-lime' : 'border-mist text-muted',
                        ].join(' ')}
                        aria-hidden
                      >
                        {checked ? '✓' : '+'}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex gap-2 rounded-xl border border-mist bg-white/95 p-3 backdrop-blur lg:bottom-4">
            <button
              type="button"
              disabled={starting || selected.size === 0}
              onClick={startWithSelected}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-steel px-4 py-3 text-sm font-semibold text-lime disabled:opacity-50"
            >
              <Plus size={16} aria-hidden />
              {starting ? 'Starting…' : `Start workout (${selected.size})`}
            </button>
            <Link
              to="/exercises"
              className="rounded-lg border border-mist px-4 py-3 text-sm font-semibold text-slate"
            >
              Library
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
