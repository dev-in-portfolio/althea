'use client';

import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '$lib/firebase/client';
import { onAuthStateChanged, signInAnonymously, getIdToken } from 'firebase/auth';

type RoomRow = {
  id: string;
  name: string;
  invite_code: string;
  owner_uid: string;
  created_at: string;
  role: 'owner' | 'member';
  member_count: string;
  item_count: string;
};

export default function RoomsPage() {
  const [token, setToken] = useState('');
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState('created_at_desc');

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

  async function loadRooms() {
    if (!token) return;
    setLoadingRooms(true);
    const res = await fetch('/api/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to load rooms.');
      setLoadingRooms(false);
      return;
    }
    setRooms(data.rooms || []);
    setLoadingRooms(false);
  }

  useEffect(() => {
    loadRooms();
  }, [token]);

  async function createRoom() {
    if (!token) return;
    if (!name.trim()) {
      setStatus('Room name required.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Create failed.');
      setLoading(false);
      return;
    }
    setName('');
    setRooms([data, ...rooms]);
    setLoading(false);
  }

  function copyInvite(code: string) {
    const url = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setStatus('Invite link copied.');
      setTimeout(() => setStatus(''), 2000);
    }).catch(() => setStatus('Unable to copy invite link.'));
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Create a room</h2>
        <p className="muted">Generate a shared space with an invite code.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input
            className="input"
            placeholder="Room name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button className="btn" onClick={createRoom} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card alt">
        <h2>Your rooms</h2>
        <p className="muted">Join a room with an invite code on the Join page.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input
            className="input"
            placeholder="Search rooms"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="member">Member</option>
          </select>
          <select className="input" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="created_at_desc">Newest</option>
            <option value="created_at_asc">Oldest</option>
            <option value="name_asc">Name A → Z</option>
          </select>
          <button className="btn secondary" onClick={loadRooms} disabled={loadingRooms}>
            {loadingRooms ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="card">
          <p className="muted">No rooms yet. Create one to get started.</p>
        </div>
      ) : (
        rooms
          .filter((room) => {
            const matchSearch = !search || room.name.toLowerCase().includes(search.toLowerCase());
            const matchRole = !roleFilter || room.role === roleFilter;
            return matchSearch && matchRole;
          })
          .sort((a, b) => {
            if (sort === 'created_at_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sort === 'name_asc') return a.name.localeCompare(b.name);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .map((room) => (
          <a key={room.id} className="card" href={`/room/${room.id}`}>
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <strong>{room.name}</strong>
              <span className="badge">{room.role}</span>
            </div>
            <p className="muted">Members: {room.member_count} | Items: {room.item_count}</p>
            {room.role === 'owner' && (
              <div className="toolbar">
                <span className="muted">Invite code: {room.invite_code}</span>
                <button className="btn secondary" onClick={(event) => { event.preventDefault(); copyInvite(room.invite_code); }}>
                  Copy link
                </button>
              </div>
            )}
          </a>
        ))
      )}
    </div>
  );
}
