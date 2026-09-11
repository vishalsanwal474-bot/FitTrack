import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { logout, user } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-muted">Account and export options.</p>
      </div>

      <section className="rounded-xl border border-mist bg-white p-5">
        <h2 className="font-display text-lg font-bold">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-ink">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Member since</dt>
            <dd className="font-medium text-ink">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full rounded-lg border border-mist px-4 py-3 text-sm font-semibold text-slate hover:bg-fog"
        >
          Log out
        </button>
      </section>

      <section className="rounded-xl border border-mist bg-white p-5">
        <h2 className="font-display text-lg font-bold">Export & share</h2>
        <p className="mt-2 text-sm text-muted">
          Download a PNG progress card or PDF report for the week, month, or year.
        </p>
        <Link
          to="/share"
          className="mt-4 inline-flex rounded-lg bg-steel px-4 py-2.5 text-sm font-semibold text-lime"
        >
          Open share page
        </Link>
      </section>
    </div>
  );
}
