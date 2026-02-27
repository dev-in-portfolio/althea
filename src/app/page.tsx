'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '$lib/supabase/client';

type Tag = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export default function TagsPage() {
  const supabase = getSupabaseClient();
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [color, setColor] = useState('#22d3ee');
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const filtered = useMemo(() => {
    if (!filter) return tags;
    const needle = filter.toLowerCase();
    return tags.filter((tag) => tag.name.toLowerCase().includes(needle));
  }, [filter, tags]);

  function contrastColor(hex: string) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? '#0c0f14' : '#f8fafc';
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/login';
      }
    });
  }, []);

  async function loadTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('id,name,color,created_at')
      .order('name', { ascending: true });
    if (error) {
      setStatus(error.message);
      return;
    }
    setTags((data || []) as Tag[]);

    const { data: counts } = await supabase
      .from('thing_tags')
      .select('tag_id');
    if (counts) {
      const countsMap: Record<string, number> = {};
      for (const row of counts as any[]) {
        countsMap[row.tag_id] = (countsMap[row.tag_id] || 0) + 1;
      }
      setTagCounts(countsMap);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  async function createTag() {
    if (!name.trim()) {
      setStatus('Tag name required.');
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus('Session expired.');
      return;
    }
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userData.user.id,
        name: name.trim(),
        color
      })
      .select('id,name,color,created_at')
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setTags([...tags, data as Tag].sort((a, b) => a.name.localeCompare(b.name)));
    setName('');
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Create tag</h2>
        <p className="muted">Define tags and attach them to things.</p>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Tag name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <button className="btn" onClick={createTag}>Add tag</button>
        </div>
        {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card alt">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Your tags</h2>
            <p className="muted" style={{ marginTop: 6 }}>Click a tag to see its neighborhood.</p>
          </div>
          <input
            className="input"
            placeholder="Search tags"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setFocusedIndex(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((prev) => Math.max(prev - 1, 0));
              }
              if (e.key === 'Enter' && focusedIndex >= 0) {
                const tag = filtered[focusedIndex];
                if (tag) window.location.href = `/tag/${tag.id}`;
              }
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <p className="muted">No tags yet.</p>
        </div>
      ) : (
        filtered.map((tag, index) => (
          <a key={tag.id} className="card" href={`/tag/${tag.id}`}>
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <strong>{tag.name}</strong>
              <span
                className="badge"
                style={{
                  borderColor: tag.color,
                  color: contrastColor(tag.color),
                  background: tag.color
                }}
              >
                {tag.color}
              </span>
            </div>
            <p className="muted">Things: {tagCounts[tag.id] || 0}</p>
            <p className="muted">Created {new Date(tag.created_at).toLocaleString()}</p>
            {focusedIndex === index && (
              <p className="muted">Press Enter to open</p>
            )}
          </a>
        ))
      )}
    </div>
  );
}
