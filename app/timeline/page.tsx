"use client";

import { useEffect, useState } from "react";
import useUserKey from "../../lib/useUserKey";
import { normalizeTags } from "../../lib/tags";
import TagInput from "../../components/TagInput";

type EventItem = {
  id: string;
  happened_at: string;
  note: string;
  context: Record<string, string> | null;
  tags: string[];
};

export default function TimelinePage() {
  const userKey = useUserKey();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterTags, setFilterTags] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editHappenedAt, setEditHappenedAt] = useState("");
  const [editContext, setEditContext] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async (reset = false) => {
    if (!userKey) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("userKey", userKey);
    params.set("limit", "20");
    if (!reset && cursor) params.set("cursor", cursor);
    if (filterTags.trim()) params.set("tags", normalizeTags(filterTags.split(",")).join(","));

    const res = await fetch(`/api/events?${params.toString()}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      setLoading(false);
      return;
    }
    if (reset) {
      setEvents(data.events || []);
    } else {
      setEvents((prev) => [...prev, ...(data.events || [])]);
    }
    setCursor(data.nextCursor || null);
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    if (userKey) {
      load(true);
    }
  }, [userKey]);

  const applyFilter = () => {
    setCursor(null);
    load(true);
  };

  const removeEvent = async (id: string) => {
    const res = await fetch(`/api/events/${id}?userKey=${userKey}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((prev) => prev.filter((event) => event.id !== id));
      setError(null);
    } else {
      setError("Delete failed. Try again.");
    }
  };

  const startEdit = (event: EventItem) => {
    setEditingId(event.id);
    setEditNote(event.note);
    setEditTags(event.tags || []);
    setEditHappenedAt(event.happened_at.slice(0, 16));
    setEditContext(event.context || {});
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey,
        note: editNote,
        tags: editTags,
        happenedAt: editHappenedAt,
        context: Object.keys(editContext).length ? editContext : null
      })
    });
    if (res.ok) {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === id
            ? {
                ...event,
                note: editNote,
                tags: editTags,
                happened_at: new Date(editHappenedAt).toISOString(),
                context: Object.keys(editContext).length ? editContext : null
              }
            : event
        )
      );
      setEditingId(null);
      setError(null);
    } else {
      setError("Save failed. Try again.");
    }
  };

  return (
    <div className="stack">
      <div className="hero">
        <h1>Timeline</h1>
        <h2>Recent events with tags and context.</h2>
      </div>

      <section className="panel stack">
        {error ? <div className="banner">{error}</div> : null}
        <div className="row">
          <input
            value={filterTags}
            onChange={(event) => setFilterTags(event.target.value)}
            placeholder="filter tags: focus, commute"
          />
          <button type="button" onClick={applyFilter} className="secondary">
            Apply filter
          </button>
        </div>
      </section>

      <section className="list">
        {events.map((event) => (
          <div key={event.id} className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{new Date(event.happened_at).toLocaleString()}</strong>
              <div className="row">
                <button type="button" className="secondary" onClick={() => startEdit(event)}>
                  Edit
                </button>
                <button type="button" className="secondary" onClick={() => removeEvent(event.id)}>
                  Delete
                </button>
              </div>
            </div>
            {editingId === event.id ? (
              <div className="stack">
                <label>
                  <small>Note</small>
                  <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                </label>
                <label>
                  <small>Tags</small>
                  <TagInput tags={editTags} onChange={setEditTags} />
                </label>
                <label>
                  <small>Happened at</small>
                  <input
                    type="datetime-local"
                    value={editHappenedAt}
                    onChange={(e) => setEditHappenedAt(e.target.value)}
                  />
                </label>
                <div className="row">
                  <label>
                    <small>Place</small>
                    <input
                      value={editContext.place || ""}
                      onChange={(e) => setEditContext({ ...editContext, place: e.target.value })}
                    />
                  </label>
                  <label>
                    <small>Energy</small>
                    <input
                      value={editContext.energy || ""}
                      onChange={(e) => setEditContext({ ...editContext, energy: e.target.value })}
                    />
                  </label>
                  <label>
                    <small>Mode</small>
                    <input
                      value={editContext.mode || ""}
                      onChange={(e) => setEditContext({ ...editContext, mode: e.target.value })}
                    />
                  </label>
                </div>
                <div className="row">
                  <button type="button" onClick={() => saveEdit(event.id)}>
                    Save changes
                  </button>
                  <button type="button" className="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>{event.note}</div>
                <div className="row">
                  {event.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                {event.context ? (
                  <small>
                    {Object.entries(event.context)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" • ")}
                  </small>
                ) : null}
              </>
            )}
          </div>
        ))}
      </section>

      <div className="row">
        <button type="button" onClick={() => load(false)} disabled={!cursor || loading}>
          {loading ? "Loading..." : cursor ? "Load more" : "No more"}
        </button>
      </div>
    </div>
  );
}
