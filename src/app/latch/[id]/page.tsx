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
  created_at: string;
  updated_at: string;
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

export default function LatchDetailPage() {
  const supabase = getSupabaseClient();
  const params = useParams();
  const latchId = params?.id as string;
  const [items, setItems] = useState<LatchItem[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');

  const groupedProofs = useMemo(() => {
    return proofs.reduce<Record<string, Proof[]>>((acc, proof) => {
      acc[proof.item_id] = acc[proof.item_id] || [];
      acc[proof.item_id].push(proof);
      return acc;
    }, {});
  }, [proofs]);

  const filteredItems = useMemo(() => {
    if (!filter) return items;
    const needle = filter.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(needle) || item.body.toLowerCase().includes(needle));
  }, [filter, items]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/login';
      }
    });
  }, []);

  async function loadLatch() {
    const { data: itemsData, error: itemsError } = await supabase
      .from('latch_items')
      .select('id,title,body,phase,proof_required,created_at,updated_at')
      .eq('latch_id', latchId)
      .order('created_at', { ascending: false });
    if (itemsError) {
      setStatus(itemsError.message);
      return;
    }
    const itemsList = (itemsData || []) as LatchItem[];
    setItems(itemsList);

    const { data: proofsData, error: proofsError } = await supabase
      .from('item_proofs')
      .select('id,item_id,kind,label,note,url,created_at')
      .in('item_id', itemsList.map((item) => item.id));
    if (proofsError) {
      setStatus(proofsError.message);
      return;
    }
    setProofs((proofsData || []) as Proof[]);
  }

  useEffect(() => {
    if (!latchId) return;
    loadLatch();
  }, [latchId]);

  async function addItem() {
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
      .from('latch_items')
      .insert({
        latch_id: latchId,
        user_id: userData.user.id,
        title: title.trim(),
        body: body.trim(),
        proof_required: true
      })
      .select('id,title,body,phase,proof_required,created_at,updated_at')
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setItems([data as LatchItem, ...items]);
    setTitle('');
    setBody('');
  }

  async function toggleProofRequired(item: LatchItem) {
    const { data, error } = await supabase
      .from('latch_items')
      .update({ proof_required: !item.proof_required })
      .eq('id', item.id)
      .select('id,title,body,phase,proof_required,created_at,updated_at')
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setItems(items.map((it) => (it.id === item.id ? (data as LatchItem) : it)));
  }

  async function advancePhase(item: LatchItem, next: 'draft' | 'ready' | 'locked') {
    const { data, error } = await supabase.rpc('advance_item_phase', {
      p_item_id: item.id,
      p_next: next
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    setItems(items.map((it) => (it.id === item.id ? (data as LatchItem) : it)));
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Latch items</h2>
        <p className="muted">Draft → Ready → Locked (proof required when enabled).</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Search items" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <a className="btn secondary" href="/">Back</a>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card">
        <h3>Add item</h3>
        <div className="grid">
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn" onClick={addItem}>Add item</button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card">
          <p className="muted">No items yet.</p>
        </div>
      ) : (
        filteredItems.map((item) => (
          <div key={item.id} className="card">
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <strong>{item.title}</strong>
              <span className="badge">{item.phase}</span>
            </div>
            <p className="muted">{item.body || 'No body yet.'}</p>
            <div className="toolbar">
              <button className="btn secondary" onClick={() => advancePhase(item, 'draft')}>Draft</button>
              <button className="btn secondary" onClick={() => advancePhase(item, 'ready')}>Ready</button>
              <button className="btn secondary" onClick={() => advancePhase(item, 'locked')}>Locked</button>
              <button className="btn secondary" onClick={() => toggleProofRequired(item)}>
                Proof {item.proof_required ? 'required' : 'optional'}
              </button>
              <a className="btn secondary" href={`/latch/${latchId}/item/${item.id}`}>Open</a>
            </div>
            <div className="toolbar" style={{ marginTop: 8 }}>
              <span className="muted">Proofs: {(groupedProofs[item.id] || []).length}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
