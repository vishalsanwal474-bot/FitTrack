const DB_NAME = 'fittrack-offline';
const DB_VERSION = 1;
const KV_STORE = 'kv';
const QUEUE_STORE = 'queue';

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open offline database'));
  });
}

async function kvGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KV_STORE, 'readonly');
    const req = tx.objectStore(KV_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

async function kvSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KV_STORE, 'readwrite');
    tx.objectStore(KV_STORE).put({ key, value });
    tx.oncomplete = () => { db.close(); resolve(value); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function kvDelete(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KV_STORE, 'readwrite');
    tx.objectStore(KV_STORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export const offlineKeys = {
  user: 'user',
  exercises: 'exercises',
  workouts: 'workouts',
  weights: 'weights',
  prs: 'prs',
  quote: 'quote',
};

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

export function makeOfflineId(prefix = 'offline') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getLocal(key) {
  try { return await kvGet(key); } catch { return null; }
}

export async function setLocal(key, value) {
  try { return await kvSet(key, value); } catch { return value; }
}

export async function removeLocal(key) {
  try { await kvDelete(key); } catch { /* best effort */ }
}

export async function enqueueMutation(mutation) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const req = tx.objectStore(QUEUE_STORE).add({ ...mutation, createdAt: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getQueuedMutations() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function removeQueuedMutation(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function replaceLocalId(oldId, newId) {
  const workouts = (await getLocal(offlineKeys.workouts)) || [];
  const next = workouts.map((w) => (String(w.id) === String(oldId) ? { ...w, id: newId } : w));
  await setLocal(offlineKeys.workouts, next);
  return next.find((w) => String(w.id) === String(newId));
}

export async function replaceQueuedLocalId(oldId, newId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      for (const item of req.result || []) {
        let changed = false;
        const next = { ...item };
        if (next.localId === oldId) { next.localId = newId; changed = true; }
        if (next.payload?.id === oldId) { next.payload = { ...next.payload, id: newId }; changed = true; }
        if (next.payload?.data?.id === oldId) { next.payload = { ...next.payload, data: { ...next.payload.data, id: newId } }; changed = true; }
        if (changed) store.put(next);
      }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
