'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '$lib/supabase/client';

export default function LoginPage() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/';
      }
    });
  }, []);

  async function sendMagicLink() {
    if (!email.trim()) {
      setStatus('Email required.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` }
    });
    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }
    setStatus('Check your inbox for a magic link.');
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStatus('Signed out.');
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Sign in</h2>
        <p className="muted">Use a magic link to access your sessions.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" onClick={sendMagicLink} disabled={loading}>
            {loading ? 'Sending...' : 'Send link'}
          </button>
          <button className="btn secondary" onClick={signOut}>Sign out</button>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>
    </div>
  );
}
