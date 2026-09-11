import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { formatTimer } from '../utils/workoutHelpers.js';

const storageKey = (id) => `fittrack-timer-${id || 'new'}`;

export default function WorkoutTimer({ workoutId, onMinutesChange }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(workoutId));
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const base = Number(data.elapsed) || 0;
      if (data.running && data.startedAt) {
        const extra = Math.floor((Date.now() - data.startedAt) / 1000);
        setElapsed(base + Math.max(0, extra));
        setRunning(true);
      } else {
        setElapsed(base);
        setRunning(false);
      }
    } catch {
      /* ignore */
    }
  }, [workoutId]);

  useEffect(() => {
    localStorage.setItem(
      storageKey(workoutId),
      JSON.stringify({
        elapsed,
        running,
        startedAt: running ? Date.now() - elapsed * 1000 : null,
      })
    );
    if (onMinutesChange && (running || elapsed >= 60)) {
      onMinutesChange(Math.max(1, Math.floor(elapsed / 60)));
    }
  }, [elapsed, running, workoutId, onMinutesChange]);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    localStorage.removeItem(storageKey(workoutId));
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-mist bg-white px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Timer</p>
        <p className="font-display text-2xl font-bold tabular-nums text-ink" aria-live="polite">
          {formatTimer(elapsed)}
        </p>
      </div>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="inline-flex items-center gap-1 rounded-lg bg-steel px-3 py-2 text-sm font-semibold text-lime"
          aria-label={running ? 'Pause timer' : 'Start timer'}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-mist px-3 py-2 text-muted hover:bg-fog"
          aria-label="Reset timer"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
