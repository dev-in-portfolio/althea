"use client";

import { useState } from "react";
import useUserKey from "../lib/useUserKey";
import TagInput from "../components/TagInput";

export default function HomePage() {
  const userKey = useUserKey();
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [happenedAt, setHappenedAt] = useState("");
  const [place, setPlace] = useState("");
  const [energy, setEnergy] = useState("");
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const submit = async () => {
    if (!note.trim()) {
      setStatus("Add a short note first.");
      return;
    }
    const context = {
      ...(place ? { place } : {}),
      ...(energy ? { energy } : {}),
      ...(mode ? { mode } : {})
    };

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey,
        note,
        tags,
        happenedAt: happenedAt || null,
        context: Object.keys(context).length ? context : null
      })
    });

    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      setStatus(data?.error ? `Error: ${data.error}` : "Could not save. Try again.");
      if (res.status === 500) {
        setBanner("Backend not configured. Set DATABASE_URL and run migrations.");
      }
      return;
    }

    setNote("");
    setTags([]);
    setHappenedAt("");
    setPlace("");
    setEnergy("");
    setMode("");
    setStatus("Saved.");
    setBanner(null);
  };

  return (
    <div className="stack">
      <div className="hero">
        <h1>Radar of One</h1>
        <h2>Log small events. Let patterns surface on their own.</h2>
      </div>

      <section className="panel stack">
        {banner ? <div className="banner">{banner}</div> : null}
        <label>
          <small>Event note</small>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What happened? Keep it short and concrete."
          />
        </label>

        <label>
          <small>Tags (comma-separated)</small>
          <TagInput tags={tags} onChange={setTags} placeholder="focus, commute, low-energy" />
        </label>

        <div className="row">
          <label>
            <small>When did it happen?</small>
            <input
              type="datetime-local"
              value={happenedAt}
              onChange={(event) => setHappenedAt(event.target.value)}
            />
          </label>
        </div>

        <details className="panel">
          <summary>Optional context</summary>
          <div className="row" style={{ marginTop: 12 }}>
            <label>
              <small>Place</small>
              <input value={place} onChange={(event) => setPlace(event.target.value)} />
            </label>
            <label>
              <small>Energy</small>
              <input value={energy} onChange={(event) => setEnergy(event.target.value)} />
            </label>
            <label>
              <small>Mode</small>
              <input value={mode} onChange={(event) => setMode(event.target.value)} />
            </label>
          </div>
        </details>

        <div className="row">
          <button type="button" onClick={submit}>
            Save event
          </button>
          {status ? <small>{status}</small> : null}
        </div>
      </section>
    </div>
  );
}
