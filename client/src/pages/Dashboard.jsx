import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, RotateCcw, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboard } from '../services/dashboardService.js';
import { quickStart } from '../services/workoutService.js';
import { formatBodyParts, formatDisplayDate } from '../utils/workoutHelpers.js';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getDashboard();
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setError('Unable to load dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startQuick = async (mode) => {
    setStarting(mode);
    setError('');
    try {
      const { data: res } = await quickStart({ mode });
      navigate(`/workout?id=${res.workout.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start workout.');
    } finally {
      setStarting('');
    }
  };

  const today = data?.today;
  const totals = today?.totals;
  const last = data?.lastWorkout;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Hey, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-muted">Your training hub for today.</p>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-2xl bg-steel p-5 text-white sm:p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-lime/80">Today&apos;s workout</p>
        {loading ? (
          <p className="mt-3 text-mist/70">Loading…</p>
        ) : today ? (
          <>
            <p className="mt-3 font-display text-2xl font-bold">{formatBodyParts(today.bodyParts)}</p>
            <p className="mt-2 text-sm text-mist/80">
              {totals.exerciseCount} exercises · {totals.sets} sets · {totals.reps} reps ·{' '}
              {totals.duration || 0} min · {Math.round(totals.volume)} kg
              {totals.caloriesBurned ? ` · ~${totals.caloriesBurned} kcal` : ''}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to={`/workout?id=${today.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-semibold text-ink"
              >
                <Dumbbell size={18} aria-hidden />
                {today.status === 'completed' ? 'View workout' : 'Continue workout'}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 font-display text-2xl font-bold">No workout recorded today.</p>
            <p className="mt-2 max-w-md text-sm text-mist/70">Quick Start an empty session or repeat your last workout.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={Boolean(starting)}
                onClick={() => startQuick('empty')}
                className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
              >
                <Dumbbell size={18} aria-hidden />
                {starting === 'empty' ? 'Starting…' : 'Start empty'}
              </button>
              <button
                type="button"
                disabled={Boolean(starting) || !last}
                onClick={() => startQuick('repeat')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                <RotateCcw size={18} aria-hidden />
                {starting === 'repeat' ? 'Starting…' : 'Repeat last'}
              </button>
            </div>
          </>
        )}
      </section>

      {!loading && last && (
        <section className="rounded-xl border border-mist bg-white px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Last workout</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{formatBodyParts(last.bodyParts)}</p>
              <p className="mt-1 text-sm text-muted">
                {formatDisplayDate(last.date)} · {last.totals?.exerciseCount || 0} exercises ·{' '}
                {Math.round(last.totals?.volume || 0)} kg
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate">
                {(last.exercises || []).slice(0, 4).map((ex) => {
                  const top = (ex.sets || [])[0];
                  return (
                    <li key={ex.id || ex.exerciseName}>
                      {ex.exerciseName}
                      {top ? ` · ${top.weight} kg × ${top.reps}` : ''}
                      {(ex.sets?.length || 0) > 1 ? ` × ${ex.sets.length}` : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
            <button
              type="button"
              disabled={Boolean(starting)}
              onClick={() => startQuick('repeat')}
              className="rounded-lg bg-steel px-4 py-2.5 text-sm font-semibold text-lime disabled:opacity-60"
            >
              Repeat workout
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Streak', value: data?.streak != null ? `${data.streak}d` : '—' },
          { label: 'This week', value: String(data?.weeklyCompletedCount ?? 0) },
          {
            label: 'Calories today',
            value: data?.caloriesBurnedToday != null ? `~${data.caloriesBurnedToday}` : '—',
          },
          {
            label: 'Daily target',
            value: data?.calorieTarget != null ? `${data.calorieTarget}` : '—',
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-mist bg-white px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-mist bg-white px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Week volume</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {data?.weeklyVolume != null ? `${data.weeklyVolume} kg` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-mist bg-white px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Current weight</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {data?.currentWeight != null
              ? `${data.currentWeight} kg`
              : user?.weight
                ? `${user.weight} kg`
                : '—'}
          </p>
          <Link to="/nutrition" className="mt-1 inline-block text-xs font-medium text-slate hover:text-ink">
            Log weight
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-mist bg-white px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Recent PR</h2>
          <Link to="/prs" className="text-sm font-medium text-slate hover:text-ink">
            All PRs
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : data?.recentPR ? (
          <div className="flex items-start gap-3">
            <Trophy className="mt-0.5 text-lime-dark" size={20} aria-hidden />
            <div>
              <p className="font-medium text-ink">{data.recentPR.exerciseName}</p>
              <p className="text-sm text-muted">
                {data.recentPR.maxWeight} kg × {data.recentPR.maxWeightReps} · vol{' '}
                {Math.round(data.recentPR.maxVolume || 0)} kg
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Keep training. Your first personal record is coming.</p>
        )}
      </section>

      <section className="rounded-xl border border-mist bg-white px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Recent workouts</h2>
          <Link to="/history" className="text-sm font-medium text-slate hover:text-ink">
            See all
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !data?.recentWorkouts?.length ? (
          <p className="text-sm text-muted">Complete a workout to see it here.</p>
        ) : (
          <ul className="divide-y divide-mist">
            {data.recentWorkouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink">{formatBodyParts(w.bodyParts)}</p>
                  <p className="text-xs text-muted">
                    {formatDisplayDate(w.date)} · {w.totals?.sets || 0} sets ·{' '}
                    {Math.round(w.totals?.volume || 0)} kg
                  </p>
                </div>
                <Link to={`/workout?id=${w.id}`} className="text-sm font-medium text-slate hover:text-ink">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-mist bg-white px-4 py-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Daily motivation</p>
          <Link to="/recommendations" className="text-xs font-medium text-slate hover:text-ink">
            Get recommendations
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <p className="text-lg text-slate">
              {data?.dailyQuote?.text || 'Consistency beats intensity. Show up today.'}
            </p>
            {data?.dailyQuote?.author && (
              <p className="mt-2 text-sm text-muted">— {data.dailyQuote.author}</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
