'use client';

import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '$lib/firebase/client';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';

type HistoryRow = {
  id: string;
  checked_in_at: string;
  notes: string;
  code: string;
  name: string;
};

export default function HistoryView() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<HistoryRow[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus('Firebase client keys missing. Set NEXT_PUBLIC_FIREBASE_* env vars.');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const idToken = await getIdToken(user, true);
      setToken(idToken);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) return;
    async function loadHistory() {
      const res = await fetch('/api/me/history?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Failed to load history.');
        return;
      }
      setItems(data.items || []);
    }
    loadHistory();
  }, [token]);

  return (
    <div className="grid">
      <div className="card">
        <h1>Check-in History</h1>
        <p className="muted">Recent visits tied to your pass.</p>
        {status && <p className="danger">{status}</p>}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p className="muted">No check-ins yet.</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="card">
            <strong>{item.name}</strong>
            <p className="muted">{item.code}</p>
            <p className="muted">{new Date(item.checked_in_at).toLocaleString()}</p>
            {item.notes && <p className="muted">{item.notes}</p>}
          </div>
        ))
      )}
    </div>
  );
}
