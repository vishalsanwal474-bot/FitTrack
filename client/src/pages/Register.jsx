import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      };
      await register(payload);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Create account</h1>
      <p className="mt-1 text-sm text-muted">Start tracking workouts in minutes.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate">
            Name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={update('name')}
            className="w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
            className="w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={form.password}
            onChange={update('password')}
            className="w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-slate">
              Age
            </label>
            <input
              id="age"
              type="number"
              min={10}
              max={120}
              value={form.age}
              onChange={update('age')}
              className="w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="gender" className="mb-1.5 block text-sm font-medium text-slate">
              Gender
            </label>
            <select
              id="gender"
              value={form.gender}
              onChange={update('gender')}
              className="w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2"
            >
              <option value="">Optional</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="height" className="mb-1.5 block text-sm font-medium text-slate">
              Height (cm)
            </label>
            <input
              id="height"
              type="number"
              min={50}
              max={300}
              value={form.height}
              onChange={update('height')}
              className="w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="weight" className="mb-1.5 block text-sm font-medium text-slate">
              Weight (kg)
            </label>
            <input
              id="weight"
              type="number"
              min={20}
              max={500}
              step="0.1"
              value={form.weight}
              onChange={update('weight')}
              className="w-full rounded-lg border border-mist bg-fog px-3 py-2.5 outline-none ring-lime focus:ring-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-steel px-4 py-3 font-semibold text-lime disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-steel underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
