'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirebaseAuth } from '$lib/firebase/client';
import { onAuthStateChanged, signInAnonymously, getIdToken } from 'firebase/auth';

type RoomItem = {
  id: string;
  title: string;
  body: string;
  status: 'open' | 'done';
  created_by_uid: string;
  created_at: string;
  updated_at: string;
};

type RoomDetail = {
  id: string;
  name: string;
  invite_code: string;
  owner_uid: string;
  role: 'owner' | 'member';
  items: RoomItem[];
  members: { uid: string; role: 'owner' | 'member'; created_at: string }[];
};

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.id as string;
  const [token, setToken] = useState('');
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState('created_at_desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);

  const stats = useMemo(() => {
    const total = room?.items.length || 0;
    const done = room?.items.filter((item) => item.status === 'done').length || 0;
    return { total, done, open: total - done };
  }, [room]);

  const activity = useMemo(() => {
    if (!room) return [];
    return [...room.items]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        updated_at: item.updated_at,
        created_by_uid: item.created_by_uid
      }));
  }, [room]);

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

  async function loadRoom() {
    if (!token || !roomId) return;
    setLoadingRoom(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (statusFilter) params.set('status', statusFilter);
    if (mineOnly) params.set('mine', 'true');
    if (sort) params.set('sort', sort);
    const res = await fetch(`/api/rooms/${roomId}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to load room.');
      setLoadingRoom(false);
      return;
    }
    setRoom(data);
    setLoadingRoom(false);
  }

  useEffect(() => {
    loadRoom();
  }, [token, roomId]);

  async function addItem() {
    if (!token || !roomId) return;
    if (!title.trim()) {
      setStatus('Title required.');
      return;
    }
    if (title.trim().length > 80) {
      setStatus('Title too long (max 80).');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/rooms/${roomId}/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, body })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to add item.');
      setSaving(false);
      return;
    }
    setRoom((prev) => (prev ? { ...prev, items: [data, ...prev.items] } : prev));
    setTitle('');
    setBody('');
    setSaving(false);
  }

  async function updateItem(id: string, payload: { title?: string; body?: string; status?: 'open' | 'done' }) {
    if (!token) return;
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Update failed.');
      return;
    }
    setRoom((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.map((item) => (item.id === id ? data : item)) };
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    if (!editTitle.trim()) {
      setStatus('Title required.');
      return;
    }
    await updateItem(editingId, { title: editTitle, body: editBody });
    setEditingId(null);
  }

  async function deleteItem(id: string) {
    if (!token) return;
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Delete failed.');
      return;
    }
    setRoom((prev) => (prev ? { ...prev, items: prev.items.filter((item) => item.id !== id) } : prev));
  }

  function toggleSelection(id: string, next?: boolean) {
    setSelected((prev) => ({ ...prev, [id]: next ?? !prev[id] }));
  }

  async function bulkUpdate(status: 'open' | 'done') {
    const ids = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);
    if (!ids.length) return;
    for (const id of ids) {
      await updateItem(id, { status });
    }
    setSelected({});
  }

  async function bulkDelete() {
    if (!confirm('Delete selected items?')) return;
    const ids = Object.entries(selected).filter(([, value]) => value).map(([id]) => id);
    for (const id of ids) {
      await deleteItem(id);
    }
    setSelected({});
  }

  function copyInvite() {
    if (!room?.invite_code) return;
    const url = `${window.location.origin}/join?code=${room.invite_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setStatus('Invite link copied.');
      setTimeout(() => setStatus(''), 2000);
    }).catch(() => {
      setStatus('Unable to copy invite link.');
    });
  }

  if (!room) {
    return (
      <div className="card">
        <p className="muted">Loading room...</p>
        {status && <p className="muted">{status}</p>}
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>{room.name}</h2>
        <div className="toolbar" style={{ marginTop: 8 }}>
          <span className="badge">{room.role}</span>
          {room.role === 'owner' && (
            <span className="badge">Invite: {room.invite_code}</span>
          )}
          {room.role === 'owner' && (
            <button className="btn secondary" onClick={copyInvite}>Copy invite link</button>
          )}
        </div>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <span className="btn secondary" style={{ pointerEvents: 'none' }}>Total: {stats.total}</span>
          <span className="btn secondary" style={{ pointerEvents: 'none' }}>Open: {stats.open}</span>
          <span className="btn secondary" style={{ pointerEvents: 'none' }}>Done: {stats.done}</span>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card alt">
        <h3>Filter items</h3>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input
            className="input"
            placeholder="Search title or notes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="done">Done</option>
          </select>
          <select className="input" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="created_at_desc">Newest</option>
            <option value="created_at_asc">Oldest</option>
            <option value="updated_at_desc">Recently updated</option>
            <option value="status">Status</option>
          </select>
          <label className="toolbar">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(event) => setMineOnly(event.target.checked)}
            />
            <span className="muted">My items</span>
          </label>
          <button className="btn secondary" onClick={loadRoom} disabled={loadingRoom}>
            {loadingRoom ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Add an item</h3>
        <div className="grid">
          <input
            className="input"
            placeholder="Item title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
          />
          <textarea
            placeholder="Notes"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <button className="btn" onClick={addItem} disabled={saving}>
            {saving ? 'Saving...' : 'Add item'}
          </button>
        </div>
      </div>

      {room.items.length === 0 ? (
        <div className="card">
          <p className="muted">No items yet. Add the first one above to get the room moving.</p>
        </div>
      ) : (
        room.items.map((item) => (
          <div key={item.id} className="card">
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <div className="toolbar">
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={!!selected[item.id]}
                    onChange={(event) => toggleSelection(item.id, event.target.checked)}
                  />
                )}
                <strong>{item.title}</strong>
              </div>
              <span className="badge">{item.status}</span>
            </div>
            <p className="muted">{item.body || 'No notes yet.'}</p>
            <p className="muted">By {item.created_by_uid.slice(0, 6)} · Updated {new Date(item.updated_at).toLocaleString()}</p>
            <div className="toolbar">
              <button
                className="btn secondary"
                onClick={() => updateItem(item.id, { status: item.status === 'open' ? 'done' : 'open' })}
              >
                Mark {item.status === 'open' ? 'done' : 'open'}
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  setEditingId(item.id);
                  setEditTitle(item.title);
                  setEditBody(item.body);
                }}
              >
                Edit
              </button>
              {room.role === 'owner' && (
                <button className="btn danger" onClick={() => deleteItem(item.id)}>Delete</button>
              )}
            </div>
            {editingId === item.id && (
              <div className="card alt" style={{ marginTop: 12 }}>
                <div className="grid">
                  <input
                    className="input"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                  <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} />
                  <div className="toolbar">
                    <button className="btn" onClick={saveEdit}>Save</button>
                    <button className="btn secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <div className="card alt">
        <h3>Recent activity</h3>
        {activity.length === 0 ? (
          <p className="muted">No updates yet.</p>
        ) : (
          <div className="grid" style={{ marginTop: 12 }}>
            {activity.map((entry) => (
              <div key={entry.id} className="card">
                <div className="toolbar" style={{ justifyContent: 'space-between' }}>
                  <strong>{entry.title}</strong>
                  <span className="badge">{entry.status}</span>
                </div>
                <p className="muted">
                  Updated {new Date(entry.updated_at).toLocaleString()} · {entry.created_by_uid.slice(0, 6)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card alt">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Bulk actions</h3>
          <button className="btn secondary" onClick={() => setBulkMode((prev) => !prev)}>
            {bulkMode ? 'Exit bulk mode' : 'Select items'}
          </button>
        </div>
        <p className="muted">Select multiple items to update or delete them in one pass.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button className="btn secondary" onClick={() => bulkUpdate('done')} disabled={!bulkMode}>Mark done</button>
          <button className="btn secondary" onClick={() => bulkUpdate('open')} disabled={!bulkMode}>Mark open</button>
          {room.role === 'owner' && (
            <button className="btn danger" onClick={bulkDelete} disabled={!bulkMode}>Delete selected</button>
          )}
        </div>
      </div>

      <div className="card alt">
        <h3>Members</h3>
        <div className="toolbar" style={{ marginTop: 12 }}>
          {room.members.map((member) => (
            <span key={member.uid} className="badge">
              {member.uid.slice(0, 6)} · {member.role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
