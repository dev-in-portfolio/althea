"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useUserKey from "../lib/userKey";

export default function HomePage() {
  const userKey = useUserKey();
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userKey) return;
    const res = await fetch(`/api/sessions?userKey=${userKey}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      setError("Backend not configured. Set DATABASE_URL and run migrations.");
      return;
    }
    setSessions(data.sessions || []);
    setError(null);
  };

  const remove = async (id: string) => {
    await fetch(`/api/sessions/${id}?userKey=${userKey}`, { method: "DELETE" });
    load();
  };

  useEffect(() => {
    load();
  }, [userKey]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>Order of One</h1>
        <h2>Turn a messy list into a clear ranking, one decision at a time.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="stack">
        {sessions.length === 0 && !error ? (
          <div className="card">No sessions yet. Start a new collapse.</div>
        ) : null}
        {sessions.map((session) => (
          <div key={session.id} className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="badge">Session</div>
                <strong>{session.title}</strong>
              </div>
              <div className="mono">{new Date(session.created_at).toLocaleString()}</div>
            </div>
            <div className="row">
              <span className="pill">{session.item_count} items</span>
              <span className="pill">{session.comparison_count} decisions</span>
            </div>
            <div className="row">
              <Link href={`/arena/${session.id}`}>Resume</Link>
              <Link href={`/results/${session.id}`}>Results</Link>
              <button type="button" className="secondary" onClick={() => remove(session.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
