import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getNutrition } from '../services/nutritionService.js';
import { createWeight, deleteWeight, getWeights } from '../services/weightService.js';
import { formatDateInput, formatDisplayDate } from '../utils/workoutHelpers.js';

const fieldClass =
  'w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2';

export default function Nutrition() {
  const { user, refreshUser } = useAuth();
  const [nutrition, setNutrition] = useState(null);
  const [weights, setWeights] = useState([]);
  const [weightInput, setWeightInput] = useState(user?.weight ?? '');
  const [dateInput, setDateInput] = useState(formatDateInput());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nRes, wRes] = await Promise.all([getNutrition(), getWeights({ limit: 30 })]);
      setNutrition(nRes.data);
      setWeights(wRes.data.weights || []);
      if (nRes.data.weight != null) setWeightInput(nRes.data.weight);
    } catch {
      setError('Unable to load nutrition data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onLogWeight = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await createWeight({
        weight: Number(weightInput),
        date: dateInput,
      });
      await refreshUser?.();
      setMessage('Weight logged.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log weight.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this weight entry?')) return;
    try {
      await deleteWeight(id);
      await refreshUser?.();
      await load();
    } catch {
      setError('Unable to delete weight entry.');
    }
  };

  const goalLabel =
    nutrition?.fitnessGoal === 'lose'
      ? 'Lose weight (−500 kcal)'
      : nutrition?.fitnessGoal === 'gain'
        ? 'Gain weight (+300 kcal)'
        : 'Maintain';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Nutrition & Calories</h1>
        <p className="mt-1 text-muted">BMR, TDEE, burn estimates, and body weight.</p>
      </div>

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

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          {!nutrition?.complete && (
            <div className="rounded-xl border border-mist bg-white px-4 py-4 text-sm text-slate">
              Add age, height, and weight in{' '}
              <Link to="/profile" className="font-semibold text-ink underline">
                Profile
              </Link>{' '}
              to unlock BMR / TDEE
              {nutrition?.missing?.length ? ` (missing: ${nutrition.missing.join(', ')})` : ''}.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'BMR', value: nutrition?.bmr != null ? `${nutrition.bmr}` : '—', hint: 'kcal/day at rest' },
              { label: 'TDEE', value: nutrition?.tdee != null ? `${nutrition.tdee}` : '—', hint: 'maintenance burn' },
              {
                label: 'Daily target',
                value: nutrition?.calorieTarget != null ? `${nutrition.calorieTarget}` : '—',
                hint: goalLabel,
              },
              {
                label: 'Burned today',
                value: `${nutrition?.caloriesBurnedToday ?? 0}`,
                hint: 'from workouts',
              },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-mist bg-white px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{card.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{card.value}</p>
                <p className="mt-1 text-xs text-muted">{card.hint}</p>
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-mist bg-white px-4 py-5">
            <h2 className="font-display text-lg font-bold text-ink">Today&apos;s energy</h2>
            <p className="mt-2 text-sm text-slate">
              Workout burn: <strong>{nutrition?.caloriesBurnedToday ?? 0} kcal</strong>
              {nutrition?.calorieTarget != null && (
                <>
                  {' '}
                  · Target intake: <strong>{nutrition.calorieTarget} kcal</strong>
                  {nutrition.remainingToday != null && (
                    <>
                      {' '}
                      · Net room after burn:{' '}
                      <strong>{nutrition.calorieTarget + (nutrition.caloriesBurnedToday || 0)} kcal</strong>
                    </>
                  )}
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-muted">
              Estimates use Mifflin–St Jeor + activity factor. Workout burn uses MET × body weight × duration.
            </p>
          </section>

          <section className="rounded-xl border border-mist bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Scale size={18} className="text-lime-dark" aria-hidden />
              <h2 className="font-display text-lg font-bold text-ink">Log body weight</h2>
            </div>
            <form onSubmit={onLogWeight} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label htmlFor="bw-weight" className="mb-1.5 block text-sm font-medium text-slate">
                  Weight (kg)
                </label>
                <input
                  id="bw-weight"
                  type="number"
                  min={20}
                  max={500}
                  step="0.1"
                  required
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="bw-date" className="mb-1.5 block text-sm font-medium text-slate">
                  Date
                </label>
                <input
                  id="bw-date"
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-steel px-4 py-2.5 text-sm font-semibold text-lime disabled:opacity-60 sm:w-auto"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-mist bg-white px-4 py-5">
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Weight history</h2>
            {weights.length === 0 ? (
              <p className="text-sm text-muted">No weight entries yet.</p>
            ) : (
              <ul className="divide-y divide-mist">
                {weights.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-ink">{entry.weight} kg</p>
                      <p className="text-xs text-muted">{formatDisplayDate(entry.date)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      className="rounded-lg p-2 text-muted hover:bg-fog hover:text-danger"
                      aria-label="Delete weight entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
