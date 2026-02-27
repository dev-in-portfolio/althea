'use client';

import { useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth } from '$lib/firebase/client';
import { signInAnonymously, onAuthStateChanged, getIdToken } from 'firebase/auth';
import QRCode from 'qrcode';

type Pass = { id: string; displayName: string; status?: string; qrPayload?: string };

type QueuedCheckin = {
  locationCode: string;
  createdAt: number;
};

const QUEUE_KEY = 'pocketpass_checkin_queue';

export default function PassView() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState<Pass | null>(null);
  const [qr, setQr] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus('Firebase client keys missing. Set NEXT_PUBLIC_FIREBASE_* env vars.');
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await signInAnonymously(auth);
        return;
      }
      const idToken = await getIdToken(user, true);
      setToken(idToken);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) return;
    flushQueue(token);
    async function loadPass() {
      setLoading(true);
      const res = await fetch('/api/me/pass', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Failed to load pass.');
        setLoading(false);
        return;
      }
      setPass(data);
      setDisplayName(data.displayName || '');
      setLoading(false);
    }
    loadPass();
  }, [token]);

  useEffect(() => {
    if (!pass?.id) return;
    const payload = pass.qrPayload || pass.id;
    QRCode.toDataURL(payload, { width: 200, margin: 1 }).then(setQr).catch(() => setQr(''));
  }, [pass?.id, pass?.qrPayload]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    try {
      const queue = JSON.parse(raw) as QueuedCheckin[];
      setQueueCount(queue.length);
    } catch {
      setQueueCount(0);
    }
  }, []);

  function readQueue(): QueuedCheckin[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedCheckin[];
    } catch {
      return [];
    }
  }

  function writeQueue(queue: QueuedCheckin[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setQueueCount(queue.length);
  }

  async function flushQueue(authToken: string) {
    const queue = readQueue();
    if (!queue.length) return;
    const remaining: QueuedCheckin[] = [];
    for (const item of queue) {
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ locationCode: item.locationCode })
        });
        if (!res.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
  }

  async function checkIn() {
    if (!locationCode) {
      setStatus('Enter a location code.');
      return;
    }
    if (!token) {
      setStatus('Sign-in not ready yet.');
      return;
    }
    setStatus('Checking in…');
    const idemKey = crypto.randomUUID();
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idemKey
      },
      body: JSON.stringify({ locationCode, notes })
    });
    const data = await res.json();
    if (!res.ok) {
      const queue = readQueue();
      queue.push({ locationCode, createdAt: Date.now() });
      writeQueue(queue);
      setStatus(data.error ? `${data.error} (queued)` : 'Check-in queued offline.');
      return;
    }
    setStatus('Checked in.');
    setLocationCode('');
    setNotes('');
  }

  async function saveDisplayName() {
    if (!token) return;
    setSavingName(true);
    const res = await fetch('/api/me/pass', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ displayName })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to update name.');
      setSavingName(false);
      return;
    }
    setPass({ id: data.id, displayName: data.displayName, status: data.status });
    setSavingName(false);
    setStatus('Display name updated.');
  }

  async function toggleStatus() {
    if (!token || !pass?.status) return;
    const next = pass.status === 'active' ? 'suspended' : 'active';
    const res = await fetch('/api/me/pass', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: next, displayName })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to update status.');
      return;
    }
    setPass({ id: data.id, displayName: data.displayName, status: data.status });
  }

  const passId = useMemo(() => pass?.id || '—', [pass]);

  return (
    <div className="grid">
      <div className="card">
        <h1>Pocket Pass</h1>
        <p className="muted">Your personal membership pass with verified check-ins.</p>
      {status && <p className={status.includes('queued') ? 'muted' : 'danger'} style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2>Pass ID</h2>
            {loading ? <p className="muted">Loading…</p> : <p className="muted">{passId}</p>}
            <div className="toolbar" style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="Display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={40}
              />
              <button className="btn secondary" onClick={saveDisplayName} disabled={savingName}>
                {savingName ? 'Saving…' : 'Save name'}
              </button>
            </div>
            {pass?.status && <p className="muted">Status: {pass.status}</p>}
            {pass?.status && (
              <button className="btn secondary" onClick={toggleStatus}>
                {pass.status === 'active' ? 'Suspend pass' : 'Reactivate pass'}
              </button>
            )}
          </div>
          {qr ? <img src={qr} alt="Pass QR" width={160} height={160} /> : <div className="muted">QR loading…</div>}
        </div>
      </div>

      <div className="card">
        <h3>Check In</h3>
        <div className="toolbar">
          <input
            className="input"
            placeholder="Location code"
            value={locationCode}
            onChange={(event) => setLocationCode(event.target.value)}
          />
          <input
            className="input"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <button className="btn" onClick={checkIn}>Check in</button>
        </div>
        {queueCount > 0 && <p className="muted" style={{ marginTop: 12 }}>Queued check-ins: {queueCount}</p>}
        {token && queueCount > 0 && (
          <button className="btn secondary" style={{ marginTop: 12 }} onClick={() => flushQueue(token)}>
            Sync queued
          </button>
        )}
        {!status ? null : <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>
    </div>
  );
}
