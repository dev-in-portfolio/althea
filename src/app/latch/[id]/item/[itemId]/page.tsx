'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '$lib/supabase/client';

type LatchItem = {
  id: string;
  title: string;
  body: string;
  phase: 'draft' | 'ready' | 'locked';
  proof_required: boolean;
};

type Proof = {
  id: string;
  item_id: string;
  kind: 'note' | 'link' | 'file';
  label: string;
  note: string;
  url: string;
  created_at: string;
};

export default function LatchItemPage() {
  const supabase = getSupabaseClient();
  const params = useParams();
  const latchId = params?.id as string;
  const itemId = params?.itemId as string;
  const [item, setItem] = useState<LatchItem | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [proofKind, setProofKind] = useState<'note' | 'link'>('note');
  const [proofLabel, setProofLabel] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFilter, setProofFilter] = useState<'all' | 'note' | 'link'>('all');
  const [status, setStatus] = useState('');

  const activity = useMemo(() => {
    return [...proofs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [proofs]);

  const canAdvance = useMemo(() => {
    if (!item) return false;
    return !item.proof_required || proofs.length > 0;
  }, [item, proofs]);

  const visibleProofs = useMemo(() => {
    if (proofFilter === 'all') return proofs;
    return proofs.filter((proof) => proof.kind === proofFilter);
  }, [proofs, proofFilter]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/login';
      }
    });
  }, []);

  async function loadItem() {
    const { data: itemData, error: itemError } = await supabase
      .from('latch_items')
      .select('id,title,body,phase,proof_required')
      .eq('id', itemId)
      .single();
    if (itemError) {
      setStatus(itemError.message);
      return;
    }
    const itemRow = itemData as LatchItem;
    setItem(itemRow);
    setTitle(itemRow.title || '');
    setBody(itemRow.body || '');

    const { data: proofData, error: proofError } = await supabase
      .from('item_proofs')
      .select('id,item_id,kind,label,note,url,created_at')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });
    if (proofError) {
      setStatus(proofError.message);
      return;
    }
    setProofs((proofData || []) as Proof[]);
  }

  useEffect(() => {
    if (!itemId) return;
    loadItem();
  }, [itemId]);

  async function saveItem() {
    if (!title.trim()) {
      setStatus('Title required.');
      return;
    }
    const { data, error } = await supabase
      .from('latch_items')
      .update({ title: title.trim(), body: body.trim() })
      .eq('id', itemId)
      .select('id,title,body,phase,proof_required')
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setItem(data as LatchItem);
  }

  async function addProof() {
    if (!item) return;
    if (proofKind === 'note' && !proofNote.trim()) {
      setStatus('Note required.');
      return;
    }
    if (proofKind === 'link' && !proofUrl.trim()) {
      setStatus('URL required.');
      return;
    }
    if (proofKind === 'link' && !/^https?:\/\//i.test(proofUrl.trim())) {
      setStatus('URL must start with http:// or https://');
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus('Session expired.');
      return;
    }
    const payload = {
      item_id: item.id,
      user_id: userData.user.id,
      kind: proofKind,
      label: proofLabel.trim(),
      note: proofKind === 'note' ? proofNote.trim() : '',
      url: proofKind === 'link' ? proofUrl.trim() : ''
    };
    const { data, error } = await supabase
      .from('item_proofs')
      .insert(payload)
      .select('id,item_id,kind,label,note,url,created_at')
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setProofs([data as Proof, ...proofs]);
    setProofLabel('');
    setProofNote('');
    setProofUrl('');
  }

  async function removeProof(id: string) {
    const { error } = await supabase.from('item_proofs').delete().eq('id', id);
    if (error) {
      setStatus(error.message);
      return;
    }
    setProofs(proofs.filter((proof) => proof.id !== id));
  }

  async function advance(next: 'draft' | 'ready' | 'locked') {
    const { data, error } = await supabase.rpc('advance_item_phase', {
      p_item_id: itemId,
      p_next: next
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    setItem(data as LatchItem);
  }

  if (!item) {
    return (
      <div className="card">
        <p className="muted">Loading item...</p>
        {status && <p className="muted">{status}</p>}
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Edit item</h2>
        <p className="muted">Phase: {item.phase} · Proof {item.proof_required ? 'required' : 'optional'}</p>
        <div className="grid" style={{ marginTop: 12 }}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="toolbar">
            <button className="btn" onClick={saveItem}>Save changes</button>
            <a className="btn secondary" href={`/latch/${latchId}`}>Back</a>
          </div>
        </div>
      </div>

      <div className="card alt">
        <h3>Advance phase</h3>
        <p className="muted">Proof is required to move to ready/locked when enabled.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button className="btn secondary" onClick={() => advance('draft')}>Draft</button>
          <button className="btn secondary" onClick={() => advance('ready')} disabled={!canAdvance}>Ready</button>
          <button className="btn secondary" onClick={() => advance('locked')} disabled={!canAdvance}>Locked</button>
        </div>
      </div>

      <div className="card alt">
        <h3>Recent proof activity</h3>
        {activity.length === 0 ? (
          <p className="muted">No proofs yet.</p>
        ) : (
          <div className="grid" style={{ marginTop: 12 }}>
            {activity.map((proof) => (
              <div key={proof.id} className="card">
                <div className="toolbar" style={{ justifyContent: 'space-between' }}>
                  <strong>{proof.label || proof.kind}</strong>
                  <span className="badge">{proof.kind}</span>
                </div>
                <p className="muted">Added {new Date(proof.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Add proof</h3>
        <div className="grid">
          <select className="input" value={proofKind} onChange={(e) => setProofKind(e.target.value as 'note' | 'link')}>
            <option value="note">Note</option>
            <option value="link">Link</option>
          </select>
          <input className="input" placeholder="Label" value={proofLabel} onChange={(e) => setProofLabel(e.target.value)} />
          {proofKind === 'note' ? (
            <textarea placeholder="Proof note" value={proofNote} onChange={(e) => setProofNote(e.target.value)} />
          ) : (
            <input className="input" placeholder="https://..." value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
          )}
          <button className="btn" onClick={addProof}>Add proof</button>
        </div>
      </div>

      <div className="card alt">
        <h3>Proofs</h3>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <span className="muted">Filter:</span>
          <select className="input" value={proofFilter} onChange={(e) => setProofFilter(e.target.value as 'all' | 'note' | 'link')}>
            <option value="all">All</option>
            <option value="note">Notes</option>
            <option value="link">Links</option>
          </select>
        </div>
        {visibleProofs.length === 0 ? (
          <p className="muted">No proofs yet.</p>
        ) : (
          <div className="grid" style={{ marginTop: 12 }}>
            {visibleProofs.map((proof) => (
              <div key={proof.id} className="card">
                <div className="toolbar" style={{ justifyContent: 'space-between' }}>
                  <strong>{proof.label || proof.kind}</strong>
                  <button className="btn danger" onClick={() => removeProof(proof.id)}>Delete</button>
                </div>
                {proof.kind === 'note' ? (
                  <p className="muted">{proof.note}</p>
                ) : (
                  <a className="muted" href={proof.url} target="_blank" rel="noreferrer">{proof.url}</a>
                )}
                <p className="muted">Created {new Date(proof.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
