"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useUserKey from "../lib/userKey";

export default function HomePage() {
  const userKey = useUserKey();
  const [problems, setProblems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userKey) return;
    const res = await fetch(`/api/problems?userKey=${userKey}`);
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
    setProblems(data.problems || []);
    setError(null);
  };

  const remove = async (id: string) => {
    await fetch(`/api/problems/${id}?userKey=${userKey}`, { method: "DELETE" });
    load();
  };

  useEffect(() => {
    load();
  }, [userKey]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>SolveSpace</h1>
        <h2>Generate a few strong options from time constraints.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="stack">
        {problems.length === 0 && !error ? (
          <div className="card">No problems yet. Create one to generate options.</div>
        ) : null}
        {problems.map((problem) => (
          <div key={problem.id} className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="badge">Problem</div>
                <strong>{problem.title}</strong>
              </div>
              <div className="mono">{new Date(problem.created_at).toLocaleString()}</div>
            </div>
            <div className="row">
              <span className="pill">{problem.task_count} tasks</span>
              <span className="pill">Available {problem.params?.availableMinutes ?? "?"} min</span>
            </div>
            <div className="row">
              <Link href={`/problems/${problem.id}`}>Open</Link>
              <Link href={`/problems/${problem.id}/solutions`}>Solutions</Link>
              <button type="button" className="secondary" onClick={() => remove(problem.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
