import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import api from '../services/api.js';
import { syncPendingMutations } from '../services/offlineData.js';

export default function OfflineStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;
      setSyncing(true);
      try { await syncPendingMutations(api); } finally { setSyncing(false); }
      window.dispatchEvent(new CustomEvent('fittrack-sync-complete'));
    };
    const onOnline = () => { setOnline(true); sync(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    sync();
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  if (online && !syncing) return null;
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-steel px-3 py-2 text-xs font-medium text-white">
      {online ? <RefreshCw size={14} className="animate-spin" aria-hidden /> : <CloudOff size={14} aria-hidden />}
      {online ? 'Syncing offline changes…' : 'Offline mode — your changes are saved on this device'}
    </div>
  );
}
