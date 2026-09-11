import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getExercises } from '../services/exerciseService.js';

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [muscle, setMuscle] = useState('All');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (muscle !== 'All') params.muscle = muscle;
        if (debouncedQ.trim()) params.q = debouncedQ.trim();
        const { data } = await getExercises(params);
        if (!cancelled) {
          setExercises(data.exercises || []);
          setMuscleGroups(data.muscleGroups || []);
        }
      } catch {
        if (!cancelled) setError('Unable to load exercises. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [muscle, debouncedQ]);

  const filters = useMemo(() => ['All', ...muscleGroups], [muscleGroups]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Exercise Library</h1>
        <p className="mt-1 text-muted">{exercises.length} exercises ready to log.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises"
          className="w-full rounded-xl border border-mist bg-white py-3 pl-10 pr-4 outline-none ring-lime focus:ring-2"
          aria-label="Search exercises"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setMuscle(group)}
            className={[
              'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium',
              muscle === group ? 'bg-steel text-lime' : 'bg-white text-slate border border-mist',
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
        <p className="text-muted">Loading exercises…</p>
      ) : exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white px-4 py-10 text-center text-sm text-muted">
          No exercises match your filters.
        </div>
      ) : (
        <ul className="space-y-3">
          {exercises.map((ex) => {
            const open = expanded === ex._id;
            return (
              <li key={ex._id} className="rounded-xl border border-mist bg-white">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
                  onClick={() => setExpanded(open ? null : ex._id)}
                  aria-expanded={open}
                >
                  <div>
                    <p className="font-semibold text-ink">{ex.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {ex.primaryMuscle} · {ex.equipment} · {ex.difficulty}
                    </p>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    {ex.recommendedSets}×{ex.recommendedReps}
                  </span>
                </button>
                {open && (
                  <div className="border-t border-mist px-4 py-3 text-sm text-slate">
                    <p>{ex.instructions}</p>
                    <p className="mt-2 text-muted">Rest {ex.restTime}s · MET {ex.met}</p>
                    {ex.secondaryMuscles?.length > 0 && (
                      <p className="mt-1 text-muted">Also works: {ex.secondaryMuscles.join(', ')}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
