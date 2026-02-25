"use client";

import { useEffect, useState } from "react";
import useUserKey from "../../../../lib/userKey";

export default function SolutionsPage({ params }: { params: { id: string } }) {
  const userKey = useUserKey();
  const [solutions, setSolutions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userKey) return;
    const res = await fetch(`/api/problems/${params.id}/solutions?userKey=${userKey}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      setError("Could not load solutions.");
      return;
    }
    setSolutions(data.solutions || []);
    setError(null);
  };

  useEffect(() => {
    load();
  }, [userKey]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>Solutions</h1>
        <h2>Ranked options with remaining time and reasons.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="stack">
        {solutions.length === 0 && !error ? (
          <div className="card">No solutions yet. Generate options first.</div>
        ) : null}
        {solutions.map((solution) => (
          <div key={solution.rank} className="card option-card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Option #{solution.rank}</strong>
              <span className="pill">Remaining {solution.payload.remaining} min</span>
            </div>
            <div className="mono">Generated {new Date(solution.created_at).toLocaleString()}</div>
            <div className="row">
              {solution.payload.tasks.map((task: any) => (
                <span key={task.id} className="pill">{task.label}</span>
              ))}
            </div>
            <div className="panel">
              {solution.payload.explanation.map((line: string, idx: number) => (
                <div key={idx} className="mono">{line}</div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
