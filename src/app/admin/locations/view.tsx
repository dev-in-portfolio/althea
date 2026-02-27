'use client';

import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '$lib/firebase/client';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';

type LocationRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  active: boolean;
};

export default function LocationsView() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<LocationRow[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [query, setQuery] = useState('');
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

  async function loadLocations() {
    const res = await fetch('/api/locations');
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to load locations.');
      return;
    }
    setItems(data.items || []);
  }

  useEffect(() => {
    loadLocations();
  }, []);

  async function createLocation() {
    if (!code || !name) {
      setStatus('Code and name required.');
      return;
    }
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, name, category, active: true })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to create location.');
      return;
    }
    setItems([data, ...items]);
    setCode('');
    setName('');
    setCategory('General');
    setStatus('Location created.');
  }

  async function toggleActive(loc: LocationRow) {
    const res = await fetch(`/api/locations/${loc.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !loc.active })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to update location.');
      return;
    }
    setItems(items.map((item) => (item.id === loc.id ? data : item)));
  }

  return (
    <div className="grid">
      <div className="card">
        <h1>Locations</h1>
        <p className="muted">Manage valid check-in locations.</p>
      </div>

      <div className="card">
        <div className="grid">
          <input
            className="input"
            placeholder="Code (e.g., HQ)"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <input
            className="input"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="input"
            placeholder="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          <button className="btn" onClick={createLocation}>Add location</button>
          {status && <p className="muted">{status}</p>}
        </div>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Search locations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {items
        .filter((loc) => {
          const hay = `${loc.code} ${loc.name} ${loc.category}`.toLowerCase();
          return hay.includes(query.toLowerCase());
        })
        .map((loc) => (
        <div key={loc.id} className="card">
          <div className="toolbar" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{loc.name}</strong>
              <p className="muted">{loc.code} · {loc.category}</p>
              {!loc.active && <p className="danger">Inactive</p>}
            </div>
            <button className="btn secondary" onClick={() => toggleActive(loc)}>
              {loc.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
