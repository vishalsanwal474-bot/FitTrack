import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Share2 } from 'lucide-react';
import ProgressShareCard from '../components/ProgressShareCard.jsx';
import { getReport } from '../services/progressService.js';
import { exportCardPng, exportReportPdf } from '../utils/exportReport.js';

const PERIODS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
];

export default function Share() {
  const cardRef = useRef(null);
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const { data } = await getReport({ period });
        if (!cancelled) setReport(data.report);
      } catch {
        if (!cancelled) setError('Unable to load report data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const stamp = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const onPng = async () => {
    setBusy('png');
    setError('');
    setMessage('');
    try {
      await exportCardPng(cardRef.current, `fittrack-progress-${period}-${stamp()}.png`);
      setMessage('PNG downloaded.');
    } catch {
      setError('Unable to export PNG. Try again.');
    } finally {
      setBusy('');
    }
  };

  const onPdf = async () => {
    if (!report) return;
    setBusy('pdf');
    setError('');
    setMessage('');
    try {
      await exportReportPdf(report, `fittrack-report-${period}-${stamp()}.pdf`);
      setMessage('PDF downloaded.');
    } catch {
      setError('Unable to export PDF. Try again.');
    } finally {
      setBusy('');
    }
  };

  const onShare = async () => {
    if (!report || !navigator.share) {
      setError('Sharing is not supported on this device. Download PNG or PDF instead.');
      return;
    }
    setBusy('share');
    setError('');
    try {
      const stats = report.stats || {};
      await navigator.share({
        title: 'My FitTrack Progress',
        text: `My fitness progress (${report.label}): ${stats.workouts} workouts, ${stats.volume} kg volume, ~${stats.calories} kcal, ${stats.streak}d streak, ${stats.newPRs} new PRs.`,
      });
    } catch (err) {
      if (err?.name !== 'AbortError') setError('Unable to open share sheet.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Share Progress</h1>
        <p className="mt-1 text-muted">Export a PNG card or PDF report for the selected period.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              period === p.id ? 'bg-steel text-lime' : 'border border-mist bg-white text-slate',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
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
        <p className="text-muted">Building your report…</p>
      ) : !report ? (
        <p className="text-muted">No report data.</p>
      ) : (
        <>
          <div className="flex justify-center">
            <ProgressShareCard ref={cardRef} report={report} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={onPng}
              className="inline-flex items-center gap-2 rounded-lg bg-steel px-4 py-2.5 text-sm font-semibold text-lime disabled:opacity-60"
            >
              <Download size={16} aria-hidden />
              {busy === 'png' ? 'Exporting…' : 'Download PNG'}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={onPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-mist bg-white px-4 py-2.5 text-sm font-semibold text-slate disabled:opacity-60"
            >
              <FileText size={16} aria-hidden />
              {busy === 'pdf' ? 'Exporting…' : 'Download PDF'}
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={onShare}
                className="inline-flex items-center gap-2 rounded-lg border border-mist bg-white px-4 py-2.5 text-sm font-semibold text-slate disabled:opacity-60"
              >
                <Share2 size={16} aria-hidden />
                {busy === 'share' ? 'Opening…' : 'Share'}
              </button>
            )}
          </div>

          <section className="rounded-xl border border-mist bg-white px-4 py-5">
            <h2 className="font-display text-lg font-bold text-ink">Report preview</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Workouts', report.stats.workouts],
                ['Volume', `${report.stats.volume} kg`],
                ['Calories', `~${report.stats.calories}`],
                ['Duration', `${report.stats.duration} min`],
                ['Streak', `${report.stats.streak}d`],
                ['New PRs', report.stats.newPRs],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-mist pb-2 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            {report.stats.workouts === 0 && (
              <p className="mt-4 text-sm text-muted">
                No completed workouts in this period yet — the card still exports with zeros.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
