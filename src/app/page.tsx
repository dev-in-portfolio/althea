'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '$lib/supabase/client';

type Latch = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export default function LatchListPage() {
  const supabase = getSupabaseClient();
  const [sessionReady, setSessionReady] = useState(false);
  const [latches, setLatches] = useState<Latch[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return latches;
    const needle = filter.toLowerCase();
    return latches.filter((l) => l.title.toLowerCase().includes(needle) || l.description.toLowerCase().includes(needle));
  }, [filter, latches]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/login';
        return;
      }
      setSessionReady(true);
    });
  }, []);

  async function loadLatches() {
    const { data, error } = await supabase
      .from('latches')
      .select('id,title,description,created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setStatus(error.message);
      return;
    }
    setLatches((data || []) as Latch[]);
  }

  useEffect(() => {
    if (!sessionReady) return;
    loadLatches();
  }, [sessionReady]);

  async function createLatch() {
    if (!title.trim()) {
      setStatus('Title required.');
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus('Session expired.');
      return;
    }
    const { data, error } = await supabase
      .from('latches')
      .insert({
        user_id: userData.user.id,
        title: title.trim(),
        description: description.trim()
      })
      .select('id,title,description,created_at')
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setLatches([data as Latch, ...latches]);
    setTitle('');
    setDescription('');
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Create a latch</h2>
        <p className="muted">Latches group your checklist items.</p>
        <div className="grid" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Latch title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="btn" onClick={createLatch}>Create latch</button>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card alt">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Your latches</h2>
            <p className="muted" style={{ marginTop: 6 }}>Draft → Ready → Locked</p>
          </div>
          <input className="input" placeholder="Search" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <p className="muted">No latches yet. Create one to start.</p>
        </div>
      ) : (
        filtered.map((latch) => (
          <a key={latch.id} className="card" href={`/latch/${latch.id}`}>
            <strong>{latch.title}</strong>
            <p className="muted">{latch.description || 'No description yet.'}</p>
            <p className="muted">Created {new Date(latch.created_at).toLocaleString()}</p>
          </a>
        ))
      )}
    </div>
  );
}
