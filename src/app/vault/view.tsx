'use client';

import { useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth } from '$lib/firebase/client';
import { onAuthStateChanged, signInAnonymously, getIdToken } from 'firebase/auth';

type ReceiptRow = {
  id: string;
  title: string;
  vendor: string;
  amount_cents: number | null;
  receipt_date: string | null;
  storage_path: string | null;
  status: string;
  created_at: string;
};

type SavedSearch = {
  name: string;
  query: string;
  tag: string;
  from: string;
  to: string;
  status: string;
  sort: string;
};

const SAVED_KEY = 'receipt-vault:searches';

export default function VaultView() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<ReceiptRow[]>([]);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('created_at_desc');
  const [savedName, setSavedName] = useState('');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filtersReady, setFiltersReady] = useState(false);

  const paginationEnabled = useMemo(() => sort === 'created_at_desc', [sort]);
  const currency = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), []);
  const summary = useMemo(() => {
    const total = items.length;
    const totalAmount = items.reduce((acc, item) => acc + (item.amount_cents || 0), 0);
    const pending = items.filter((item) => item.status === 'pending').length;
    const ready = items.filter((item) => item.status === 'ready').length;
    return {
      total,
      totalAmount: currency.format(totalAmount / 100),
      pending,
      ready
    };
  }, [items, currency]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
    setTag(params.get('tag') || '');
    setFrom(params.get('from') || '');
    setTo(params.get('to') || '');
    setStatusFilter(params.get('status') || '');
    setSort(params.get('sort') || 'created_at_desc');
    try {
      const saved = JSON.parse(window.localStorage.getItem(SAVED_KEY) || '[]');
      if (Array.isArray(saved)) {
        setSavedSearches(saved.filter((entry) => entry && typeof entry.name === 'string'));
      }
    } catch {
      setSavedSearches([]);
    }
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/tags?limit=20', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTagSuggestions((data.items || []).map((t: any) => t.name)))
      .catch(() => setTagSuggestions([]));
  }, [token]);

  async function load(overrides?: Partial<SavedSearch>) {
    if (!token || !filtersReady) return;
    const nextQuery = overrides?.query ?? query;
    const nextTag = overrides?.tag ?? tag;
    const nextFrom = overrides?.from ?? from;
    const nextTo = overrides?.to ?? to;
    const nextStatus = overrides?.status ?? statusFilter;
    const nextSort = overrides?.sort ?? sort;
    const params = new URLSearchParams();
    if (nextQuery) params.set('q', nextQuery);
    if (nextTag) params.set('tag', nextTag);
    if (nextFrom) params.set('from', nextFrom);
    if (nextTo) params.set('to', nextTo);
    if (nextStatus) params.set('status', nextStatus);
    if (nextSort) params.set('sort', nextSort);
    const res = await fetch(`/api/receipts?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to load receipts.');
      return;
    }
    setItems(data.items || []);
    const canPaginate = nextSort === 'created_at_desc';
    setHasMore(canPaginate && (data.items || []).length === 50);
  }

  useEffect(() => {
    load();
  }, [token, filtersReady]);

  async function loadMore() {
    if (!token || !items.length || loadingMore || !hasMore || !paginationEnabled) return;
    setLoadingMore(true);
    const last = items[items.length - 1];
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tag) params.set('tag', tag);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (statusFilter) params.set('status', statusFilter);
    if (sort) params.set('sort', sort);
    params.set('before', last.created_at);
    params.set('limit', '50');
    const res = await fetch(`/api/receipts?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to load more.');
      setLoadingMore(false);
      return;
    }
    const next = data.items || [];
    setItems([...items, ...next]);
    setHasMore(next.length === 50);
    setLoadingMore(false);
  }

  function applyFilters(overrides?: Partial<SavedSearch>) {
    if (overrides) {
      if (overrides.query !== undefined) setQuery(overrides.query);
      if (overrides.tag !== undefined) setTag(overrides.tag);
      if (overrides.from !== undefined) setFrom(overrides.from);
      if (overrides.to !== undefined) setTo(overrides.to);
      if (overrides.status !== undefined) setStatusFilter(overrides.status);
      if (overrides.sort !== undefined) setSort(overrides.sort);
    }
    const nextQuery = overrides?.query ?? query;
    const nextTag = overrides?.tag ?? tag;
    const nextFrom = overrides?.from ?? from;
    const nextTo = overrides?.to ?? to;
    const nextStatus = overrides?.status ?? statusFilter;
    const nextSort = overrides?.sort ?? sort;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (nextQuery) params.set('q', nextQuery);
      if (nextTag) params.set('tag', nextTag);
      if (nextFrom) params.set('from', nextFrom);
      if (nextTo) params.set('to', nextTo);
      if (nextStatus) params.set('status', nextStatus);
      if (nextSort) params.set('sort', nextSort);
      const next = params.toString();
      window.history.replaceState({}, '', next ? `/vault?${next}` : '/vault');
    }
    load(overrides);
  }

  function saveSearch() {
    const trimmed = savedName.trim();
    if (!trimmed) return;
    const entry: SavedSearch = { name: trimmed, query, tag, from, to, status: statusFilter, sort };
    const next = [entry, ...savedSearches.filter((s) => s.name !== trimmed)].slice(0, 8);
    setSavedSearches(next);
    setSavedName('');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    }
  }

  function loadSaved(entry: SavedSearch) {
    applyFilters({
      query: entry.query,
      tag: entry.tag,
      from: entry.from,
      to: entry.to,
      status: entry.status,
      sort: entry.sort || 'created_at_desc'
    });
  }

  function removeSaved(name: string) {
    const next = savedSearches.filter((s) => s.name !== name);
    setSavedSearches(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    }
  }

  function resetFilters() {
    applyFilters({
      query: '',
      tag: '',
      from: '',
      to: '',
      status: '',
      sort: 'created_at_desc'
    });
  }

  return (
    <div className="grid">
      <div className="card">
        <h1>Vault</h1>
        <p className="muted">Browse and filter receipts.</p>
        {status && <p className="danger">{status}</p>}
        {items.length > 0 && (
          <div className="toolbar" style={{ marginTop: 12 }}>
            <span className="btn secondary" style={{ pointerEvents: 'none' }}>Total: {summary.total}</span>
            <span className="btn secondary" style={{ pointerEvents: 'none' }}>Sum: {summary.totalAmount}</span>
            <span className="btn secondary" style={{ pointerEvents: 'none' }}>Ready: {summary.ready}</span>
            <span className="btn secondary" style={{ pointerEvents: 'none' }}>Pending: {summary.pending}</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <input className="input" placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="ready">Ready</option>
            <option value="pending">Pending</option>
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="created_at_desc">Newest first</option>
            <option value="created_at_asc">Oldest first</option>
            <option value="amount_desc">Amount high → low</option>
            <option value="amount_asc">Amount low → high</option>
            <option value="vendor_asc">Vendor A → Z</option>
            <option value="vendor_desc">Vendor Z → A</option>
          </select>
          <button className="btn secondary" onClick={() => applyFilters()}>Apply</button>
          <button className="btn secondary" onClick={() => resetFilters()}>Reset</button>
        </div>
        {tagSuggestions.length > 0 && (
          <div className="toolbar" style={{ marginTop: 12 }}>
            <span className="muted">Tag shortcuts:</span>
            {tagSuggestions.map((s) => (
              <button key={s} className="btn secondary" onClick={() => applyFilters({ tag: s })}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="toolbar" style={{ marginTop: 16 }}>
          <input
            className="input"
            placeholder="Save this search"
            value={savedName}
            onChange={(e) => setSavedName(e.target.value)}
          />
          <button className="btn secondary" onClick={() => saveSearch()}>Save</button>
        </div>
        {savedSearches.length > 0 && (
          <div className="toolbar" style={{ marginTop: 12 }}>
            <span className="muted">Saved:</span>
            {savedSearches.map((entry) => (
              <span key={entry.name}>
                <button className="btn secondary" onClick={() => loadSaved(entry)}>{entry.name}</button>
                <button className="btn secondary" onClick={() => removeSaved(entry.name)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p className="muted">No receipts found.</p>
        </div>
      ) : (
        items.map((item) => (
          <a key={item.id} className="card" href={`/receipt/${item.id}`}>
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <strong>{item.title}</strong>
              <span className="btn secondary" style={{ pointerEvents: 'none' }}>
                {item.status}
              </span>
            </div>
            <p className="muted">{item.vendor || 'Unknown vendor'}</p>
            <p className="muted">
              {item.receipt_date || 'No date'} · {item.amount_cents !== null ? currency.format(item.amount_cents / 100) : 'No amount'}
            </p>
          </a>
        ))
      )}
      {hasMore && items.length > 0 && (
        <div className="card">
          <button className="btn secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
