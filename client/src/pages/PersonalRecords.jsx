import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { getPRs } from '../services/progressService.js';
import { formatDisplayDate } from '../utils/workoutHelpers.js';

export default function PersonalRecords() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getPRs();
        if (!cancelled) setPrs(data.prs || []);
      } catch {
        if (!cancelled) setError('Unable to load personal records.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Personal Records</h1>
        <p className="mt-1 text-muted">Best weight, reps, and volume per exercise.</p>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted">Loading PRs…</p>
      ) : prs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white px-4 py-10 text-center">
          <p className="text-sm text-muted">Keep training. Your first personal record is coming.</p>
          <Link to="/workout" className="mt-4 inline-block text-sm font-semibold text-ink underline">
            Start Workout
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {prs.map((pr) => (
            <li key={pr.id} className="rounded-xl border border-mist bg-white p-4">
              <div className="flex items-start gap-3">
                <Trophy className="mt-1 shrink-0 text-lime-dark" size={18} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{pr.exerciseName}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted">Max weight</p>
                      <p className="font-medium text-ink">
                        {pr.maxWeight} kg × {pr.maxWeightReps}
                      </p>
                      {pr.maxWeightDate && (
                        <p className="text-xs text-muted">{formatDisplayDate(pr.maxWeightDate)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted">Max reps</p>
                      <p className="font-medium text-ink">
                        {pr.maxReps} @ {pr.maxRepsWeight} kg
                      </p>
                      {pr.maxRepsDate && (
                        <p className="text-xs text-muted">{formatDisplayDate(pr.maxRepsDate)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted">Max volume</p>
                      <p className="font-medium text-ink">{Math.round(pr.maxVolume)} kg</p>
                      {pr.maxVolumeDate && (
                        <p className="text-xs text-muted">{formatDisplayDate(pr.maxVolumeDate)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
