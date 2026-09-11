import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteWorkout, getWorkouts } from '../services/workoutService.js';
import { formatBodyParts, formatDisplayDate } from '../utils/workoutHelpers.js';

export default function WorkoutHistory() {
  const [workouts, setWorkouts] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    const msg = sessionStorage.getItem('fittrack-pr-flash');
    if (msg) {
      setFlash(msg);
      sessionStorage.removeItem('fittrack-pr-flash');
    }
  }, []);

  const load = async (nextPage = page, nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: nextPage, limit: 10 };
      if (nextStatus) params.status = nextStatus;
      const { data } = await getWorkouts(params);
      setWorkouts(data.workouts || []);
      setPages(data.pagination?.pages || 1);
      setPage(data.pagination?.page || 1);
    } catch {
      setError('Unable to load your workouts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    setDeletingId(id);
    try {
      await deleteWorkout(id);
      await load(page, status);
    } catch {
      setError('Unable to delete workout.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Workout History</h1>
          <p className="mt-1 text-muted">Review, edit, or remove past sessions.</p>
        </div>
        <Link
          to="/workout"
          className="rounded-lg bg-steel px-4 py-2.5 text-sm font-semibold text-lime"
        >
          New workout
        </Link>
      </div>

      <div className="flex gap-2">
        {[
          { value: '', label: 'All' },
          { value: 'completed', label: 'Completed' },
          { value: 'in_progress', label: 'Drafts' },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              status === opt.value ? 'bg-steel text-lime' : 'border border-mist bg-white text-slate',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {flash && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success" role="status">
          {flash}
        </p>
      )}

      {loading ? (
        <p className="text-muted">Loading history…</p>
      ) : workouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white px-4 py-10 text-center">
          <p className="text-sm text-muted">No workout recorded yet.</p>
          <Link to="/workout" className="mt-4 inline-block text-sm font-semibold text-ink underline">
            Start Workout
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {workouts.map((w) => (
            <li key={w.id} className="rounded-xl border border-mist bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{formatBodyParts(w.bodyParts)}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDisplayDate(w.date)} · {w.status === 'completed' ? 'Completed' : 'Draft'} ·{' '}
                    {w.workoutType || 'strength'}
                  </p>
                  <p className="mt-2 text-sm text-slate">
                    {w.totals?.exerciseCount || 0} exercises · {w.totals?.sets || 0} sets ·{' '}
                    {w.totals?.reps || 0} reps · {w.duration || 0} min ·{' '}
                    {Math.round(w.totals?.volume || 0)} kg
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/workout?id=${w.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-mist px-3 py-2 text-sm font-medium text-slate hover:bg-fog"
                  >
                    <Pencil size={14} aria-hidden />
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={deletingId === w.id}
                    onClick={() => onDelete(w.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-mist px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-60"
                  >
                    <Trash2 size={14} aria-hidden />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded-lg border border-mist px-3 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="rounded-lg border border-mist px-3 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
