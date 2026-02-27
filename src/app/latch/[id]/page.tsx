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
  const [phaseFilter, setPhaseFilter] = useState('');
  const [proofFilter, setProofFilter] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState('updated_desc');

  const groupedProofs = useMemo(() => {
    return proofs.reduce<Record<string, Proof[]>>((acc, proof) => {
      acc[proof.item_id] = acc[proof.item_id] || [];
      acc[proof.item_id].push(proof);
      return acc;
    }, {});
  }, [proofs]);

  const summary = useMemo(() => {
    const total = items.length;
    const draft = items.filter((item) => item.phase === 'draft').length;
    const ready = items.filter((item) => item.phase === 'ready').length;
    const locked = items.filter((item) => item.phase === 'locked').length;
    const proofRequired = items.filter((item) => item.proof_required).length;
    return { total, draft, ready, locked, proofRequired };
  }, [items]);

  const filteredItems = useMemo(() => {
    let next = [...items];
    if (filter) {
      const needle = filter.toLowerCase();
      next = next.filter((item) => item.title.toLowerCase().includes(needle) || item.body.toLowerCase().includes(needle));
    }
    if (phaseFilter) {
      next = next.filter((item) => item.phase === phaseFilter);
    }
    if (proofFilter) {
      next = next.filter((item) => (proofFilter === 'required' ? item.proof_required : !item.proof_required));
    }
    next.sort((a, b) => {
      if (sort === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'created_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return next;
  }, [filter, items, phaseFilter, proofFilter, sort]);

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
    if (title.trim().length > 80) {
      setStatus('Title too long (max 80).');
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

  function toggleSelect(id: string, next?: boolean) {
    setSelected((prev) => ({ ...prev, [id]: next ?? !prev[id] }));
  }

  async function bulkAdvance(next: 'draft' | 'ready' | 'locked') {
    const ids = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);
    if (!ids.length) return;
    for (const id of ids) {
      const item = items.find((it) => it.id === id);
      if (!item) continue;
      await advancePhase(item, next);
    }
    setSelected({});
  }

  async function bulkToggleProof() {
    const ids = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);
    if (!ids.length) return;
    for (const id of ids) {
      const item = items.find((it) => it.id === id);
      if (!item) continue;
      await toggleProofRequired(item);
    }
    setSelected({});
  }

  function resetFilters() {
    setFilter('');
    setPhaseFilter('');
    setProofFilter('');
    setSort('updated_desc');
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Latch items</h2>
        <p className="muted">Draft → Ready → Locked (proof required when enabled).</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <span className="badge">Total {summary.total}</span>
          <span className="badge">Draft {summary.draft}</span>
          <span className="badge">Ready {summary.ready}</span>
          <span className="badge">Locked {summary.locked}</span>
          <span className="badge">Proof required {summary.proofRequired}</span>
        </div>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Search items" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <select className="input" value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
            <option value="">All phases</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="locked">Locked</option>
          </select>
          <select className="input" value={proofFilter} onChange={(e) => setProofFilter(e.target.value)}>
            <option value="">Proof: any</option>
            <option value="required">Proof required</option>
            <option value="optional">Proof optional</option>
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated_desc">Updated: newest</option>
            <option value="created_desc">Created: newest</option>
            <option value="created_asc">Created: oldest</option>
          </select>
          <button className="btn secondary" onClick={resetFilters}>Reset</button>
          <a className="btn secondary" href="/">Back</a>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card">
        <h3>Add item</h3>
        <div className="grid">
          <input className="input" placeholder="Title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
          <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn" onClick={addItem}>Add item</button>
        </div>
      </div>

      <div className="card alt">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Bulk actions</h3>
          <button className="btn secondary" onClick={() => setBulkMode((prev) => !prev)}>
            {bulkMode ? 'Exit bulk mode' : 'Select items'}
          </button>
        </div>
        <p className="muted">Apply phase changes or proof toggles to multiple items.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button className="btn secondary" onClick={() => bulkAdvance('draft')} disabled={!bulkMode}>Draft</button>
          <button className="btn secondary" onClick={() => bulkAdvance('ready')} disabled={!bulkMode}>Ready</button>
          <button className="btn secondary" onClick={() => bulkAdvance('locked')} disabled={!bulkMode}>Locked</button>
          <button className="btn secondary" onClick={bulkToggleProof} disabled={!bulkMode}>Toggle proof</button>
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
              <div className="toolbar">
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={!!selected[item.id]}
                    onChange={(event) => toggleSelect(item.id, event.target.checked)}
                  />
                )}
                <strong>{item.title}</strong>
              </div>
              <div className="toolbar">
                {item.proof_required && <span className="badge">Proof required</span>}
                <span className="badge">{item.phase}</span>
              </div>
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
              <span className="muted">Updated {new Date(item.updated_at).toLocaleString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
