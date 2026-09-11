import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-steel">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(200,245,66,0.25), transparent), radial-gradient(ellipse 60% 40% at 90% 80%, rgba(61,74,92,0.8), transparent)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="font-display text-4xl font-extrabold tracking-tight text-lime">FitTrack</p>
          <p className="mt-2 text-sm text-mist/70">Train. Track. Progress.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-black/20">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
