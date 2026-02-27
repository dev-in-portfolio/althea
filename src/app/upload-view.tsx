'use client';

import { useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, getFirebaseStorage } from '$lib/firebase/client';
import { onAuthStateChanged, signInAnonymously, getIdToken } from 'firebase/auth';
import { ref, uploadBytesResumable } from 'firebase/storage';

type ReceiptInput = {
  title: string;
  vendor: string;
  amount: string;
  receiptDate: string;
};

export default function UploadView() {
  const [token, setToken] = useState('');
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [input, setInput] = useState<ReceiptInput>({
    title: '',
    vendor: '',
    amount: '',
    receiptDate: ''
  });

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
      setUid(user.uid);
      setToken(idToken);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/tags?limit=20', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setSuggestions((data.items || []).map((t: any) => t.name)))
      .catch(() => setSuggestions([]));
  }, [token]);

  const amountCents = useMemo(() => {
    const value = Number(input.amount);
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100);
  }, [input.amount]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(next: File | null) {
    if (!next) return;
    if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(next.type)) {
      setStatus('Unsupported file type. Use PDF or image.');
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setStatus('File too large. Max 10MB.');
      return;
    }
    setFile(next);
    setStatus('');
  }

  function addTag(name: string) {
    const normalized = name.trim().toLowerCase();
    if (!normalized || tags.includes(normalized)) return;
    setTags([...tags, normalized]);
    setTagInput('');
  }

  function removeTag(name: string) {
    setTags(tags.filter((t) => t !== name));
  }

  async function submit() {
    if (!token) {
      setStatus('Sign-in not ready yet.');
      return;
    }
    if (!file) {
      setStatus('Choose a receipt file.');
      return;
    }
    if (!input.title || !input.vendor) {
      setStatus('Title and vendor required.');
      return;
    }

    setStatus('Creating receipt…');
    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: input.title,
        vendor: input.vendor,
        amountCents,
        receiptDate: input.receiptDate || null
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to create receipt.');
      return;
    }

    const storage = getFirebaseStorage();
    if (!storage) {
      setStatus('Firebase storage not configured.');
      return;
    }
    const receiptId = data.id as string;
    if (!uid) {
      setStatus('User session not ready yet.');
      return;
    }
    const storagePath = `receipts/${uid}/${receiptId}/${file.name}`;
    setStatus('Uploading file…');
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(ref(storage, storagePath), file);
      task.on('state_changed', (snap) => {
        setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      }, reject, () => resolve());
    });

    setStatus('Finalizing…');
    const finalize = await fetch(`/api/receipts/${receiptId}/finalize`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ storagePath, mimeType: file.type })
    });
    if (!finalize.ok) {
      const err = await finalize.json();
      setStatus(err.error || 'Finalize failed.');
      return;
    }

    if (tags.length) {
      await Promise.all(tags.map((name) =>
        fetch(`/api/receipts/${receiptId}/tags`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name })
        })
      ));
    }

    setStatus('Receipt saved.');
    setFile(null);
    setPreview(null);
    setProgress(0);
    setTags([]);
    setInput({ title: '', vendor: '', amount: '', receiptDate: '' });
  }

  return (
    <div className="grid">
      <div className="card">
        <h1>Receipt Vault</h1>
        <p className="muted">Upload and tag receipts with secure storage.</p>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card">
        <div className="grid">
          <input
            className="input"
            placeholder="Title"
            value={input.title}
            onChange={(event) => setInput({ ...input, title: event.target.value })}
          />
          <input
            className="input"
            placeholder="Vendor"
            value={input.vendor}
            onChange={(event) => setInput({ ...input, vendor: event.target.value })}
          />
          <input
            className="input"
            placeholder="Amount"
            value={input.amount}
            onChange={(event) => setInput({ ...input, amount: event.target.value })}
          />
          <input
            className="input"
            type="date"
            value={input.receiptDate}
            onChange={(event) => setInput({ ...input, receiptDate: event.target.value })}
          />
          <input
            className="input"
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => handleFile(event.target.files?.[0] || null)}
          />
          <div
            className="card"
            style={{
              borderStyle: 'dashed',
              background: dragActive ? 'rgba(255, 190, 85, 0.12)' : undefined
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleFile(event.dataTransfer.files?.[0] || null);
            }}
          >
            <p className="muted">Drag and drop a receipt file here.</p>
          </div>
          {preview && (
            <div className="card">
              {file?.type === 'application/pdf' ? (
                <p className="muted">PDF selected: {file.name}</p>
              ) : (
                <img src={preview} alt="Receipt preview" style={{ maxWidth: '100%', borderRadius: 12 }} />
              )}
            </div>
          )}
          <div className="card">
            <div className="toolbar">
              {tags.map((t) => (
                <button key={t} className="btn secondary" onClick={() => removeTag(t)}>{t} ×</button>
              ))}
            </div>
            <div className="toolbar" style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="Add tag"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag(tagInput);
                  }
                }}
              />
              <button className="btn secondary" onClick={() => addTag(tagInput)}>Add tag</button>
            </div>
            {suggestions.length > 0 && (
              <div className="toolbar" style={{ marginTop: 8 }}>
                <span className="muted">Suggestions:</span>
                {suggestions.map((s) => (
                  <button key={s} className="btn secondary" onClick={() => addTag(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <button className="btn" onClick={submit}>Upload receipt</button>
          {progress > 0 && <p className="muted">Upload {progress}%</p>}
        </div>
      </div>
    </div>
  );
}
