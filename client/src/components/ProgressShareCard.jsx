import { forwardRef } from 'react';

/** Social-style progress card — captured to PNG via html-to-image. */
const ProgressShareCard = forwardRef(function ProgressShareCard({ report }, ref) {
  const stats = report?.stats || {};

  return (
    <div
      ref={ref}
      className="w-full max-w-md overflow-hidden rounded-2xl bg-steel text-white shadow-lg"
      style={{ fontFamily: 'Syne, DM Sans, sans-serif' }}
    >
      <div className="relative px-6 pb-6 pt-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 90% 10%, #c8f54255 0%, transparent 45%), radial-gradient(circle at 10% 90%, #9bc41a33 0%, transparent 40%)',
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime/80">FitTrack</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">My Fitness Progress</h2>
          <p className="mt-1 text-sm text-mist/70">{report?.label}</p>
          {report?.userName && <p className="mt-3 text-sm font-medium text-mist/90">{report.userName}</p>}

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Workouts', value: String(stats.workouts ?? 0) },
              { label: 'Calories', value: formatK(stats.calories) },
              { label: 'Volume', value: `${formatK(stats.volume)} kg` },
              { label: 'Streak', value: `${stats.streak ?? 0}d` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/5 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-mist/50">{item.label}</p>
                <p className="mt-1 font-display text-xl font-bold text-lime">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-lime px-4 py-3 text-ink">
            <p className="text-sm font-semibold">New PRs</p>
            <p className="font-display text-2xl font-extrabold">{stats.newPRs ?? 0}</p>
          </div>

          {report?.muscles?.length > 0 && (
            <p className="mt-4 text-xs text-mist/60">
              Focus: {report.muscles.slice(0, 3).map((m) => m.name).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

function formatK(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`.replace('.0k', 'k');
  return String(Math.round(v));
}

export default ProgressShareCard;
