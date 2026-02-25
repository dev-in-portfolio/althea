"use client";

import { useEffect, useState } from "react";
import useUserKey from "../../lib/userKey";

export default function ConflictsPage() {
  const userKey = useUserKey();
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("cached");

  const load = async () => {
    if (!userKey) return;
    const res = await fetch(`/api/conflicts?userKey=${userKey}&mode=${mode}`);
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
    setConflicts(data.conflicts || []);
    setError(null);
  };

  const updateStatus = async (conflictId: string, status: string) => {
    await fetch("/api/conflicts/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userKey, conflictId, status })
    });
    load();
  };

  useEffect(() => {
    load();
  }, [userKey, mode]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>Conflicts</h1>
        <h2>Pairs that appear to clash, plus the question to resolve it.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="panel row">
        <label>
          <small>Mode</small>
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="cached">Cached</option>
            <option value="recompute">Recompute</option>
          </select>
        </label>
        <button type="button" className="secondary" onClick={load}>Refresh</button>
      </section>

      <section className="stack">
        {conflicts.length === 0 && !error ? (
          <div className="card">No conflicts detected yet.</div>
        ) : null}
        {conflicts.map((conflict, index) => (
          <div key={`${conflict.a_id || conflict.a?.id}-${conflict.b_id || conflict.b?.id}-${index}`} className="card conflict-card stack">
            <div className="badge">{conflict.conflict_type || conflict.conflictType}</div>
            <strong>{conflict.a?.text || conflict.a_text || "Statement A"}</strong>
            <strong>{conflict.b?.text || conflict.b_text || "Statement B"}</strong>
            <small>{conflict.reason}</small>
            <div className="row">
              <span className="pill">Severity {conflict.severity || 3}</span>
              <span className="pill">Status {conflict.resolution_status || "open"}</span>
            </div>
            <div className="panel">
              <small>Resolution prompt</small>
              <div>{conflict.resolutionPrompt || "Which side can be softened?"}</div>
            </div>
            <div className="row">
              <button type="button" className="secondary" onClick={() => updateStatus(conflict.id, "accepted")}>Accept</button>
              <button type="button" className="secondary" onClick={() => updateStatus(conflict.id, "resolved")}>Resolved</button>
              <button type="button" className="secondary" onClick={() => updateStatus(conflict.id, "dismissed")}>Not a conflict</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
