"use client";

import { useEffect, useState } from "react";
import useUserKey from "../../../lib/userKey";

export default function ResultsPage({ params }: { params: { id: string } }) {
  const userKey = useUserKey();
  const [ranking, setRanking] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userKey) return;
    const res = await fetch(`/api/sessions/${params.id}?userKey=${userKey}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data) {
      setError("Could not load results.");
      return;
    }
    setRanking(data.ranking || []);
    setScores(data.scoreMap || []);
    setComparisons(data.comparisons || []);
    setError(null);
  };

  useEffect(() => {
    load();
  }, [userKey]);

  const scoreLookup = new Map(scores.map((row) => [row.id, row]));
  const labelLookup = new Map(ranking.map((row) => [row.id, row.label]));

  return (
    <div className="stack">
      <div className="hero">
        <h1>Results</h1>
        <h2>Your current order, with the win-loss trail behind it.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="stack">
        {ranking.map((item, index) => {
          const stats = scoreLookup.get(item.id);
          return (
            <div key={item.id} className="card stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>#{index + 1} {item.label}</strong>
                <span className="pill">Score {stats?.score ?? 0}</span>
              </div>
              <div className="row">
                <span className="pill">Wins {stats?.wins ?? 0}</span>
                <span className="pill">Losses {stats?.losses ?? 0}</span>
                <span className="pill">Seed {item.seed}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="panel stack">
        <h3>Audit trail</h3>
        {comparisons.length === 0 ? (
          <small>No comparisons yet.</small>
        ) : (
          comparisons.slice(0, 30).map((comp: any) => (
            <div key={comp.id} className="row">
              <span className="pill">{labelLookup.get(comp.a_item_id) || comp.a_item_id}</span>
              <span className="pill">vs</span>
              <span className="pill">{labelLookup.get(comp.b_item_id) || comp.b_item_id}</span>
              <span className="pill">winner: {labelLookup.get(comp.winner_item_id) || comp.winner_item_id}</span>
            </div>
          ))
        )}
        {comparisons.length > 30 ? (
          <small>Showing 30 of {comparisons.length} decisions.</small>
        ) : null}
      </section>
    </div>
  );
}
