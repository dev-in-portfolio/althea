'use client';

import { useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, getFirebaseStorage } from '$lib/firebase/client';
import { getDownloadURL, ref } from 'firebase/storage';
import { onAuthStateChanged, signInAnonymously, getIdToken } from 'firebase/auth';
import { useParams } from 'next/navigation';

type ReceiptDetail = {
  id: string;
  title: string;
  vendor: string;
  amount_cents: number | null;
  receipt_date: string | null;
  storage_path: string | null;
  mime_type: string | null;
  status: string;
  tags: { id: string; name: string }[];
};

export default function ReceiptView() {
  const params = useParams();
  const id = params?.id as string;
  const [token, setToken] = useState('');
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [tag, setTag] = useState('');
  const [edit, setEdit] = useState({ title: '', vendor: '', amount: '', receiptDate: '' });
  const [status, setStatus] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function load() {
    if (!token || !id) return;
    const res = await fetch(`/api/receipts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to load receipt.');
      return;
    }
    setReceipt(data);
    setEdit({
      title: data.title || '',
      vendor: data.vendor || '',
      amount: data.amount_cents !== null ? (data.amount_cents / 100).toFixed(2) : '',
      receiptDate: data.receipt_date || ''
    });
  }

  useEffect(() => {
    load();
  }, [token, id]);

  useEffect(() => {
    async function hydrateUrl() {
      if (!receipt?.storage_path) {
        setFileUrl(null);
        return;
      }
      const storage = getFirebaseStorage();
      if (!storage) {
        setFileUrl(null);
        return;
      }
      try {
        const url = await getDownloadURL(ref(storage, receipt.storage_path));
        setFileUrl(url);
      } catch {
        setFileUrl(null);
      }
    }
    hydrateUrl();
  }, [receipt?.storage_path]);

  const amountCents = useMemo(() => {
    if (!edit.amount) return null;
    const value = Number(edit.amount);
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100);
  }, [edit.amount]);

  async function addTag() {
    if (!tag) return;
    const res = await fetch(`/api/receipts/${id}/tags`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: tag })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Tag failed.');
      return;
    }
    setReceipt((prev) => {
      if (!prev) return prev;
      if (prev.tags.some((t) => t.id === data.id)) return prev;
      return { ...prev, tags: [...prev.tags, data] };
    });
    setTag('');
  }

  async function removeTag(tagId: string) {
    const res = await fetch(`/api/receipts/${id}/tags`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tagId })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Remove tag failed.');
      return;
    }
    setReceipt((prev) => (prev ? { ...prev, tags: prev.tags.filter((t) => t.id !== tagId) } : prev));
  }

  async function saveChanges() {
    if (!edit.title.trim() || !edit.vendor.trim()) {
      setStatus('Title and vendor required.');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/receipts/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: edit.title,
        vendor: edit.vendor,
        amountCents,
        receiptDate: edit.receiptDate || null
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Update failed.');
      setSaving(false);
      return;
    }
    setReceipt((prev) => (prev ? { ...prev, ...data } : prev));
    setSaving(false);
  }

  async function deleteReceipt() {
    if (!confirm('Delete this receipt?')) return;
    const res = await fetch(`/api/receipts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Delete failed.');
      return;
    }
    window.location.href = '/vault';
  }

  if (!receipt) {
    return (
      <div className="card">
        <p className="muted">Loading receipt…</p>
        {status && <p className="danger">{status}</p>}
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card">
        <h1>{receipt.title}</h1>
        <p className="muted">{receipt.vendor}</p>
        <p className="muted">{receipt.receipt_date || 'No date'} · {receipt.status}</p>
        {status && <p className="danger">{status}</p>}
      </div>

      <div className="card">
        <h3>Receipt File</h3>
        {fileUrl ? (
          <div className="grid" style={{ gap: 12 }}>
            {receipt.mime_type?.startsWith('image/') ? (
              <img src={fileUrl} alt="Receipt" style={{ width: '100%', borderRadius: 12 }} />
            ) : receipt.mime_type === 'application/pdf' ? (
              <iframe title="Receipt PDF" src={fileUrl} style={{ width: '100%', height: 420, border: 'none' }} />
            ) : (
              <p className="muted">File preview unavailable.</p>
            )}
            <a className="btn secondary" href={fileUrl} target="_blank" rel="noreferrer">Open file</a>
          </div>
        ) : (
          <p className="muted">No file uploaded yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Edit Details</h3>
        <div className="grid">
          <input
            className="input"
            placeholder="Title"
            value={edit.title}
            onChange={(e) => setEdit({ ...edit, title: e.target.value })}
          />
          <input
            className="input"
            placeholder="Vendor"
            value={edit.vendor}
            onChange={(e) => setEdit({ ...edit, vendor: e.target.value })}
          />
          <input
            className="input"
            placeholder="Amount"
            value={edit.amount}
            onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
          />
          <input
            className="input"
            type="date"
            value={edit.receiptDate}
            onChange={(e) => setEdit({ ...edit, receiptDate: e.target.value })}
          />
          <button className="btn secondary" onClick={saveChanges} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Tags</h3>
        <div className="toolbar">
          {receipt.tags.map((t) => (
            <button key={t.id} className="btn secondary" onClick={() => removeTag(t.id)}>{t.name} ×</button>
          ))}
        </div>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Add tag" value={tag} onChange={(e) => setTag(e.target.value)} />
          <button className="btn secondary" onClick={addTag}>Add tag</button>
        </div>
      </div>

      <div className="card">
        <button className="btn secondary" onClick={deleteReceipt}>Delete receipt</button>
      </div>
    </div>
  );
}
