'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFirebaseAuth } from '$lib/firebase/client';
import { onAuthStateChanged, signInAnonymously, getIdToken } from 'firebase/auth';

export default function JoinClient() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setInviteCode(code.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus('Firebase client keys missing. Set NEXT_PUBLIC_FIREBASE_* env vars.');
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

  async function joinRoom() {
    if (!token) return;
    if (!inviteCode.trim()) {
      setStatus('Invite code required.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inviteCode })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Join failed.');
      setLoading(false);
      return;
    }
    window.location.href = `/room/${data.id}`;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Join a room</h2>
        <p className="muted">Enter the invite code from the room owner.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input
            className="input"
            placeholder="Invite code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />
          <button className="btn" onClick={joinRoom} disabled={loading}>
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>
    </div>
  );
}
