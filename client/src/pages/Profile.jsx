import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age ?? '',
    gender: user?.gender || '',
    height: user?.height ?? '',
    weight: user?.weight ?? '',
    activityLevel: user?.activityLevel || '',
    fitnessGoal: user?.fitnessGoal || '',
    targetWeight: user?.targetWeight ?? '',
    workoutFrequency: user?.workoutFrequency ?? 3,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await updateUser({
        name: form.name.trim(),
        age: form.age === '' ? undefined : Number(form.age),
        gender: form.gender,
        height: form.height === '' ? undefined : Number(form.height),
        weight: form.weight === '' ? undefined : Number(form.weight),
        activityLevel: form.activityLevel,
        fitnessGoal: form.fitnessGoal,
        targetWeight: form.targetWeight === '' ? undefined : Number(form.targetWeight),
        workoutFrequency: Number(form.workoutFrequency) || 0,
      });
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Profile</h1>
        <p className="mt-1 text-muted">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-mist bg-white p-5">
        {message && (
          <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate">
            Name
          </label>
          <input id="profile-name" required value={form.name} onChange={update('name')} className={fieldClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-age" className="mb-1.5 block text-sm font-medium text-slate">
              Age
            </label>
            <input
              id="profile-age"
              type="number"
              min={10}
              max={120}
              value={form.age}
              onChange={update('age')}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="profile-gender" className="mb-1.5 block text-sm font-medium text-slate">
              Gender
            </label>
            <select id="profile-gender" value={form.gender} onChange={update('gender')} className={fieldClass}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-height" className="mb-1.5 block text-sm font-medium text-slate">
              Height (cm)
            </label>
            <input
              id="profile-height"
              type="number"
              min={50}
              max={300}
              value={form.height}
              onChange={update('height')}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="profile-weight" className="mb-1.5 block text-sm font-medium text-slate">
              Weight (kg)
            </label>
            <input
              id="profile-weight"
              type="number"
              min={20}
              max={500}
              step="0.1"
              value={form.weight}
              onChange={update('weight')}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="activity" className="mb-1.5 block text-sm font-medium text-slate">
            Activity level
          </label>
          <select id="activity" value={form.activityLevel} onChange={update('activityLevel')} className={fieldClass}>
            <option value="">Select</option>
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="very_active">Very active</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="goal" className="mb-1.5 block text-sm font-medium text-slate">
              Fitness goal
            </label>
            <select id="goal" value={form.fitnessGoal} onChange={update('fitnessGoal')} className={fieldClass}>
              <option value="">Select</option>
              <option value="maintain">Maintain</option>
              <option value="lose">Lose weight</option>
              <option value="gain">Gain weight</option>
            </select>
          </div>
          <div>
            <label htmlFor="target" className="mb-1.5 block text-sm font-medium text-slate">
              Target weight (kg)
            </label>
            <input
              id="target"
              type="number"
              min={20}
              max={500}
              step="0.1"
              value={form.targetWeight}
              onChange={update('targetWeight')}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="freq" className="mb-1.5 block text-sm font-medium text-slate">
            Workouts per week
          </label>
          <input
            id="freq"
            type="number"
            min={0}
            max={14}
            value={form.workoutFrequency}
            onChange={update('workoutFrequency')}
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-steel px-4 py-3 font-semibold text-lime disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
