import OfflineStatus from '../components/OfflineStatus.jsx';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Dumbbell,
  Flame,
  History,
  Home,
  Library,
  Settings,
  Share2,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/exercises', label: 'Exercises', icon: Library },
  { to: '/recommendations', label: 'Recommend', icon: Sparkles },
  { to: '/history', label: 'History', icon: History },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/nutrition', label: 'Nutrition', icon: Flame },
  { to: '/prs', label: 'PRs', icon: Trophy },
  { to: '/share', label: 'Share', icon: Share2 },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const mobilePrimary = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: Activity },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
];

function linkClass({ isActive }) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-steel text-lime' : 'text-mist/80 hover:bg-steel/60 hover:text-white',
  ].join(' ');
}

function mobileLinkClass({ isActive }) {
  return [
    'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium',
    isActive ? 'text-lime-dark' : 'text-muted',
  ].join(' ');
}

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <OfflineStatus />
      <div className="min-h-screen bg-fog lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-steel text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-display text-2xl font-extrabold tracking-tight text-lime">FitTrack</p>
          <p className="mt-1 text-xs text-mist/60">Personal fitness tracker</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-mist/50">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-mist/80 hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-mist bg-fog/95 px-4 py-3 backdrop-blur lg:hidden">
          <p className="font-display text-xl font-bold text-ink">FitTrack</p>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm text-slate hover:bg-mist"
          >
            Log out
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-mist bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Mobile"
      >
        {mobilePrimary.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={mobileLinkClass}>
            <Icon size={20} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      </div>
    </>
  );
}
