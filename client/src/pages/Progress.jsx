import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getDailyProgress,
  getMonthlyProgress,
  getWeeklyProgress,
  getYearlyProgress,
} from '../services/progressService.js';

const RANGES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const PIE_COLORS = ['#1a2332', '#9bc41a', '#3d4a5c', '#c8f542', '#6b7a8f', '#2a9d6e', '#d64545', '#e8eef4'];

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e8eef4',
  borderRadius: 8,
  fontSize: 12,
};

async function fetchRange(range) {
  if (range === 'weekly') return getWeeklyProgress();
  if (range === 'monthly') return getMonthlyProgress();
  if (range === 'yearly') return getYearlyProgress();
  return getDailyProgress();
}

export default function Progress() {
  const [range, setRange] = useState('weekly');
  const [data, setData] = useState(null);
  const [metric, setMetric] = useState('volume');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchRange(range);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setError('Unable to load progress. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const hasWorkouts = (data?.summary?.workouts || 0) > 0;
  const series = data?.series || [];
  const muscles = data?.muscles || [];

  const weightSeries = useMemo(() => {
    if (range === 'daily' && data?.weights?.length) {
      return data.weights.map((w) => ({ label: w.label, weight: w.weight }));
    }
    if (range === 'monthly') {
      return series.filter((p) => p.weight != null).map((p) => ({ label: p.label, weight: p.weight }));
    }
    return [];
  }, [data, range, series]);

  const metricLabel =
    metric === 'calories' ? 'Calories' : metric === 'workouts' ? 'Workouts' : 'Volume (kg)';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Progress</h1>
          <p className="mt-1 text-muted">Volume, workouts, calories, and muscle focus over time.</p>
        </div>
        <Link
          to="/share"
          className="rounded-lg border border-mist bg-white px-3 py-2 text-sm font-semibold text-slate hover:bg-fog"
        >
          Share / export
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              range === r.id ? 'bg-steel text-lime' : 'border border-mist bg-white text-slate',
            ].join(' ')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted">Loading charts…</p>
      ) : !hasWorkouts ? (
        <div className="rounded-xl border border-dashed border-mist bg-white px-4 py-10 text-center">
          <p className="text-sm text-muted">Complete a few workouts to unlock your progress charts.</p>
          <Link to="/workout" className="mt-4 inline-block text-sm font-semibold text-ink underline">
            Start Workout
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Workouts', value: data.summary.workouts },
              { label: 'Volume', value: `${data.summary.volume} kg` },
              { label: 'Calories', value: `~${data.summary.calories}` },
              { label: 'Duration', value: `${data.summary.duration} min` },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-mist bg-white px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{card.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{card.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-mist bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">{metricLabel}</h2>
              <div className="flex gap-2">
                {[
                  { id: 'volume', label: 'Volume' },
                  { id: 'workouts', label: 'Workouts' },
                  { id: 'calories', label: 'Calories' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetric(m.id)}
                    className={[
                      'rounded-lg px-2.5 py-1 text-xs font-medium',
                      metric === m.id ? 'bg-steel text-lime' : 'bg-fog text-slate',
                    ].join(' ')}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7a8f' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7a8f' }} width={48} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey={metric} fill="#1a2332" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-mist bg-white p-4 sm:p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">Muscle focus</h2>
              {muscles.length === 0 ? (
                <p className="text-sm text-muted">No body-part data in this range.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={muscles}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {muscles.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-mist bg-white p-4 sm:p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">Body weight</h2>
              {weightSeries.length < 2 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <p className="text-sm text-muted">
                    {weightSeries.length === 1
                      ? 'Log more weigh-ins to see a trend.'
                      : 'Log body weight on Nutrition to chart trends.'}
                  </p>
                  <Link to="/nutrition" className="mt-3 text-sm font-semibold text-ink underline">
                    Log weight
                  </Link>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7a8f' }} />
                      <YAxis
                        domain={['dataMin - 1', 'dataMax + 1']}
                        tick={{ fontSize: 11, fill: '#6b7a8f' }}
                        width={40}
                        unit="kg"
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#9bc41a"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#1a2332' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
